/*
 * 地图楼层路由
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:33:15
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-07-03 19:37:10
 */

'use strict'

const router = require('koa-router')()
const controller = require('./storey.controller')

router.get('/:id/point', controller.getAllPointByChannelType) // 根据地图id获取地图下所有点位
router.get('/:id/statistic', controller.statistic) // 统计某个楼层下包含的点位信息
router.get('/:id', controller.getOne)
router.put('/:id', controller.updateOne)
router.delete('/:id', controller.deleteOne)
router.post('/', controller.add)
router.get('/:id/reses', controller.getReses) // 获取当前楼层下的所有资源

module.exports = router
