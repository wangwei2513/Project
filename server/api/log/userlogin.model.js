'use strict'
/**
 * 用户登录模型
 */
const { db, mongoose } = require('../log/model.base')

const userloginSchema = mongoose.Schema({
  time: Number,
  role: String,
  user: String,
  taskType: String,
  ipsource: String
})
const collectionName = 'Log_userlogin'

exports.UserLogin = db.model('userlogin', userloginSchema, collectionName)
