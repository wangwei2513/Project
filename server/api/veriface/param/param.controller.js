/*
 * @Author: linhang
 * @Date: 2018-12-07 09:58:57
 * @Last Modified by: linhang
 * @Last Modified time: 2018-12-17 17:21:35
 */
'use strict'
const { handleSysException } = require('../../../common/tools')
const mongoose = require('mongoose')
const paramModel = mongoose.model('FaceParameter')
const OrgRes = mongoose.model('OrgRes')
const Org = mongoose.model('Org')
const tool = require('../../../common/tools')
const Device = mongoose.model('Device')
const ObjectId = mongoose.Types.ObjectId
const Resource = mongoose.model('Resource')
const _ = require('lodash')
const { devOnlineList } = require('../../bstar/dev.interface')
const FaceServer = mongoose.model('FaceServer')
const postal = require('postal')
/**
 * 获取抓拍参数
 * @param {*} ctx
 */
exports.get = async ctx => {
  try {
    const data = await paramModel.findOne().lean()
    ctx.body = data
  } catch (err) {
    handleSysException(err)
  }
}
/**
 * 修改抓拍参数
 * @param {*} ctx
 */
exports.update = async ctx => {
  try {
    const data = ctx.request.body
    const param = paramModel.findOne().lean()
    // 路人库开启或者关闭发送通知
    if (param.passby !== data.passby) {
      if (data.passby) {
        postal.publish({ channel: 'faceParameter', topic: 'open.passer', data: {} })
      } else {
        postal.publish({ channel: 'faceParameter', topic: 'close.passer', data: {} })
      }
    }
    // 抓拍图片改变发送通知
    if (param.pattern !== data.pattern) {
      postal.publish({ channel: 'websocket', topic: 'ws.update', data: {} })
    }
    await paramModel.updateOne({}, data, { upsert: true })
    ctx.status = 201
  } catch (err) {
    handleSysException(err)
  }
}
// 获取人脸相机资源列表
exports.getFaceResources = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('资源管理-获取资源列表'))
    if (!ctx.query.oid) {
      return ctx.throw(500, {
        code: 1003,
        message: '该机构不存在'
      })
    }
    const orginfo = await Org.findById(ctx.query.oid).exec()
    if (_.isEmpty(orginfo)) {
      return ctx.throw(500, {
        code: 1003,
        message: '该机构不存在'
      })
    }
    let allChildrenIds = [] // 该机构的所有子机构
    if (parseInt(ctx.query.never) === -1) {
      const orgs = await Org.find(
        {
          type: orginfo.type || 0
        },
        '_id name pid order'
      )
        .sort('order')
        .exec()
      allChildrenIds = tool.getChildren(allChildrenIds, orgs, ctx.query.oid)
    }
    allChildrenIds.unshift(ctx.query.oid + '')
    let result = await OrgRes.find(
      {
        islane: false,
        org: {
          $in: allChildrenIds
        }
      },
      'resource -_id'
    ).exec()
    const _ids = _.map(result, 'resource')
    const query = { _id: { $in: _ids } }
    // 过滤报警求助的针孔摄像头
    const devs = await Device.find({ type: { $in: ['alarmBox', 'alarmPillar'] } }, '_id')
      .lean()
      .exec()
    if (ctx.query.tab === 'alarmHelp') {
      if (devs && devs.length) {
        query.eid = { $in: devs.map(dev => dev._id) }
      } else {
        query._id = new ObjectId()
      }
    } else {
      query.type = ctx.query.type
      devs && devs.length && (query.eid = { $nin: devs.map(dev => dev._id) })
    }
    ctx.query.seek && (query.name = { $regex: ctx.query.seek || '' })
    result = await Resource.find(query)
      .populate('eid')
      .skip((+ctx.query.page.page - 1) * +ctx.query.page.limit)
      .limit(+ctx.query.page.limit)
      .lean()
      .exec()
    ctx.set({
      'X-BSC-COUNT': result.length,
      'X-BSC-PAGES': Math.ceil(result.length / ctx.query.page.limit),
      'X-BSC-CUR': parseInt(ctx.query.page.page),
      'X-BSC-LIMIT': parseInt(ctx.query.page.limit)
    })
    // 判断设备在线情况
    const devices = await devOnlineList()
    const onlineRes = devices.devOnlineList.map(item => {
      return item.devIp
    })
    result.forEach(item => {
      // true:在线
      if (onlineRes.includes(item.ip)) {
        item.state = true
      } else {
        item.state = false
      }
    })
    // 查询哪些资源绑定了sdk服务器
    const faceServer = await FaceServer.find({}).lean()
    let resIds = []
    if (!_.isEmpty(faceServer)) {
      faceServer.forEach(item => {
        resIds = resIds.concat(item.res)
      })
      if (!_.isEmpty(resIds)) {
        resIds = resIds.map(item => {
          return item + ''
        })
      }
    }
    result.forEach(item => {
      item.binding = false
      if (!_.isEmpty(resIds)) {
        if (resIds.includes(item._id + '')) {
          item.binding = true
        }
      }
    })
    ctx.body = result
  } catch (err) {
    handleSysException(err)
  }
}
