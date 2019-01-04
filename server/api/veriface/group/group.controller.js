/*
 * @Author: chenkaibo
 * @Date: 2018-06-05 14:24:32
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-12-20 17:05:24
 */
'use strict'

const VeriGroup = require('mongoose').model('VeriGroup')
const VeriUser = require('mongoose').model('VeriUser')
const DefenseTask = mongoose.model('DefenseTask')
const FaceServer = require('mongoose').model('FaceServer')
const fs = require('fs')
const config = require('../../../../config').backend
const { handleSysException } = require('../../../common/tools')
const sdkInterface = require('../sdk.interface')

exports.index = async ctx => {
  try {
    const data = await VeriGroup.find({}).lean()
    ctx.body = data
  } catch (error) {
    handleSysException(error)
  }
}
exports.add = async ctx => {
  try {
    const postData = ctx.request.body
    const checkCount = await VeriGroup.count()
    if (checkCount >= 128) {
      return ctx.throw(500, { code: 0, message: '底库数量不能超过128个' })
    }
    const checkUq = await VeriGroup.findOne({ name: postData.name }).exec()
    if (checkUq) {
      return ctx.throw(500, { code: 0, message: '该名称已经已经存在' })
    }
    const result = await VeriGroup.create(postData)
    const id = result._id + ''
    try {
      await sdkInterface.addGroup(id)
      // 如果一键布控
      if (postData.isAuto) {
        let points = []
        const servers = await FaceServer.find().lean()
        servers.forEach(svr => {
          points = [...points, ...svr.res.map(item => item + '')]
        })
        const task = await DefenseTask.findOne({ name: '一键布控' }).lean()
        if (!task) {
          await DefenseTask.create({
            name: '一键布控',
            always: true,
            groups: [id],
            points: [...new Set(points)],
            cameraCfg: config.veriface.cameraCfg
          })
        } else {
          await DefenseTask.updateOne({ name: '一键布控' }, { groups: task.groups.push(id) })
        }
      }
      ctx.body = id
    } catch (error) {
      await VeriGroup.findByIdAndRemove(result._id)
      throw error
    }
  } catch (error) {
    handleSysException(error)
  }
}
/**
 * 删除底库
*/
exports.del = async ctx => {
  const id = ctx.params.id
  try {
    const autoTask = await DefenseTask.findOne({ name: '一键布控' }).lean()
    const groups = autoTask.groups.map(item => item + '')
    if (groups.includes(id + '')) {
      await DefenseTask.updateOne({ _id: autoTask._id }, { groups: groups.filter(item => item + '' !== id + '') })
    }
    const userImages = (await VeriUser.find({ group: id }, 'image').lean()).map(item => item.image)
    await Promise.all([
      sdkInterface.delGroup(id),
      VeriGroup.findByIdAndRemove(id),
      VeriUser.deleteMany({ group: id })
    ])
    // 删除用户图片
    userImages.forEach(img => {
      fs.unlink(img)
    })
    ctx.status = 200
  } catch (error) {
    handleSysException(error)
  }
}

exports.put = async ctx => {
  const id = ctx.params.id
  try {
    const old = await VeriGroup.findById(ctx.params.id).lean()
    const checkUq = await VeriGroup.findOne({ name: ctx.request.body.name, _id: { $ne: id } }).exec()
    if (checkUq) {
      return ctx.throw(500, { code: 0, message: '该名称已经已经存在' })
    }
    if (ctx.request.body.isAuto !== old.isAuto) {
      const autoTask = await DefenseTask.findOne({ name: '一键布控' }).lean()
      const groups = autoTask.groups.map(item => item + '')
      if (groups.includes(id + '')) {
        await DefenseTask.updateOne({ _id: autoTask._id }, { groups: groups.filter(item => item + '' !== id + '') })
      }
    }
    await VeriGroup.findByIdAndUpdate(id, ctx.request.body)
    ctx.status = 200
  } catch (error) {
    handleSysException(error)
  }
}
exports.getAudio = async ctx => {
  try {
    const dirArr = fs.readdirSync(config.fileDirs.defenseAudioDir)
    ctx.body = dirArr
  } catch (error) {
    handleSysException(error)
  }
}
exports.delSdkGroup = async ctx => {
  try {
    const sdkGroups = require('./sdk.group')
    for (let item of sdkGroups) {
      await sdkInterface.delGroup(item.name)
    }
    ctx.status = 200
  } catch (error) {
    handleSysException(error)
  }
}
