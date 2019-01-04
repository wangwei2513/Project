/**
 * 报警配置模型
 * **/
'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const FireAlarmCfgSchem = new Schema({
  resource: {
    type: Schema.Types.ObjectId,
    ref: 'Resource'
  },
  type: {
    type: Number,
    enum: [
      1, 2, 3 // 1.报警输入 2.智能报警 3.监控点报警
    ]
  },
  actionVideo: [ // 视频联动
    {
      resource: {
        type: Schema.Types.ObjectId,
        ref: 'Resource'
      },
      channelName: String, // 监控点名称(通道名称)
      orgId: {
        type: Schema.Types.ObjectId,
        ref: 'Org'
      },
      mainCamera: {
        type: Boolean, // 主摄像机
        default: false
      },
      client: {
        type: Boolean, // 客户端弹出视频
        default: false
      },
      videoWall: {
        type: Boolean, // 弹出电视墙
        default: false
      },
      electronicMap: {
        type: Boolean, // 电视墙弹出视频
        default: false
      },
      record: {
        type: Boolean, // 启动中心录像
        default: false
      }
    }
  ],
  actionOutCtl: [ // 联动输出控制
    {
      resource: {
        type: Schema.Types.ObjectId,
        ref: 'Resource'
      },
      outPutName: String, // 输出端名字
      outPutOrg: {
        type: Schema.Types.ObjectId,
        ref: 'Org'
      },
      runMode: Number, // 执行方式 0手动/1自动
      runAction: Number, // 执行动作 0打开/1关闭
      overlayIcon: Boolean // 叠加图标
    }
  ],
  actionRule: [{ // 报警规则
    status: Boolean, // 状态
    beginTime: Number, // 开始时间
    endTime: Number, // 结束时间点
    actionVideo: Boolean, // 联动视频
    actionOutPut: Boolean // 输出视频
  }]
})
mongoose.model('alarmCfg', FireAlarmCfgSchem)
