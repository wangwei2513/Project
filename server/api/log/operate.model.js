'use strict'
/**
 * 登录日志模型
 */
const { db, mongoose } = require('../log/model.base')

const OperateSchema = mongoose.Schema({
  info: String,
  time: Number,
  role: String,
  user: String,
  tasktype: String,
  ipSource: String,
  reqBody: String,
  method: String,
  reqUrl: String
}, { timestamps: true })
const collectionName = 'Log_operate'

exports.Operate = db.model('Operate', OperateSchema, collectionName)
