/*
 * @Author: linhang
 * @Date: 2018-09-10 09:23:10
 * @Last Modified by: linhang
 * @Last Modified time: 2018-09-13 19:41:53
 */

'use strict'
const router = require('koa-router')()
const controller = require('./alarm.controller')

router.get('/', controller.getAlarmEvent) // 获取接警事件列表
router.post('/', controller.create) // 新建接警事件
router.put('/:id', controller.update) // 修改接警事件
router.delete('/', controller.delete) // 删除接警事件
router.post('/handle/:id', controller.handleAlarm) // 处理接警事件
router.get('/history', controller.getAlarmHistory) // 获取历史接警事件
module.exports = router
