/*
 * 回放路由
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:46:45
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-06-06 14:47:06
 */

'use strict'
// 视频回放
const router = require('koa-router')()
const controller = require('./playback.controller')

router.get('/ds', controller.getDsServer)
router.post('/query', controller.queryRecord)
router.post('/start', controller.startRecord)
router.post('/stop', controller.stopRecord)
router.post('/open', controller.openRecord)
module.exports = router
