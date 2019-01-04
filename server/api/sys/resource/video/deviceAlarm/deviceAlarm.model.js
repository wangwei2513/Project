/*
 * 设备报警模型
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:52:17
 * @Last Modified by:   chenkaibo
 * @Last Modified time: 2018-06-06 14:52:17
 */

'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DeviceAlarmSchema = new Schema({
  eid: { // 所属设备
    type: Schema.Types.ObjectId,
    ref: 'Device'
  },
  name: { // 名称
    type: String
  },
  type: [
    { // 设备报警类型
      type: String,
      // 0：sd卡故障 1：sd卡满  2：网络断开  3：ip冲突  4：时间异常  5：非法网络访问
      enum: ['hardDiskFailure', 'hardDiskFull', 'networkDown', 'ipConflict', 'timeAbnormal', 'illegalNetworkAccess']
    }
  ],
  chan: { // 通道号
    type: Number
  },
  alarmtemplate: { // 布撤防时间
    type: Schema.Types.ObjectId,
    ref: 'PlanTemplate'
  },
  level: { // 级别
    type: Number
  },
  alarmtype: {
    type: Schema.Types.ObjectId,
    ref: 'alarmType'
  },
  maxdelaytime: { // 最大延迟时间
    type: Number,
    default: 300
  },
  minintervaltime: { // 最小间隔时间
    type: Number,
    default: 300
  },
  alarmaffirm: { // 报警确认
    affirmflag: {
      type: Boolean
    },
    autoaffirm: {
      status: {
        type: Boolean
      },
      intervaltime: {
        type: Number // 时间间隔
      }
    },
    handaffirm: {
      status: {
        type: Boolean
      }
    }
  }
})

mongoose.model('DeviceAlarm', DeviceAlarmSchema)
