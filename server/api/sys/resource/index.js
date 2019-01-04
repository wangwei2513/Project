/*
 * 资源路由
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:56:32
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-12-19 18:11:53
 */

'use strict'

const router = require('koa-router')()
const controller = require('./resource.controller')
const config = require('../../../../config').backend
const koaBody = require('koa-body')({
  multipart: true,
  formidable: {
    uploadDir: config.fileDirs.tempDir,
    keepExtensions: true
  }
})
router.post('/import', koaBody, controller.resourceImport) // 资源导入
router.get('/export', controller.resourceExport) // 资源导出
router.use('/video/devicealarm', require('./video/deviceAlarm').routes(), require('./video/deviceAlarm').allowedMethods())
router.use('/video/intelligentalarm', require('./video/intelligentAlarm').routes(), require('./video/intelligentAlarm').allowedMethods())
router.use('/video/monitorypointalarm', require('./video/monitoryPointAlarm').routes(), require('./video/monitoryPointAlarm').allowedMethods())
router.get('/', controller.getAll) // 资源列表
router.get('/search', controller.searchResource) // 资源搜索
// router.get('/', controller.getAuthAll)   // 资源列表
router.post('/', controller.addOne) // 新增资源

router.get('/countrtsp', controller.countRtsp) // 统计已配置的rtsp流的数量
router.get('/count', controller.count) // 统计资源管理tab头资源数量
router.get('/rtspres', controller.getRtspRes) // 获取已配置rtsp流的资源列表
router.get('/unusedrtspid', controller.getUnusedRtspId) // 获取可用的rtsp流id
router.get('/rtspserver', controller.getRtspSever) // 获取流服务器
router.put('/rtspserver', controller.editRtspSever) // 编辑流服务器
router.put('/addrtsppatch', controller.addRtspPatch) // 批量添加资源的rtsp流
router.put('/:id/updatertsp', controller.updateResourceRtsp) // 修改资源的rtsp流

router.post('/distribute', controller.distribute) // 资源分配
router.get('/distributiontree', controller.getDistributionTree) // 资源分配树（机构->设备->资源）
router.get('/alarmlist', controller.getAlarmList) // 报警输入、报警输出资源列表，报警管理模块使用
router.get('/alarmlist/dependvideo', controller.getDependVideoAlarmList) // 智能报警报警、监控点报警资源列表，报警管理模块使用
router.get('/distributiontreeforalarm', controller.getDistributionTreeForAlarmAndIpcAlarm) // 资源分配：报警主机报警、普通视频报警：机构资源树（机构->资源）
// router.get('/distributiontree', controller.getAuthDistributionTree)   // 资源分配树（机构->设备->资源）
router.put('/org', controller.upOrg) // 修改通道资源所属的机构（资源移动）
router.get('/tree', controller.getTree) // 机构资源树
router.get('/tree/multi', controller.getMultiTree) // 机构资源树(多类型)
router.get('/tree/link/alarm', controller.getResTreeOfAlarmLink) // 机构资源树> 报警联动资源获取
router.get('/tree/link/fire', controller.getResTreeOfFireLink) // 机构资源树> 消防联动资源获取
router.get('/tree/map/alarmhelp', controller.getMapAlarmHelpTree) // 机构>报警求助视频资源（地图使用）
router.get('/tree/map/multiresource', controller.getMapMultiResourceTree) // 机构>视频资源，视频报警资源树，地图模块树使用(用于获取多种类型资源)(无地图标识)
router.get('/tree/map/firealarmin', controller.getMapFireAlarmInTree) // 获取地图的输入防区树，报警主机(有地图标识)
router.get('/list/map/firealarmin', controller.getMapFireAlarmListByMapId) // 根据地图id获取输入防区列表，报警主机列表
router.post('/sync/center', controller.syncToCenter) // 通道名称同步->同步到中心
router.post('/sync/device', controller.syncToDevice) // 通道名称同步->同步到设备
router.put('/patch', controller.updatePatch) // 资源编辑(批量)
router.get('/:id', controller.getOne) // 资源详情
router.put('/:id', controller.updateOne) // 资源编辑
router.delete('/rtsp', controller.deleteResourceRtsp) // 删除资源RTSP
router.delete('/', controller.unbindPatch) // 资源机构解绑（批量）
router.delete('/patch', controller.deleteResource) // 资源删除
router.delete('/unbind', controller.unbind) // 资源机构解绑
router.delete('/unbind/vehicle', controller.unbindVehicle) // 资源机构解绑
router.post('/fire/patch', controller.addPatchFire) // 批量添加消防资源
router.delete('/:id/alarm', controller.delAlarm) // 智能报警+监控点报警删除（支持批量）
router.put('/:id/alarm/:aid', controller.updateAlarm) // 智能报警+监控点报警修改
router.post('/:chan/alarm', controller.addAlarm) // 智能报警+监控点报警新增

router.put('/', controller.patchUpdate) // 批量修改某个属性（所有指定的属性均改为相同内容）

// 资源相关的订阅
require('./substribe.js')

module.exports = router
