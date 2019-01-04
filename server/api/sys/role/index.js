/*
 * @Author: linhang
 * @Date: 2018-10-18 10:56:01
 * @Last Modified by: linhang
 * @Last Modified time: 2018-12-18 17:19:20
 */
'use strict'
const router = require('koa-router')()
const controller = require('./role.controller')

router.get('/module', controller.getModules)
router.get('/', controller.find) // 默认显示超级管理员角色数据
router.get('/auth', controller.findAuth) // 查询权限数据
router.post('/', controller.create) // 增加角色
router.put('/:id', controller.update) // 修改角色
router.delete('/:id', controller.delete) // 删除角色
router.get('/assign', controller.findProperties) // 获取某个资源的属性
router.get('/:id', controller.findById) // 根据id查询角色数据
router.put('/updown/:id', controller.updown) // 改变位置，上移或者下移

module.exports = router
