/*
 * 智能报警路由
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:52:53
 * @Last Modified by:   chenkaibo
 * @Last Modified time: 2018-06-06 14:52:53
 */

'use strict'

const router = require('koa-router')()
const controller = require('./intelligentAlarm.controller')

router.post('/', controller.add) // 添加
router.get('/:id', controller.getOne) // 获取
router.put('/:id', controller.update) // 修改
router.delete('/', controller.del) // 删除

module.exports = router
