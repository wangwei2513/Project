/*
 * @Author: zhangminbo
 * @Date: 2018-06-05 14:24:24
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-12-20 16:30:11
 */
'use strict'

const router = require('koa-router')()
const controller = require('./group.controller')

router.get('/', controller.index)
router.get('/audio', controller.getAudio)
router.post('/', controller.add)
router.get('/sdk', controller.delSdkGroup)
router.delete('/:id', controller.del)
router.put('/:id', controller.put)

module.exports = router
