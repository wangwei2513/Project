
/*
 * @Author: chenkaibo
 * @Date: 2018-07-25 09:54:53
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-09-17 16:36:19
 */

// 智能交通服务器可以看做是一种类型的设备，数据模型使用Device

'use strict'
const mongoose = require('mongoose')
const Device = mongoose.model('Device')
const TrafficLane = mongoose.model('TrafficLane')
const TrafficAlarmCfg = mongoose.model('TrafficAlarmCfg')
const TrafficServerCfg = mongoose.model('TrafficServerCfg')
const notice = require('../../bstar/dev.interface').devNotice
const util = require('../../../common/protobuf.util')
const command = require('../../../common/command')
const _ = require('lodash')
const pagin = require('../../paging')
const { handleSysException, transData2Tree, getChildren } = require('../../../common/tools')
const { addsystem } = require('../../log/log.controller')

// 获取智能交通服务器信息
exports.get = async (ctx) => {
  try {
    ctx.set('loginfo', encodeURI('智能交通-创建智能交通服务器配置'))
    const id = ctx.params.id
    if (!id) {
      throw new Error(500, { message: '参数不存在' })
    }
    const result = await Device.findById(id, 'name manufacturer deviceid ip cport username password').lean()
    ctx.status = 200
    ctx.body = result
  } catch (error) {
    handleSysException(error)
  }
}

// 添加智能交通服务器
exports.create = async (ctx) => {
  try {
    ctx.set('loginfo', encodeURI('智能交通-创建智能交通服务器配置'))
    const entity = ctx.request.body
    const espect = await Device.find({ bigtype: 8, $or: [{ name: entity.name }, { ip: entity.ip, cport: entity.cport }] })
    if (!_.isEmpty(espect)) {
      ctx.throw(500, { code: 2001, message: '服务器名|ip|端口地址已存在' })
    }
    entity.bigtype = 8
    entity.type = 'traffic'
    const server = await Device.create(entity)
    ctx.headers['location'] = ctx.url + server._id
    ctx.status = 201
    ctx.body = ''
  } catch (error) {
    handleSysException(error)
  }
}
// 修改智能交通服务器
exports.update = async (ctx) => {
  try {
    ctx.set('loginfo', encodeURI('智能交通-修改智能交通服务器配置'))
    const entity = ctx.request.body
    const id = ctx.params.id
    let flag = false
    const devices = await Device.find({ bigtype: 8, $or: [{ name: entity.name }, { ip: entity.ip, cport: entity.cport }] })
    devices.forEach(item => {
      if (item && item._id + '' !== ctx.params.id + '') { flag = true }
    })
    if (flag) {
      ctx.throw(500, { code: 2001, message: '服务器名|ip|端口地址已存在' })
    }
    await Device.findByIdAndUpdate(id, entity)
    ctx.status = 200
  } catch (error) {
    handleSysException(error)
  }
}
// 删除智能交通服务器
exports.remove = async (ctx) => {
  ctx.set('loginfo', encodeURI('智能交通-删除智能交通服务器配置'))
  try {
    const id = ctx.params.id
    await Promise.all([
      TrafficAlarmCfg.deleteMany({ sid: id }),
      TrafficLane.deleteMany({ sid: id }),
      Device.findByIdAndRemove(id)
    ])
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}

// 获取报警配置
exports.getAlarmCfg = async (ctx) => {
  try {
    const id = ctx.query.id
    const sid = ctx.query.sid
    if (!id || !sid) {
      throw new Error(500, { message: '参数缺失' })
    }
    const result = await TrafficAlarmCfg.findOne({ devcode: id, sid }).lean()
    ctx.body = result
  } catch (error) {
    handleSysException(error)
  }
}
// 批量配置报警配置
exports.batchAlarmCfg = async (ctx) => {
  try {
    if (_.isEmpty(ctx.request.body.ids)) {
      throw new Error(500, { message: '参数缺失' })
    }
    const { ids, sid } = ctx.request.body
    delete ctx.request.body.ids
    delete ctx.request.body.sid
    const body = _.clone(ctx.request.body).body
    for (var item of ids) {
      const alarmcfg = await TrafficAlarmCfg.findOne({ devcode: item, sid }).lean().exec()
      if (alarmcfg) {
        await TrafficAlarmCfg.findByIdAndUpdate(alarmcfg._id, _.merge(body, { devcode: item, sid }))
      } else {
        await TrafficAlarmCfg.create(_.merge(body, { devcode: item, sid }))
      }
    }
    notice({ ctx, data: { module: 'alarm' } }).catch(err => {
      console.log({ code: 4106, message: 'bstar资源配置通知接口异常' }, err.message)
      addsystem({ worknum: 106, msg: 'bstar资源配置通知接口异常' })
    })
    ctx.status = 200
  } catch (error) {
    handleSysException(error)
  }
}

// 获取服务器机构下的所有车道信息
module.exports.getLaneList = async (ctx) => {
  try {
    const { sid, deptId, recursive = 0, key = '' } = ctx.query.search
    const query = {}
    if (!sid || !deptId) {
      throw new Error(500, { message: '参数缺失' })
    }
    query.sid = sid
    query.deptId = deptId
    key && (query.$or = [{ devChnName: { $regex: key } }, { devChnId: { $regex: key } }])
    let ids = []
    if (parseInt(recursive)) {
      const lane = await TrafficLane.find({ sid }).lean()
      const org = []
      lane.map(item => {
        const deptIds = org.map(node => node._id)
        if (!deptIds.includes(item.deptId)) {
          if (item.deptParent === item.deptId) {
            org.push({ name: item.deptName, _id: item.deptId, pid: sid })
          } else {
            org.push({ name: item.deptName, _id: item.deptId, pid: item.deptParent })
          }
        }
      })
      ids = getChildren(ids, org, deptId)
      ids.unshift(deptId)
      query.deptId = { $in: ids }
    }
    const result = await pagin.listQuery(TrafficLane, query, '', '', ctx.query.page, '', ctx)
    ctx.status = 200
    ctx.body = result
  } catch (error) {
    handleSysException(error)
  }
}

// 获取服务器机构树
module.exports.index = async (ctx) => {
  try {
    const key = ctx.query.search.struct || 'list'
    let result = []
    // 获取所有智能交通服务器列表
    if (key === 'list') {
      result = (await pagin.listQuery(Device, { bigtype: 8 }, 'name manufacturer deviceid ip cport username password', '', ctx.query.page, '', ctx)).results
    } else {
      const servers = await Device.find({ bigtype: 8 }).lean()
      const sids = servers.map(item => item._id.toString())
      const lanes = await TrafficLane.find({ sid: { $in: sids } }).lean().exec()
      const serverMapping = {}
      servers && servers.length && servers.forEach(server => {
        serverMapping[server._id + ''] = server
      })
      const laneMapping = {}
      lanes && lanes.length && lanes.forEach(lane => {
        !laneMapping[lane.sid + ''] && (laneMapping[lane.sid + ''] = [])
        laneMapping[lane.sid + ''] = [...laneMapping[lane.sid + ''], lane]
      })
      if (Object.keys(laneMapping).length) {
        for (const sid in laneMapping) {
          const org = []
          laneMapping[sid] && laneMapping[sid].length && laneMapping[sid].forEach(lane => {
            if (lane.deptParent + '' === lane.deptId + '') { lane.deptParent = serverMapping[sid + '']._id }
            const orgids = org.map(org => org._id + '')
            !orgids.includes(lane.deptId.toString()) && org.push({ name: lane.deptName, _id: lane.deptId.toString(), sid, pid: lane.deptParent ? lane.deptParent.toString() : serverMapping[sid + '']._id + '' })
          })
          org.push({ name: serverMapping[sid + ''].name, _id: serverMapping[sid + '']._id + '', pid: '', sid: serverMapping[sid + '']._id + '' })
          result.push(transData2Tree(org, '_id', 'pid').pop())
        }
      } else {
        for (const sid in serverMapping) {
          result.push({ name: serverMapping[sid + ''].name, _id: '', pid: '', sid: serverMapping[sid + '']._id + '' })
        }
      }
    }
    ctx.status = 200
    ctx.body = result
  } catch (error) {
    handleSysException(error)
  }
}

// function findOid(orgs) {
//   let res
//   const _ids = orgs.map(org => org._id).filter(org => org)
//   const pids = orgs.map(org => org.pid).filter(org => org)
//   const noRepeatIds = [...new Set(_ids)]
//   const noRepeatPids = [...new Set(pids)]
//   const allIds = noRepeatIds.concat(noRepeatPids)
//   const noRepeatAll = [...new Set(allIds)]
//   noRepeatAll.forEach(id => {
//     if (noRepeatPids.includes(id)) res = id
//   })
//   return res
// }
// 同步智能交通服务器组织及设备
module.exports.sync = async (ctx, next) => {
  ctx.set('loginfo', encodeURI('智能交通-同步智能交通服务器设备'))
  try {
    const id = ctx.params.id
    const server = await Device.findById(id)
    if (_.isEmpty(server)) {
      ctx.throw(500, { code: 200, message: '找不到服务器配置资源' })
    }
    const payload = { cmdBase: { devIp: server.ip, devPort: server.cport } }
    // 获取GetDoorDevInfoMA2DA proto
    const basePro = util.baseProto('GetTrafficDevInfoMA2DA')
    const structPro = util.getProtoMsg(basePro, 'CommandGeneric')
    const bufReq = util.encode(structPro, payload)
    const result = await util.tcp(bufReq, command.VMR_COMMAND_MA2DA_TRAF_GET_INFO_LIST)
    // 请求成功，解析获取解码的buffer数据
    if (result.code === 0) {
      const resPro = util.getProtoMsg(basePro, 'GetTraDevInfoResp')
      const bytes = util.decode(resPro, result.message)
      // 把buff字节转换成json对象
      const byteJson = JSON.parse(Buffer.from(bytes.traInfo, 'base64'))
      const lane = []
      if (!_.isEmpty(byteJson.equipInfo)) {
        byteJson.equipInfo.forEach(item => {
          // const deptIds = org.map(node => node._id)
          // if (!deptIds.includes(item.deptId)) {
          //   org.push({ name: item.deptName, _id: item.deptId, pid: item.deptParent || server._id.toString() })
          // }
          // 获取到所有的设备
          lane.push(_.assign(item, { sid: server._id.toString() }))
        })
      }
      // 添加服务器作为树根节点
      // const oid = findOid(org)
      // org.push({ name: server.name, _id: oid, sid: server._id.toString(), pid: '' })
      // 删除库中已有的所有设备配置
      const [cfgs] = await Promise.all([
        TrafficAlarmCfg.find({ sid: server._id.toString() }).lean(),
        TrafficLane.deleteMany({ sid: server._id.toString() })
      ])
      // 移除不存在设备的报警配置并创建设备配置
      const devChnIds = lane.map(node => node.devChnId)
      const detach = []
      cfgs.map(item => item.devcode).forEach(devcode => {
        if (!devChnIds.includes(devcode)) {
          detach.push(devcode)
        }
      })
      await Promise.all([
        TrafficAlarmCfg.deleteMany({ devcode: { $in: detach } }),
        TrafficLane.create(lane)
      ])
      const treeData = []
      const servers = await Device.find({ bigtype: 8 }).lean()
      const sids = servers.map(item => item._id.toString())
      const lanes = await TrafficLane.find({ sid: { $in: sids } }).lean().exec()
      const serverMapping = {}
      servers && servers.length && servers.forEach(server => {
        serverMapping[server._id + ''] = server
      })
      const laneMapping = {}
      lanes && lanes.length && lanes.forEach(lane => {
        !laneMapping[lane.sid + ''] && (laneMapping[lane.sid + ''] = [])
        laneMapping[lane.sid + ''] = [...laneMapping[lane.sid + ''], lane]
      })
      if (Object.keys(laneMapping).length) {
        for (const sid in laneMapping) {
          const org = []
          laneMapping[sid] && laneMapping[sid].length && laneMapping[sid].forEach(lane => {
            if (lane.deptParent + '' === lane.deptId + '') { lane.deptParent = serverMapping[sid + '']._id }
            const orgids = org.map(org => org._id + '')
            !orgids.includes(lane.deptId.toString()) && org.push({ name: lane.deptName, _id: lane.deptId.toString(), sid, pid: lane.deptParent ? lane.deptParent.toString() : serverMapping[sid + '']._id + '' })
          })
          org.push({ name: serverMapping[sid + ''].name, _id: serverMapping[sid + '']._id, pid: '', sid: serverMapping[sid + '']._id + '' })
          treeData.push(transData2Tree(org, '_id', 'pid').pop())
        }
      } else {
        for (const sid in serverMapping) {
          treeData.push({ name: serverMapping[sid + ''].name, _id: '', pid: '', sid: serverMapping[sid + '']._id + '' })
        }
      }
      ctx.status = 200
      ctx.body = treeData
    } else {
      throw (500, result)
    }
  } catch (error) {
    handleSysException(error)
  }
}
// 获取服务器地址
exports.getServerCfg = async (ctx) => {
  try {
    const res = await TrafficServerCfg.findOne().exec()
    ctx.body = res
  } catch (error) {
    handleSysException(error)
  }
}
// 配置服务器地址
exports.editServerCfg = async (ctx) => {
  try {
    const res = await TrafficServerCfg.findOne().lean().exec()
    if (res) {
      await TrafficServerCfg.findByIdAndUpdate(res._id, ctx.request.body)
    } else {
      await TrafficServerCfg.create(ctx.request.body)
    }
    ctx.body = 200
  } catch (error) {
    handleSysException(error)
  }
}
