/*
 * 设备报警接口
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:52:34
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-09-14 15:06:32
 */

'use strict'

const mongoose = require('mongoose')
const DeviceAlarm = mongoose.model('DeviceAlarm')
const tools = require('../../../../../common/tools')
const handleSysException = tools.handleSysException

/**
 * 添加设备报警
 */
exports.add = async ctx => {
  try {
    if (!ctx.request.body.eid) { return ctx.throw(500, { code: -1, message: '所属设备id不能为空' }) }
    const res = await DeviceAlarm.create(ctx.request.body)
    ctx.status = 200
    ctx.body = res._id
  } catch (error) {
    handleSysException(error)
  }
}
/**
 * 获取设备报警
 */
exports.getOne = async ctx => {
  try {
    const res = await DeviceAlarm.findById(ctx.params.id)
    ctx.status = 200
    ctx.body = res
  } catch (error) {
    handleSysException(error)
  }
}
/**
 * 修改设备报警
 */
exports.update = async ctx => {
  try {
    await DeviceAlarm.findByIdAndUpdate(ctx.params.id, ctx.request.body).exec()
    ctx.status = 200
  } catch (error) {
    handleSysException(error)
  }
}
/**
 * 删除设备报警
 */
exports.del = async ctx => {
  try {
    await DeviceAlarm.deleteMany({ _id: { $in: ctx.query.ids.split(',') } }).exec()
    ctx.status = 200
  } catch (error) {
    handleSysException(error)
  }
}
