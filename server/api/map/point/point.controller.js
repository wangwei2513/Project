/*
 * 地图点位接口
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:32:20
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-12-21 17:04:53
 */

'use strict'

const Resource = require('mongoose').model('Resource')
const { handleSysException } = require('../../../common/tools')
const command = require('../../../common/command')
const _ = require('lodash')
const moment = require('moment')
const util = require('../../../common/protobuf.util')
const postal = require('postal')
const Model = require('mongoose').model('Model')
const Device = require('mongoose').model('Device')
const { alarmStatus } = require('../../../api/bstar/dev.interface')
// 添加点位
exports.updateOne = async ctx => {
  ctx.set('loginfo', encodeURI('地图管理-添加点位'))
  const data = ctx.request.body
  if (_.isEmpty(data)) { ctx.throw(500, { code: 4003, message: '参数不能为空' }) }
  try {
    const res = await Resource.findById(data._id).populate({ path: 'eid', select: 'type' }).lean().exec()
    // 判断是否为添加点位
    if (!res.point3D && data.point3D && data.point3D.isouter) {
      // 获取默认模型
      let key = res.type + '' + res.monitortype
      res.eid.type === 'alarmBox' && (key = '130')
      res.eid.type === 'alarmPillar' && (key = '131')
      const model = await Model.findOne({ oid: key, default: true }, '_id')
      if (!model) {
        ctx.throw(500, { code: 4003, message: '请先添加模型！' })
      }
      const mid = model._id
      data.point3D.mid = mid
    }
    await Resource.findByIdAndUpdate(ctx.params.id, data).exec()
    postal.publish({
      channel: 'devices',
      topic: 'item.notice',
      data: {
        ctx: ctx,
        data: {
          module: 'alarm',
          varyData: [],
          newData: []
        }
      }
    })
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}

// 获取点位
exports.getOne = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('地图管理-获取点位'))
    let select
    let populate
    if (ctx.query.mapType === '3D') {
      select = 'name chan type eid level status stream nodeId gbPlaDevIp gbPlaDevPort gbDevId gbParentDevId gbPlaNvrId alarmtemplate monitortype alarmstatus maxdelaytime minintervaltime mapsign point3D'
      populate = [{ path: 'eid', select: '_id ip cport dport name manufacturer type' }, { path: 'point3D.mid' }]
    } else {
      select = 'name chan type eid level status stream nodeId gbPlaDevIp gbPlaDevPort gbDevId gbParentDevId gbPlaNvrId  alarmtemplate monitortype alarmstatus maxdelaytime minintervaltime mapsign point'
      populate = { path: 'eid', select: '_id ip cport dport name manufacturer type' }
    }
    const res = await Resource.findById(ctx.params.id, select).populate(populate).lean().exec()
    const FIRE_RES = 11
    if (res.type === FIRE_RES) {
      try {
        const alarmHost = await alarmStatus(ctx, { devIp: res.eid.ip, devPort: res.eid.cport })
        alarmHost.channelStatus && alarmHost.channelStatus.forEach(item => {
          if (+item.channel === res.chan) {
            res.alarmStatus = item.status
          }
        })
      } catch (error) {
        console.log(error)
      }
    }
    ctx.body = _.isEmpty(res) ? {} : res
  } catch (err) {
    handleSysException(err)
  }
}
// 删除点位
exports.delOne = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('地图管理-删除点位'))
    const data = {}
    ctx.query.mapType === '3D' ? data.$unset = { point3D: 1 } : data.$unset = { point: 1 }
    await Resource.findByIdAndUpdate(ctx.params.id, data).exec()
    postal.publish({
      channel: 'devices',
      topic: 'item.notice',
      data: {
        ctx: ctx,
        data: {
          module: 'alarm',
          varyData: [],
          newData: []
        }
      }
    })
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}

// 获取所有资源点位
exports.getAll = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('地图管理-获取所有资源点位'))
    const reses = await Resource.find({
      point: {
        $nin: [null, undefined]
      },
      'point.isouter': ctx.query.isouter
    }).exec()
    ctx.body = _.isEmpty(reses) ? [] : reses
  } catch (err) {
    handleSysException(err)
  }
}
exports.getPointByMapId = async (ctx) => {
  try {
    const mapId = ctx.query.mapId
    const res = await Resource.find({ type: ctx.query.channelType, 'point.mapId': mapId, 'point.isouter': true }, '-point3D').populate({ path: 'eid', select: 'ip cport' }).lean().exec()
    // res.forEach(item => {
    //   if (!item.status && +item.alarmstatus === 1) {
    //     item.alarmstatus = 2
    //   } else {
    //     if (item && +item.alarmstatus === 1 && item.alarmtemplate) {
    //       const status = getAlarmStatus(item.alarmtemplate)
    //       item.alarmstatus = status
    //     }
    //   }
    // })
    ctx.status = 200
    ctx.body = res
  } catch (err) {
    handleSysException(err)
  }
}
exports.get3DPoint = async (ctx) => {
  try {
    const tab = ctx.query.tab
    const sid = ctx.query.sid
    const query = { type: { $in: ctx.query.channelTypes.split(',') }, point3D: { $nin: [null, undefined] } }
    if (sid) {
      query['point3D.sid'] = sid
    } else {
      query['point3D.isouter'] = true
    }
    const alarmEidArr = (await Device.find({ type: { $in: ['alarmBox', 'alarmPillar'] } }, '_id').lean().exec()).map(item => item._id)
    if (tab === 'video') {
      alarmEidArr.length && (query.eid = { $nin: alarmEidArr })
    } else if (tab === 'alarmHelp') {
      if (alarmEidArr.length) {
        query.eid = { $in: alarmEidArr }
      } else {
        ctx.body = []
        return
      }
    }
    const res = await Resource.find(query, 'ip port name type status alarmtemplate alarmstatus stream chan point3D status monitortype').populate([{ path: 'eid', select: '_id ip cport dport type name manufacturer' }, { path: 'point3D.mid' }]).lean().exec()
    ctx.status = 200
    ctx.body = res
  } catch (err) {
    handleSysException(err)
  }
}
// 设备布撤防
exports.updateAlarmStatus = async ctx => {
  try {
    if (+ctx.request.body.alarmstatus === 1) {
      const res = await Resource.findById(ctx.params.id, 'alarmtemplate').populate('alarmtemplate').exec()
      const status = getAlarmStatus(res.alarmtemplate)
      if (status === 2) { ctx.throw(500, { code: 500, message: '该点位未在布防时间内，无法布防！' }) }
    }
    const base = { cmdBase: { devIp: ctx.request.body.devIp, devPort: ctx.request.body.devPort } }
    const defenseInfo = {
      inputNoCfgPrmArr: [
        {
          inputNo: ctx.request.body.chan,
          deployment: ctx.request.body.alarmstatus ? 1 : 0
        }
      ]
    }
    console.log(JSON.stringify(defenseInfo))
    // 获取DevRecordQueryMA2DA proto
    const basePro = util.baseProto('AlertAlarmInputCfgMA2DA')
    const structProBase = util.getProtoMsg(basePro, 'AlertAlarmInputCfgPrm')
    const buf = util.encode(structProBase, defenseInfo)
    const data = _.merge(base, { cmdContent: buf })
    const structPro = util.getProtoMsg(basePro, 'CommandGeneric')
    const bufReq = util.encode(structPro, data)
    try {
      const result = await util.tcp(bufReq, command.VMR_COMMAND_CLIENT2MA_POINT_DEFRNSE)
      // 请求成功，解析获取解码的buffer数据
      if (result.code === 0) {
      } else {
        ctx.throw(500, result)
      }
    } catch (error) {
      ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1017, message: '第三方接口异常' })
    }
    await Resource.findByIdAndUpdate(ctx.params.id, { alarmstatus: ctx.request.body.alarmstatus }).exec()
    ctx.status = 200
  } catch (error) {
    handleSysException(error)
  }
}
exports.getAllPoint = async (ctx) => {
  try {
    const query = { 'point.isouter': false }
    let select
    let populate
    if (ctx.query.mapType === '3D') {
      query.point3D = { $nin: [null, undefined] }
      select = 'point3D.isouter point3D.loc point3D.sid point3D.bid'
      populate = {
        path: 'point3D.sid',
        select: 'name bid class picture',
        populate: {
          path: 'bid',
          select: 'name center scope code'
        }
      }
    } else {
      query.point = { $nin: [null, undefined] }
      select = 'point.isouter point.class point.loc point.sid point.bid point.mapId'
      populate = {
        path: 'point.sid',
        select: 'name bid class picture mapId',
        populate: {
          path: 'bid',
          select: 'name center scope mapId'
        }
      }
    }
    const reses = await Resource.find(query, select).populate(populate).lean().exec()
    ctx.body = reses
  } catch (error) {
    handleSysException(error)
  }
}

// 若布撤防状态不为手动控制，通过时间模板检测布撤防状态
function getAlarmStatus(template) {
  try {
    let status = 2
    const nowSecond = moment().unix() - moment(moment().format('YYYY-MM-DD')).unix()
    const nowWeek = moment().isoWeekday()
    const elements = template.elements.toObject()
    for (var item in elements) {
      if (item === ('week' + nowWeek)) {
        elements[item].forEach(time => {
          if (nowSecond >= time.beginTime && nowSecond <= time.endTime) { status = 1 }
        })
      }
    }
    return status
  } catch (error) {
    console.log(error)
  }
}
// 根据位置获取点位
exports.getPointByLoc = async (ctx) => {
  try {
    ctx.set('loginfo', encodeURI('地图管理-获取所有资源点位'))
    const query = {
      point: {
        $nin: [null, undefined]
      }
    }
    if (ctx.query.mapType === '3D') {
      query['point.loc'] = ctx.query.loc
    } else {
      query['point.loc3d'] = ctx.query.loc
    }
    const reses = await Resource.find(query).exec()
    ctx.body = _.isEmpty(reses) ? [] : reses
  } catch (error) {
    handleSysException(error)
  }
}
