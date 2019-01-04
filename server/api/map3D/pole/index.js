/*
 * 辅助杆路由
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:42:40
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-11-06 15:27:09
 */

'use strict'

const router = require('koa-router')()
const controller = require('./pole.controller')

router.post('/', controller.add)
router.get('/', controller.getAll)
router.get('/:id', controller.getOne)
router.put('/:id', controller.updateOne)
router.delete('/:id', controller.delete)
module.exports = router
