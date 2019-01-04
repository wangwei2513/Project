/*
 * 监控点报警模型
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:56:06
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-06-06 14:56:26
 */

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const MonitoryPointAlarmSchema = new Schema({
  rid: { // 所属视频通道
    type: Schema.Types.ObjectId,
    ref: 'Resource'
  },
  name: { // 名称
    type: String
  },
  type: [
    { // 报警具体类型
      type: String,
      enum: ['alarmMoveSense', 'videoMask', 'sceneSwitch', 'definitionAbnormal', 'brightnessAbnormal', 'noise', 'colorCast', 'signalLoss', 'screenFreeze']
      // 0：移动侦测  1：视频遮挡 2：镜头移位  3：清晰度异常 4：亮度异常  5：噪声检测  6：偏色检测  7：信号缺失  8：画面冻结
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
  mapsign: { // 地图标识
    signflag: {
      type: Boolean
    },
    signtype: {
      type: Number,
      enum: [0, 1, 2] // 0:图标,1:线,2:区域
    },
    signvalue: {
      type: String
    }
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

mongoose.model('MonitoryPointAlarm', MonitoryPointAlarmSchema)
