/*
* 楼宇路由
* @Author: chenkaibo
* @Date: 2018-06-05 15:27:09
* @Last Modified by: chenkaibo
* @Last Modified time: 2018-06-05 15:27:30
*/

'use strict'

const router = require('koa-router')()
const controller = require('./building.controller')
// const auth = require('../../../auth/auth.service')

router.get('/mapid/info', controller.getBuildingInfoByLocation) // 判断楼宇是否在坐标范围内
router.get('/mapid', controller.getBuildingByMapId) // 根据地图id获取所有楼宇
router.get('/checkRepeat', controller.checkRepeat)
router.get('/', controller.getAll)
router.get('/:id', controller.getOne)
router.get('/:id/storey', controller.getStorey)
router.get('/:id/statistic', controller.statistic)
router.put('/:id', controller.updateOne)
router.delete('/:id', controller.deleteOne)
router.post('/', controller.add)

module.exports = router
