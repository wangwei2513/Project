'use strict'

/**
 * 连接数据库, 各日志模型的基础
 */
const mongoose = require('mongoose')
let db
try {
  db = mongoose.createConnection(require('../../../config').backend.mongo.logUri)
} catch (error) {
  console.log(error.message)
}

exports.db = db
exports.mongoose = mongoose
