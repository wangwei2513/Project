/*
 * @Author: linhang
 * @Date: 2018-09-10 09:23:16
 * @Last Modified by: linhang
 * @Last Modified time: 2018-09-13 19:43:10
 */

'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const AlarmEventSchema = new Schema(
  {
    // 事件编号
    eventCode: {
      type: String,
      required: '事件编号必填'
    },
    // 事件名称
    eventName: {
      type: String,
      required: '事件名称必填'
    },
    // 报警人
    person: {
      type: String,
      required: '报警人必填'
    },
    // 报警人联系方式
    phone: {
      type: String,
      required: '报警人联系方式必填'
    },
    // 报警时间
    alarmTime: {
      type: Number,
      required: '报警时间必填'
    },
    // 当前状态，2|未解决，1|已解决
    state: {
      type: Number,
      required: '当前状态必填',
      default: 2,
      enum: [1, 2]
    },
    // 事件描述
    description: {
      type: String
    },
    // 是否关闭
    close: {
      type: Boolean
    },
    // 创建时间
    createTime: {
      type: Number,
      required: '创建时间必填'
    },
    // 关闭时间
    closeTime: {
      type: Number
    },
    // 事件来源
    source: {
      type: String
    },
    // 记录人
    recordPerson: {
      type: String,
      required: '记录人必填'
    },
    // 记录人联系方式
    recordPhone: {
      type: String
    },
    // 事件处理详情
    detail: [
      {
        // 处理时间
        handleTime: {
          type: Number,
          required: '处理时间必填'
        },
        // 处理人
        person: {
          type: String,
          required: '处理人必填'
        },
        phone: {
          type: String,
          required: '联系方式必填'
        },
        // 处理详情
        detail: String
      }
    ]
  },
  { timestamps: true }
)

mongoose.model('AlarmEvent', AlarmEventSchema)
