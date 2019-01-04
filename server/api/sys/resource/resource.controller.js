/*
 * 资源接口
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:56:51
 * @Last Modified by: hansen.liuhao
 * @Last Modified time: 2018-12-21 15:27:22
 */

'use strict'
const mongoose = require('mongoose')
const OrgRes = mongoose.model('OrgRes')
const Org = mongoose.model('Org')
const Resource = mongoose.model('Resource')
const Device = mongoose.model('Device')
const Origin = mongoose.model('Origin')
const RtspServer = mongoose.model('RtspServer')
const paging = require('../../paging')
const _ = require('lodash')
const tool = require('../../../common/tools')
const { updateOneFavoriteResource } = require('../favorite/favorite.controller')
const { updateOneMonitor } = require('../tvWall/monitor/monitor.controller')
const { updateOnePollingResource } = require('../tvWall/polling/polling.controller')
const { updateOneSenceResource } = require('../tvWall/scene/scene.controller')
const AlarmCfg = mongoose.model('alarmCfg')
const FireCfg = mongoose.model('fireAlarmCfg')
const MonitoryPointAlarm = mongoose.model('MonitoryPointAlarm')
const IntelligentAlarm = mongoose.model('IntelligentAlarm')
const AlarmTimeTemplate = mongoose.model('alarmTimeTemplate')
const xlsx = require('node-xlsx')
const fs = require('fs')
const postal = require('postal')
const Rtsp = require('../../../common/rtsp')
const ObjectId = mongoose.Types.ObjectId
const rtspServer = new Rtsp()
const { ORG_TYPE, RES_TYPE } = require('../../../common/constant')
const {
  getDevConf,
  updateDevConf
} = require('../../bstar/dev.interface')
const generateNum = require('../../platform/generateNum')

const treeField = 'chan name status monitortype stream point eid pinyin nodeId gbPlaDevIp gbPlaDevPort gbDevId gbParentDevId gbPlaNvrId shareServer'

// 资源分配
exports.distribute = async (ctx, next) => {
  ctx.set('loginfo', encodeURI('资源管理-资源分配'))
  const {
    oid,
    rids
  } = ctx.request.body
  const org = await Org.findById(oid).lean()
  if (org.shareType) {
    ctx.throw(500, { code: 1010, message: '下联机构不能添加资源' })
  }
  // 查找该机构下已分配的资源数
  const orgReses = await OrgRes.find({ org: oid }).lean().exec()
  const videoCount = await Resource.countDocuments({ _id: { $in: orgReses.map(item => item.resource) }, type: RES_TYPE.VIDEO }).exec()
  if ((videoCount + (rids.length || 0)) > 200) {
    ctx.throw(500, { code: 1010, message: '机构下的视频资源数量不能超过200!' })
  }
  try {
    const patchArr = []
    let patchRes = {}
    const org = await Org.findById(oid).exec()
    // if (org.isroot) {
    //   return ctx.throw(500, {
    //     code: 1004,
    //     message: '根机构不允许直接操作'
    //   })
    // }
    if (_.isEmpty(org)) {
      return ctx.throw(500, { code: 1003, message: '该机构不存在' })
    }
    const rootorg = await Org.findOne({ type: org.type || ORG_TYPE.LOCALE, isroot: true }).exec()
    let existed
    const distributedRes = []
    const ids = []
    for (let i = 0, len = rids.length; i < len; i++) {
      // 判断该资源id是否已经被分配过
      existed = await Resource.isDistributed(rids[i], rootorg)
      if (existed) { continue }
      patchRes['rootorg'] = rootorg._id
      ids.push(rids[i])
      patchRes['resource'] = rids[i]
      patchRes['org'] = oid
      patchRes['type'] = org.type
      patchArr.push(patchRes)
      distributedRes.push(rids[i])
      patchRes = {}
    }
    await Promise.all([
      OrgRes.insertMany(patchArr),
      Resource.updateMany({ _id: { $in: ids } }, { gbParentDevId: org.gbDevId }) // 资源分配到其他组织之后国标的原有的所属关系修改
    ])
    ctx.status = 201
    ctx.body = distributedRes // 返回已分配成功的所有资源id集合
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}

// 获取资源列表
exports.getAll = async ctx => {
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
  try {
    if (parseInt(ctx.query.never) === -1) {
      const orgs = await Org.find({
        type: orginfo.type || ORG_TYPE.LOCALE
      }, '_id name pid order').sort('order').exec()
      allChildrenIds = tool.getChildren(allChildrenIds, orgs, ctx.query.oid)
    }
    allChildrenIds.unshift(ctx.query.oid + '')
    let result = await OrgRes.find({
      islane: false,
      org: {
        $in: allChildrenIds
      }
    }, 'resource -_id').exec()
    const _ids = _.map(result, 'resource')
    const query = { _id: { $in: _ids } }
    // 过滤报警求助的针孔摄像头
    const devs = await Device.find({ type: { $in: ['alarmBox', 'alarmPillar'] } }, '_id').lean().exec()
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
    const count = await Resource.countDocuments(query).exec()
    result = await Resource.find(query).populate('eid').skip((+ctx.query.page.page - 1) * (+ctx.query.page.limit)).limit(+ctx.query.page.limit).lean().exec()
    // 集成数据权限
    // const reses = tool.integrationAuthData(global.authCache[ctx.state.user._id], result)
    ctx.set({
      'X-BSC-COUNT': count,
      'X-BSC-PAGES': Math.ceil(count / ctx.query.page.limit),
      'X-BSC-CUR': parseInt(ctx.query.page.page),
      'X-BSC-LIMIT': parseInt(ctx.query.page.limit)
    })
    ctx.body = result
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
// 资源搜索
exports.searchResource = async ctx => {
  ctx.set('loginfo', encodeURI('资源管理-资源搜索'))
  try {
    let allChildrenIds = [] // 该机构的所有子机构
    const orgs = await Org.find({
      type: ctx.query.orgtype
    }, '_id name pid order').sort('order').exec()
    allChildrenIds = tool.getChildren(allChildrenIds, orgs, ctx.query.oid)
    allChildrenIds.unshift(ctx.query.oid + '')
    const result = await OrgRes.find({
      islane: false,
      org: {
        $in: allChildrenIds
      }
    }, 'resource -_id').exec()
    const _ids = _.map(result, 'resource')
    const query = { _id: { $in: _ids }, type: { $in: ctx.query.types.split(',') }, $or: [{ name: { $regex: decodeURIComponent(ctx.query.seek) } }, { ip: { $regex: ctx.query.seek } }] }
    let select = 'chan type name stream ip port eid status alarmintype alarmtemplate maxdelaytime monitortype minintervaltime'
    if (ctx.query.mapType) {
      if (ctx.query.mapType === '3D') {
        select = 'chan type name stream eid status alarmintype alarmtemplate maxdelaytime monitortype minintervaltime point3D'
      } else {
        select = 'chan type name stream eid status alarmintype alarmtemplate maxdelaytime monitortype minintervaltime point'
      }
      if (ctx.query.storeyId) {
        if (ctx.query.mapType === '3D') {
          query.$or = [{ 'point3D.sid': ctx.query.storeyId }, { point3D: { $exists: false } }]
        } else {
          query.$or = [{ 'point.sid': ctx.query.storeyId }, { point: { $exists: false } }]
        }
      } else {
        if (ctx.query.mapType === '3D') {
          query.$or = [{ 'point3D.isouter': true }, { point3D: { $exists: false } }]
        } else {
          query.$or = [{ 'point.isouter': true }, { point: { $exists: false } }]
        }
      }
      // 过滤报警求助的针孔摄像头
      const devs = await Device.find({ type: { $nin: ['alarmBox', 'alarmPillar'] } }, '_id').lean().exec()
      devs && devs.length && (query.eid = { $nin: devs.map(dev => dev._id) })
    }
    const reses = await Resource.find(query, select).populate('eid').exec()
    if (ctx.state.user.name === 'admin') {
      ctx.body = reses
      return
    }
    // 集成数据权限
    const PropertyModel = require('mongoose').model('ResProperty')
    const authResArr = await PropertyModel.find({ role: ctx.state.user.role }).lean().exec()
    const authDataMap = {}
    authResArr.map(item => {
      authDataMap[item.resource + ''] = item.properties
    })
    ctx.body = tool.integrationAuthData(authDataMap, reses)
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
// 统计已分配的资源和已配置的rtsp流的数量
exports.countRtsp = async ctx => {
  try {
    let allChildrenIds = [] // 该机构的所有子机构
    if (parseInt(ctx.query.never) === -1) {
      const orgs = await Org.find({ type: ORG_TYPE.LOCALE }, '_id name pid order').sort('order').exec()
      allChildrenIds = tool.getChildren(allChildrenIds, orgs, ctx.query.oid)
    }
    allChildrenIds.unshift(ctx.query.oid + '')
    const query = { oid: { $in: allChildrenIds }, type: ctx.query.type }
    const rtspCount = await Resource.countDocuments(query).exec()
    ctx.set({ 'X-BSC-COUNT': rtspCount })
    ctx.body = rtspCount || 0
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
// 统计资源管理tab头资源数量
exports.count = async ctx => {
  try {
    let allChildrenIds = [] // 该机构的所有子机构
    const orgs = await Org.find({ type: ORG_TYPE.LOCALE }, '_id name pid order').sort('order').exec()
    allChildrenIds = tool.getChildren(allChildrenIds, orgs, ctx.query.oid)
    allChildrenIds.unshift(ctx.query.oid + '')
    let result = await OrgRes.find({
      islane: false,
      org: {
        $in: allChildrenIds
      }
    }, 'resource -_id').exec()
    const _ids = _.map(result, 'resource')
    const query = { _id: { $in: _ids }, type: RES_TYPE.VIDEO }
    const devs = await Device.find({ type: { $in: ['alarmBox', 'alarmPillar'] } }, '_id').lean().exec()
    const [videoCount, alarmHelpCount] = await Promise.all([
      Resource.countDocuments((devs && devs.length) ? _.assign(query, { eid: { $nin: devs.map(dev => dev._id) } }) : query),
      (devs && devs.length) ? Resource.countDocuments(_.assign(query, { eid: { $in: devs.map(dev => dev._id) } })) : 0
    ])
    ctx.body = { videoCount, alarmHelpCount }
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
// 获取已配置rtsp流的资源列表
exports.getRtspRes = async ctx => {
  try {
    let allChildrenIds = [] // 该机构的所有子机构
    if (parseInt(ctx.query.never) === -1) {
      const orgs = await Org.find({ type: ORG_TYPE.LOCALE }, '_id name pid order').sort('order').exec()
      allChildrenIds = tool.getChildren(allChildrenIds, orgs, ctx.query.oid)
    }
    allChildrenIds.unshift(ctx.query.oid + '')
    const query = { oid: { $in: allChildrenIds }, rtsp: { $exists: { $nin: [null, undefined] } } }
    ctx.query.seek && (query.name = { $regex: ctx.query.seek + '' || '' })
    const rtspRes = await paging.listQuery(Resource, query, '', '', ctx.query.page, { path: 'eid' }, ctx)
    ctx.body = rtspRes.results
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
// 获取可用的rtsp流配置
exports.getUnusedRtspId = async ctx => {
  try {
    const rtspServer = await RtspServer.findOne({}).lean().exec()
    if (_.isEmpty(rtspServer)) { ctx.throw(500, { code: 500, message: '请先配置流服务器' }) }
    const urlStr = `rtsp://${rtspServer.username}:${rtspServer.password}@${rtspServer.url}:${rtspServer.port}/main/id=`
    const rtspData = []
    const rids = ctx.accept.headers['x-bsc-ids'].split(',')
    rids.forEach(rid => {
      const obj = {}
      obj[rid] = { rtsp: { main: urlStr + rtspServer.getUnusedIds() } }
      rtspData.push(obj)
    })
    ctx.body = rtspData
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
// 获取流服务器
exports.getRtspSever = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('资源管理-获取流服务器'))
    const rtspServer = await RtspServer.findOne({}).exec()
    ctx.status = 200
    ctx.body = rtspServer
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
// 编辑流服务器
exports.editRtspSever = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('资源管理-编辑流服务器'))
    const rtspServer = await RtspServer.findOne({}).exec()
    if (rtspServer) {
      await RtspServer.findByIdAndUpdate(rtspServer._id, ctx.request.body).exec()
    } else {
      await RtspServer.create(ctx.request.body)
    }
    ctx.status = 200
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.addRtspPatch = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('资源管理-配置rtsp流'))
    const reqData = ctx.request.body
    await Promise.all(reqData.map(data => {
      const key = Object.keys(data)[0]
      const value = data[key]
      return Resource.findByIdAndUpdate(key, value)
    }))
    ctx.status = 200
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.updateResourceRtsp = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('资源管理-配置rtsp流'))
    const rtspId = ctx.request.body.rtsp.main.split('=').pop()
    const flag = rtspServer.unusedIds.includes(Number(rtspId))
    if (!flag) { ctx.throw(500, { code: 500, message: '该rtsp id已被占用' }) }
    await Resource.findByIdAndUpdate(ctx.params.id, ctx.request.body).exec()
    ctx.status = 200
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
// 删除资源的rtsp流
exports.deleteResourceRtsp = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('资源管理-删除资源'))
    const ids = ctx.accept.headers['x-bsc-ids'].split(',')
    const resources = await Resource.find({ _id: { $in: ids } }, 'rtsp.main').lean().exec()
    await Resource.updateMany({ _id: { $in: ids } }, { rtsp: { $unset: 1 } }, { multi: true }).exec()
    // 回收rtsp流
    resources.forEach(res => {
      let id
      if (res.rtsp.main) {
        id = res.rtsp.main.split('=').pop()
        rtspServer.setUnusedIds(Number(id))
      }
    })
    ctx.status = 200
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.deleteResource = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('资源管理-删除资源'))
    const ids = ctx.request.body.ids
    const resources = await Resource.find({ _id: { $in: ids } }).exec()
    Origin.deleteMany({ $or: [{ decodechan: { $in: ids } }, { jointorigin: { $in: ids } }] })
    postal.publish({
      channel: 'resources',
      topic: 'array.delete',
      data: {
        ctx,
        ids: resources.map(item => { if (item.type === RES_TYPE.VIDEO) { return item._id } })
      }
    })
    postal.publish({
      channel: 'alarm',
      topic: 'alarmCfg',
      data: {
        ids: resources.map(item => item._id)
      }
    })
    postal.publish({
      channel: 'alarm',
      topic: 'fireAlarmCfg',
      data: {
        ids: resources.map(item => item._id)
      }
    })
    for (var item of ids) {
      const res = await Resource.findById(item).exec()
      if (_.isEmpty(res)) {
        return ctx.throw(500, {
          code: 1014,
          message: '该资源不存在'
        })
      }
      await Promise.all([
        Resource.findByIdAndRemove(item).exec(),
        OrgRes.deleteMany({
          resource: item
        }).exec() // 删除资源机构分配中间表数据
      ])
      if (res.type === 0) {
        await Promise.all([
          updateOneFavoriteResource(res),
          updateOnePollingResource(res),
          updateOneSenceResource(res)
        ])
      }
      if (res.type === 5) {
        await updateOneMonitor(res)
      }
      postal.publish({
        channel: 'resources',
        topic: 'item.delete',
        data: {
          id: item,
          isreal: true,
          ctx: ctx
        }
      })
      if (res.rtsp && /=/g.test(res.rtsp.main)) {
        const rtspId = res.rtsp.main.split('=').pop()
        // 回收当前资源的rtsp id
        rtspServer.setUnusedIds(Number(rtspId))
      }
    }
    // postal.publish({
    //   channel: 'devices',
    //   topic: 'item.notice',
    //   data: {
    //     ctx: ctx
    //   }
    // })
    ctx.status = 200
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}

// 获取单个资源
exports.getOne = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('资源管理-获取单个资源'))
    const res = await Resource.findById(ctx.params.id).populate('eid').exec()
    ctx.body = _.isEmpty(res) ? {} : res
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}

// 修改通道资源所属的机构（资源移动）
exports.upOrg = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('资源管理-资源移动'))
    const oid = ctx.request.body.oid
    const ids = ctx.accept.headers['x-bsc-ids'].split(',')
    const neworg = await Org.findById(oid).exec()
    if (neworg.shareType) {
      ctx.throw(500, { code: 1010, message: '下联机构不能添加资源' })
    }
    const rootorg = await Org.findOne({
      isroot: true,
      type: neworg.type
    }).exec()
    for (var item of ids) {
      const orgres = await OrgRes.findOne({
        rootorg: rootorg._id,
        resource: item,
        islane: false
      }).exec()
      orgres.org = neworg
      await orgres.save()
    }
    ctx.status = 200
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}

// 资源编辑
exports.updateOne = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('资源管理-资源更新'))
    ctx.request.body.name && (ctx.request.body.pinyin = tool.transferPinyin(ctx.request.body.name))
    if (ctx.request.body.devloop === 0) {
      const res = await Resource.find({ devloop: ctx.request.body.devloop, chan: ctx.request.body.chan }).exec()
      let flag = false
      res.forEach(item => {
        if (item.devloop === ctx.request.body.devloop && item.chan === ctx.request.body.chan && item._id + '' !== ctx.request.body._id + '') { flag = true }
      })
      if (flag) {
        ctx.throw(500, { code: 1012, message: `该设备回路下防区编号已存在` })
      }
    } else if (ctx.request.body.devloop) {
      const res = await Resource.find({ devloop: ctx.request.body.devloop, chan: ctx.request.body.chan })
      let flag = false
      res.forEach(item => {
        if (item.devloop === ctx.request.body.devloop && item.chan === ctx.request.body.chan && item._id + '' !== ctx.request.body._id + '') { flag = true }
      })
      if (flag) {
        ctx.throw(500, { code: 1012, message: `该设备回路下防区编号已存在` })
      }
    }
    const body = ctx.request.body
    const old = await Resource.findById(ctx.params.id).exec()
    await Resource.findByIdAndUpdate(ctx.params.id, body).exec()
    if (body.isprerecord && body.isdelayrecord && body.precord && body.delayrecord && (old.isprerecord !== body.isprerecord || old.isdelayrecord !== body.isdelayrecord || old.precord !== body.precord || old.delayrecord !== body.delayrecord)) {
      postal.publish({
        channel: 'devices',
        topic: 'item.notice',
        data: {
          ctx: ctx,
          data: {
            module: 'resource',
            varyData: [
              {
                resourceId: ctx.params.id,
                before: {
                  channelName: old.name,
                  devType: +old.type,
                  streamType: old.stream,
                  keyboardNum: old.keycode,
                  isDelayRecord: old.isdelayrecord,
                  isPreRecord: old.isprerecord,
                  delayTime: old.delayrecord || 0,
                  preTime: old.precord || 0
                },
                after: {
                  channelName: body.name,
                  devType: +body.type,
                  streamType: body.stream,
                  keyboardNum: body.keycode,
                  isDelayRecord: body.isdelayrecord,
                  isPreRecord: body.isprerecord,
                  delayTime: body.delayrecord || 0,
                  preTime: body.precord || 0
                }
              }
            ],
            newData: []
          }
        }
      })
    }
    ctx.status = 200
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message, type: err.type || '' } : { code: 1001, message: '系统内部错误' })
  }
}
// 资源批量编辑
exports.updatePatch = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('资源管理-资源批量更新'))
    const ids = ctx.accept.headers['x-bsc-ids'].split(',')
    const body = ctx.request.body
    await Promise.all(
      ids.map(id => {
        return Resource.findByIdAndUpdate(id, body).exec()
      })
    )
    ctx.status = 200
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message, type: err.type || '' } : { code: 1001, message: '系统内部错误' })
  }
}
// 资源分配:机构设备资源树
exports.getDistributionTree = async ctx => {
  ctx.set('loginfo', encodeURI('资源管理-获取未分配的资源树'))
  let allChildrenIds = [] // 该机构的所有子机构
  if (!ctx.query.orgtype) {
    return ctx.throw(500, { code: -1, message: '参数不能为空' })
  }
  const { _id: rootId } = await Org.findOne({ type: ORG_TYPE.LOCALE, isroot: true }, '_id').lean().exec()
  if (!ctx.query.oid) { // 用户不传oid。则按照当前用户的权限下的机构id去处理
    ctx.query.oid = rootId
    // ctx.query.oid = '59880cdfef54131c051818a3'
  }
  try {
    const allorg = await Org.find({
      type: 0
    }, '_id name pid order').sort('order').exec()
    const rootorg = await Org.findOne({
      type: ctx.query.orgtype,
      isroot: true
    }).exec()
    allChildrenIds = tool.getChildren(allChildrenIds, allorg, ctx.query.oid)
    allChildrenIds.unshift(ctx.query.oid + '') // 所有的现场机构
    let orgs = await Org.find({
      _id: {
        $in: allChildrenIds
      }
    }, '_id name pid isroot').sort({ order: -1 }).lean().exec()
    const query = {}
    // 过滤报警求助的针孔摄像头
    const devs = await Device.find({ type: { $in: ['alarmBox', 'alarmPillar'] } }, '_id').lean().exec()
    if (ctx.query.tab === 'alarmHelp') {
      devs && devs.length && (query.eid = { $in: devs.map(dev => dev._id + '') })
    } else {
      query.type = ctx.query.type
      devs && devs.length && (query.eid = { $nin: devs.map(dev => dev._id + '') })
    }
    // 过滤报警求助的针孔摄像头
    // const devs = Device.find({ type: { $nin: ['alarmBox', 'alarmPillar'] } }, '_id').lean().exec()
    // devs && devs.length && (query.eid = { $nin: devs.map(dev => dev._id) })
    const reses = await Resource.find(query, '_id name type eid').exec()
    // 在这里进行资源过滤（已分配的资源不展示）
    const orgreses = await OrgRes.find({ // 选出所有已分配到机构下的资源
      rootorg: rootorg._id,
      resource: {
        $in: _.map(reses, '_id')
      }
    }).exec()
    const orgResMap = {}
    orgreses.forEach(item => {
      orgResMap[item.resource + ''] = 1
    })
    const orgids = orgs.map(org => org._id)
    const devQuery = {}
    // 过滤报警求助的针孔摄像头设备
    if (ctx.query.tab === 'alarmHelp') {
      if (devs && devs.length) {
        devQuery._id = { $in: devs.map(dev => dev._id + '') }
      } else {
        ctx.body = []
        return
      }
    } else {
      devQuery.oid = { $in: orgids }
      devQuery.bigtype = ctx.query.bigtype
      devs && devs.length && (devQuery._id = { $nin: devs.map(dev => dev._id + '') })
    }
    const devices = await Device.find(devQuery, 'name oid status').lean().exec()
    let resources
    const devids = devices.map(dev => dev._id)
    query.eid = { $in: devids }
    if (Number(ctx.query.rtsp) === 1) {
      query.resp = { $exists: false }
      resources = await Resource.find(query).lean().exec()
    } else {
      resources = await Resource.find(query).lean().exec()
      resources = resources.filter(resource => {
        // if (!orgreses.map(res => res.resource + '').includes(resource._id + '')) return resource
        if (!orgResMap[resource._id + '']) { return resource }
      })
    }
    const arr = new Array(devices.length)
    _.fill(arr, { equip: true })
    _.merge(devices, arr)
    const resMapping = {}
    resources.forEach(res => {
      !resMapping[res.eid + ''] && (resMapping[res.eid + ''] = [])
      resMapping[res.eid + ''] = [...resMapping[res.eid + ''], res]
    })
    const devMapping = {}
    devices.forEach(dev => {
      !devMapping[dev.oid + ''] && (devMapping[dev.oid + ''] = [])
      devMapping[dev.oid + ''] = [...devMapping[dev.oid + ''], dev]
    })
    orgs.forEach(org => {
      devMapping[org._id + ''] && devMapping[org._id + ''].forEach(dev => {
        if (resMapping[dev._id + '']) {
          dev.children = resMapping[dev._id + '']
          // 节点过滤
        } else {
          devMapping[org._id + ''] = devMapping[org._id + ''].filter(item => item._id + '' !== dev._id + '')
        }
      })
      org.children = devMapping[org._id + ''] || []
    })
    // 节点过滤
    // 获取所有的机构pid
    const orgPids = orgs.map(item => item.pid + '').filter(item => item !== undefined)
    // 机构集合数据转化以及过滤掉没有设备的机构(不包括当期传入机构)
    orgs = orgs.filter(org => {
      if (org.isroot) {
        return org
      } else if (org._id + '' === ctx.query.oid) {
        return org
      }
      if (org.children && org.children.length) {
        return org
      } else if (orgPids.includes(org._id + '')) {
        return org
      }
    })
    ctx.body = tool.transData2Tree(orgs, '_id', 'pid', true).pop()
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
// 报警管理列表获取(报警输入、报警输出)
exports.getAlarmList = async ctx => {
  ctx.set('loginfo', encodeURI('资源管理-获取资源列表'))
  try {
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
      const orgs = await Org.find({
        type: orginfo.type || ORG_TYPE.LOCALE
      }, '_id name pid order').sort('order').exec()
      allChildrenIds = tool.getChildren(allChildrenIds, orgs, ctx.query.oid)
    }
    allChildrenIds.unshift(ctx.query.oid + '')
    let result = await OrgRes.find({
      islane: false,
      org: {
        $in: allChildrenIds
      }
    }, 'resource -_id').exec()
    const search = {
      type: {
        $in: ctx.query.channelTypes.split(',')
      }
    }
    const _ids = _.map(result, 'resource')
    _.merge(search, {
      _id: {
        $in: _ids
      }
    })
    result = await paging.listQuery(Resource, {
      $and: [search, {
        name: {
          $regex: ctx.query.seek || ''
        }
      }]
    }, '', '', ctx.query.page, { path: 'eid' }, ctx)
    ctx.body = _.isEmpty(result.results) ? [] : result.results
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
// 智能报警、监控点报警列表获取
exports.getDependVideoAlarmList = async ctx => {
  ctx.set('loginfo', encodeURI('资源管理-获取资源列表'))
  try {
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
      const orgs = await Org.find({
        type: orginfo.type || ORG_TYPE.LOCALE
      }, '_id name pid order').sort('order').exec()
      allChildrenIds = tool.getChildren(allChildrenIds, orgs, ctx.query.oid)
    }
    allChildrenIds.unshift(ctx.query.oid + '')
    const result = await OrgRes.find({
      islane: false,
      org: {
        $in: allChildrenIds
      }
    }, 'resource -_id').exec()
    const _ids = _.map(result, 'resource')
    // 找出视频资源
    const resources = await Resource.find({ type: RES_TYPE.VIDEO, _id: { $in: _ids } }).exec()
    const resIds = resources.map(item => item._id + '')
    // schema mapping
    const mapping = {
      intelligentAlarm: IntelligentAlarm,
      monitoryPointAlarm: MonitoryPointAlarm
    }
    // 分页查询
    const res = await paging.listQuery(mapping[ctx.query.category], { rid: { $in: resIds } }, '', '', ctx.query.page, { path: 'rid', select: 'eid', populate: { path: 'eid', select: 'name' } }, ctx)
    let resultRes = []
    if (ctx.query.seek) {
      if (!_.isEmpty(res.results)) {
        res.results.forEach(item => {
          if (new RegExp(ctx.query.seek).test(item.rid.eid.name)) { resultRes.push(item) }
        })
      }
    } else {
      resultRes = [...res.results]
    }
    ctx.body = resultRes
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
// 资源分配:报警主机报警、普通视频报警：机构资源树,消防报警
exports.getDistributionTreeForAlarmAndIpcAlarm = async ctx => {
  ctx.set('loginfo', encodeURI('资源管理-获取未分配的资源树'))
  let allChildrenIds = [] // 该机构的所有子机构
  if (!ctx.query.orgtype) {
    return ctx.throw(500, { code: 1008, message: '参数不能为空' })
  }
  const { _id: rootId } = await Org.findOne({ type: ORG_TYPE.LOCALE, isroot: true }, '_id').lean().exec()
  try {
    const allorg = await Org.find({
      type: 0
    }, '_id name pid order').exec()
    const rootorg = await Org.findOne({
      type: ctx.query.orgtype,
      isroot: true
    }).exec()
    allChildrenIds = tool.getChildren(allChildrenIds, allorg, ctx.query.oid || rootId + '')
    allChildrenIds.unshift(ctx.query.oid || rootId + '') // 所有的现场机构
    let orgs = await Org.find({
      _id: {
        $in: allChildrenIds
      }
    }, '_id name pid isroot').sort({ name: -1 }).lean().exec()
    const reses = await Resource.find({ type: { $in: ctx.query.channelTypes.split(',') } }, '_id name type eid').exec()
    const orgArr = new Array(orgs.length)
    _.fill(orgArr, { isOrg: true })
    _.merge(orgs, orgArr)
    // 在这里进行资源过滤（已分配的资源不展示）
    const orgreses = await OrgRes.find({ // 选出所有已分配到机构下的资源
      rootorg: rootorg._id,
      resource: {
        $in: _.map(reses, '_id')
      }
    }).exec()
    const orgids = orgs.map(org => org._id)
    const devices = await Device.find({ oid: { $in: orgids }, bigtype: { $in: ctx.query.bigTypes.split(',') } }, 'name oid bigtype').lean().exec()
    const devids = devices.map(dev => dev._id)
    let resources = await Resource.find({ eid: { $in: devids }, type: { $in: ctx.query.channelTypes.split(',') } }).lean().exec()
    resources = resources.filter(resource => {
      if (!orgreses.map(res => res.resource + '').includes(resource._id + '')) { return resource }
    })
    const arr = new Array(devices.length)
    _.fill(arr, { equip: true })
    _.merge(devices, arr)
    const resMapping = {}
    resources.forEach(res => {
      !resMapping[res.eid + ''] && (resMapping[res.eid + ''] = [])
      resMapping[res.eid + ''] = [...resMapping[res.eid + ''], res]
    })
    const devMapping = {}
    devices.forEach(dev => {
      !devMapping[dev.oid + ''] && (devMapping[dev.oid + ''] = [])
      devMapping[dev.oid + ''] = [...devMapping[dev.oid + ''], dev]
    })
    orgs.forEach(org => {
      devMapping[org._id + ''] && devMapping[org._id + ''].forEach(dev => {
        if (resMapping[dev._id + '']) {
          dev.children = resMapping[dev._id + '']
        } else {
          devMapping[org._id + ''] = devMapping[org._id + ''].filter(item => item._id + '' !== dev._id + '')
        }
      })
      org.children = devMapping[org._id + ''] || []
    })
    // 获取所有的机构pid
    const orgPids = orgs.map(item => item.pid + '').filter(item => item !== undefined)
    // 机构集合数据转化以及过滤掉没有设备的机构(不包括当期传入机构)
    // const orgsMapping = {}
    // orgs.forEach(org => {
    //   orgsMapping[org._id + ''] = org
    // })
    // const notChildIds = orgids.filter(id => !orgPids.includes(id + ''))
    // notChildIds.forEach(oid => filterNull(oid + '', orgsMapping))
    // orgs = []
    // if (_.isEmpty(orgsMapping)) {
    //   const org = await Org.findById(ctx.query.oid)
    //   orgs.push(org)
    // } else {
    //   for (const org in orgsMapping) {
    //     orgs.push(orgsMapping[org])
    //   }
    // }
    orgs = orgs.filter(org => {
      if (org.isroot) {
        return org
      } else if (org._id + '' === ctx.query.oid) {
        return org
      }
      if (org.children && org.children.length) {
        return org
      } else if (orgPids.includes(org._id + '')) {
        return org
      }
    })
    ctx.body = tool.transData2Tree(orgs, '_id', 'pid', true).pop()
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}

// 机构资源树(已分配)
exports.getTree = async ctx => {
  ctx.set('loginfo', encodeURI('资源管理-获取机构资源树'))
  const oid = ctx.query.oid
  const rid = ctx.query.rid
  delete ctx.query.rid
  let allChildrenIds = [] // 该机构的所有子机构
  const [allorg, rootorg] = await Promise.all([
    Org.find({
      type: ctx.query.orgtype || ORG_TYPE.LOCALE
    }, '_id name pid order').sort({ 'order': -1 }).exec(),
    Org.findOne({
      type: ctx.query.orgtype || ORG_TYPE.LOCALE,
      isroot: true
    }).exec()
  ])
  if (!oid) {
    allChildrenIds = tool.getChildren(allChildrenIds, allorg, rootorg._id + '')
    allChildrenIds.unshift(rootorg._id + '')
  } else {
    allChildrenIds = tool.getChildren(allChildrenIds, allorg, oid)
    allChildrenIds.unshift(oid)
  }
  let orgReses = await OrgRes.find({
    islane: false,
    org: {
      $in: allChildrenIds
    }
  }, 'resource org').sort('name').exec()
  const againOrgReses = await OrgRes.find({
    islane: true,
    rootorg: rootorg._id
  }, 'resource org').exec()
  const newOrgReses = []
  let flag
  for (let i = 0; i < orgReses.length; i++) {
    flag = true
    for (let j = 0; j < againOrgReses.length; j++) {
      if (orgReses[i].resource + '' === ('' + againOrgReses[j].resource)) {
        flag = false
        break
      }
    }
    if (flag) { // 说明没有重复的resource（既islane true|false）, 即重复的数据不添加
      newOrgReses.push(orgReses[i])
    }
  }
  orgReses = newOrgReses
  const [orgResHash, resHash] = [{}, {}]
  let reses = []
  if (ctx.query.devicetype !== undefined) {
    reses = await Resource.find({}, treeField).populate({
      path: 'eid',
      select: 'name type ip cport dport manufacturer',
      match: {
        bigtype: ctx.query.devicetype
      }
    }).sort('name').lean().exec()
  } else {
    reses = await Resource.find({ type: ctx.query.type }, treeField).populate({
      path: 'eid',
      select: 'name type ip cport dport manufacturer'
    }).sort('name').lean().exec()
  }
  // 若是获取rtsp分配的树
  // if (Number(ctx.query.rtsp) === 0) {
  //   // 过滤已经存在rtsp的资源
  //   reses = reses.filter(res => !res.toObject().rtsp)
  // }
  // 集成数据权限
  if (ctx.state.user.role + '' !== '5be27279e74ee9376c681111') {
    const PropertyModel = require('mongoose').model('ResProperty')
    const authResArr = await PropertyModel.find({ role: ctx.state.user.role }).lean().exec()
    const authDataMap = {}
    authResArr.map(item => {
      authDataMap[item.resource + ''] = item.properties
    })
    reses = tool.integrationAuthData(authDataMap, reses)
  }
  const allResIds = _.map(reses, '_id').toString() // 所有的资源数据（这里是为了做查询过滤）
  reses.forEach(item => (resHash[item._id] = item))
  const temp = orgReses.filter(item => {
    return allResIds.indexOf(item.resource + '') !== -1
  })
  temp.forEach(item => {
    !orgResHash[item.org] && (orgResHash[item.org] = [])
    if (resHash[item.resource]) {
      orgResHash[item.org] = [...orgResHash[item.org], resHash[item.resource]]
    }
  })
  try {
    let mainRes, orgRes
    if (rid) {
      mainRes = await Resource.findById(rid).exec()
      orgRes = await OrgRes.findOne({
        resource: rid,
        islane: true
      }).exec()
    }
    const allOrgs = await Org.find({
      _id: {
        $in: allChildrenIds
      }
    }, '_id pid name').sort({ order: -1 }).exec()
    const tempArr = new Array(allOrgs.length)
    _.fill(tempArr, { _doc: { isOrg: true } })
    _.merge(allOrgs, tempArr)
    const resultRes = allOrgs.map(item => {
      item = item.toObject()
      item.children = orgResHash[item._id] // 剔除所有非allResIds的资源id
      if (orgRes && item._id + '' === ('' + orgRes.org)) {
        if (!item.children) { item.children = [] }
        item.children = [...item.children, mainRes]
      }
      return item
    })
    ctx.body = tool.transData2Tree(resultRes, '_id', 'pid', true).pop()
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.getMultiTree = async ctx => {
  ctx.set('loginfo', encodeURI('资源管理-获取机构资源树'))
  try {
    const oid = ctx.query.oid
    let allChildrenIds = [] // 该机构的所有子机构
    const [allorg, rootorg] = await Promise.all([
      Org.find({
        type: ctx.query.orgtype || ORG_TYPE.LOCALE
      }, '_id name pid order').sort({ 'order': -1 }).exec(),
      Org.findOne({
        type: ctx.query.orgtype || ORG_TYPE.LOCALE,
        isroot: true
      }).exec()
    ])
    if (!oid) {
      allChildrenIds = tool.getChildren(allChildrenIds, allorg, rootorg._id)
      allChildrenIds.unshift(rootorg._id + '')
    } else {
      allChildrenIds = tool.getChildren(allChildrenIds, allorg, oid)
      allChildrenIds.unshift(oid)
    }
    let orgReses = await OrgRes.find({
      islane: false,
      org: {
        $in: allChildrenIds
      }
    }, 'resource org').sort('name').exec()
    const againOrgReses = await OrgRes.find({
      islane: true,
      rootorg: rootorg._id
    }, 'resource org').exec()
    const newOrgReses = []
    let flag
    for (let i = 0; i < orgReses.length; i++) {
      flag = true
      for (let j = 0; j < againOrgReses.length; j++) {
        if (orgReses[i].resource + '' === ('' + againOrgReses[j].resource)) {
          flag = false
          break
        }
      }
      if (flag) { // 说明没有重复的resource（既islane true|false）, 即重复的数据不添加
        newOrgReses.push(orgReses[i])
      }
    }
    orgReses = newOrgReses
    const [orgResHash, resHash] = [{}, {}]
    const reses = await Resource.find({ type: { $in: ctx.query.types.split(',') } }, treeField).populate({
      path: 'eid',
      select: 'name type ip cport dport manufacturer'
    }).sort('name').exec()
    const allResIds = _.map(reses, '_id').toString() // 所有的资源数据（这里是为了做查询过滤）
    reses.forEach(item => (resHash[item._id] = item))
    const temp = orgReses.filter(item => {
      return allResIds.indexOf(item.resource + '') !== -1
    })
    temp.forEach(item => {
      !orgResHash[item.org] && (orgResHash[item.org] = [])
      if (resHash[item.resource]) {
        orgResHash[item.org] = [...orgResHash[item.org], resHash[item.resource]]
      }
    })
    const allOrgs = await Org.find({
      _id: {
        $in: allChildrenIds
      }
    }, '_id pid name').sort({ order: -1 }).exec()
    const tempArr = new Array(allOrgs.length)
    _.fill(tempArr, { _doc: { isOrg: true } })
    _.merge(allOrgs, tempArr)
    const resultRes = allOrgs.map(item => {
      item = item.toObject()
      item.children = orgResHash[item._id]
      return item
    })
    ctx.body = tool.transData2Tree(resultRes, '_id', 'pid', true).pop()
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
// 获取配置联动视频的树
exports.getResTreeOfAlarmLink = async ctx => {
  ctx.set('loginfo', encodeURI('资源管理-获取配置联动视频的树(联动模块使用)'))
  try {
    const oid = ctx.query.oid
    let allChildrenIds = [] // 该机构的所有子机构
    const allorg = await Org.find({ type: ctx.query.orgtype || ORG_TYPE.LOCALE }, '_id name pid order').sort('order').exec()
    const { _id: rootId } = await Org.findOne({ type: ORG_TYPE.LOCALE, isroot: true }, '_id').lean().exec()
    if (ctx.query.never === '-1') {
      allChildrenIds = tool.getChildren(allChildrenIds, allorg, oid || rootId)
    }
    allChildrenIds.unshift(oid || rootId)
    const orgReses = await OrgRes.find({
      islane: false,
      org: {
        $in: allChildrenIds
      }
    }, 'resource org').sort('name').exec()
    const [orgResHash, resHash] = [{}, {}]
    const reses = await Resource.find({ type: { $in: ctx.query.channelTypes.split(',') } }, 'chan name monitortype status stream point eid').populate({ path: 'eid', select: 'name ip cport dport manufacturer' }).sort('name').exec()
    const allResIdsStr = _.map(reses, '_id').toString() // 所有的资源数据（这里是为了做查询过滤）
    reses.forEach(item => (resHash[item._id] = item))
    const temp = orgReses.filter(item => { // 过滤资源和资源机构关系的集合
      return allResIdsStr.indexOf(item.resource + '') !== -1
    })
    // const alarmCfgs = await AlarmCfg.find({ type: ctx.query.linkType }, 'actionVideo actionOutCtl').exec()
    // // 获取已配置联动资源的id字符串，用于过滤
    // const linkResStr = alarmCfgs && alarmCfgs.map(alarmCfg => {
    //   if (alarmCfg.actionVideo.length && alarmCfg.actionOutCtl.length) {
    //     // 返回单个监控点配置的不重复的资源id字符串
    //     return [...new Set([...alarmCfg.actionVideo.map(item => item.resource + ''), ...alarmCfg.actionOutCtl.map(item => item.resource + '')])].toString() // 返回资源数组后进行连接，再过滤
    //   } else if (alarmCfg.actionVideo.length && !alarmCfg.actionOutCtl.length) {
    //     // 返回单个监控点配置的不重复的资源id字符串
    //     return [...new Set(alarmCfg.actionVideo.map(item => item.resource + ''))].toString() // 返回资源数组后进行连接，再过滤
    //   } else if (!alarmCfg.actionVideo.length && alarmCfg.actionOutCtl.length) {
    //     // 返回单个监控点配置的不重复的资源id字符串
    //     return [...new Set(alarmCfg.actionOutCtl.map(item => item.resource + ''))].toString() // 返回资源数组后进行连接，再过滤
    //   }
    // }).join(',')
    const alarmCfg = await AlarmCfg.findOne({ resource: ctx.query.resId }, 'actionVideo actionOutCtl').lean().exec()
    let linkResStr
    if (alarmCfg) {
      linkResStr = alarmCfg.actionVideo.length && alarmCfg.actionOutCtl.length ? [...new Set([...alarmCfg.actionVideo.map(item => item.resource + ''), ...alarmCfg.actionOutCtl.map(item => item.resource + '')])].join(',') : alarmCfg.actionVideo.length && !alarmCfg.actionOutCtl.length ? [...new Set(alarmCfg.actionVideo.map(item => item.resource + ''))].join(',') : !alarmCfg.actionVideo.length && alarmCfg.actionOutCtl.length ? [...new Set(alarmCfg.actionOutCtl.map(item => item.resource + ''))].join(',') : ''
    } else {
      linkResStr = ''
    }
    const temp2 = temp.filter(item => { // 过滤联动资源和资源机构关系的集合(二次过滤)
      return linkResStr.indexOf(item.resource + '') === -1
    })
    temp2.forEach(item => {
      !orgResHash[item.org] && (orgResHash[item.org] = [])
      if (resHash[item.resource]) {
        orgResHash[item.org] = [...orgResHash[item.org], resHash[item.resource]]
      }
    })
    const allOrgs = await Org.find({
      _id: {
        $in: allChildrenIds
      }
    }, '_id pid name').sort({ order: -1 }).lean().exec()
    const orgArr = new Array(allOrgs.length)
    _.fill(orgArr, { isOrg: true })
    _.merge(allOrgs, orgArr)
    const resultRes = allOrgs.map(item => {
      item.children = orgResHash[item._id]
      return item
    })
    ctx.body = tool.transData2Tree(resultRes, '_id', 'pid', true).pop()
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.getResTreeOfFireLink = async ctx => {
  ctx.set('loginfo', encodeURI('资源管理-获取配置联动视频的树(联动模块使用)'))
  try {
    const oid = ctx.query.oid
    let allChildrenIds = [] // 该机构的所有子机构
    const allorg = await Org.find({ type: ctx.query.orgtype || ORG_TYPE.LOCALE }, '_id name pid order').sort('order').exec()
    const { _id: rootId } = await Org.findOne({ type: ORG_TYPE.LOCALE, isroot: true }, '_id').lean().exec()
    if (ctx.query.never === '-1') {
      allChildrenIds = tool.getChildren(allChildrenIds, allorg, oid || rootId)
    }
    allChildrenIds.unshift(oid || rootId)
    const orgReses = await OrgRes.find({
      islane: false,
      org: {
        $in: allChildrenIds
      }
    }, 'resource org').sort('name').exec()
    const [orgResHash, resHash] = [{}, {}]
    const reses = await Resource.find({ type: { $in: ctx.query.channelTypes.split(',') } }, 'chan name monitortype status stream point eid').populate({ path: 'eid', select: 'name ip cport dport manufacturer' }).sort('name').exec()
    const allResIdsStr = _.map(reses, '_id').toString() // 所有的资源数据（这里是为了做查询过滤）
    reses.forEach(item => (resHash[item._id] = item))
    const temp = orgReses.filter(item => { // 过滤资源和资源机构关系的集合
      return allResIdsStr.indexOf(item.resource + '') !== -1
    })
    // const fireCfgs = await FireCfg.find({}, 'actionVideo actionOutCtl').exec()
    // // 获取已配置联动资源的id字符串，用于过滤
    // const linkResStr = fireCfgs && fireCfgs.map(fireCfg => {
    //   if (fireCfg.actionVideo.length) {
    //     // 返回单个监控点配置的不重复的资源id字符串
    //     return [...new Set(fireCfg.actionVideo.map(item => item.resource + ''))].toString() // 返回资源数组后进行连接，再过滤
    //   }
    // }).join(',')
    const fireCfg = await FireCfg.findOne({ resource: ctx.query.resId }, 'actionVideo').lean().exec()
    let linkResStr
    if (fireCfg) {
      linkResStr = fireCfg.actionVideo.length ? [...new Set(fireCfg.actionVideo.map(item => item.resource + ''))].join(',') : ''
    } else {
      linkResStr = ''
    }
    const temp2 = temp.filter(item => { // 过滤联动资源和资源机构关系的集合(二次过滤)
      return linkResStr.indexOf(item.resource + '') === -1
    })
    temp2.forEach(item => {
      !orgResHash[item.org] && (orgResHash[item.org] = [])
      if (resHash[item.resource]) {
        orgResHash[item.org] = [...orgResHash[item.org], resHash[item.resource]]
      }
    })
    const allOrgs = await Org.find({
      _id: {
        $in: allChildrenIds
      }
    }, '_id pid name').sort({ order: -1 }).lean().exec()
    const orgArr = new Array(allOrgs.length)
    _.fill(orgArr, { isOrg: true })
    _.merge(allOrgs, orgArr)
    const resultRes = allOrgs.map(item => {
      item.children = orgResHash[item._id]
      return item
    })
    ctx.body = tool.transData2Tree(resultRes, '_id', 'pid', true).pop()
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
// 获取地图报警树
exports.getMapAlarmHelpTree = async ctx => {
  ctx.set('loginfo', encodeURI('资源管理-获取地图报警求助'))
  try {
    const storeyId = ctx.query.storeyId
    const query = {}
    const alarmBoxs = await Device.find({ type: { $in: 'alarmBox' } }, '_id').lean().exec()
    const alarmPillars = await Device.find({ type: { $in: 'alarmPillar' } }, '_id').lean().exec()
    query.eid = { $in: [...alarmBoxs.map(item => item._id), ...alarmPillars.map(item => item._id)] }
    let select
    if (ctx.query.mapType === '3D') {
      select = 'chan type name eid status alarmintype alarmtemplate maxdelaytime monitortype minintervaltime point3D'
    } else {
      select = 'chan type name eid status alarmintype alarmtemplate maxdelaytime monitortype minintervaltime point'
    }
    if (storeyId) {
      if (ctx.query.mapType === '3D') {
        query.$or = [{ 'point3D.sid': storeyId }, { point3D: { $exists: false } }]
      } else {
        query.$or = [{ 'point.sid': storeyId }, { point: { $exists: false } }]
      }
    } else {
      if (ctx.query.mapType === '3D') {
        query.$or = [{ 'point3D.isouter': true }, { point3D: { $exists: false } }]
      } else {
        query.$or = [{ 'point.isouter': true }, { point: { $exists: false } }]
      }
    }
    const reses = await Resource.find(query, select).populate({
      path: 'eid',
      select: 'name ip cport type dport manufacturer'
    }).lean().exec()
    const root = await Org.findOne({ isroot: true, type: ORG_TYPE.LOCALE }).exec()
    const result = {
      _id: root._id || '1',
      name: root.name || '根节点',
      isOrg: true,
      children: [
        {
          _id: 2,
          name: '报警柱',
          isOrg: true,
          pid: root._id,
          children: reses.filter(res => alarmPillars.map(item => item._id + '').includes(res.eid._id + ''))
        },
        {
          _id: 3,
          name: '报警箱',
          isOrg: true,
          pid: root._id,
          children: reses.filter(res => alarmBoxs.map(item => item._id + '').includes(res.eid._id + ''))
        }
      ]
    }
    ctx.body = result
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
// 机构>视频资源，视频报警资源树，地图模块树使用(用于获取多种类型资源)(已分配)
exports.getMapMultiResourceTree = async ctx => {
  ctx.set('loginfo', encodeURI('资源管理-视频资源，视频报警资源树'))
  try {
    const oid = ctx.query.oid
    const storeyId = ctx.query.storeyId
    const channelTypes = ctx.query.channelTypes
    const mapType = ctx.query.mapType
    let allChildrenIds = [] // 该机构的所有子机构
    const [allorg, rootorg] = await Promise.all([
      Org.find({
        type: ctx.query.orgtype || ORG_TYPE.LOCALE
      }, '_id name pid order').exec(),
      Org.findOne({
        type: ctx.query.orgtype || ORG_TYPE.LOCALE,
        isroot: true
      }).exec()
    ])
    if (!oid) {
      allChildrenIds = tool.getChildren(allChildrenIds, allorg, rootorg._id)
      allChildrenIds.unshift(rootorg._id + '')
    } else {
      allChildrenIds = tool.getChildren(allChildrenIds, allorg, oid)
      allChildrenIds.unshift(oid)
    }
    let orgReses = await OrgRes.find({
      islane: false,
      org: {
        $in: allChildrenIds
      }
    }, 'resource org').sort('name').exec()
    const againOrgReses = await OrgRes.find({
      islane: true,
      rootorg: rootorg._id
    }, 'resource org').exec()
    const newOrgReses = []
    let flag
    for (let i = 0; i < orgReses.length; i++) {
      flag = true
      for (let j = 0; j < againOrgReses.length; j++) {
        if (orgReses[i].resource + '' === ('' + againOrgReses[j].resource)) {
          flag = false
          break
        }
      }
      if (flag) { // 说明没有重复的resource（既islane true|false）, 即重复的数据不添加
        newOrgReses.push(orgReses[i])
      }
    }
    orgReses = newOrgReses
    const [orgResHash, resHash] = [{}, {}]
    const query = { type: { $in: channelTypes.split(',') } }
    let select
    if (mapType === '3D') {
      select = 'chan type name stream eid status alarmintype alarmtemplate maxdelaytime monitortype minintervaltime point3D nodeId gbPlaDevIp gbPlaDevPort gbDevId gbParentDevId gbPlaNvrId shareServer'
    } else {
      select = 'chan type name stream eid status alarmintype alarmtemplate maxdelaytime monitortype minintervaltime point nodeId gbPlaDevIp gbPlaDevPort gbDevId gbParentDevId gbPlaNvrId shareServer'
    }
    if (storeyId) {
      if (mapType === '3D') {
        query.$or = [{ 'point3D.sid': storeyId }, { point3D: { $exists: false } }]
      } else {
        query.$or = [{ 'point.sid': storeyId }, { point: { $exists: false } }]
      }
    } else {
      if (mapType === '3D') {
        query.$or = [{ 'point3D.isouter': true }, { point3D: { $exists: false } }]
      } else {
        query.$or = [{ 'point.isouter': true }, { point: { $exists: false } }]
      }
    }
    // 过滤报警求助的针孔摄像头
    const devs = await Device.find({ type: { $nin: ['alarmBox', 'alarmPillar'] } }, '_id').lean().exec()
    devs && devs.length && (query.eid = { $in: devs.map(dev => dev._id) })
    const reses = await Resource.find(query, select).populate({
      path: 'eid',
      select: 'name ip cport type dport manufacturer'
    }).exec()
    const allResIds = _.map(reses, '_id').toString() // 所有的资源数据（这里是为了做查询过滤）
    reses.forEach(item => (resHash[item._id] = item))
    const temp = orgReses.filter(item => {
      return allResIds.indexOf(item.resource + '') !== -1
    })
    temp.forEach(item => {
      !orgResHash[item.org] && (orgResHash[item.org] = [])
      if (resHash[item.resource]) {
        orgResHash[item.org] = [...orgResHash[item.org], resHash[item.resource]]
      }
    })
    const allOrgs = await Org.find({
      _id: {
        $in: allChildrenIds
      }
    }, '_id pid name').sort({ order: -1 }).lean().exec()
    const tempArr = new Array(allOrgs.length)
    _.fill(tempArr, { isOrg: true })
    _.merge(allOrgs, tempArr)
    const resultRes = allOrgs.map(item => {
      item.children = orgResHash[item._id] // 剔除所有非allResIds的资源id
      return item
    })
    ctx.body = tool.transData2Tree(resultRes, '_id', 'pid', true).pop()
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
// 获取地图输入防区树
exports.getMapFireAlarmInTree = async ctx => {
  ctx.set('loginfo', encodeURI('资源管理-获取地图输入防区树'))
  try {
    const oid = ctx.query.oid
    const rid = ctx.query.rid
    const storeyId = ctx.query.storeyId
    delete ctx.query.rid
    let allChildrenIds = [] // 该机构的所有子机构
    const [allorg, rootorg] = await Promise.all([
      Org.find({
        type: ctx.query.orgtype || ORG_TYPE.LOCALE
      }, '_id name pid order').exec(),
      Org.findOne({
        type: ctx.query.orgtype || ORG_TYPE.LOCALE,
        isroot: true
      }).exec()
    ])
    if (!oid) {
      allChildrenIds = tool.getChildren(allChildrenIds, allorg, rootorg._id + '')
      allChildrenIds.unshift(rootorg._id + '')
    } else {
      allChildrenIds = tool.getChildren(allChildrenIds, allorg, oid)
      allChildrenIds.unshift(oid)
    }
    let orgReses = await OrgRes.find({
      islane: false,
      org: {
        $in: allChildrenIds
      }
    }, 'resource org').sort('name').exec()
    const againOrgReses = await OrgRes.find({
      islane: true,
      rootorg: rootorg._id
    }, 'resource org').exec()
    const newOrgReses = []
    let flag
    for (let i = 0; i < orgReses.length; i++) {
      flag = true
      for (let j = 0; j < againOrgReses.length; j++) {
        if (orgReses[i].resource + '' === ('' + againOrgReses[j].resource)) {
          flag = false
          break
        }
      }
      if (flag) { // 说明没有重复的resource（既islane true|false）, 即重复的数据不添加
        newOrgReses.push(orgReses[i])
      }
    }
    orgReses = newOrgReses
    const [orgResHash, resHash] = [{}, {}]
    const query = { type: { $in: ctx.query.channelTypes.split(',') }, 'mapsign.signflag': true }
    let select
    if (ctx.query.mapType === '3D') {
      select = 'chan type name eid status alarmintype mapsign alarmtemplate maxdelaytime minintervaltime point3D'
    } else {
      select = 'chan type name eid status alarmintype mapsign alarmtemplate maxdelaytime minintervaltime point'
    }
    if (storeyId) {
      if (ctx.query.mapType === '3D') {
        query.$or = [{ 'point3D.sid': storeyId }, { point3D: { $exists: false } }]
      } else {
        query.$or = [{ 'point.sid': storeyId }, { point: { $exists: false } }]
      }
    } else {
      if (ctx.query.mapType === '3D') {
        query.$or = [{ 'point3D.isouter': true }, { point3D: { $exists: false } }]
      } else {
        query.$or = [{ 'point.isouter': true }, { point: { $exists: false } }]
      }
    }
    const reses = await Resource.find(query, select).populate({
      path: 'eid',
      select: 'name ip cport dport manufacturer'
    }).exec()
    const allResIds = _.map(reses, '_id').toString() // 所有的资源数据（这里是为了做查询过滤）
    reses.forEach(item => (resHash[item._id] = item))
    const temp = orgReses.filter(item => {
      return allResIds.indexOf(item.resource + '') !== -1
    })
    temp.forEach(item => {
      !orgResHash[item.org] && (orgResHash[item.org] = [])
      if (resHash[item.resource]) {
        orgResHash[item.org] = [...orgResHash[item.org], resHash[item.resource]]
      }
    })
    let mainRes, orgRes
    if (rid) {
      mainRes = await Resource.findById(rid).exec()
      orgRes = await OrgRes.findOne({
        resource: rid,
        islane: true
      }).exec()
    }
    const allOrgs = await Org.find({
      _id: {
        $in: allChildrenIds
      }
    }, '_id pid name').sort({ order: -1 }).exec()
    const tempArr = new Array(allOrgs.length)
    _.fill(tempArr, { _doc: { isOrg: true } })
    _.merge(allOrgs, tempArr)
    const resultRes = allOrgs.map(item => {
      item = item.toObject()
      item.children = orgResHash[item._id] // 剔除所有非allResIds的资源id
      if (orgRes && item._id + '' === ('' + orgRes.org)) {
        if (!item.children) { item.children = [] }
        item.children = [...item.children, mainRes]
      }
      return item
    })
    ctx.body = tool.transData2Tree(resultRes, '_id', 'pid', true).pop()
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
/**
 * 获取防区资源列表
 */
exports.getMapFireAlarmListByMapId = async ctx => {
  ctx.set('loginfo', encodeURI('资源管理-获取地图输入防区列表'))
  try {
    const mapId = ctx.query.mapId
    const query = { type: { $in: ctx.query.channelTypes.split(',') } }
    let select
    if (ctx.query.mapType === '3D') {
      query.map3d = { $nin: [null, undefined] }
      select = 'chan name monitortype status eid alarmintype alarmtemplate maxdelaytime minintervaltime mapsign alarmaffirm point3D'
    } else {
      query['point.mapId'] = mapId
      select = 'chan name monitortype status eid alarmintype alarmtemplate maxdelaytime minintervaltime mapsign alarmaffirm point'
    }
    const reses = await Resource.find(query, select).populate({
      path: 'eid',
      select: 'name ip cport manufacturer'
    }).exec()
    ctx.body = reses
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
// 新增资源
exports.addOne = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('资源管理-添加资源'))
    const device = await Device.findById(ctx.request.body.eid, 'ip status cport').populate({ path: 'oid' }).lean()
    if (ctx.request.body.devloop === 0) {
      const count = await Resource.countDocuments({
        devloop: ctx.request.body.devloop,
        chan: ctx.request.body.chan
      })
      if (count !== 0) {
        return ctx.throw(500, { code: 1012, message: '该设备回路下防区编号已存在' })
      }
    } else if (ctx.request.body.devloop) {
      const count = await Resource.countDocuments({
        devloop: ctx.request.body.devloop,
        chan: ctx.request.body.chan
      })
      if (count !== 0) {
        return ctx.throw(500, { code: 1012, message: '该设备回路下防区编号已存在' })
      }
    }
    if (Number(ctx.request.body.type) === RES_TYPE.VIDEO) {
      const id = rtspServer.getUnusedIds()
      ctx.request.body.rtsp = {
        main: `rtsp://ip:port/main/id=${id}`,
        sub: `rtsp://ip:port/sub/id=${id}`
      }
      // 视频通道增加国标字段
      await generateNum.res([ctx.request.body], device.oid.gbDevId)
    }
    ctx.request.body.pinyin = tool.transferPinyin(ctx.request.body.name)
    ctx.request.body.ip = device.ip
    ctx.request.body.port = device.cport
    ctx.request.body.status = device.status ? 1 : 0
    const res = await Resource.create(ctx.request.body)
    // postal.publish({
    //   channel: 'devices',
    //   topic: 'item.notice',
    //   data: {
    //     ctx: ctx
    //   }
    // })
    ctx.status = 201
    ctx.body = [res._id]
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}

// 资源机构解绑(实际资源不会删除，只删除机构和资源的关系)
exports.unbind = async ctx => {
  ctx.set('loginfo', encodeURI('资源管理-资源机构解绑'))
  if (_.isEmpty(ctx.query.type)) {
    ctx.throw(500, { code: 1015, message: '参数有误' })
  }
  const type = Number(ctx.query.type) // 机构类型
  try {
    const rootOrg = await Org.findOne({ type, isroot: true }).exec()
    if (_.isEmpty(rootOrg)) {
      return ctx.throw(500, { code: 1015, message: '参数有误' })
    }
    const ids = ctx.accept.headers['x-bsc-ids'].split(',')
    // 下联的资源通道不能删除
    if (ids.length) {
      const res = await Resource.findById(ids[0]).lean()
      if (res.nodeId) {
        ctx.throw(500, { code: 1015, message: '下联资源不能删除' })
      }
    }
    for (var item of ids) {
      if (_.isEmpty(item)) {
        return ctx.throw(500, { code: 1008, message: '参数不能为空' })
      }
      await OrgRes.deleteMany({
        rootorg: rootOrg._id,
        resource: item
      }).exec()
    }
    // if (rootOrg.type === 0) {
    //   // 删除国标数据
    //   await Resource.updateMany({ _id: { $in: ids } }, { $unset: { gbDevId: 1, gbParentDevId: 1 } })
    // }
    const resources = await Resource.find({ _id: { $in: ids } }).exec()
    if (type === ORG_TYPE.LOCALE) {
      postal.publish({
        channel: 'resources',
        topic: 'array.delete',
        data: {
          ctx,
          ids: resources.map(item => { if (item.type === RES_TYPE.VIDEO) { return item._id } })
        }
      })
    }
    postal.publish({
      channel: 'resources',
      topic: 'resource.unbind',
      data: {
        ids: resources.map(item => item._id),
        type
      }
    })
    ctx.status = 200
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}

// 资源机构解绑(实际资源不会删除，只删除机构和资源的关系,用于车辆)
exports.unbindVehicle = async ctx => {
  ctx.set('loginfo', encodeURI('资源管理-资源机构解绑'))
  const type = ctx.query.type // 机构类型
  try {
    const rootOrg = await Org.findOne({
      type: type || ORG_TYPE.LOCALE,
      isroot: true
    }).exec()
    if (_.isEmpty(rootOrg)) {
      return ctx.throw(500, { code: 1015, message: '参数有误' })
    }
    const ids = ctx.accept.headers['x-bsc-ids'].split(',')
    for (var item of ids) {
      if (_.isEmpty(item)) {
        return ctx.throw(500, { code: 1008, message: '参数不能为空' })
      }
      await OrgRes.deleteMany({
        rootorg: rootOrg._id,
        resource: item
      }).exec()
    }
    // const resources = await Resource.find({ _id: { $in: ids } }).exec()
    // postal.publish({
    //   channel: 'resources',
    //   topic: 'array.delete',
    //   data: {
    //     ctx,
    //     ids: resources.map(item => { if (item.type === 0) return item._id })
    //   }
    // })
    Resource.updateMany({ _id: { $in: ids } }, { $unset: { channelid: 1, hasserver: 1, server: 1 } }, { multi: true }).then()
    ctx.status = 200
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}

// 批量解绑
exports.unbindPatch = async ctx => {
  ctx.set('loginfo', encodeURI('资源管理-批量解绑'))
  const type = ctx.query.type // 机构类型
  try {
    const rootOrg = await Org.findOne({
      type: type,
      isroot: true
    }).exec()
    if (_.isEmpty(rootOrg)) {
      return ctx.throw(500, {
        code: 1015,
        message: '参数有误'
      })
    }
    const resIds = ctx.request.header['x-bsc-ids'].split(',') || []
    for (let i = 0; i < resIds.length; i++) {
      await OrgRes.deleteMany({
        rootorg: rootOrg._id,
        resource: resIds[i]
      }).exec()
    }
    postal.publish({
      channel: 'resources',
      topic: 'array.delete',
      data: {
        ids: resIds,
        isreal: false,
        ctx: ctx
      }
    })
    const resources = await Resource.find({ id: { $in: resIds } }).exec()
    // 删除视频资源的通知
    postal.publish({
      channel: 'devices',
      topic: 'item.deleteIPC',
      data: {
        resources
      }
    })
    ctx.status = 200
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}

// 删除某个视频通道下的某个报警
exports.delAlarm = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('资源管理-删除报警'))
    const id = ctx.params.id // 资源id、报警id
    const alarmType = ctx.query.alarmType // 报警类型(监控点报警：monitoryPointAlarm、智能报警：intelligentAlarm)
    const alarmIds = ctx.request.header['x-bsc-ids'].split(',') || [] // 报警ids
    if (!alarmType || !id) {
      return ctx.throw(500, {
        code: 1008,
        message: '参数不能为空'
      })
    }
    const res = await Resource.findById(id).exec()
    if (_.isEmpty(res)) {
      return ctx.throw(500, {
        code: 1014,
        message: '该资源不存在'
      })
    }
    const newAlarms = []
    if (res.alarm && res.alarm[alarmType]) {
      for (let i = 0; i < res.alarm[alarmType].length; i++) {
        if (alarmIds.indexOf(res.alarm[alarmType][i]._id + '') === -1) {
          newAlarms.push(res.alarm[alarmType][i])
        }
      }
      res.alarm[alarmType] = newAlarms
    }
    await res.save()
    // postal.publish({
    //   channel: 'devices',
    //   topic: 'item.notice',
    //   data: {
    //     ctx: ctx
    //   }
    // })
    postal.publish({
      channel: 'resources',
      topic: 'intelligencealarm.delete',
      data: {
        ids: alarmIds,
        ctx: ctx
      }
    })
    ctx.status = 200
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}

// 修改报警
exports.updateAlarm = async ctx => {
  ctx.set('loginfo', encodeURI('资源管理-修改报警'))
  const {
    id,
    aid
  } = ctx.params // 资源id、报警id
  const alarmType = ctx.query.alarmType // 报警类型(监控点报警：monitoryPointAlarm、智能报警：intelligentAlarm)
  if (!alarmType || !id || !aid) {
    return ctx.throw(500, {
      code: 1015,
      message: '参数有误'
    })
  }
  try {
    const res = await Resource.findById(id).exec()
    if (_.isEmpty(res)) {
      return ctx.throw(500, {
        code: 1014,
        message: '该资源不存在'
      })
    }
    let matchedIndex = -1
    // let matchedAlarmIndex = -1
    let typeFlag = false
    let nameFlag = false
    if (_.isEmpty(res.alarm)) {
      ctx.status = 200
      return
    }
    for (let i = 0; i < res.alarm[alarmType].length; i++) {
      if ('' + res.alarm[alarmType][i]._id === '' + aid) { matchedIndex = i }
      if ('' + res.alarm[alarmType][i]._id !== '' + aid && res.alarm[alarmType][i].type + '' === ('' + ctx.request.body.type)) { typeFlag = true }
      if ('' + res.alarm[alarmType][i]._id !== '' + aid && res.alarm[alarmType][i].name + '' === ('' + ctx.request.body.name)) { nameFlag = true }
    }
    if (nameFlag) {
      return ctx.throw(500, { code: 1012, message: '该名称已存在' })
    }
    if (typeFlag) {
      return ctx.throw(500, {
        code: 1013,
        message: '该报警类型已存在'
      })
    }
    if (parseInt(matchedIndex) !== -1) {
      res.alarm[alarmType][matchedIndex] = _.merge(res.alarm[alarmType][matchedIndex], ctx.request.body)
    }
    await res.save()
    // postal.publish({
    //   channel: 'devices',
    //   topic: 'item.notice',
    //   data: {
    //     ctx: ctx
    //   }
    // })
    ctx.status = 200
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}

// 给指定视频通道下添加某个报警
exports.addAlarm = async ctx => {
  ctx.set('loginfo', encodeURI('资源管理-添加报警'))
  const chan = ctx.params.chan // 资源id、报警id
  const alarmType = ctx.query.alarmType // 报警类型(监控点报警：monitoryPointAlarm、智能报警：intelligentAlarm)
  const eid = ctx.query.eid
  if (!alarmType || !chan) {
    return ctx.throw(500, {
      code: 1015,
      message: '参数有误'
    })
  }
  try {
    const res = await Resource.findOne({
      eid: eid,
      chan: chan,
      type: 0
    }).exec()
    if (_.isEmpty(res)) {
      return ctx.throw(500, {
        code: 1016,
        message: `资源通道不存在`
      })
    }
    if (_.isEmpty(res.alarm)) {
      res.alarm = []
      if (!res.alarm[alarmType]) { res.alarm[alarmType] = [] }
    }
    let existedAlarm = ''
    let existedName = ''
    res.alarm[alarmType].forEach(item => {
      if (item.type + '' === (ctx.request.body.type + '')) { existedAlarm = ctx.request.body.type }
      if (item.name + '' === (ctx.request.body.name + '')) { existedName = ctx.request.body.name }
    })
    if (existedName) {
      return ctx.throw(500, {
        code: 1012,
        message: `该名称已存在`
      })
    }
    if (existedAlarm) {
      return ctx.throw(500, {
        code: 1013,
        message: `该报警类型已存在`
      })
    }
    res.alarm[alarmType].push(ctx.request.body)
    await res.save()
    // postal.publish({
    //   channel: 'devices',
    //   topic: 'item.notice',
    //   data: {
    //     ctx: ctx
    //   }
    // })
    ctx.status = 201
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}

// 通道名称同步（同步到中心）
exports.syncToCenter = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('资源管理-同步到中心'))
    const ids = ctx.accept.headers['x-bsc-ids'].split(',')
    for (var item of ids) {
      if (!item) {
        return ctx.throw(500, {
          code: 1008,
          message: '参数不能为空'
        })
      }
      const resource = await Resource.findById(item, 'chan name eid').populate({
        path: 'eid',
        select: 'cport ip'
      }).exec()
      if (!resource) {
        return ctx.throw(500, {
          code: -1,
          message: '该资源不存在'
        })
      }
      const data = {
        devInfo: {
          devIp: resource.eid.ip,
          devPort: resource.eid.cport
        }
      }
      let result
      try {
        result = await getDevConf({ data, ctx })
      } catch (error) {
        return ctx.throw(500, { code: error.error, message: '请求第三方接口异常', type: 'sys' })
      }
      const ChanCfgPrmArr = result.ChanCfgPrmArr || []
      console.log(JSON.stringify(ChanCfgPrmArr))
      let resName = ''
      ChanCfgPrmArr.forEach(item => {
        if (item.channel && resource.chan && item.channel === resource.chan) {
          resName = item.name
        }
      })
      if (resName) {
        resource.name = resName // 本地化同步通道名
      }
      await resource.save()
    }
    // postal.publish({
    //   channel: 'devices',
    //   topic: 'item.notice',
    //   data: {
    //     ctx: ctx
    //   }
    // })
    ctx.status = 200
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}

// 通道名称同步（同步到设备）
exports.syncToDevice = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('资源管理-同步到设备'))
    const ids = ctx.accept.headers['x-bsc-ids'].split(',')
    for (var item of ids) {
      if (!item) {
        return ctx.throw(500, {
          code: 1008,
          message: '参数不能为空'
        })
      }
      const resource = await Resource.findById(item, 'chan name eid').populate({
        path: 'eid',
        select: 'cport ip name'
      }).exec()
      if (!resource) {
        return ctx.throw(500, {
          code: 1014,
          message: '该资源不存在'
        })
      }
      const data = {
        devInfo: {
          devIp: resource.eid.ip,
          devPort: parseInt(resource.eid.cport)
        },
        devCtl: {
          ChanCfgPrmArr: [{
            channel: resource.chan,
            name: resource.name.toString('utf8')
          }],
          name: resource.eid.name
        }
      }
      try {
        await updateDevConf({ data, ctx })
      } catch (error) {
        return ctx.throw(500, { code: error.error, message: '请求第三方接口异常', type: 'sys' })
      }
    }
    // postal.publish({
    //   channel: 'devices',
    //   topic: 'item.notice',
    //   data: {
    //     ctx: ctx
    //   }
    // })
    ctx.status = 200
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}

// 批量修改操作（现在主要用于批量修改实时码流字段）
exports.patchUpdate = async ctx => {
  ctx.set('loginfo', encodeURI('资源管理-批量修改资源某个属性'))
  const ids = ctx.request.header['x-bsc-ids'].split(',') || []
  const patchBody = ctx.request.body
  try {
    for (let i = 0; i < ids.length; i++) {
      await Resource.where({
        _id: ids[i]
      }).update(patchBody).exec()
    }
    // postal.publish({
    //   channel: 'devices',
    //   topic: 'item.notice',
    //   data: {
    //     ctx: ctx
    //   }
    // })
    ctx.status = 200
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.addPatchFire = async (ctx) => {
  try {
    const fireInputNum = ctx.request.body.fireInputNum
    const fireOutputNum = ctx.request.body.fireOutputNum
    const docs = []
    const count = ctx.request.body.chan
    if (fireInputNum) {
      delete ctx.request.body.fireInputNum
      for (var i = 1; i <= fireInputNum; i++) {
        const device = await Device.findById(ctx.request.body.eid).exec()
        docs.push({
          name: device.name + '_输入防区_' + ctx.request.body.devloop + '_' + (+count + i - 1),
          ip: device.ip,
          port: device.port,
          chan: +count + i - 1,
          type: ctx.request.body.type,
          devloop: ctx.request.body.devloop,
          eid: ctx.request.body.eid,
          level: ctx.request.body.level,
          alarmtemplate: ctx.request.body.alarmtemplate,
          maxdelaytime: ctx.request.body.maxdelaytime,
          minintervaltime: ctx.request.body.minintervaltime,
          mapsign: ctx.request.body.mapsign,
          alarmaffirm: ctx.request.body.alarmaffirm
        })
      }
    }
    if (fireOutputNum) {
      delete ctx.request.body.fireOutputNum
      for (var j = 1; j <= fireOutputNum; j++) {
        const device = await Device.findById(ctx.request.body.eid).exec()
        docs.push({
          name: device.name + '_输出防区_' + ctx.request.body.devloop + '_' + (+count + i - 1),
          ip: device.ip,
          port: device.port,
          chan: +count + j - 1,
          type: ctx.request.body.type,
          eid: ctx.request.body.eid,
          devloop: ctx.request.body.devloop,
          level: ctx.request.body.level,
          maxdelaytime: ctx.request.body.maxdelaytime,
          alarmtemplate: ctx.request.body.alarmtemplate,
          minintervaltime: ctx.request.body.minintervaltime,
          mapsign: ctx.request.body.mapsign,
          alarmaffirm: ctx.request.body.alarmaffirm
        })
      }
    }
    for (var item of docs) {
      if (item.devloop === 0) {
        const count = await Resource.countDocuments({
          devloop: item.devloop,
          chan: item.chan
        })
        if (count !== 0) {
          return ctx.throw(500, { code: 1012, message: `设备回路${item.devloop}下防区编号${item.chan}已存在` })
        }
      } else if (item.devloop) {
        const count = await Resource.countDocuments({
          devloop: item.devloop,
          chan: item.chan
        })
        if (count !== 0) {
          return ctx.throw(500, { code: 1012, message: `设备回路${item.devloop}下防区编号${item.chan}已存在` })
        }
      }
    }
    await Resource.insertMany(docs)
    ctx.status = 200
  } catch (err) {
    console.log(err)
    return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 1001, message: '系统内部错误' })
  }
}
// 资源信息导入
exports.resourceImport = async ctx => {
  try {
    const alarmTemplates = await AlarmTimeTemplate.find({}).lean()
    const tmpMap = {}
    alarmTemplates.forEach(item => {
      tmpMap[item.name] = item._id
    })
    const existRes = await Resource.find({ eid: ctx.query.eid, type: ctx.query.type }).lean()
    const existResMap = {}
    existRes.forEach(item => {
      existResMap[item.devloop + '_' + item.chan] = 1
    })
    const dev = await Device.findById(ctx.query.eid).lean()
    // 解析文件
    const resInfos = xlsx.parse(ctx.request.body.files.file.path)
    const docs = []
    // 获取资源信息的doc
    resInfos.forEach(item => {
      item.data.shift()
      item.data.forEach(item => {
        const res = {
          eid: ctx.query.eid,
          name: item[0],
          devloop: item[1],
          type: ctx.query.type,
          chan: item[2],
          level: item[3],
          alarmtemplate: tmpMap[item[4]],
          ip: dev.ip,
          port: dev.cport,
          maxdelaytime: item[5],
          minintervaltime: item[6]
        }
        if (!existResMap[res.devloop + '_' + res.chan]) {
          docs.push(res)
        }
      })
    })
    // 批量生产资源
    await Resource.create(docs)
    fs.unlinkSync(ctx.request.body.files.file.path)
    ctx.status = 200
  } catch (error) {
    tool.handleSysException(error)
  }
}

// 设备信息导出
exports.resourceExport = async ctx => {
  try {
    const alarmTemplates = await AlarmTimeTemplate.find({}).lean()
    const device = await Device.findById(ctx.query.eid, 'name').lean()
    const tmpMap = {}
    alarmTemplates.forEach(item => {
      tmpMap[item._id + ''] = item.name
    })
    const resMaping = { 0: '视频通道', 1: '视频报警输入', 2: '视频报警输出通道', 3: '对讲通道', 4: '门禁通道', 5: '解码通道', 6: '音频通道', 7: '解码报警输入', 8: '解码报警输出', 9: '报警主机报警输入', 10: '报警主机报警输出', 11: '消防输入防区', 12: '消防输出防区', 15: ' 拼接输入通道' }
    const reses = await Resource.find({ eid: ctx.query.eid, type: ctx.query.type }, 'name devloop chan level alarmtemplate maxdelaytime minintervaltime').exec()
    // 定义表头
    const data = [['输入防区名称', '设备回路', '通道号', '级别', '时间模板', '最大延时', '最小间隔']]
    reses.forEach(item => {
      const arr = [item.name, item.devloop, item.chan, item.level, tmpMap[item.alarmtemplate], item.maxdelaytime, item.minintervaltime]
      data.push(arr)
    })
    // 设置列样式
    const ColInfos = [{ width: 15 }, {}, {}, {}, { width: 15 }, {}, {}]
    const option = { '!cols': ColInfos }
    const buffer = xlsx.build([{ name: resMaping[ctx.query.type], data }], option)
    ctx.type = 'application/vnd.openxmlformats'
    const timeStr = new Date().toLocaleString().replace(/[-: ]/g, '')
    ctx.attachment(device.name + '-' + resMaping[ctx.query.type] + '-' + timeStr + '.xlsx'.toString('utf8'))
    ctx.body = buffer
  } catch (error) {
    tool.handleSysException(error)
  }
}
