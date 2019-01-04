/**
 * 人员布控控制器
 * @time:207-6-27
 * @author:hansen
 */

const mongoose = require('mongoose')
const videoStructure = mongoose.model('videoStructure')
const moment = require('moment')
const path = require('path')
const _ = require('lodash')
const fs = require('fs')
exports.upload = async (ctx, next) => {
  try {
    const type = Number(ctx.query.type)
    let filePath = ctx.request.body.files.file.path
    const fileName = ctx.request.body.files.file.name
    if (filePath && fileName && type) {
      filePath = '/structure/' + path.basename(filePath)
      const result = await videoStructure.create({
        fileName: fileName,
        filePath: ctx.request.body.files.file.path,
        path: filePath,
        date: moment().format('X'),
        type: type
      })
      if (_.isNull(result)) {
        return ctx.throw(500, { code: 501, message: '上传失败' })
      }
      ctx.status = 200
      ctx.body = result
    } else {
      return ctx.throw(500, { code: 500, message: '文件上传失败' })
    }
  } catch (error) {
    return ctx.throw(500, error)
  }
}
exports.index = async (ctx, next) => {
  const type = ctx.query.type
  try {
    const result = await videoStructure.find({ type: type }, 'fileName path', { sort: { date: -1 } })
    ctx.status = 200
    ctx.body = result
  } catch (error) {
    return ctx.throw(500, error)
  }
}
exports.delete = async (ctx, next) => {
  const id = ctx.params.id
  try {
    const record = await videoStructure.findById(id)
    fs.unlinkSync(record.filePath)
    const result = await videoStructure.findByIdAndRemove(id)
    if (_.isNull(result)) {
      ctx.throw(500, { code: -1, message: '找不到请求的服务资源' })
    } else {
      ctx.status = 200
      ctx.body = ''
    }
  } catch (error) {
    return ctx.throw(500, error)
  }
}
