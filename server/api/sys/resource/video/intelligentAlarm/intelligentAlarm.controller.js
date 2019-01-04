/*
 * 智能报警接口
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:53:08
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-09-14 15:06:59
 */

'use strict'

const mongoose = require('mongoose')
const IntelligentAlarm = mongoose.model('IntelligentAlarm')
const tools = require('../../../../../common/tools')
const handleSysException = tools.handleSysException

/**
 * 添加智能报警
 */
exports.add = async ctx => {
  try {
    if (!ctx.request.body.rid) { return ctx.throw(500, { code: -1, message: '所属资源id不能为空' }) }
    const res = await IntelligentAlarm.create(ctx.request.body)
    ctx.status = 200
    ctx.body = res._id
  } catch (error) {
    handleSysException(error)
  }
}
/**
 * 获取智能报警
 */
exports.getOne = async ctx => {
  try {
    const res = await IntelligentAlarm.findById(ctx.params.id).populate({ path: 'rid', select: 'eid', populate: { path: 'eid', select: 'name' } }).exec()
    ctx.status = 200
    ctx.body = res
  } catch (error) {
    handleSysException(error)
  }
}
/**
 * 修改智能报警
 */
exports.update = async ctx => {
  try {
    await IntelligentAlarm.findByIdAndUpdate(ctx.params.id, ctx.request.body).exec()
    ctx.status = 200
  } catch (error) {
    handleSysException(error)
  }
}
/**
 * 删除智能报警
 */
exports.del = async ctx => {
  try {
    await IntelligentAlarm.deleteMany({ _id: { $in: ctx.query.ids.split(',') } }).exec()
    ctx.status = 200
  } catch (error) {
    handleSysException(error)
  }
}
