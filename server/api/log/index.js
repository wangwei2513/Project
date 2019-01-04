'use strict'
//  日志
const router = require('koa-router')()
const controller = require('./log.controller')

router.get('/loginout', controller.addLoginOut) // 退出登录

module.exports = router
