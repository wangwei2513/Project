/*
 * @Author: linhang
 * @Date: 2018-10-17 10:07:52
 * @Last Modified by: linhang
 * @Last Modified time: 2018-11-26 17:30:50
 */
'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const changeDutyLogSchema = new Schema(
  {
    // 交班人
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    // 交班人
    takeUser: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    // 交接时间
    time: Number,
    // 上个用户的接班时间
    loginTime: Number,
    // 总接警任务
    allTask: Number,
    // 未处理接警任务
    undealTask: Number,
    // 值班日志
    logCount: Number,
    // 报警总数
    allAlarm: Number,
    // 未处理报警数
    undealAlarm: Number,
    // 备注
    remark: String
  },
  { timestamps: true }
)
mongoose.model('changeDutyLog', changeDutyLogSchema)
