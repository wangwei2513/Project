/**
 * 应急指挥控制器
 * @since:2018-2-22
 * @author:hansen
 */

'use strict'

const mongoose = require('mongoose')
const EmergencyPlan = mongoose.model('EmergencyPlan')
const _ = require('lodash')
const handleSysException = require('../../common/tools').handleSysException

// 获取指定预案
module.exports.get = async (ctx, next) => {
  ctx.set('loginfo', encodeURI('应急预案-获取预案'))
  try {
    const orgid = ctx.query.search.orgid
    const result = await EmergencyPlan.find({ orgid })
    if (_.isNull(result)) {
      ctx.throw(500, { code: 2001, message: '找不到请求的服务资源' })
    } else {
      ctx.status = 200
      ctx.body = result
    }
  } catch (err) {
    handleSysException(err, 2002)
  }
}

// 获取预案列表
module.exports.index = async (ctx, next) => {
  ctx.set('loginfo', encodeURI('应急预案-获取预案列表'))
  try {
    const planId = ctx.query.search.planId || ''
    if (_.isEmpty(planId)) {
      ctx.throw(500, { code: 2001, message: '参数为空' })
    }
    const result = await EmergencyPlan.find({ planId: Number(planId) }, '-__v -createdAt -updatedAt')
      .populate({ path: 'orgid', select: 'name' })
      .lean()
    ctx.status = 200
    ctx.body = result.map(item => {
      item.name = item.orgid.name
      delete item.orgid
      return item
    })
  } catch (err) {
    handleSysException(err, 2002)
  }
}

// 删除指定预案
module.exports.remove = async (ctx, next) => {
  ctx.set('loginfo', encodeURI('应急预案-删除预案'))
  try {
    const id = ctx.params.id
    const result = await EmergencyPlan.findByIdAndRemove(id)
    if (_.isNull(result)) {
      ctx.throw(500, { code: 2001, message: '找不到请求的服务资源' })
    } else {
      ctx.status = 200
      ctx.body = ''
    }
  } catch (err) {
    handleSysException(err, 2002)
  }
}

// 创建预案
module.exports.create = async (ctx, next) => {
  ctx.set('loginfo', encodeURI('应急预案-创建预案'))
  try {
    const body = ctx.request.body
    const doc = await EmergencyPlan.find({ orgid: body.orgid }).lean()
    let result
    if (_.isEmpty(doc)) {
      result = await EmergencyPlan.create(body)
      ctx.status = 201
      ctx.headers['location'] = ctx.url + result._id
      ctx.body = [result._id]
    } else {
      result = await EmergencyPlan.update({ orgid: body.orgid }, body)
      ctx.status = 200
      ctx.body = ''
    }
  } catch (err) {
    handleSysException(err, 2002)
  }
}

/**
 * 订阅组织删除通知，同步删除绑定到该组织的预案
 * @param {*} data
 * @param {*} envelope
 */
module.exports.synDelEmgPlan = async (data, envelope) => {
  try {
    await EmergencyPlan.deleteMany({ orgid: data.id })
  } catch (err) {
    handleSysException(err, 2002)
  }
}
