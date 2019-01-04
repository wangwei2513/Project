/*
 * @Author: zhangminbo
 * @Date: 2018-06-05 14:23:51
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-12-18 14:14:23
 */
'use strict'

const router = require('koa-router')()
const controller = require('./user.controller')
const config = require('../../../../config').backend
const { cfgUploadDir } = require('../../../common/tools')

router.get('/export', controller.exportData) // 导出
router.get('/info/:id', controller.userInfo) // 获取单个用户信息
router.get('/:group', controller.index) // 获取某个分组数据
router.post('/batimg', cfgUploadDir(config.fileDirs.faceUserPictureDir), controller.batImg) // 批量导入
router.post('/', controller.add) // 新增用户
router.put('/:id', controller.update) // 修改人员信息
router.delete('/bat', controller.delBat) // 批量删除人员

module.exports = router
