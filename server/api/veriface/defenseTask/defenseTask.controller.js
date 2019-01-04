/*
 * @Author: chenkaibo
 * @Date: 2018-06-05 14:24:32
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-12-20 15:31:32
 */
'use strict'

const mongoose = require('mongoose')
const DefenseTask = mongoose.model('DefenseTask')
const { handleSysException } = require('../../../common/tools')
const postal = require('postal')
exports.getList = async ctx => {
  try {
    const page = ctx.query.page.page || 1
    const limit = ctx.query.page.limit || 10
    const [count, tasks] = await Promise.all([
      DefenseTask.countDocuments(),
      DefenseTask.find().skip((+page - 1) * +limit).limit(+limit).populate({ path: 'groups', select: '_id name' }).lean()
    ])
    ctx.set({
      'X-BSC-COUNT': count,
      'X-BSC-PAGES': Math.ceil(count / limit),
      'X-BSC-CUR': parseInt(page),
      'X-BSC-LIMIT': parseInt(limit)
    })
    ctx.body = tasks
  } catch (error) {
    handleSysException(error)
  }
}
exports.add = async ctx => {
  try {
    const exist = await DefenseTask.findOne({ name: ctx.request.body.name })
    if (exist) {
      ctx.throw(500, { code: 500, message: '任务名称已存在' })
    }
    const doc = await DefenseTask.create(ctx.request.body)
    postal.publish({
      channel: 'websocket',
      topic: 'ws.update',
      data: {
        resIds: ctx.request.body.points,
        type: 'add'
      }
    })
    ctx.status = 201
    ctx.body = doc._id
  } catch (error) {
    handleSysException(error)
  }
}

exports.del = async ctx => {
  try {
    const ids = ctx.request.body.ids
    let resIds = []
    const tasks = await DefenseTask.find({ _id: { $in: ids } }, 'points').lean()
    tasks.forEach(item => {
      resIds = [...resIds, ...item.points]
    })
    await DefenseTask.deleteMany({ _id: { $in: ids } })
    postal.publish({
      channel: 'websocket',
      topic: 'ws.update',
      data: {
        resIds,
        type: 'update'
      }
    })
    ctx.status = 200
  } catch (error) {
    handleSysException(error)
  }
}

exports.update = async ctx => {
  try {
    const exist = await DefenseTask.findOne({ name: ctx.request.body.name, _id: { $ne: ctx.params.id } })
    if (exist) {
      ctx.throw(500, { code: 500, message: '任务名称已存在' })
    }
    await DefenseTask.findByIdAndUpdate(ctx.params.id, ctx.request.body)
    postal.publish({
      channel: 'websocket',
      topic: 'ws.update',
      data: {}
    })
    ctx.status = 200
  } catch (error) {
    handleSysException(error)
  }
}
exports.updatePatch = async ctx => {
  try {
    let resIds = []
    const tasks = await DefenseTask.find({ _id: { $in: ctx.request.body.ids } }, 'points').lean()
    tasks.forEach(item => {
      resIds = [...resIds, ...item.points]
    })
    await DefenseTask.updateMany({ _id: { $in: ctx.request.body.ids } }, { vaild: ctx.request.body.vaild })
    postal.publish({
      channel: 'websocket',
      topic: 'ws.update',
      data: {
        resIds,
        type: 'update'
      }
    })
    ctx.status = 200
  } catch (error) {
    handleSysException(error)
  }
}
