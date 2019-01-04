/*
 * 设备接口
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:48:21
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-12-21 17:54:29
 */

'use strict'

const mongoose = require('mongoose')
const Device = mongoose.model('Device')
const Org = mongoose.model('Org')
const Resource = mongoose.model('Resource')
const OrgRes = mongoose.model('OrgRes')
const OrgAlarm = mongoose.model('OrgAlarm')
const _ = require('lodash')
// const request = require('request')
const tool = require('../../../common/tools')
const paging = require('../../paging')
const rp = require('../../bstar/req').req
const wallInterface = require('../../bstar/tvwall.interface')
const logUtil = require('../../log/log.controller')
const postal = require('postal')
const xlsx = require('node-xlsx')
const DeviceAlarm = mongoose.model('DeviceAlarm')
const IntelligentAlarm = mongoose.model('IntelligentAlarm')
const MonitoryPointAlarm = mongoose.model('MonitoryPointAlarm')
const Origin = mongoose.model('Origin')
const { handleSysException } = tool
const User = mongoose.model('User')
const {
  devOnlineList,
  devLogin,
  devLogout,
  syncOnlineList,
  getDevinfo,
  getDevConf
} = require('../../bstar/dev.interface')
const Rtsp = require('../../../common/rtsp')
const rtspServer = new Rtsp()
const fs = require('fs')
const { RES_DEFAULT_NAME, ORG_TYPE, DEV_TYPE } = require('../../../common/constant')
const { res } = require('../../platform/generateNum')
// 修改某个设备信息
exports.updateOne = async (ctx, next) => {
  ctx.set('loginfo', encodeURI('设备管理-修改设备'))
  const deviceId = ctx.params.id
  try {
    const org = await Org.findById(ctx.request.body.oid).exec()
    if (_.isEmpty(org)) {
      return ctx.throw(404, { code: 1003, message: '该机构不存在' })
    }
    let flag = false
    const res = await Device.find({ ip: ctx.request.body.ip, cport: ctx.request.body.cport })
    res.forEach(item => {
      if (item && item._id + '' !== ctx.params.id + '') {
        flag = true
      }
    })
    if (flag) {
      return ctx.throw(500, { code: 1003, message: '该设备已存在' })
    }
    const oldDevice = await Device.findById(deviceId).exec()
    const { ip, intelligent, name, cport } = ctx.request.body
    const newDevice = await Device.findByIdAndUpdate(deviceId, ctx.request.body, { new: true }).exec()
    const resources = await Resource.find({ eid: deviceId }).exec()
    // 0：视频通道 1：报警输入 2：报警输出通道 3：对讲通道 4：门禁通道 5：解码通道 6：音频通道 7: 解码报警输入 8:解码报警输出 9：报警主机报警输入 10：报警主机报警输出 11：消防输入防区 12：消防输出防区
    await Promise.all([
      resources.map(item => {
        item.ip = ip
        item.intelligent = intelligent
        item.port = cport
        item.name = `${name}_${RES_DEFAULT_NAME[item.type]}_通道${item.chan}`
        return item.save()
      })
    ])
    await Resource.updateMany({ eid: deviceId }, { ip, intelligent }, { multi: true })
    const alterData = tool.filterAlterData(oldDevice.toObject(), newDevice.toObject())
    const noticeCon = ['username', 'ip', 'password', 'cport', 'manufacturer']
    const sameData = tool.filterData(alterData, noticeCon)
    if (sameData.length) {
      postal.publish({
        channel: 'devices',
        topic: 'item.notice',
        data: {
          ctx: ctx,
          data: {
            module: 'dev',
            varyData: [
              {
                before: {
                  devIp: oldDevice.ip + '',
                  devPort: +oldDevice.cport
                },
                after: {
                  devIp: newDevice.ip + '',
                  devPort: +newDevice.cport
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
    handleSysException(err)
  }
}

// 添加设备
exports.add = async ctx => {
  ctx.set('loginfo', encodeURI('设备管理-添加设备'))
  delete ctx.request.body._id
  let newDevice
  try {
    const org = await Org.findById(ctx.request.body.oid).exec()
    if (_.isEmpty(org)) {
      return ctx.throw(404, { code: 1003, message: '该机构不存在' })
    }
    if (org.shareType) {
      return ctx.throw(500, { code: 1019, message: '下联机构不能添加设备' })
    }
    const rst = await Device.countDocuments({ ip: ctx.request.body.ip, cport: ctx.request.body.cport }).exec()
    if (rst) {
      return ctx.throw(500, { code: 1019, message: '该设备已存在' })
    }
    newDevice = await Device.create(ctx.request.body) // 添加设备
    postal.publish({
      channel: 'devices',
      topic: 'item.notice',
      data: {
        ctx: ctx,
        data: {
          module: 'dev',
          varyData: [],
          newData: [
            {
              devIp: newDevice.ip + '',
              devPort: +newDevice.cport
            }
          ]
        }
      }
    })
    // 如果是拼接控制器，获取拼接控制器得输入源
    // if (ctx.request.body.bigtype === 9) {
    //   try {
    //     const jointInfo = await getJointInput(ctx, { devIp: ctx.request.body.ip, devPort: Number(ctx.request.body.cport) })
    //     ctx.request.body.jointinputcount = jointInfo.carStateInfoArr && jointInfo.carStateInfoArr.length
    //   } catch (error) {
    //     ctx.throw(500, { code: error.error, message: '请求第三方接口异常', type: 'sys' })
    //   }
    // }
    // 操作机构表
    await Resource.insertPatch(newDevice, ctx.request.body, rtspServer, org.gbDevId) // 批量生成多个资源
    // 若添加解码设备，需更新拼接源
    if (newDevice.bigtype === DEV_TYPE.DECODER) {
      const origin = await Origin.find({}, '_id').exec()
      const decodes = await Resource.find({ oid: newDevice._id }, '_id').exec()
      // 拼接源存在的情况下更新
      if (origin) {
        const oriArr = []
        decodes.forEach(item => {
          oriArr.push({ decodechan: item._id })
        })
        Origin.create()
      }
    }
    ctx.status = 201
    ctx.body = [newDevice._id]
  } catch (err) {
    console.log(err)
    if (newDevice) {
      // 删除设备和对应的资源
      await Device.findByIdAndRemove(newDevice._id).exec()
      await Resource.deleteMany({ eid: newDevice._id }).exec()
    }
    handleSysException(err)
  }
}
// 批量添加设备
exports.insertPatch = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('设备管理-批量添加设备'))
    var retIds = []
    const data = ctx.request.body
    const org = await Org.findById(data[0].oid).exec()
    if (_.isEmpty(org)) {
      return ctx.throw(404, { code: 1003, message: '该机构不存在' })
    }
    // if (org.isroot) {   // 如果是根机构
    //   return ctx.throw(404, { code: 1004, message: '根机构不允许直接操作' })
    // }
    let newDevice

    for (var item of data) {
      const rst = await Device.countDocuments({ ip: item.ip, cport: item.cport }).exec()
      if (rst) {
        ctx.throw(500, { code: 1019, message: `设备:${item.name},设备已存在` })
        break
      }
      const rst2 = await Device.countDocuments({ name: item.name }).exec()
      if (rst2) {
        ctx.throw(500, { code: 1020, message: `设备:${item.name},设备名称已存在` })
        break
      }
      newDevice = await Device.create(item) // 添加设备
      // 操作机构表
      retIds.push(newDevice._id)
      await Resource.insertPatch(newDevice, item, rtspServer) // 批量生成多个资源
      // 根据设备通道数量批量生成资源
      postal.publish({
        channel: 'devices',
        topic: 'item.notice',
        data: {
          ctx: ctx,
          data: {
            module: 'dev',
            varyData: [],
            newData: [
              {
                devIp: newDevice.ip + '',
                devPort: +newDevice.cport
              }
            ]
          }
        }
      })
    }
    ctx.status = 200
    ctx.body = retIds
  } catch (err) {
    handleSysException(err)
  }
}

// 获取各个设备名称
exports.names = async (ctx, next) => {
  try {
    ctx.set('loginfo', encodeURI('设备管理-获取设备名称'))
    const names = await Device.distinct('name').exec()
    ctx.body = _.isEmpty(names) ? [] : names
  } catch (err) {
    handleSysException(err)
  }
}
// 获取设备列表(是否显示子机构设备: query参数never)
exports.getAll = async ctx => {
  ctx.set('loginfo', encodeURI('设备管理-获取设备列表'))
  let allChildrenIds = []
  let errMsg
  if (!ctx.query.oid) {
    ctx.throw(404, { code: 1010, message: '请求参数不能为空' })
  }
  try {
    try {
      syncOnlineList()
    } catch (error) {
      // 将所有设备置为离线
      const devIds = (await Device.find('_id').exec()).map(item => item._id + '')
      Device.updateMany({ _id: { $in: devIds } }, { status: false }).exec()
      errMsg = '同步设备状态接口调用异常，设备状态同步失败!'
    }
    const query = { bigtype: ctx.query.bigtype }
    if (parseInt(ctx.query.never) === -1) {
      // 如果传入机构：oid
      const orgs = await Org.find({ type: ORG_TYPE.LOCALE }, '_id name pid')
        .sort('order')
        .exec() // -devices
      allChildrenIds = tool.getChildren(allChildrenIds, orgs, ctx.query.oid)
      allChildrenIds.unshift(ctx.query.oid + '')
      query.oid = {
        $in: allChildrenIds
      }
    } else {
      query.oid = ctx.query.oid
    }
    if (typeof ctx.query.status !== 'undefined') {
      query.status = Boolean(Number(ctx.query.status))
    }
    if (ctx.query.seek) {
      if (ctx.query.seek.match(/\./)) {
        ctx.query.seek = ctx.query.seek.replace(/\./, '\\.')
      }
      query.$or = [{ ip: { $regex: ctx.query.seek + '' || '' } }, { name: { $regex: ctx.query.seek + '' || '' } }]
    }
    query.shareServer = { $exists: false }
    const resultObj = await paging.listQuery(
      Device,
      query,
      '',
      'order',
      ctx.query.page,
      { path: 'oid', select: '_id name' },
      ctx
    )
    // 同步报警主机设备报警状态
    // if (Number(ctx.query.bigtype) === 1 && ctx.query.module === 'alarmHost') {
    //   const res = []
    //   for (var item of resultObj.results) {
    //     try {
    //       const deviceAlarmStatus = await alarmStatus(ctx, { devIp: item.ip, devPort: item.cport })
    //       if (ctx.query.alarmStatus) {
    //         if (ctx.query.alarmStatus === deviceAlarmStatus.devStatus) {
    //           item._doc.alarmStatus = deviceAlarmStatus.devStatus
    //           res.push(item)
    //         }
    //       } else {
    //         item._doc.alarmStatus = deviceAlarmStatus.devStatus || ''
    //         res.push(item)
    //       }
    //     } catch (error) {
    //       res.push(item)
    //       continue
    //     }
    //   }
    //   resultObj.results = res
    // }
    ctx.body = { devList: _.isEmpty(resultObj.results) ? [] : resultObj.results, errMsg }
  } catch (err) {
    handleSysException(err)
  }
}
// 获取单个设备
exports.getOne = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('设备管理-获取单个设备'))
    const result = await Device.findById(ctx.params.id).exec()
    ctx.body = _.isEmpty(result) ? {} : result
  } catch (err) {
    handleSysException(err)
  }
}
// 设备移动
exports.moveDevice = async ctx => {
  try {
    const oid = ctx.request.body.oid
    const _ids = ctx.request.body._ids
    const org = await Org.findById(oid).exec()
    if (org.shareType) {
      return ctx.throw(500, { code: 1019, message: '设备不能移动下联机构' })
    }
    if (!oid && _ids) {
      ctx.throw(404, { code: 1010, message: '请求参数不能为空' })
    }
    await Device.updateMany({ _id: { $in: _ids } }, { oid }).exec()
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}
// 获取设备树
exports.getDeviceTree = async ctx => {
  ctx.set('loginfo', encodeURI('设备管理-获取设备树'))
  let allChildrenIds = []
  let orgs = []
  !ctx.query.oid && (ctx.query.oid = ctx.state.user.orgId)
  try {
    orgs = await Org.find({ type: ctx.query.orgtype || ORG_TYPE.LOCALE })
      .lean()
      .exec()
    allChildrenIds = tool.getChildren(allChildrenIds, orgs, ctx.query.oid)
    allChildrenIds.unshift(ctx.query.oid + '')
    orgs = await Org.find({ _id: { $in: allChildrenIds } })
      .sort({ order: -1 })
      .lean()
      .exec()
    const orgTemp = new Array(orgs.length)
    _.fill(orgTemp, { _doc: { isOrg: true } })
    _.merge(orgs, orgTemp)
    const devices = await Device.find(
      { oid: { $in: orgs.map(org => org._id + '') }, bigtype: ctx.query.bigtype || DEV_TYPE.VIDEO },
      '_id name status oid'
    )
      .sort('name')
      .lean()
      .exec()
    const devTemp = new Array(devices.length)
    _.fill(devTemp, { _doc: { equip: true } })
    _.merge(devices, devTemp)
    const devMapping = {}
    devices.forEach(dev => {
      !devMapping[dev.oid + ''] && (devMapping[dev.oid + ''] = [])
      devMapping[dev.oid + ''] = [...devMapping[dev.oid + ''], dev]
    })
    orgs.forEach(org => {
      !org.children && (org.children = [])
      devMapping[org._id + ''] && (org.children = [...org.children, ...devMapping[org._id + '']])
    })
    const treeDatas = tool.transData2Tree(orgs, '_id', 'pid', true)
    ctx.body = _.isEmpty(treeDatas) ? {} : treeDatas[0]
  } catch (err) {
    handleSysException(err)
  }
}
exports.getChannelTree = async ctx => {
  ctx.set('loginfo', encodeURI('设备管理-获取通道树'))
  let allChildrenIds = []
  let orgs = []
  try {
    orgs = await Org.find({ type: ctx.query.orgtype || ORG_TYPE.LOCALE }, '_id name isroot pid type')
      .sort('name')
      .lean()
      .exec() // -devices
    const rootOrg = orgs.filter(item => item.isroot === true && item.type === ORG_TYPE.LOCALE)
    allChildrenIds = tool.getChildren(allChildrenIds, orgs, rootOrg[0]._id + '')
    allChildrenIds.unshift(rootOrg[0]._id + '')
    orgs = await Org.find(
      {
        _id: {
          $in: allChildrenIds
        }
      },
      '_id name pid isroot'
    )
      .sort({ order: -1 })
      .lean()
      .exec()
    const orgids = orgs.map(org => org._id)
    const devices = await Device.find({ oid: { $in: orgids }, bigtype: ctx.query.bigtype }, 'name oid status')
      .lean()
      .exec()
    const devids = devices.map(dev => dev._id)
    const resources = await Resource.find({ eid: { $in: devids }, type: ctx.query.channeltype })
      .lean()
      .exec()
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
      devMapping[org._id + ''] &&
        devMapping[org._id + ''].forEach(dev => {
          dev.children = resMapping[dev._id + '']
        })
      !org.children && (org.children = [])
      devMapping[org._id + ''] && (org.children = [...org.children, ...devMapping[org._id + '']])
    })
    orgs = orgs.map(item => {
      item.isOrg = true
      return item
    })
    const treeDatas = tool.transData2Tree(orgs, '_id', 'pid', true)
    ctx.body = _.isEmpty(treeDatas) ? {} : treeDatas[0]
  } catch (err) {
    handleSysException(err)
  }
}
// 获取通道树
exports.getAuthChannelTree = async ctx => {
  ctx.set('loginfo', encodeURI('设备管理-获取通道树'))
  let allChildrenIds = []
  let orgs = []
  let mainFlag = true
  let userDataInfo
  !ctx.query.pid && (ctx.query.pid = ctx.state.user.orgId)
  try {
    // 获取用户权限数据
    const userData = (await User.findById(ctx.query.userid, 'userData')
      .lean()
      .exec()).userData
    switch (Number(ctx.query.bigtype)) {
      case 0: {
        userDataInfo = userData.video
        break
      }
      case 5: {
        userDataInfo = userData.decode
        break
      }
    }
    orgs = await Org.find({ type: ctx.query.orgtype || ORG_TYPE.LOCALE }, '_id name pid')
      .sort({ order: -1 })
      .exec() // -devices
    allChildrenIds = tool.getChildren(allChildrenIds, orgs, ctx.query.pid)
    allChildrenIds.unshift(ctx.query.pid + '')
    orgs = await Org.find(
      {
        _id: {
          $in: allChildrenIds
        }
      },
      '_id name pid isroot'
    )
      .sort('name')
      .lean()
      .exec()
    const orgids = orgs.map(org => org._id)
    // 获取所有设备
    const devices = await Device.find({ oid: { $in: orgids }, bigtype: ctx.query.bigtype }, 'name oid status')
      .lean()
      .exec()
    const devids = devices.map(dev => dev._id)
    // 获取所有资源
    const resources = await Resource.find({ eid: { $in: devids }, type: ctx.query.channeltype })
      .lean()
      .exec()
    const arr = new Array(devices.length)
    _.fill(arr, { equip: true })
    _.merge(devices, arr)
    const resMapping = {}
    const userResMapping = {}
    const userDevMapping = {}
    const userPowerMapping = {}
    // 获取资源|power的mapping
    userDataInfo.res.length &&
      userDataInfo.res.forEach(item => {
        !userPowerMapping[item.id + ''] && (userPowerMapping[item.id + ''] = [])
        userPowerMapping[item.id + ''] = [...userPowerMapping[item.id + ''], ...item.power]
      })
    // 获取相应的id数组
    const userResIds = userDataInfo.res.map(item => item.id + '')
    const userDevIds = userDataInfo.device
    const userOrgIds = userDataInfo.org

    resources.forEach(res => {
      if (userResIds && userDevIds.length) {
        // 判断资源是否有云台权限
        if (userPowerMapping[res._id + ''] && userPowerMapping[res._id + ''].length) {
          res.power = userPowerMapping[res._id + '']
          if (userPowerMapping[res._id + ''].length === 5) {
            res.checked = 2
          } else {
            res.checked = 1
            mainFlag = false
          }
          // 获取用户权限数据(设备|资源)mapping
          !userResMapping[res.eid + ''] && (userResMapping[res.eid + ''] = [])
          userResMapping[res.eid + ''] = [...userResMapping[res.eid + ''], res]
        } else {
          // 若无云台权限，判断是否有资源权限
          if (userResIds.includes(res._id + '')) {
            res.checked = 1
            res.power = []
            mainFlag = false
            // 获取用户权限数据(设备|资源)mapping
            !userResMapping[res.eid + ''] && (userResMapping[res.eid + ''] = [])
            userResMapping[res.eid + ''] = [...userResMapping[res.eid + ''], res]
          } else {
            res.checked = 0
            res.power = []
            mainFlag = false
          }
        }
      } else {
        res.checked = 0
        res.power = []
        mainFlag = false
      }
      // 获取(设备|资源)mapping
      !resMapping[res.eid + ''] && (resMapping[res.eid + ''] = [])
      resMapping[res.eid + ''] = [...resMapping[res.eid + ''], res]
    })
    const devMapping = {}
    devices.forEach(dev => {
      // 控制半选的flag
      let flag = true
      // 判断设备是否有权限
      if (userResMapping[dev._id + ''] && userResMapping[dev._id + ''].length) {
        if (userResMapping[dev._id + ''].length === resMapping[dev._id + ''].length) {
          resMapping[dev._id + ''].forEach(item => {
            if (item.checked !== 2) {
              flag = false
            }
          })
          if (flag) {
            dev.checked = 2
          } else {
            dev.checked = 1
            mainFlag = false
          }
        } else {
          dev.checked = 1
          mainFlag = false
        }
      } else {
        dev.checked = 0
        mainFlag = false
      }
      // 获取用户权限的(机构|设备)mapping
      if (userDevIds.includes(dev._id + '')) {
        !userDevMapping[dev.oid + ''] && (userDevMapping[dev.oid + ''] = [])
        userDevMapping[dev.oid + ''] = [...userDevMapping[dev.oid + ''], dev]
      }
      // 获取(机构|设备)mapping
      !devMapping[dev.oid + ''] && (devMapping[dev.oid + ''] = [])
      devMapping[dev.oid + ''] = [...devMapping[dev.oid + ''], dev]
    })
    // 找出所有不在权限数据里的机构，并将checked置为0
    orgs.forEach(org => {
      if (!userOrgIds.includes(org._id + '')) {
        org.checked = 0
      }
    })
    // 遍历机构，更改状态
    orgs.forEach(org => {
      let flag = true
      // 判断设备所在机构是否具有数据权限
      if (userDevMapping[org._id + ''] && userDevMapping[org._id + ''].length) {
        if (userDevMapping[org._id + ''].length === devMapping[org._id + ''].length) {
          let childrenIds = []
          childrenIds = tool.getChildren(childrenIds, orgs, org._id + '')
          if (childrenIds.length) {
            // 过滤该节点下的所有子机构
            const childOrgs = orgs.filter(org => childrenIds.includes(org._id + ''))
            // 判断改节点下的子节点机构是否存在半选
            childOrgs.forEach(child => {
              if ((child.checked || child.checked === 0) && child.checked !== 2) {
                flag = false
              }
            })
            const childDevs = devices.filter(dev => childrenIds.includes(dev.oid + ''))
            childDevs.forEach(child => {
              if (child.checked !== 2) {
                flag = false
              } else {
                resMapping[child._id + ''].forEach(res => {
                  if (res.checked !== 2) {
                    flag = false
                  }
                })
              }
            })
          }
          devMapping[org._id + ''].forEach(item => {
            if (item.checked !== 2) {
              flag = false
            } else {
              resMapping[item._id + ''].forEach(res => {
                if (res.checked !== 2) {
                  flag = false
                }
              })
            }
          })
          if (flag) {
            org.checked = 2
          } else {
            org.checked = 1
            mainFlag = false
          }
        } else {
          org.checked = 1
          mainFlag = false
        }
        // 判断机构是否存在于权限数据中
      } else if (userOrgIds.includes(org._id + '')) {
        // 获取机构子节点
        let childrenIds = []
        childrenIds = tool.getChildren(childrenIds, orgs, org._id + '')
        // childrenIds.shift(org._id + '')
        // 获取机构子节点对应的设备
        if (childrenIds.length) {
          // 过滤该节点下的所有子机构
          const childOrgs = orgs.filter(org => childrenIds.includes(org._id + ''))
          // 判断改节点下的子节点机构是否存在半选
          childOrgs.forEach(child => {
            if ((child.checked || child.checked === 0) && child.checked !== 2) {
              flag = false
            }
          })
          if (mainFlag) {
            org.checked = 2
          } else {
            // 判断改节点下的资源是否存在半选
            const childDevs = devices.filter(dev => childrenIds.includes(dev.oid + ''))
            childDevs.forEach(child => {
              if (child.checked !== 2) {
                flag = false
              } else {
                resMapping[child._id + ''].forEach(res => {
                  if (res.checked !== 2) {
                    flag = false
                  }
                })
              }
            })
            if (flag) {
              org.checked = 2
            } else {
              org.checked = 1
            }
          }
        } else {
          org.checked = 2
        }
      } else {
        org.checked = 0
      }
      // 将设备和资源挂载于机构
      devMapping[org._id + ''] &&
        devMapping[org._id + ''].forEach(dev => {
          dev.children = resMapping[dev._id + '']
        })
      !org.children && (org.children = [])
      devMapping[org._id + ''] && (org.children = [...org.children, ...devMapping[org._id + '']])
    })
    orgs = orgs.map(item => {
      item.isOrg = true
      return item
    })
    const treeDatas = tool.transData2Tree(orgs, '_id', 'pid', true)
    ctx.body = _.isEmpty(treeDatas) ? {} : treeDatas[0]
  } catch (err) {
    handleSysException(err)
  }
}

// 删除设备
exports.delete = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('设备管理-删除设备'))
    const ids = ctx.accept.headers['x-bsc-ids'].split(',')
    if (_.isEmpty(ids)) {
      ctx.throw(404, { code: 1010, message: '参数不能为空' })
    }
    const deviceFlag = await Device.findById(ids[0]).exec()
    const resources = await Resource.find({ eid: { $in: ids }, type: parseInt(deviceFlag.bigtype) }, '_id').exec()
    for (var item of ids) {
      const device = await Device.findById(item).exec()
      if (_.isEmpty(device)) {
        return ctx.throw(404, { code: 1010, message: '该设备不存在' })
      }
      // 查找设备对应的资源表
      const res = await Resource.find({ eid: item }).exec()
      // 删除资源机构关系表数据
      res.forEach(async item => {
        await OrgRes.deleteMany({ resource: item._id }).exec()
      })
      // 如果资源中存在智能报警，删除对应的机构报警关系表
      res.forEach(async item => {
        await OrgAlarm.deleteMany({ resource: item._id }).exec()
      })
      // 删除设备对应的资源
      await Resource.deleteMany({ eid: item }).exec()
      // 回收rtsp流
      res.forEach(async item => {
        if (res.rtsp) {
          const rtspId = res.rtsp.main.split('=').pop()
          // 回收当前资源的rtsp id
          rtspServer.setUnusedIds(Number(rtspId))
        }
      })
      // 删除该设备
      await Device.findByIdAndRemove(item).exec()
      // 设备更新通知
      postal.publish({
        channel: 'devices',
        topic: 'item.notice',
        data: {
          ctx: ctx,
          data: {
            module: 'dev',
            varyData: [
              {
                before: {
                  devIp: device.ip + '',
                  devPort: +device.cport
                },
                after: {}
              }
            ],
            newData: []
          }
        }
      })
    }
    if (parseInt(deviceFlag.bigtype) === DEV_TYPE.DECODER || parseInt(deviceFlag.bigtype) === DEV_TYPE.FINE_TRACK) {
      // 删除拼接源对应关系
      Origin.deleteMany({ $or: [{ decodechan: { $in: resources } }, { jointorigin: { $in: resources } }] })
    }
    if (parseInt(deviceFlag.bigtype) === DEV_TYPE.DECODER) {
      // 查找设备对应的资源
      postal.publish({
        channel: 'devices',
        topic: 'item.deleteDecoder',
        data: {
          equipment: ids,
          resources
        }
      })
    } else {
      postal.publish({
        channel: 'devices',
        topic: 'item.deleteIPC',
        data: {
          equipment: ids,
          resources
        }
      })
      // const resIPCIds = await Resource.find({ eid: { $in: ids } }, '_id')
      postal.publish({
        channel: 'resources',
        topic: 'array.delete',
        data: {
          ctx,
          ids: resources.map(item => item._id)
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
    }
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}

// 获取各类设备的设备总数
exports.counts = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('设备管理-获取各类设备总数'))
    let allChildrenIds = []
    if (parseInt(ctx.query.never) === -1) {
      // 统计所有子孙机构
      const orginfo = await Org.findById(ctx.query.id).exec()
      const orgs = await Org.find({ type: orginfo.type || ORG_TYPE.LOCALE }, '_id pid').exec()
      allChildrenIds = tool.getChildren(allChildrenIds, orgs, ctx.query.id)
    }
    allChildrenIds.unshift(ctx.query.id + '')
    const arr = []
    for (let i = 0; i <= 9; i++) {
      arr.push(
        Device.countDocuments({
          oid: {
            $in: allChildrenIds
          },
          bigtype: i
        }).exec()
      )
    }
    ctx.body = await Promise.all(arr)
  } catch (err) {
    handleSysException(err)
  }
}

// 首页中各个设备统计
exports.countIndex = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('设备管理-统计设备'))
    const devices = await Device.find({}).exec() // 查找类型的所有设备
    const total = { online: 0, offline: 0, total: devices.length || 0 } // 设备统计对象
    const counts = new Array(8) // 数量统计
    counts.fill(0)
    devices.forEach(item => {
      if (!counts[item.bigtype]) {
        counts[item.bigtype] = 0
      }
      counts[item.bigtype]++
      parseInt(item.status) === 1 || item.status ? total.online++ : total.offline++
    })
    ctx.body = {
      total: total,
      counts: counts
    }
  } catch (err) {
    handleSysException(err)
  }
}

// 获取指定设备下的所有资源
exports.getResource = async ctx => {
  ctx.set('loginfo', encodeURI('设备管理-获取设备资源'))
  const eid = ctx.params.id // 设备id
  try {
    const device = await Device.findById(eid).exec() // 设备信息
    if (_.isEmpty(device)) {
      return ctx.throw(500, { code: 1010, message: '该设备不存在' })
    }
    const reses = await Resource.find(
      { eid: eid },
      'type name chan ip port monitortype stream protocol model alarm level alarmtype alarmouttype alarmtemplate maxdelaytime minintervaltime durationtime exportdelaytime mapsign alarmaffirm devloop'
    ).exec()
    const totalArr = []
    reses.forEach(item => {
      if (!totalArr[item['type']]) {
        totalArr[item['type']] = []
      }
      totalArr[item['type']] = [...totalArr[item['type']], item.toObject()]
    })
    let monitoryPointAlarmArr // 监控点报警
    let intelligentAlarmArr // 智能报警
    let deviceAlarmArr // 设备报警
    const ipcResids = totalArr[0] && totalArr[0].map(item => item._id)
    // 获取设备报警,获取监控点报警,获取智能报警
    const [deviceAlarms, monitoryPointAlarms, intelligentAlarms] = await Promise.all([
      DeviceAlarm.find({ eid }).exec(),
      MonitoryPointAlarm.find({ rid: { $in: ipcResids } }).exec(),
      IntelligentAlarm.find({ rid: { $in: ipcResids } }).exec()
    ])
    if (deviceAlarms.length) {
      deviceAlarmArr = deviceAlarms
    }
    if (!deviceAlarms.length && device.devicealarm) {
      deviceAlarmArr = []
    }

    if (monitoryPointAlarms.length) {
      monitoryPointAlarmArr = monitoryPointAlarms
    }
    if (!monitoryPointAlarms.length && device.monitorypointalarm) {
      monitoryPointAlarmArr = []
    }

    if (intelligentAlarms.length) {
      intelligentAlarmArr = intelligentAlarms
    }
    if (!intelligentAlarms.length && device.intelligent) {
      intelligentAlarmArr = []
    }
    // 按通道号排序
    const videoArr = sort(totalArr[0], 'chan')
    ctx.body = {
      video: videoArr || [], // 视频通道
      alarmInput: totalArr[1] || totalArr[9] || totalArr[11] || totalArr[7] || [], // 报警输入
      alarmOutput: totalArr[2] || totalArr[10] || totalArr[12] || totalArr[8] || [], // 报警输出
      intercom: totalArr[3] || [], // 对讲通道
      entranceGuard: [], // 门禁通道暂时为空
      decode: totalArr[5] || [], // 解码通道
      voice: totalArr[6] || [], // 音频通道
      deviceAlarm: deviceAlarmArr || [], // 设备报警
      monitoryPointAlarm: monitoryPointAlarmArr || [], // 监控点报警
      intelligentAlarm: intelligentAlarmArr || [], // 智能报警
      jointInput: totalArr[15] || []
    }
  } catch (err) {
    handleSysException(err)
  }
}

// 获取指定设备类型下的设备列表
exports.getTypeDevice = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('设备管理-获取制定类型的设备列表'))
    const results = await Device.find({ bigtype: ctx.params.type }, '').exec()
    ctx.body = _.isEmpty(results) ? [] : results
  } catch (err) {
    handleSysException(err)
  }
}

// 获取指定设备指定通道的详情数据
exports.getResinfo = async ctx => {
  ctx.set('loginfo', encodeURI('设备管理-获取设备通道详情'))
  const { id, type } = ctx.params
  try {
    const reses = await Resource.find({ eid: id, type: type }).exec()
    ctx.body = reses
  } catch (err) {
    handleSysException(err)
  }
}

// 修改设备报警
exports.updateAlarm = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('设备管理-修改设备报警'))
    const deviceId = ctx.params.id // 设备id
    const alarmId = ctx.params.aid // 报警id
    const device = await Device.findById(deviceId).exec()
    if (_.isEmpty(device)) {
      return ctx.throw(500, { code: 1010, message: '该设备不存在' })
    }
    let matchedIndex = -1
    // let matchedAlarmIndex = -1
    let nameFlag = false
    let typeFlag = false
    for (let i = 0; i < device.alarm.length; i++) {
      if ('' + device.alarm[i]._id === '' + alarmId) {
        matchedIndex = i
      }
      if ('' + device.alarm[i]._id !== '' + alarmId && ctx.request.body.type + '' === device.alarm[i].type + '') {
        typeFlag = true
      }
      if ('' + device.alarm[i]._id !== '' + alarmId && ctx.request.body.name + '' === device.alarm[i].name + '') {
        nameFlag = true
      }
    }
    if (nameFlag) {
      return ctx.throw(500, { code: 1012, message: `该名称已存在` })
    }
    if (typeFlag) {
      return ctx.throw(500, { code: 1013, message: `该报警类型已存在` })
    }

    if (!_.isEmpty(device.alarm) && parseInt(matchedIndex) !== -1) {
      device.alarm[matchedIndex] = _.merge(device.alarm[matchedIndex], ctx.request.body)
    }
    await device.save()
    // postal.publish({
    //   channel: 'devices',
    //   topic: 'item.notice',
    //   data: {
    //     ctx: ctx
    //   }
    // })
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}

// 删除某条设备报警
exports.delAlarm = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('设备管理-删除单个设备报警'))
    const deviceId = ctx.params.id // 设备id
    const alarmId = ctx.params.aid // 报警id
    const device = await Device.findById(deviceId).exec()
    if (_.isEmpty(device)) {
      return ctx.throw(500, { code: 1010, message: '该设备不存在' })
    }
    for (let i = 0; i < device.alarm.length; i++) {
      if ('' + device.alarm[i]._id === '' + alarmId) {
        device.alarm.splice(i, 1)
      }
    }
    await device.save()
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}

// 批量删除设备报警
exports.delAlarmPatch = async ctx => {
  ctx.set('loginfo', encodeURI('设备管理-批量删除设备报警'))
  const deviceId = ctx.params.id // 设备id
  const alarmIds = ctx.request.header['x-bsc-ids'].split(',') || [] // 报警ids
  try {
    const device = await Device.findById(deviceId).exec()
    if (_.isEmpty(device)) {
      return ctx.throw(500, { code: 1010, message: '该设备不存在' })
    }
    const newAlarms = []
    for (let i = 0; i < device.alarm.length; i++) {
      if (alarmIds.indexOf(device.alarm[i]._id + '') === -1) {
        newAlarms.push(device.alarm[i])
      }
    }
    device.alarm = newAlarms
    await device.save()
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}

// 新增一条设备报警数据
exports.addAlarm = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('设备管理-新增设备报警'))
    const deviceId = ctx.params.id // 设备id
    const device = await Device.findById(deviceId).exec()
    if (_.isEmpty(device)) {
      return ctx.throw(500, { code: 1010, message: '该设备不存在' })
    }
    if (_.isEmpty(device.alarm)) {
      device.alarm = []
    }
    let existedType = ''
    let existedName = ''
    device.alarm.forEach(item => {
      if (ctx.request.body.type + '' === item.type + '') {
        existedType = item.type
      }
      if (ctx.request.body.name === item.name) {
        existedName = item.name
      }
    })
    if (existedType) {
      return ctx.throw(500, { code: 1013, message: `该报警类型已存在` })
    }
    if (existedName) {
      return ctx.throw(500, { code: 1012, message: '该名称已存在' })
    }
    device.alarm.push(ctx.request.body)
    await device.save()
    ctx.status = 201
  } catch (err) {
    handleSysException(err)
  }
}

// 获取指定设备未使用的通道号
exports.getUnusedChanCode = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('设备管理-获取设备未使用的通道号'))
    const mapping = {
      0: 'ipcount',
      1: 'defenseicount',
      2: 'defenseocount',
      3: 'intercomcount',
      4: 'entranceguardcount',
      5: 'decodecount',
      6: 'voicecount',
      7: 'encodingcount',
      8: 'videoinputcount',
      15: 'jointinputcount'
    }
    let type
    const eid = ctx.params.id
    type = ctx.query.type
    const [device, resources] = await Promise.all([Device.findById(eid).exec(), Resource.find({ eid, type }).exec()])
    if (+type === 7 || +type === 9 || +type === 11) {
      type = 1
    }
    if (+type === 8 || +type === 10 || +type === 12) {
      type = 2
    }
    const count = device[mapping[type]] || 0
    const rcode = resources.map(item => item.chan)
    const canUseChan = []
    for (let i = 1; i <= count; i++) {
      if (rcode.indexOf(i) === -1) {
        canUseChan.push(i)
      }
    }
    ctx.status = 200
    ctx.body = canUseChan
  } catch (err) {
    handleSysException(err)
  }
}
exports.getUnConfigAlarm = async ctx => {
  try {
    const mapping = {
      intelligentAlarm: IntelligentAlarm,
      monitoryPointAlarm: MonitoryPointAlarm
    }
    const resources = await Resource.find({ eid: ctx.params.id, type: 0 }, 'chan').exec()
    const resArr = resources.map(item => {
      return { chan: item.chan, _id: item._id }
    })
    const canUseRes = []
    for (var item of resArr) {
      const num = await mapping[ctx.query.category].countDocuments({ rid: item._id, chan: item.chan }).exec()
      if (!num) {
        canUseRes.push(item)
      }
    }
    ctx.body = sort(canUseRes, 'chan')
  } catch (error) {
    handleSysException(error)
  }
}
// 远程获取设备信息，视频设备和解码器设备信息 // 设备类型0：视频设备1：报警主机2：门禁设备3：ip对讲4：巡更设备5：解码器6：网络键盘
exports.getDeviceinfo = async ctx => {
  ctx.set('loginfo', encodeURI('设备管理-获取远程设备信息'))
  const device = ctx.query // 设备对象{ip:xxx port:xxx}
  if (_.isEmpty(device)) {
    return ctx.throw(500, { code: 1010, message: '设备不存在' })
  }
  try {
    let result
    switch (parseInt(device.type)) {
      case 0: {
        result = await getDevinfo({ device, ctx })
        break
      }
      case 5: {
        const body = {
          devInfo: {
            devIp: device.ip,
            devPort: parseInt(device.port),
            username: device.username,
            password: device.password
          }
        }
        result = await wallInterface.getMonitorCfg(ctx, body)
        result = {
          ChanCount: result.MonitorCfgPrmArr.length
        }
      }
    }

    if (_.isEmpty(result)) {
      ctx.throw(500, { code: 1017, message: '请求第三方接口异常', type: 'sys' })
    }
    ctx.body = result
  } catch (err) {
    handleSysException(err)
  }
}
// 设备重启
exports.restartDev = async ctx => {
  ctx.set('loginfo', encodeURI('设备管理-重启设备'))
  const device = ctx.request.body
  try {
    const options = {
      ctx,
      method: 'POST',
      url: `/api/dev/reboot`,
      body: {
        devInfo: {
          devIp: device.ip,
          devPort: parseInt(device.port)
        },
        devCtl: {
          channel: 1 // ipc设备目前写死为1
        }
      },
      json: true,
      timeout: 5000
    }
    await rp(options)
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}

// 设备登录
exports.login = async ctx => {
  ctx.set('loginfo', encodeURI('设备管理-设备登录'))
  const devId = ctx.request.body.id
  const device = await Device.findById(devId).exec()
  try {
    await devLogin({ device: device, ctx: ctx })
    postal.publish({
      channel: 'devices',
      topic: 'item.login',
      data: {
        device: device,
        ctx: ctx
      }
    })
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}

// 设备登出
exports.logout = async ctx => {
  ctx.set('loginfo', encodeURI('设备管理-设备登出'))
  const devId = ctx.request.body.id
  const device = await Device.findById(devId).exec()
  try {
    await devLogout({ device: device, ctx: ctx })
    postal.publish({
      channel: 'devices',
      topic: 'item.logout',
      data: {
        device: device,
        ctx: ctx
      }
    })
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}

// 返回所有在线的设备列表 // api/dev/onlinelist
exports.getDevOnline = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('设备管理-获取在线设备列表'))
    const ret = await devOnlineList()
    const onlineList = ret.devOnlineList ? ret.devOnlineList : []
    ctx.body = onlineList
  } catch (err) {
    console.log(err)
    return ctx.throw(500, { code: 1017, message: '请求第三方接口异常', type: 'sys' })
  }
}

// 同步设备在线状态
exports.syncOnlineList = async ctx => {
  try {
    console.log('同步设备在线状态')
    await syncOnlineList()
  } catch (err) {
    logUtil.addsystem({ msg: err.message })
  }
}
// 设备信息导入
exports.deviceImport = async ctx => {
  try {
    const org = await Org.findById(ctx.query.oid).lean()
    if (org.shareType) {
      return ctx.throw(500, { code: 1019, message: '下联机构不能添加设备' })
    }
    // 解析文件
    const devInfos = xlsx.parse(ctx.request.body.files.file.path)
    const doc = []
    let newDoc = []
    // 获取设备信息的doc
    // devInfos.forEach(item => {
    //   item.data.shift()
    //   if (item.data.length > 200) {
    //     ctx.throw(500, { code: 500, message: '一个机构节点下导入设备不能超过200条' })
    //   }
    //   item.data.forEach(item => {
    //     const dev = {
    //       oid: ctx.query.oid,
    //       name: item[0],
    //       bigtype: item[1],
    //       type: item[2],
    //       manufacturer: item[3],
    //       series: item[4],
    //       ip: item[5],
    //       cport: item[6],
    //       dport: item[7],
    //       username: item[8],
    //       password: item[9],
    //       ipcount: item[10],
    //       defenseicount: item[11],
    //       defenseocount: item[12],
    //       intercomcount: item[13]
    //     }
    //     if (dev.name && dev.ip && dev.cport) {
    //       doc.push(dev)
    //     }
    //   })
    // })
    let bigtype = ctx.query.bigtype
    // 获取设备信息的doc
    devInfos.forEach(item => {
      item.data.shift()
      if (item.data.length > 200) {
        ctx.throw(500, { code: 500, message: '一个机构节点下导入设备不能超过200条' })
      }
      item.data.forEach(item => {
        const dev = {
          bigtype: bigtype,
          oid: ctx.query.oid,
          name: item[0],
          manufacturer: bigtype === '0' ? item[3] : item[1],
          ip: bigtype === '0' ? item[5] : bigtype === '1' || bigtype === '5' || bigtype === '7' ? item[4] : bigtype === '9' ? item[2] : item[3],
          cport: bigtype === '0' ? item[6] : bigtype === '1' || bigtype === '5' || bigtype === '7' ? item[5] : bigtype === '9' ? item[3] : item[4]
        }
        switch (bigtype) {
          case '0':
            dev.series = item[4]
            dev.dport = item[7]
            dev.username = item[8]
            dev.password = item[9]
            dev.type = item[2]
            dev.ipcount = item[10]
            dev.defenseicount = item[11]
            dev.defenseocount = item[12]
            dev.intercomcount = item[13]
            break
          case '1':
            dev.model = item[2]
            dev.intranetIp = item[3]
            dev.username = item[6]
            dev.password = item[7]
            dev.defenseicount = item[8]
            dev.defenseocount = item[9]
            break
          case '5':
            dev.type = item[2]
            dev.model = item[3]
            dev.username = item[6]
            dev.password = item[7]
            dev.decodecount = item[8]
            dev.voicecount = item[9]
            dev.defenseicount = item[10]
            dev.defenseocount = item[11]
            break
          case '7':
            dev.model = item[2]
            dev.intranetIp = item[3]
            dev.username = item[6]
            dev.password = item[7]
            break
          case '9':
            dev.jointinputcount = item[4]
            break
          case '6':
            dev.model = item[2]
            break
        }
        if (dev.name && dev.ip && dev.cport) {
          doc.push(dev)
        }
      })
    })
    if (!doc.length) {
      ctx.throw(500, { message: '无可用数据' })
      return
    }
    for (var item of doc) {
      const device = await Device.find({ ip: item.ip, cport: item.cport }).exec()
      if (device.length) {
        continue
      } else {
        newDoc.push(item)
      }
    }
    if (!newDoc.length) {
      ctx.throw(500, { code: 1019, message: '重复数据' })
      return
    }
    const newDeviceArr = await Device.create(newDoc)
    const docs = []
    let videos = []
    let id
    newDeviceArr.forEach(newDevice => {
      const deviceObj = newDevice.toObject()
      const { ipcount = 0, defenseicount = 0, defenseocount = 0, intercomcount = 0 } = deviceObj
      for (let i = 1; i <= ipcount; i++) {
        id = rtspServer.getUnusedIds()
        videos.push({
          eid: newDevice._id,
          chan: i,
          type: 0,
          ip: newDevice.ip,
          port: newDevice.cport,
          rtsp: {
            main: `rtsp://ip:port/main/id=${id}`,
            sub: `rtsp://ip:port/sub/id=${id}`
          },
          name: `${newDevice.name}_视频通道_通道${i}`,
          pinyin: tool.transferPinyin(`${newDevice.name}_视频通道_通道${i}`)
        })
      }
      for (let i = 1; i <= defenseicount; i++) {
        docs.push({
          eid: newDevice._id,
          chan: i,
          type:
            newDevice.bigtype === 0
              ? 1
              : newDevice.bigtype === 1
                ? 9
                : newDevice.bigtype === 5
                  ? 7
                  : newDevice.bigtype === 7
                    ? 11
                    : 1,
          ip: newDevice.ip,
          port: newDevice.cport,
          name: newDevice.bigtype === 0 ? `${newDevice.name}_报警输入_通道${i}` : `${newDevice.name}_报警防区_通道${i}`,
          pinyin: tool.transferPinyin(`${newDevice.name}_报警输入_通道${i}`)
        })
      }
      for (let i = 1; i <= defenseocount; i++) {
        docs.push({
          eid: newDevice._id,
          chan: i,
          ip: newDevice.ip,
          port: newDevice.cport,
          type:
            newDevice.bigtype === 0
              ? 2
              : newDevice.bigtype === 1
                ? 10
                : newDevice.bigtype === 5
                  ? 8
                  : newDevice.bigtype === 7
                    ? 12
                    : 2,
          name: `${newDevice.name}_报警输出_通道${i}`,
          pinyin: tool.transferPinyin(`${newDevice.name}_报警输出_通道${i}`)
        })
      }
      for (let i = 1; i <= intercomcount; i++) {
        docs.push({
          eid: newDevice._id,
          chan: i,
          ip: newDevice.ip,
          port: newDevice.cport,
          type: 3,
          name: `${newDevice.name}_设备对讲_通道${i}`,
          pinyin: tool.transferPinyin(`${newDevice.name}_设备对讲_通道${i}`)
        })
      }
    })
    // ipc/nvr视频通道添加国标字段
    videos = await res(videos, org.gbDevId)
    // 批量生产资源
    await Resource.create(docs.concat(videos))
    fs.unlinkSync(ctx.request.body.files.file.path)
    ctx.status = 200
  } catch (error) {
    handleSysException(error)
  }
}

// 设备信息导出
exports.deviceExport = async ctx => {
  try {
    const orgName = await Org.findById(ctx.query.oid, 'name').exec()
    const allOrgs = await Org.find({ type: 0 }).exec()
    let allChildrenIds = []
    allChildrenIds = tool.getChildren(allChildrenIds, allOrgs, ctx.query.oid)
    allChildrenIds.unshift(ctx.query.oid)
    // const devices = await Device.find({ oid: { $in: allChildrenIds }, bigtype: ctx.query.bigtype }, 'name bigtype type manufacturer series ip cport dport username password ipcount defenseicount defenseocount intercomcount').exec()
    // // 定义表头
    // const data = [['设备名称', '设备大类', '设备类型', '设备厂商', '产品系列', 'IP地址', '控制端口', '数据端口', '用户名', '密码', '视频通道数量', '报警输入数量', '报警输出数量', '对讲通道数量']]
    // const devMapping = { 0: '视频设备', 1: '报警主机', 2: '门禁设备', 3: 'ip对讲', 4: '巡更设备', 5: '解码器', 6: '网络键盘', 7: '消防主机', 8: '拼接控制器' }
    // // 将设备信息Push到sheet
    // devices.forEach(item => {
    //   const arr = [item.name, item.bigtype, item.type, item.manufacturer, item.series, item.ip, item.cport, item.dport, item.username, item.password, item.ipcount, item.defenseicount, item.defenseocount, item.intercomcount]
    //   data.push(arr)
    // })
    // }
    let data
    let fieldNames = []
    let tableHeaderXlsx
    if (ctx.query.bigtype === '0') {
      data = [['设备名称', '设备大类', '设备类型', '设备厂商', '产品系列', 'IP地址', '控制端口', '数据端口', '用户名', '密码', '视频通道数量', '报警输入数量', '报警输出数量', '对讲通道数量']]
      fieldNames = ['name', 'bigtype', 'type', 'manufacturer', 'series', 'ip', 'cport', 'dport', 'username', 'password', 'ipcount', 'defenseicount', 'defenseocount', 'intercomcount']
      tableHeaderXlsx = '视频设备'
    } else if (ctx.query.bigtype === '1') {
      data = [['设备名称', '设备厂商', '设备型号', '内网地址', '主机地址', '数据端口', '用户名', '密码', '报警防区数量', '报警输出数量']]
      fieldNames = ['name', 'manufacturer', 'model', 'intranetIp', 'ip', 'cport', 'username', 'password', 'defenseicount', 'defenseocount']
      tableHeaderXlsx = '报警主机'
    } else if (ctx.query.bigtype === '5') {
      data = [['设备名称', '设备厂商', '设备类型', '设备型号', 'IP地址', '数据端口', '用户名', '密码', '解码通道数量', '音频通道数量', '报警输入通道', '报警输出通道  ']]
      fieldNames = ['name', 'manufacturer', 'type', 'model', 'ip', 'cport', 'username', 'password', 'decodecount', 'voicecount', 'defenseicount', 'defenseocount']
      tableHeaderXlsx = '解码器'
    } else if (ctx.query.bigtype === '7') {
      data = [['设备名称', '设备厂商', '设备型号', '内网地址', '主机地址', '数据端口', '用户名', '密码']]
      fieldNames = ['name', 'manufacturer', 'model', 'intranetIp', 'ip', 'cport', 'username', 'password']
      tableHeaderXlsx = '消防主机'
    } else if (ctx.query.bigtype === '9') {
      data = [['设备名称', '设备厂商', '主机地址', '数据端口', '输入通道数量']]
      fieldNames = ['name', 'manufacturer', 'ip', 'cport', 'jointinputcount']
      tableHeaderXlsx = '拼接控制器'
    } else if (ctx.query.bigtype === '6') {
      data = [['设备名称', '设备厂商', '型号', '主机地址', '数据端口']]
      fieldNames = ['name', 'manufacturer', 'model', 'ip', 'cport']
      tableHeaderXlsx = '网络键盘'
    }
    // const devMapping = ['视频设备', '报警主机', '门禁设备', 'ip对讲', '巡更设备', '解码器', '网络键盘', '消防主机']
    const devices = await Device.find({ oid: { $in: allChildrenIds }, bigtype: ctx.query.bigtype }, fieldNames.join(' ')).exec()
    // 将设备信息Push到sheet
    devices.forEach(item => {
      let arr = []
      fieldNames.forEach(val => {
        arr.push(item[val])
      })
      data.push(arr)
    })
    // 设置列样式
    const ColInfos = [
      { width: 15 },
      {},
      {},
      {},
      {},
      { width: 15 },
      {},
      {},
      {},
      {},
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ]
    const option = { '!cols': ColInfos }
    const buffer = xlsx.build([{ name: tableHeaderXlsx, data }], option)
    ctx.type = 'application/vnd.openxmlformats'
    const timeStr = new Date().toLocaleString().replace(/[-: ]/g, '')
    ctx.attachment(orgName.name + '-' + tableHeaderXlsx + '-' + timeStr + '.xlsx'.toString('utf8'))
    ctx.body = buffer
  } catch (error) {
    handleSysException(error)
  }
}
// 按通道号排序
function sort(arr, cond) {
  let temp
  const length = arr ? arr.length : 0
  for (let i = 0; i < length; i++) {
    for (let j = i; j < length - 1; j++) {
      if (arr[i][cond] > arr[j + 1][cond]) {
        temp = arr[i]
        arr[i] = arr[j + 1]
        arr[j + 1] = temp
      }
    }
  }
  return arr
}
exports.refreshResource = async ctx => {
  try {
    const device = await Device.findById(ctx.params.id)
      .lean()
      .exec()
    const data = {
      devInfo: {
        devIp: device.ip,
        devPort: device.cport
      }
    }
    const remoteRes = (await getDevConf({ data, ctx })).ChanCfgPrmArr
    const reses = await Resource.find({ eid: ctx.params.id, type: 0 }).exec()
    let flag = false
    for (var res of reses) {
      remoteRes.forEach(item => {
        if (+item.channel === +res.chan) {
          if (item.devIp) {
            res.ip = item.devIp
            flag = true
          }
        }
      })
      if (flag) {
        // const id = res._id
        // delete res._id
        // await Resource.findByIdAndUpdate(id, res)
        await res.save()
      }
    }
    ctx.status = 200
  } catch (error) {
    handleSysException(error)
  }
}
exports.getDeviceBySeries = async ctx => {
  try {
    const devices = await Device.find({ series: ctx.query.series }, '_id')
      .lean()
      .exec()
    const devIds = devices.map(dev => dev._id)
    const resources = await Resource.find({ eid: { $in: devIds } }, 'name')
    ctx.body = resources
  } catch (error) {
    handleSysException(error)
  }
}
