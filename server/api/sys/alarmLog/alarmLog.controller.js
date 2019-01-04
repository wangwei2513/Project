/*
 * @Author: linhang
 * @Date: 2018-09-20 16:40:25
 * @Last Modified by: linhang
 * @Last Modified time: 2018-09-28 14:11:27
 */
'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const handleSysException = require('../../../common/tools').handleSysException
const db = require('../../../common/logdb').db
const paging = require('../../paging')
const AlarmLog = db.model(
  'AlarmLog',
  new mongoose.Schema({
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Org'
    },
    srcName: String,
    level: Number,
    alarmClassifyId: {
      type: Schema.Types.ObjectId,
      ref: 'alarmType'
    },
    // 报警类型
    eventType: String,
    time: Number
  }),
  'AlarmLog'
)

// 获取报警列表
exports.getAlarmLog = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('报警处理统计分析-获取所有报警列表'))
    const searchObj = ctx.query.search
    const search = {}
    search.$and = []
    // 报警分类
    if (searchObj.alarmClassifyId) {
      search.$and.push({ alarmClassifyId: searchObj.alarmClassifyId })
    }
    // 报警类型
    if (searchObj.alarmType !== 'all') {
      const alarmType = searchObj.alarmType.split(',')
      search.$and.push({ eventType: { $in: alarmType } })
    }
    // 报警确认
    if (searchObj.deal === 'true') {
      search.$and.push({ deal: true })
    } else if (searchObj.deal === 'false') {
      search.$and.push({ deal: { $exists: false } })
    }
    // 机构
    if (searchObj.orgId) {
      search.$and.push({ orgId: searchObj.orgId })
    }
    // 报警级别
    if (searchObj.level !== '0') {
      search.$and.push({ level: Number(searchObj.level) })
    }
    // 源名称
    if (searchObj.srcName) {
      search.$and.push({ srcName: { $regex: searchObj.srcName } })
    }
    // 时间
    search.$and.push({ time: { $gte: searchObj.beginTime, $lte: searchObj.endTime } })
    // 如果是未定义的报警，则不发送
    search.$and.push({ define: true })
    const page = ctx.query.page
    const results = await paging.listQuery(AlarmLog, search, '', { time: -1 }, page, '', ctx)
    ctx.body = results.results
  } catch (err) {
    handleSysException(err)
  }
}
