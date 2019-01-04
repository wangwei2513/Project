/*
 * 区域统计路由
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:42:40
 * @Last Modified by:   chenkaibo
 * @Last Modified time: 2018-06-06 14:42:40
 */

'use strict'

const router = require('koa-router')()
const controller = require('./zone.controller')
// const auth = require('../../../auth/auth.service')

router.get('/tree', controller.getTree)
// router.get('/statistic', controller.statistic)      // 任意区域的统计
router.post('/statistic', controller.statistic) // 任意区域的统计
router.get('/all', controller.getAllResourceNum) // 根据地图id获取地图下所有的资源数量
router.get('/resource', controller.getAllResource) // 根据地图id获取地图下所有的资源数量
module.exports = router
