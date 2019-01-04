/*
 * 监控点报警路由
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:55:32
 * @Last Modified by:   chenkaibo
 * @Last Modified time: 2018-06-06 14:55:32
 */

'use strict'

const router = require('koa-router')()
const controller = require('./monitoryPointAlarm.controller')

router.post('/', controller.add) // 添加
router.get('/:id', controller.getOne) // 获取
router.put('/:id', controller.update) // 修改
router.delete('/', controller.del) // 删除

module.exports = router
