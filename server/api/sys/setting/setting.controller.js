'use strict'
/**
 * 参数设置
 */
var Sysparamters = require('mongoose').model('Sysparamters')
var Resource = require('mongoose').model('Resource')
var ServerSetting = require('mongoose').model('ServerSetting')
var paging = require('../../paging')
var _ = require('lodash')
var postal = require('postal')

/**
 * 获取参数信息
 */
exports.sysparamters = async (ctx, next) => {
  try {
    const results = await Sysparamters.findOne({}).exec()
    ctx.body = results
  } catch (error) {
    return ctx.throw(500, { code: 4101, message: error.message })
  }
}

/**
 * 系统参数新增
 */

exports.sysparamtersAdd = async (ctx, next) => {
  const newVehicleDefense = {
    // name: '平台1',
    // logo: 'LOGO地址',
    // titlecolor: '标题地址 ',
    // titlefont: '标题栏字体',
    // loginimg: '登陆页面图片',
    // alarmlog: 10,
    // equipmentlog: 20,
    // operationlog: 15,
    // configlog: 13, // 配置日志天数
    // transport: 'TCP',
    // picture: 'auto',
    // screenshot: 'png', // 截图保存格式
    // videotape: 'avi' // 本地录像格式
  }

  try {
    const vehicleDefense = await Sysparamters.create(newVehicleDefense)
    ctx.status = 201
    ctx.body = vehicleDefense
  } catch (error) {
    return ctx.throw(500, { code: 4101, message: error.message })
  }
}

/**
 * 系统参数修改
 */
exports.sysparamtersUpdate = async (ctx, next) => {
  try {
    await Sysparamters.findOneAndUpdate({}, ctx.request.body, { upsert: true }).exec()
    ctx.status = 200
  } catch (error) {
    return ctx.throw(500, { code: 4101, message: error.message })
  }
}

/**
 * 获取服务器信息列表
 */
exports.serverIndex = async (ctx, next) => {
  const search = ctx.query.search
  try {
    const results = await paging.listQuery(ServerSetting, search, '', { _id: -1 }, ctx.query.page, '', ctx)
    if (_.isEmpty(results)) {
      ctx.status = 404
      return
    }
    ctx.body = results.results
  } catch (error) {
    return ctx.throw(500, { code: 4101, message: error.message })
  }
}

/**
 * 获取登录页logo和登陆图片
 */
exports.getLoginImgs = async (ctx, next) => {
  try {
    ctx.body = await Sysparamters.findOne({}, 'logo loginimg name').exec()
  } catch (error) {
    return ctx.throw(500, { code: 4101, message: error.message })
  }
}

/**
 * 智能服务器新增
 */
exports.serverAdd = async (ctx, next) => {
  const addObj = ctx.request.body
  try {
    const result = await ServerSetting.create(addObj)
    // 发布服务器更新消息
    postal.publish({ channel: 'server', topic: 'item.message', data: {} })
    ctx.status = 201
    ctx.body = result
  } catch (error) {
    return ctx.throw(500, { code: 4101, message: error.message })
  }
}

/**
 * 智能服务器修改
 */
exports.serverUpdate = async (ctx, next) => {
  const id = ctx.params.id
  const updateObj = ctx.request.body
  try {
    const result = await ServerSetting.findByIdAndUpdate(id, updateObj)
    // 发布服务器更新消息
    postal.publish({ channel: 'server', topic: 'item.message', data: {} })
    ctx.body = result
  } catch (error) {
    return ctx.throw(500, { code: 4101, message: error.message })
  }
}

/**
 * 服务器删除
 */

exports.serverDelete = async (ctx, next) => {
  const id = ctx.params.id
  try {
    const checkResult = await Resource.countDocuments({ server: id }).exec()
    if (checkResult) {
      return ctx.throw(500, { code: 4201, message: '该服务器正被使用,无法删除!' })
    } else {
      ctx.body = await ServerSetting.findByIdAndRemove(id)
      // 发布服务器更新消息
      postal.publish({ channel: 'server', topic: 'item.message', data: {} })
    }
  } catch (error) {
    return ctx.throw(500, { code: 4101, message: error.message })
  }
}

/**
 * 服务器批量删除
 */
exports.serverBatchDelete = async (ctx, next) => {
  const ids = ctx.request.header['x-bsc-ids'].split(',') || []
  try {
    const checkResult = await Resource.countDocuments({ server: { $in: ids } }).exec()
    if (checkResult) {
      return ctx.throw(500, { code: 4201, message: '存在正被使用的服务器,无法删除!' })
    } else {
      ctx.body = await ServerSetting.deleteMany({ _id: { $in: ids } })
      // 发布服务器更新消息
      postal.publish({ channel: 'server', topic: 'item.message', data: {} })
    }
  } catch (error) {
    return ctx.throw(500, { code: 4101, message: error.message })
  }
}
/**
 * 修改文件表全局时间间隔
 */
exports.updateFileConnectTime = async (ctx, next) => {
  try {
    const time = Math.floor(new Date().getTime() / 1000)
    global.createFileConnectTime = time
    await Sysparamters.update({ creatdbtime: time })
  } catch (error) {
    return ctx.throw(500, { code: 4101, message: error.message })
  }
}

// 获取地图类型，2D或者3D
exports.getMapType = async ctx => {
  try {
    const mapType = await Sysparamters.findOne({}, 'mapType').exec()
    ctx.body = mapType
  } catch (error) {
    return ctx.throw(500, { code: 4101, message: error.message })
  }
}

exports.updateMapType = async ctx => {
  try {
    await Sysparamters.findByIdAndUpdate(ctx.request.body._id, { mapType: ctx.request.body.mapType }).exec()
    ctx.status = 200
  } catch (error) {
    return ctx.throw(500, { code: 4101, message: error.message })
  }
}
