/*
 * 地图列表路由
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:30:12
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-07-11 11:06:50
 */

'use strict'

const router = require('koa-router')()
const controller = require('./map.controller')

router.delete('/:mapid', controller.deleteAllResourceByMapId)
router.post('/', controller.add)
router.get('/', controller.index)
router.put('/:id', controller.update)

module.exports = router
