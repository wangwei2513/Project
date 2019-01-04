'use strict'
const AlarmType = require('mongoose').model('alarmType')
const AlarmPlan = require('mongoose').model('alarmPlan')
const AlarmLevel = require('mongoose').model('alarmLevel')
const AlarmCfg = require('mongoose').model('alarmCfg')
const FireAlarmCfg = require('mongoose').model('fireAlarmCfg')
const AlarmTimeTemplate = require('mongoose').model('alarmTimeTemplate')
const FireAlarmConf = require('mongoose').model('fireAlarmConf')
const AlarmAudio = require('mongoose').model('alarmAudio')
const paging = require('../../paging')
const postal = require('postal')
const { handleSysException } = require('../../../common/tools')
const AlarmDeal = require('mongoose').model('AlarmDeal')
const Sysparamters = require('mongoose').model('Sysparamters')

// 报警分类
exports.getAlarmType = async ctx => {
  try {
    const data = await AlarmType.find().exec()
    ctx.body = data
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}

exports.putAlarmType = async ctx => {
  try {
    const id = ctx.params.id
    const data = await AlarmType.findByIdAndUpdate(id, ctx.request.body)
    sendNotice(ctx) // 发布通知
    ctx.body = data
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}
// 级别配置
exports.getAllAlarmLevel = async ctx => {
  try {
    const data = await AlarmLevel.find().exec()
    ctx.body = data
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}

exports.getOneAlarmLevel = async ctx => {
  try {
    const id = ctx.params.id
    const data = await AlarmLevel.findById(id).exec()
    ctx.body = data
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}

exports.putAlarmLevel = async ctx => {
  try {
    const id = ctx.params.id
    const data = await AlarmLevel.findByIdAndUpdate(id, ctx.request.body)
    sendNotice(ctx) // 发布通知
    ctx.body = data
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}

// 时间模板
exports.getTimeTemplate = async ctx => {
  try {
    const data = await AlarmTimeTemplate.find().exec()
    ctx.body = data
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.addTimeTemplate = async ctx => {
  try {
    const data = await AlarmTimeTemplate.create(ctx.request.body)
    sendNotice(ctx) // 发布通知
    ctx.body = data
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.putTimeTemplate = async ctx => {
  try {
    const id = ctx.params.id
    const data = await AlarmTimeTemplate.findByIdAndUpdate(id, ctx.request.body)
    sendNotice(ctx) // 发布通知
    ctx.body = data
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.delTimeTemplate = async ctx => {
  try {
    const id = ctx.params.id
    const data = await AlarmTimeTemplate.findByIdAndRemove(id)
    sendNotice(ctx) // 发布通知
    ctx.body = data
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}

// 预案
exports.getPlan = async (ctx, next) => {
  try {
    const results = await paging.listQuery(AlarmPlan, ctx.query.search, '', { _id: -1 }, ctx.query.page, '', ctx)
    ctx.body = results.results
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}

exports.addPlan = async ctx => {
  try {
    const putData = ctx.request.body
    const check = await checkPlanUnique(putData)
    if (check) {
      ctx.status = 505
      ctx.body = {
        name: false
      }
      return
    }
    const data = await AlarmPlan.create(putData)
    sendNotice(ctx) // 发布通知
    ctx.body = data
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.putPlan = async ctx => {
  try {
    const id = ctx.params.id
    const putData = ctx.request.body
    const check = await checkPlanUnique(putData, id)
    if (check) {
      ctx.status = 505
      ctx.body = {
        name: false
      }
      return
    }
    const data = await AlarmPlan.findByIdAndUpdate(id, putData)
    sendNotice(ctx) // 发布通知
    ctx.body = data
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.delPlan = async ctx => {
  try {
    const id = ctx.params.id
    const data = await AlarmPlan.findByIdAndRemove(id)
    sendNotice(ctx) // 发布通知
    ctx.body = data
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}

// 配置报警
exports.setUpdateAlarm = async ctx => {
  try {
    const postData = ctx.request.body
    const id = ctx.params.id
    const result = await AlarmCfg.findOneAndUpdate({ resource: id }, postData, { upsert: true })
    sendNotice(ctx) // 发布通知
    ctx.body = result
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}

// 根据id 获取报警配置详情
exports.getSetAlarm = async ctx => {
  try {
    const id = ctx.params.id
    const result = await AlarmCfg.findOne({ resource: id }, '-org -resource')
      .populate([{ path: 'videoAction.resource', select: 'name' }, { path: 'videoAction.org', select: 'name' }])
      .exec()
    ctx.body = result || {}
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}

// 配置消防报警
exports.setUpdateFire = async ctx => {
  try {
    const postData = ctx.request.body
    const id = ctx.params.id
    const result = await FireAlarmCfg.findOneAndUpdate({ resource: id }, postData, { upsert: true })
    sendNotice(ctx) // 发布通知
    ctx.body = result
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}

// 根据id 获取消防配置详情
exports.getSetFire = async ctx => {
  try {
    const id = ctx.params.id
    const result = await FireAlarmCfg.findOne({ resource: id }).exec()
    ctx.body = result
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.getSetFireInfo = async ctx => {
  try {
    const id = ctx.params.id
    const result = await FireAlarmCfg.findOne({ resource: id })
      .populate({ path: 'actionVideo.resource', select: '_id stream chan eid', populate: { path: 'eid', select: 'cport ip manufacturer' } })
      .exec()
    ctx.body = result
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}

exports.setFireConf = async ctx => {
  try {
    const data = await FireAlarmConf.update(ctx.request.body)
    sendNotice(ctx) // 发布通知
    ctx.body = data
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}

exports.getFireConf = async ctx => {
  try {
    const data = await FireAlarmConf.findOne()
    ctx.body = data
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}

exports.getAudio = async ctx => {
  try {
    const results = await paging.listQuery(AlarmAudio, {}, '', { _id: -1 }, ctx.query.page, '', ctx)
    ctx.body = results
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.addAudio = async ctx => {
  try {
    const data = await AlarmAudio.create(ctx.request.body)
    sendNotice(ctx) // 发布通知
    ctx.body = data
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.delAudio = async ctx => {
  const id = ctx.params.id
  try {
    const data = await AlarmAudio.findByIdAndRemove(id)
    sendNotice(ctx) // 发布通知
    ctx.body = data
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.putAudio = async ctx => {
  const id = ctx.params.id
  try {
    const data = await AlarmAudio.findByIdAndUpdate(id, ctx.request.body)
    sendNotice(ctx) // 发布通知
    ctx.body = data
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}

const sendNotice = ctx => {
  postal.publish({
    channel: 'devices',
    topic: 'item.notice',
    data: {
      ctx: ctx,
      data: {
        module: 'alarm',
        varyData: [],
        newData: []
      }
    }
  })
}

postal.subscribe({
  channel: 'resources',
  topic: 'resource.unbind',
  callback: async data => {
    if (data.type * 1 === 0) {
      await AlarmCfg.deleteMany({ resource: { $in: data.ids } })
      await FireAlarmCfg.deleteMany({ resource: { $in: data.ids } })
    }
  }
})

const checkPlanUnique = async (obj, id = null) => {
  let result = []
  if (id) {
    result = await AlarmPlan.find({ type: obj.type, name: obj.name, _id: { $ne: id } }).exec()
  } else {
    result = await AlarmPlan.find({ type: obj.type, name: obj.name }).exec()
  }
  return result.length
}
/**
 * 增加警情处理
 * @param {*} ctx
 */
exports.addAlarmDeal = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('警情处理-添加'))
    await AlarmDeal.create(ctx.request.body)
    ctx.body = 201
  } catch (error) {
    handleSysException(error)
  }
}
/**
 * 查询警情处理
 * @param {*} ctx
 */
exports.getAlarmDeal = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('警情处理-查询'))
    const page = ctx.query.page
    const search = {}
    search.page = ctx.query.type
    const data = await paging.listQuery(AlarmDeal, search, '', { createdAt: -1 }, page, '', ctx)
    ctx.body = data.results
  } catch (error) {
    handleSysException(error)
  }
}
/**
 * 修改警情处理
 * @param {*} ctx
 */
exports.updateAlarmDeal = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('警情处理-修改'))
    const id = ctx.params.id
    const obj = await AlarmDeal.findOne({ name: ctx.request.body.name, _id: { $ne: id } }).exec()
    if (obj) {
      throw new Error('用户名重复')
    }
    await AlarmDeal.findByIdAndUpdate(id, ctx.request.body)
    ctx.body = 200
  } catch (error) {
    handleSysException(error)
  }
}
/**
 * 删除警情处理
 * @param {*} ctx
 */
exports.deleteAlarmDeal = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('警情处理-删除'))
    const id = ctx.params.id
    await AlarmDeal.findByIdAndRemove(id)
    ctx.body = 200
  } catch (error) {
    handleSysException(error)
  }
}
/**
 * 获取系统参数
 * @param {*} ctx
 */
exports.getSysParam = async ctx => {
  try {
    const data = await Sysparamters.findOne({}, 'fireOpen alarmOpen')
    ctx.body = data
  } catch (error) {
    handleSysException(error)
  }
}
/**
 * 修改系统参数
 * @param {*} ctx
 */
exports.updateSysParam = async ctx => {
  try {
    const id = ctx.params.id
    const obj = ctx.request.body
    await Sysparamters.findByIdAndUpdate(id, obj)
    ctx.body = 200
  } catch (error) {
    handleSysException(error)
  }
}
