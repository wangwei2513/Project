/*
 * 监控点报警接口
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:55:51
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-09-14 15:07:08
 */

'use strict'

const mongoose = require('mongoose')
const MonitoryPointAlarm = mongoose.model('MonitoryPointAlarm')
const tools = require('../../../../../common/tools')
const handleSysException = tools.handleSysException
const postal = require('postal')

/**
 * 添加监控点报警
 */
exports.add = async ctx => {
  try {
    if (!ctx.request.body.rid) { return ctx.throw(500, { code: -1, message: '所属资源id不能为空' }) }
    const res = await MonitoryPointAlarm.create(ctx.request.body)
    ctx.status = 200
    ctx.body = res._id
  } catch (error) {
    handleSysException(error)
  }
}
/**
 * 获取监控点报警
 */
exports.getOne = async ctx => {
  try {
    const res = await MonitoryPointAlarm.findById(ctx.params.id).populate({ path: 'rid', select: 'eid', populate: { path: 'eid', select: 'name' } }).exec()
    ctx.status = 200
    ctx.body = res
  } catch (error) {
    handleSysException(error)
  }
}
/**
 * 修改监控点报警
 */
exports.update = async ctx => {
  try {
    await MonitoryPointAlarm.findByIdAndUpdate(ctx.params.id, ctx.request.body).exec()
    postal.publish({
      channel: 'devices',
      topic: 'item.notice',
      data: {
        ctx: ctx,
        data: {
          module: 'resource',
          varyData: [],
          newData: []
        }
      }
    })
    ctx.status = 200
  } catch (error) {
    handleSysException(error)
  }
}
/**
 * 删除监控点报警
 */
exports.del = async ctx => {
  try {
    await MonitoryPointAlarm.deleteMany({ _id: { $in: ctx.query.ids.split(',') } }).exec()
    ctx.status = 200
  } catch (error) {
    handleSysException(error)
  }
}
