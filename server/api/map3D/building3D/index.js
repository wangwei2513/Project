/*
* 楼宇路由
* @Author: chenkaibo
* @Date: 2018-06-05 15:27:09
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-07-12 18:02:08
*/

'use strict'

const router = require('koa-router')()
const controller = require('./building.controller')

// router.get('/mapid', controller.getBuildingByMapId) // 根据地图id获取所有楼宇
router.get('/', controller.getAll) // 获取所有楼宇
router.get('/:id', controller.getOne) // 获取单个楼宇
router.put('/:id', controller.update) // 修改楼宇
router.delete('/:id', controller.del) // 删除楼宇
router.get('/:id/storey', controller.getStorey) // 获取楼宇下的楼层
router.post('/', controller.add)

module.exports = router
