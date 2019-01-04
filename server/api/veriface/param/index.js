/*
 * @Author: linhang
 * @Date: 2018-12-07 09:45:19
 * @Last Modified by: linhang
 * @Last Modified time: 2018-12-12 10:09:37
 */
'use strict'

const router = require('koa-router')()
const controller = require('./param.controller')

router.get('/face', controller.getFaceResources) // 获取人脸的资源
router.get('/', controller.get) // 获取抓拍参数
router.put('/', controller.update) // 更新参数

module.exports = router
