/*
 * @Author: linhang
 * @Date: 2018-10-15 19:27:39
 * @Last Modified by: linhang
 * @Last Modified time: 2018-12-20 13:08:38
 */
'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PropertySchema = new Schema(
  {
    // 视频资源：'preview'视频预览, 'cloudControl'云台控制, 'playbackDownload'回放及下载,报警设备：'alarmReceive'报警接收，'alarmConfirm'报警确认，'alarmClean'报警清除，'deployment'布防，'disarming'撤防，'clean'清除,'bypass'旁路，'removeBypass'撤旁
    properties: [
      {
        type: String
      }
    ],
    resource: {
      type: Schema.Types.ObjectId,
      ref: 'Resource'
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'Role'
    }
  },
  {
    timestamps: true
  }
)

mongoose.model('ResProperty', PropertySchema)
