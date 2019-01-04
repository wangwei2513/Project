/*
 * 设备报警路由
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:51:49
 * @Last Modified by:   chenkaibo
 * @Last Modified time: 2018-06-06 14:51:49
 */

'use strict'

const router = require('koa-router')()
const controller = require('./deviceAlarm.controller')

router.post('/', controller.add) // 添加
router.get('/:id', controller.getOne) // 获取
router.put('/:id', controller.update) // 修改
router.delete('/', controller.del) // 删除(支持批量)

module.exports = router
