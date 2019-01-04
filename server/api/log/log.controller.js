'use strict'

const {
  System
} = require('./system.model')
const {
  Operate
} = require('./operate.model')
const {
  UserLogin
} = require('./userlogin.model')

/**
 * 添加系统日志
 */
exports.addsystem = async (obj) => {
  // obj = {
  //   msg: error.message,
  //   ipsource: ipsource
  // }
  obj.time = parseInt(new Date().getTime() / 1000)
  obj.ipsource = obj.ipsource || '127.0.0.1'
  try {
    await System.create(obj)
  } catch (error) {
    console.log(error)
  }
}

// 添加操作日志
exports.addOperate = async (obj) => {
  obj.time = parseInt(new Date().getTime() / 1000)
  try {
    await Operate.create(obj)
  } catch (error) {
    console.log(error)
  }
}
// 添加登出日志
exports.addLoginOut = async (ctx) => {
  const obj = {
    time: parseInt(new Date().getTime() / 1000),
    role: ctx.state.user.role,
    user: ctx.state.user.user,
    taskType: '退出',
    ipsource: ctx.ip
  }
  try {
    await UserLogin.create(obj)
    ctx.status = 200
  } catch (error) {
    console.log(error)
  }
}
