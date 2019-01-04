'use strict'
/**
 * 系统日志模型
 */
const { db, mongoose } = require('../log/model.base')

const systemSchema = mongoose.Schema({
  time: Number,
  msg: String,
  ipsource: String
})
const collectionName = 'Log_system'

exports.System = db.model('SystemState', systemSchema, collectionName)
