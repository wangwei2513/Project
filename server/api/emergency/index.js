/**
 * 应急管理路由
 * @since:2018-2-22
 * @author:hansen
 */

'use strict'

const router = require('koa-router')()
const controller = require('./emergency.controller')
const postal = require('postal')

router.post('/plan', controller.create) // 创建预案
router.get('/plan/', controller.get) // 获取指定预案
router.get('/plan/list', controller.index) // 获取预案列表
router.delete('/plan/:id', controller.remove) // 删除指定预案

// 订阅组织删除通知，同步删除绑定到该组织的预案
postal.subscribe({
  channel: 'orgs',
  topic: 'item.delete',
  callback: controller.synDelEmgPlan
})

module.exports = router
