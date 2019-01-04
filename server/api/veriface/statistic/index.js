/*
 * @Author: linhang
 * @Date: 2018-12-11 16:04:05
 * @Last Modified by: linhang
 * @Last Modified time: 2018-12-16 16:52:44
 */
'use strict'

const router = require('koa-router')()
const controller = require('./statistics.controller')

router.get('/today', controller.today) // 今日统计数据
router.get('/analysis', controller.analysis) // 统计分析,7/14/30天的路人识别量，布控报警量
router.get('/analysis/export', controller.analysisExport) // 导出统计数据
router.get('/passby/export', controller.strangerExportData) // 陌生人导出/以图搜图导出
router.get('/alarm/export', controller.alarmExportData) // 报警检索导出
router.get('/passby', controller.getPassbyList) // 路人按照条件检索
router.get('/alarm', controller.getAlarmList) // 报警检索
router.get('/passby/img', controller.getImageByImage) // 路人以图搜图检索

module.exports = router
