/*
 * @Author: linhang
 * @Date: 2018-12-16 11:15:24
 * @Last Modified by:   linhang
 * @Last Modified time: 2018-12-16 11:15:24
 */
'use strict'

const router = require('koa-router')()
const controller = require('./server.controller')

router.get('/', controller.index) // 获取服务器信息
router.post('/', controller.add) // 新增服务器
router.delete('/batch', controller.delBatch) // 删除服务器
router.put('/:id', controller.put) // 修改服务器
router.delete('/:id', controller.del) // 删除服务器

module.exports = router
