/*
 * @Author: chenkaibo
 * @Date: 2018-07-27 11:47:11
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-08-09 14:35:59
 */
'use strict'
const router = require('koa-router')()
const controller = require('./traffic.controller')

router.get('/servercfg', controller.getServerCfg) // 获取服务器地址
router.post('/servercfg', controller.editServerCfg) // 配置服务器地址
router.get('/alarmcfg', controller.getAlarmCfg) // 获取报警配置
router.post('/alarmcfg/batch', controller.batchAlarmCfg) // 批量配置报警配置
router.get('/lane', controller.getLaneList) // 获取服务器机构下的所有车道信息
router.get('/server', controller.index) // 获取智能交通服务器列表
router.post('/server', controller.create) // 创建智能交通服务器
router.get('/server/:id', controller.get) // 获取智能交通服务器信息
router.put('/server/:id', controller.update) // 修改智能交通服务器
router.delete('/server/:id', controller.remove) // 删除智能交通服务器
router.get('/server/:id/sync', controller.sync) // 同步智能交通服务器组织及设备

module.exports = router
