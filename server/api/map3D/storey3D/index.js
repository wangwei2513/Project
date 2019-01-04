/*
 * @Author: chenkaibo
 * @Date: 2018-07-11 10:26:50
 * @Last Modified by: hansen.liuhao
 * @Last Modified time: 2018-07-31 16:48:14
 */
'use strict'
const router = require('koa-router')()
const controller = require('./storey.controller')

router.get('/', controller.getAll)
router.get('/:id', controller.getOne)
router.get('/:id/point', controller.getPoints)
router.post('/', controller.add)
router.put('/:id', controller.update)
router.delete('/:id', controller.del)

module.exports = router
