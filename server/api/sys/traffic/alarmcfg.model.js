/*
 * @Author: chenkaibo
 * @Date: 2018-07-27 10:56:27
 * @Last Modified by: hansen.liuhao
 * @Last Modified time: 2018-08-02 11:47:57
 */
'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const TrafficAlarmCfg = new Schema({
  // 服务器id
  sid: {
    type: Schema.Types.ObjectId,
    ref: 'Device'
  },
  devcode: { // 设备编号
    type: String
  },
  level: { // 级别
    type: Number
  },
  alarmtype: { // 报警分类
    type: Schema.Types.ObjectId,
    ref: 'alarmType'
  },
  alarmtemplate: { // 布撤防时间
    type: Schema.Types.ObjectId,
    ref: 'alarmTimeTemplate'
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
mongoose.model('TrafficAlarmCfg', TrafficAlarmCfg)
