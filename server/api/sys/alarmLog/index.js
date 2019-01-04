/*
 * @Author: linhang
 * @Date: 2018-09-20 16:36:58
 * @Last Modified by: linhang
 * @Last Modified time: 2018-09-28 11:42:25
 */
'use strict'
const router = require('koa-router')()
const controller = require('./alarmLog.controller')

router.get('/', controller.getAlarmLog) // 获取报警数据
module.exports = router
