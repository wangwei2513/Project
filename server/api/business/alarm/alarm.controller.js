/*
 * @Author: linhang
 * @Date: 2018-09-10 09:23:23
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2018-11-20 23:56:17
 */

'use strict'
const mongoose = require('mongoose')
const AlarmEvent = mongoose.model('AlarmEvent')
const _ = require('lodash')
const moment = require('moment')
const paging = require('../../paging')
const { handleSysException } = require('../../../common/tools')

// 获取接警事件
exports.getAlarmEvent = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('业务管理-获取接警事件'))
    const search = ctx.query.search
    search.close = false
    if (search.deal && search.deal === '0') {
      search['detail.0'] = { $exists: 0 }
    }
    if (search.startTime && search.endTime) {
      search.alarmTime = { $gte: Number(search.startTime), $lte: Number(search.endTime) }
    }
    search.$or = [{ eventName: { $regex: search.name || '' } }, { person: { $regex: search.name || '' } }]
    delete search.startTime
    delete search.endTime
    delete search.name
    delete search.deal
    const results = await paging.listQuery(AlarmEvent, search, '', { alarmTime: -1 }, ctx.query.page, '', ctx)
    ctx.body = results.results
  } catch (err) {
    handleSysException(err)
  }
}
// 新建接警事件
exports.create = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('业务管理-新建接警事件'))
    const alarmEvent = ctx.request.body
    const n = Math.floor(Math.random() * 10000) + ''
    const eventCode = moment().format('YYYYMMDD') + _.padStart(n, 4, '0')
    alarmEvent.eventCode = eventCode
    alarmEvent.createTime = moment().unix()
    alarmEvent.close = false
    await AlarmEvent.create(alarmEvent)
    ctx.status = 201
  } catch (err) {
    handleSysException(err)
  }
}
// 修改接警事件
exports.update = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('业务管理-修改接警事件'))
    const id = ctx.params.id
    if (_.isEmpty(id)) {
      ctx.throw(500, { code: 2001, message: '参数不能为空' })
    }
    const alarmEvent = ctx.request.body
    await AlarmEvent.findByIdAndUpdate(id, alarmEvent)
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}
// 删除接警事件
exports.delete = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('业务管理-删除接警事件'))
    const ids = ctx.request.header['x-bsc-ids'].split(',')
    if (_.isEmpty(ids)) {
      ctx.throw(500, { code: 2001, message: '参数不能为空' })
    }
    await AlarmEvent.remove({ _id: { $in: ids } })
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}
// 处理接警事件
exports.handleAlarm = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('业务管理-处理接警事件'))
    const id = ctx.params.id
    if (_.isEmpty(id)) {
      ctx.throw(500, { code: 2001, message: '参数不能为空' })
    }
    const data = ctx.request.body
    const detail = data.detail
    const alarmEvent = await AlarmEvent.findById(id)
      .lean()
      .exec()
    if (alarmEvent.detail) {
      alarmEvent.detail.push(detail[0])
    } else {
      alarmEvent.detail = detail
    }
    if (data.close) {
      alarmEvent.closeTime = moment().unix()
    }
    alarmEvent.state = data.state
    alarmEvent.close = data.close
    await AlarmEvent.findByIdAndUpdate(id, alarmEvent)
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}
// 查询历史接警事件
exports.getAlarmHistory = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('业务管理-查询历史接警事件'))
    const search = ctx.query.search
    if (search.startTime && search.endTime) {
      search.alarmTime = { $gte: Number(search.startTime), $lte: Number(search.endTime) }
    }
    search.$or = [{ eventName: { $regex: search.name || '' } }, { person: { $regex: search.name || '' } }]
    if (Number(search.state) === 0) {
      delete search.state
    } else if (Number(search.state) === 1) {
      search.state = 1
    } else if (Number(search.state) === 2) {
      search.state = 2
    }
    search.close = true
    delete search.startTime
    delete search.endTime
    delete search.name
    const results = await paging.listQuery(AlarmEvent, search, '', { alarmTime: -1 }, ctx.query.page, '', ctx)
    ctx.body = results.results
  } catch (err) {
    handleSysException(err)
  }
}
