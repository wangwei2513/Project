/*
 * @Author: linhang
 * @Date: 2018-10-18 11:14:51
 * @Last Modified by: linhang
 * @Last Modified time: 2018-12-21 14:04:22
 */
'use strict'
const mongoose = require('mongoose')
const RoleModel = mongoose.model('Role')
const ActionModel = mongoose.model('Action')
const tool = require('../../../common/tools')
const PropertyModel = mongoose.model('ResProperty')
const ResourceModel = mongoose.model('Resource')
const User = mongoose.model('User')
const _ = require('lodash')
// 常量定义
const CONSTANT = {
  ADMIN_NAME: '超级管理员', // 超级管理员默认名称
  RESOUECE_TYPE: 0, // 视频资源type为0
  FUNC_TYPE: '1', // 功能模块类型'1'
  SYS_TYPE: '2' // 系统模块类型'2'
}
/**
 * 角色管理
 */
class Role {
  /**
   * 查询角色数据,默认展示超级管理员数据
   */
  constructor () {
    this.delFuncActions = []
    this.delSysActions = []
  }
  async find () {
    try {
      const roles = await RoleModel.find({}, 'name')
        .sort({ order: 1 })
        .lean()
        .exec()
      return roles
    } catch (err) {
      throw err
    }
  }
  /**
   * 获取权限数据
   */
  async findAuth () {
    // 1|功能模块，2|系统模块
    try {
      let [funcModules, sysModules] = await Promise.all([
        await ActionModel.find({ isapi: false, moduleType: CONSTANT.FUNC_TYPE }, 'name pid')
          .lean()
          .exec(),
        await ActionModel.find({ isapi: false, moduleType: CONSTANT.SYS_TYPE }, 'name pid')
          .lean()
          .exec()
      ])
      funcModules = tool.transData2Tree(funcModules, '_id', 'pid')
      const funcTree = this.dealActions(funcModules)
      sysModules = tool.transData2Tree(sysModules, '_id', 'pid')
      const sysTree = this.dealActions(sysModules)
      this.delFuncActions = funcTree.delActions
      this.delSysActions = sysTree.delActions
      return {
        funcModules: funcTree.tree,
        sysModules: sysTree.tree
      }
    } catch (err) {
      throw err
    }
  }
  /**
   * 处理树结构，去掉第三层子
   * @param {*} tree
   */
  dealActions (tree) {
    try {
      let delActions = []
      const root = tree[0]
      if (_.has(root, 'children')) {
        for (let item of root.children) {
          if (_.has(item, 'children')) {
            for (let item1 of item.children) {
              if (_.has(item1, 'children')) {
                delActions = delActions.concat(item1.children)
                delete item1.children
              }
            }
          }
        }
      }
      return {
        tree: tree,
        delActions: delActions
      }
    } catch (err) {
      throw err
    }
  }
  /**
   * 从删除的子里面获取action的id
   * @param {*} arr
   */
  getActionIds (arr, actionIds = []) {
    arr.forEach(item => {
      actionIds.push(item._id + '')
      if (_.has(item, 'children')) {
        this.getActionIds(item.children, actionIds)
      }
    })
    return actionIds
  }
  /**
   *根据id查找角色数据
   * @param {*} id
   */
  async findById (id) {
    try {
      let [role, funcModules, sysModules] = await Promise.all([
        await RoleModel.findById(id, 'name actions resources order loginType')
          .lean()
          .exec(),
        await ActionModel.find({ isapi: false, moduleType: CONSTANT.FUNC_TYPE }, 'muduleType')
          .lean()
          .exec(),
        await ActionModel.find({ isapi: false, moduleType: CONSTANT.SYS_TYPE }, 'muduleType')
          .lean()
          .exec()
      ])
      let funcActions = []
      let sysActions = []
      if (!_.isEmpty(role.actions)) {
        const actions = role.actions.map(item => item + '')
        // 获取功能模块action的id数组
        funcModules = funcModules.filter(item => actions.includes(item._id + ''))
        funcActions = funcModules.map(item => item._id + '')
        // 获取系统模块action的id数组
        sysModules = sysModules.filter(item => actions.includes(item._id + ''))
        sysActions = sysModules.map(item => item._id + '')

        // 过滤actionIds
        const delFuncActionIds = this.getActionIds(this.delFuncActions)
        funcActions = funcActions.filter(item => !delFuncActionIds.includes(item))
        const delSysActionIds = this.getActionIds(this.delSysActions)
        sysActions = sysActions.filter(item => !delSysActionIds.includes(item))
      }
      role.funcActions = funcActions
      role.sysActions = sysActions
      delete role.actions
      return role
    } catch (err) {
      throw err
    }
  }
  /**
   * 创建角色
   * @param {*} obj
   */
  async create (obj) {
    try {
      const orders = await RoleModel.distinct('order')
      orders.sort((a, b) => {
        return b - a
      })
      obj.order = orders[0] + 1
      const roles = await RoleModel.find({ name: obj.name })
        .lean()
        .exec()
      if (!_.isEmpty(roles)) {
        throw new Error('角色名称重复')
      }
      // 如果有属性_id,则是复制角色，反之是新增
      if (_.has(obj, 'id')) {
        const role = await RoleModel.findById(obj.id)
          .lean()
          .exec()
        obj.actions = role.actions
        obj.resources = role.resources
        delete obj._id
        // 更新角色表
        const [roleObj, props] = await Promise.all([RoleModel.create(obj), PropertyModel.find({ role: obj.id, resource: { $in: role.resources } }, 'properties resource role').lean()])
        props.forEach(item => {
          delete item._id
          item.role = roleObj._id
        })
        // 更新属性表
        await PropertyModel.create(props)
        return
      }
      await RoleModel.create(obj)
    } catch (err) {
      throw err
    }
  }
  /**
   * 修改角色
   * @param {*} id
   * @param {*} obj
   */
  async update (id, obj) {
    try {
      const resProp = obj.resource
      if (!_.isEmpty(resProp)) {
        const resIds = resProp.map(item => {
          // 本次要修改的数据中涉及到的所有资源的id
          return item.resId
        })
        const props = await PropertyModel.find({ role: id }) // 查找此角色的所有资源权限属性数据
        const OldResIds = props.map(item => {
          return item.resource + ''
        })
        // 数组取交集
        const sameResIds = _.intersection(resIds, OldResIds)
        // 如果有重合的资源数据,先删除
        if (!_.isEmpty(sameResIds)) {
          await PropertyModel.deleteMany({ role: id, resource: { $in: sameResIds } })
        }
        // 如果没有重合的数据，直接添加
        const arr = []
        resProp.forEach(item => {
          const obj = {}
          obj.resource = item.resId
          obj.role = id
          obj.properties = item.prop
          arr.push(obj)
        })
        await PropertyModel.create(arr)
        // 更新角色表
        await this.updateRole(id, obj)
      } else {
        delete obj.resource
        await RoleModel.findByIdAndUpdate(id, obj)
      }
    } catch (err) {
      throw err
    }
  }
  /**
   * 更新角色表
   * @param {*} id
   * @param {*} obj
   */
  async updateRole (id, obj) {
    try {
      const resProp = obj.resource
      const resIds = resProp.map(item => {
        // 本次要修改的数据中涉及到的所有资源的id
        return item.resId
      })
      // 所有传过来的资源的id
      const allResIds = []
      //  资源属性为空的id
      const emptyIds = []
      resProp.forEach(item => {
        allResIds.push(item.resId)
        if (_.isEmpty(item.prop)) {
          emptyIds.push(item.resId)
        }
      })
      // 查询此角色原来的资源权限id
      const role = await RoleModel.findById(id, 'resources')
      const originResIds = role.resources.map(item => {
        return item + ''
      })
      const newObj = {
        name: obj.name,
        resources: resIds,
        actions: obj.actions
      }
      if (_.isEmpty(originResIds)) {
        // 如果此角色原来没有资源权限直接更新
        // 角色表修改数据
        await RoleModel.findByIdAndUpdate(id, newObj)
      } else {
        const resArr = _.uniq(allResIds.concat(originResIds))
        _.remove(resArr, item => {
          return emptyIds.includes(item)
        })
        newObj.resources = resArr
        await RoleModel.findByIdAndUpdate(id, newObj)
      }
    } catch (err) {
      throw err
    }
  }
  /**
   * 删除角色
   * @param {*} id
   */
  async delete (id) {
    try {
      const users = await User.findOne({ role: id }).exec()
      if (users) {
        throw new Error('有用户分配了该角色，不能删除')
      }
      await RoleModel.findByIdAndRemove(id).exec()
    } catch (err) {
      throw err
    }
  }
  /**
   * 查询某个视频资源的属性
   * @param {*} id
   */
  async findProperties (resId, roleId) {
    try {
      // 给管理员添加资源权限属性数据
      const role = await RoleModel.findOne({ name: CONSTANT.ADMIN_NAME })
      const property = await PropertyModel.find({ role: role._id }, '_id')
      if (_.isEmpty(property)) {
        const resources = await ResourceModel.find({ type: 0 }, '_id')
          .lean()
          .exec()
        if (!_.isEmpty(resources)) {
          const arr = []
          resources.forEach(item => {
            const obj = {}
            obj.role = role._id
            obj.resource = item._id
            obj.properties = ['preview', 'cloudControl', 'playbackDownload']
            arr.push(obj)
          })
          await PropertyModel.create(arr)
        }
      }
      if (roleId === '5be27279e74ee9376c681111') {
        return {
          properties: ['preview', 'cloudControl', 'playbackDownload', 'alarmReceive', 'alarmConfirm', 'alarmClean', 'deployment', 'disarming', 'clean', 'bypass', 'removeBypass']
        }
      } else {
        const result = await PropertyModel.findOne({ resource: resId, role: roleId }, 'properties')
          .lean()
          .exec()
        return result || {}
      }
    } catch (err) {
      throw err
    }
  }
  async getModules () {
    try {
      const obj = await this.findAuth()
      const modules = []
      const funcModules = obj.funcModules[0].children
      funcModules.forEach(item => {
        modules.push(item.name)
      })
      const sysModules = obj.sysModules[0].children
      sysModules.forEach(item => {
        modules.push('系统-' + item.name)
      })
      return modules
    } catch (err) {
      throw err
    }
  }
}
module.exports = Role
