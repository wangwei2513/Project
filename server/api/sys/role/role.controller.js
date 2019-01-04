/*
 * @Author: linhang
 * @Date: 2018-10-18 11:09:01
 * @Last Modified by: linhang
 * @Last Modified time: 2018-12-18 18:15:35
 */
'use strict'
const { handleSysException } = require('../../../common/tools')
const Role = require('./role.service')
const role = new Role()
const mongoose = require('mongoose')
const RoleModel = mongoose.model('Role')
const User = mongoose.model('User')
/**
 * 查询角色
 * @param {*} ctx
 */
exports.find = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('用户管理-查询角色'))
    const results = await role.find()
    ctx.body = results
  } catch (err) {
    handleSysException(err)
  }
}
/**
 * 查询角色权限
 * @param {*} ctx
 */
exports.findAuth = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('用户管理-查询角色权限'))
    const results = await role.findAuth()
    ctx.body = results
  } catch (err) {
    handleSysException(err)
  }
}
/**
 * 查询单个角色
 * @param {*} ctx
 */
exports.findById = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('用户管理-查询单个角色'))
    const id = ctx.params.id
    if (!id) {
      ctx.throw(500, { code: 2001, message: '参数不能为空' })
    }
    const result = await role.findById(id)
    ctx.body = result
  } catch (err) {
    handleSysException(err)
  }
}
/**
 * 新增角色
 * @param {*} ctx
 */
exports.create = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('用户管理-新增角色'))
    await role.create(ctx.request.body)
    ctx.status = 201
  } catch (err) {
    handleSysException(err)
  }
}
/**
 * 修改角色
 */
exports.update = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('用户管理-修改角色'))
    await role.update(ctx.params.id, ctx.request.body)
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}
/**
 * 删除角色
 */
exports.delete = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('用户管理-删除角色'))
    const id = ctx.params.id
    if (!id) {
      ctx.throw(500, { code: 2001, message: '参数不能为空' })
    }
    await role.delete(id)
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}
/**
 * 查询视频资源属性
 */
exports.findProperties = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('用户管理-查询视频资源属性'))
    // 视频资源id
    const resId = ctx.query.resId
    // 角色id
    const roleId = ctx.query.roleId
    if (!resId || !roleId) {
      ctx.throw(500, { code: 2001, message: '参数不能为空' })
    }
    const result = await role.findProperties(resId, roleId)
    ctx.body = result
  } catch (err) {
    handleSysException(err)
  }
}
/**
 * 获取模块列表
 */
exports.getModules = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('用户管理-查询模块列表'))
    const result = await role.getModules()
    ctx.body = result
  } catch (err) {
    handleSysException(err)
  }
}
exports.updown = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('用户管理-移动位置'))
    const type = ctx.request.body.type
    const id = ctx.params.id
    const updateId = ctx.request.body.id
    if (type === 'user') {
      const [user, updateUser] = await Promise.all([User.findById(id), User.findById(updateId)])
      const order = user.order
      user.order = updateUser.order
      updateUser.order = order
      await Promise.all([user.save(), updateUser.save()])
    } else {
      const [role, updateRole] = await Promise.all([RoleModel.findById(id), RoleModel.findById(updateId)])
      const order = role.order
      role.order = updateRole.order
      updateRole.order = order
      await Promise.all([role.save(), updateRole.save()])
    }
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}
