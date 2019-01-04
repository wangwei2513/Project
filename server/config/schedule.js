/**
 * 定时任务配置表
 */

'use strict'
const sched = require('../common/schedule')

module.exports = function () {
  // 车辆统计 每个小时统计一次数据
  const statistic = require('../api/vehicle/statistic/statistics.controller').index
  const verifaceStatistic = require('../api/veriface/statistic/statistics.controller').add
  const syncDevOnlineList = require('../api/sys/device/device.controller').syncOnlineList
  const updateSDKUserState = require('../api/veriface/user/user.controller').updateSDKUserState
  const syncAttentionStatus = require('../api/face/attention/attention.controller').syncAttentionStatus
  const { scheduleRecord } = require('../api/patrol/patrol.controller')
  const operationCreateLog = require('../api/sys/operation/log').createLog
  const { clearDir } = require('../common/tools')

  // const ChangState = require('../api/sys/setting/setting.controller').changState // 车辆布控修改状态
  const updateFileConnectTime = require('../api/sys/setting/setting.controller').updateFileConnectTime // 创建分表

  sched.addSchedule({ rule: '0 0 * * * *', operation: statistic })
  sched.addSchedule({ rule: '30 59 * * * *', operation: verifaceStatistic }) // sdk 每小时59分30秒统计一次
  sched.addSchedule({ rule: '30 0 0 * * *', operation: updateSDKUserState }) // sdk 每日0小时0分30秒修改一次布控状态
  sched.addSchedule({ rule: '*/30 * * * * *', operation: syncDevOnlineList }) // 每隔30s同步一次设备状态
  sched.addSchedule({ rule: '0 0 0 * * *', operation: syncAttentionStatus })
  sched.addSchedule({ rule: '30 0 0 * * *', operation: operationCreateLog }) // sdk 每日0小时0分30秒创建设备昨日日志

  // sched.addSchedule({ rule: '0 0 0 * * *', operation: ChangState })// 车辆布控修改状态
  sched.addSchedule({
    rule: require('../../config').backend.createFileConnectTime,
    operation: updateFileConnectTime
  })
  sched.addSchedule({
    rule: '0 0 0 * * *',
    operation: scheduleRecord
  })
  sched.addSchedule({ rule: '0 0 0 * * *', operation: clearDir }) // 每天清理临时目录
}
