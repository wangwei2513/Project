'use strict'

/*
 * bstar数据库数据库, 各日志模型的基础
 * @Author: lushengying
 * @Date: 2018-08-29 10:54:45
 * @Last Modified by: lushengying
 * @Last Modified time: 2018-09-19 20:31:13
 */
const { db, mongoose } = require('../../log/model.base')

const devLogSchema = new mongoose.Schema({
  //  名称
  name: {
    type: String
  },
  // IP
  ip: {
    type: String
  },
  orgs: {
    //  机构名称
    type: String
  },
  port: {
    //  端口
    type: Number
  },
  manufactuer: {
    //  厂商名称
    type: String
  },
  type: {
    //  设备类型
    type: String
  },
  createTime: {
    //  创建时间
    type: Number
  },
  status: {
    //  状态1上线2下线3断流
    type: Number
  }
})
const recordLogSchema = new mongoose.Schema({
  name: {
    //  名称
    type: String
  },
  ip: {
    // IP
    type: String
  },
  channel: {
    type: Number
  },
  cport: {
    //  控制端口
    type: Number
  },
  dport: {
    //  检测端口
    type: Number
  },
  createTime: {
    //  创建时间
    type: Number
  },
  status: {
    //  状态1上线2下线3断流
    type: Number
  }
})
const serverLogSchema = new mongoose.Schema({
  name: {
    //  名称
    type: String
  },
  ip: {
    // IP
    type: String
  },
  //  1 存储服务器 2 转发服务器 3 接入服务器
  serverType: {
    type: Number
  },
  createTime: {
    //  创建时间
    type: Number
  },
  //  状态1上线2下线3断流
  status: {
    type: Number
  }
})

const recordPlanLogSchema = new mongoose.Schema({
  name: {
    //  名称
    type: String
  },
  ip: {
    // IP
    type: String
  },
  //  1 存储服务器 2 转发服务器 3 接入服务器
  serverType: {
    type: Number
  },
  createTime: {
    //  创建时间
    type: Number
  },
  //  状态1上线2下线3断流
  status: {
    type: Number
  }
})
const devLog = db.model('devLog', devLogSchema, 'devLog')
const recordLog = db.model('recordLog', recordLogSchema, 'recordLog')
const serverLog = db.model('serverLog', serverLogSchema, 'serverLog')
const recordPlanLog = db.model('recordPlanLog', recordPlanLogSchema, 'recordPlanLog')

exports.devLog = devLog
exports.recordLog = recordLog
exports.serverLog = serverLog
exports.recordPlanLog = recordPlanLog
