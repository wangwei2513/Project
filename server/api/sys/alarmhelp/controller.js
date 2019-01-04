'use strict'
const AHC = require('mongoose').model('alarmHelpConf')
const AR = require('mongoose').model('alarmReceive')
const AC = require('mongoose').model('alarmClient')
const Device = require('mongoose').model('Device')
const Resource = require('mongoose').model('Resource')
const Storage = require('mongoose').model('Storage')
const Org = require('mongoose').model('Org')
const postal = require('postal')
const paging = require('../../paging')

exports.getServer = async (ctx) => {
  try {
    const data = await AHC.findOne().populate({ path: 'device', select: 'name username password ip cport adapterPort adapterIp' }).exec()
    ctx.body = data
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.putServer = async (ctx) => {
  ctx.set('loginfo', encodeURI('报警求助-修改服务配置'))
  try {
    const postData = ctx.request.body
    postData.type = 'talkServer'
    postData.manufacturer = 'shibang'
    const checkData = await AHC.findOne().populate({
      path: 'device',
      select: 'name username password ip cport adapterIp adapterPort'
    }).exec()
    if (checkData) {
      const newDevice = await Device.update({ _id: checkData.device._id + '' }, postData, { upsert: true })
      // 发布通知
      devPut(ctx, [
        {
          before: {
            devIp: postData.ip + '',
            devPort: +postData.cport
          },
          after: {
            devIp: newDevice.ip + '',
            devPort: +newDevice.cport
          }
        }
      ])
    } else {
      const deviceData = await Device.create(postData)
      await AHC.create({ device: deviceData._id + '' })
    }
    ctx.status = 200
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.getReceive = async (ctx) => {
  try {
    const search = ctx.query.search
    if (search.name) {
      var reg = new RegExp(decodeURIComponent(ctx.query.search.name))
      search.name = reg
    }
    const results = await paging.listQuery(AR, ctx.query.search, '', { _id: -1 }, ctx.query.page, {
      path: 'alarmHostId',
      select: 'ip username cport password'
    }, ctx)
    ctx.body = results.results
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.postReceive = async (ctx) => {
  ctx.set('loginfo', encodeURI('报警求助-新增接警'))
  try {
    const postData = ctx.request.body
    // 校验talkId/Ip 唯一性
    const checkData = await checkUniqueData(AR, postData)
    if (Object.keys(checkData).length) {
      ctx.status = 505
      ctx.body = checkData
      return
    }

    const name = postData.name
    const talkIp = postData.talkIp
    const talkId = postData.talkId
    delete postData.name
    delete postData.talkIp
    delete postData.talkIp
    postData.type = 'alarmHost'
    postData.manufacturer = 'bstar'
    const device = await Device.create(postData)
    await Resource.create([{
      eid: device._id + '',
      type: 10,
      chan: 1,
      name: '警笛'
    }, {
      eid: device._id + '',
      type: 10,
      chan: 2,
      name: '警铃'
    }])
    const data = await AR.create({
      name: name,
      alarmHostId: device._id + '',
      talkIp: talkIp,
      talkId: talkId
    })
    devPost(ctx, [
      {
        devIp: device.ip + '',
        devPort: +device.cport
      }
    ])

    ctx.body = data
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.putReceive = async (ctx) => {
  ctx.set('loginfo', encodeURI('报警求助-修改接警'))
  try {
    const id = ctx.params.id
    const postData = ctx.request.body
    // 校验talkId/Ip 唯一性
    const checkData = await checkUniqueData(AR, postData, id)
    if (Object.keys(checkData).length) {
      ctx.status = 505
      ctx.body = checkData
      return
    }
    const arData = {}
    if (postData.name) {
      arData.name = postData.name
      delete postData.name
    }
    if (postData.talkId) {
      arData.talkId = postData.talkId
      delete postData.talkId
    }
    if (postData.talkIp) {
      arData.talkIp = postData.talkIp
      delete postData.talkIp
    }
    const one = await AR.findByIdAndUpdate(id, arData)
    const oldData = await Device.findByIdAndUpdate(one.alarmHostId + '', postData)

    // 发布通知
    devPut(ctx, [
      {
        before: {
          devIp: oldData.ip + '',
          devPort: +oldData.cport
        },
        after: {
          devIp: postData.ip + '' || oldData.ip + '',
          devPort: +postData.cport || +oldData.cport
        }
      }
    ])

    ctx.status = 200
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}

exports.delReceive = async (ctx) => {
  ctx.set('loginfo', encodeURI('报警求助-删除接警'))
  const ids = ctx.request.header['x-bsc-ids'].split(',') || []
  try {
    for (let i = 0; i < ids.length; i++) {
      const data = await AR.findByIdAndRemove(ids[i])
      const device = await Device.findByIdAndRemove(data.alarmHostId)
      // 设备更新通知
      devPut(ctx, [
        {
          before: {
            devIp: device.ip + '',
            devPort: +device.cport
          },
          after: {
          }
        }
      ])
      const res = Resource.find({ eid: data.alarmHostId }).exec()
      await Resource.deleteMany({ eid: data.alarmHostId })
      resDel(ctx, res.map(n => n._id))
    }

    ctx.status = 200
  } catch (error) {
    return ctx.throw(500, { code: 2101, message: error.message })
  }
}
exports.getClient = async (ctx) => {
  try {
    const search = ctx.query.search
    if (search.name) {
      var reg = new RegExp(decodeURIComponent(ctx.query.search.name))
      search.name = reg
    }
    const results = await paging.listQuery(AC, ctx.query.search, '', { _id: -1 }, ctx.query.page,
      { path: 'camerDevId', select: 'cport dport ip password username type' }, ctx)
    const devIds = []
    const resIds = []
    const resDev = {}
    const devResType = {}
    const devStor = {}
    results.results.map(n => {
      devIds.push(n.camerDevId._id)
    })
    const resDatas = await Resource.find({ eid: { $in: devIds } }).exec()
    resDatas.map(n => {
      resDev[n._id] = n.eid
      devResType[n.eid] = n.type
      resIds.push(n._id)
    })
    const storageDatas = await Storage.find({ resource: { $in: resIds } }).exec()
    storageDatas.map(n => {
      devStor[resDev[n.resource]] = n
    })
    const datas = JSON.parse(JSON.stringify(results.results))
    datas.map(n => {
      const stor = devStor[n.camerDevId._id]
      n.type = devResType[n.camerDevId._id]
      if (stor) {
        n.storeServer = stor.server
        n.storePath = stor.path
      }
    })
    ctx.body = datas
  } catch (error) {
    console.log(error.message)
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.postClient = async (ctx) => {
  ctx.set('loginfo', encodeURI('报警求助-新增报警终端'))
  try {
    const postData = ctx.request.body
    // 校验talkId/Ip 唯一性
    const checkData = await checkUniqueData(AC, postData)
    if (Object.keys(checkData).length) {
      ctx.status = 505
      ctx.body = checkData
      return
    }

    const name = postData.name
    const talkIp = postData.talkIp
    const talkId = postData.talkId
    const storePath = postData.storePath
    const storeServer = postData.storeServer
    const devType = postData.deviceType
    delete postData.name
    delete postData.talkIp
    delete postData.talkId
    delete postData.storePath
    delete postData.storeServer
    delete postData.deviceType
    const ahc = await AHC.findOne().exec()
    if (!ahc) {
      return ctx.throw(500, { code: 1001, message: '请先创建服务器配置!' })
    }
    postData.manufacturer = 'bstar'
    const { _id: rootId } = await Org.findOne({ type: 0, isroot: true }, '_id').lean().exec()
    const device = await Device.create(Object.assign(postData, { name, type: devType, oid: rootId }))
    devPost(ctx, [
      {
        devIp: device.ip + '',
        devPort: +device.cport
      }
    ])
    const res = await Resource.create({
      eid: device._id + '',
      type: 0,
      port: postData.cport,
      ip: postData.ip,
      name: devType === 'alarmBox' ? '报警箱_' + name : '报警柱_' + name
    })
    // 添加存储路径
    await Storage.create({
      server: storeServer,
      path: storePath,
      resource: res._id + ''
    })

    const data = await AC.create({
      name: name,
      camerDevId: device._id + '',
      serverDevId: ahc.device,
      talkIp: talkIp,
      talkId: talkId,
      deviceType: devType
    })
    ctx.body = data
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}
exports.putClient = async (ctx) => {
  ctx.set('loginfo', encodeURI('报警求助-修改报警终端'))
  try {
    const id = ctx.params.id
    const postData = ctx.request.body
    // 校验talkId/Ip 唯一性
    const checkData = await checkUniqueData(AC, postData, id)
    if (Object.keys(checkData).length) {
      ctx.status = 505
      ctx.body = checkData
      return
    }

    const acData = {} // 报警终端
    const storeData = {} // 存储路径
    if (postData.name) {
      acData.name = postData.name
      delete postData.name
    }
    if (postData.talkId) {
      acData.talkId = postData.talkId
      delete postData.talkId
    }
    if (postData.talkIp) {
      acData.talkIp = postData.talkIp
      delete postData.talkIp
    }
    if (postData.actionloc) {
      acData.actionloc = postData.actionloc
      delete postData.actionloc
    }
    if (postData.actionOutCtl) {
      acData.actionOutCtl = postData.actionOutCtl
      delete postData.actionOutCtl
    }
    if (postData.actionVideo) {
      acData.actionVideo = postData.actionVideo
      delete postData.actionVideo
    }
    if (postData.ip) {
      acData.ip = postData.ip
    }

    // 存储路径
    if (postData.storeServer) {
      storeData.server = postData.storeServer
    }
    if (postData.storePath) {
      storeData.path = postData.storePath
    }
    const one = await AC.findByIdAndUpdate(id, acData)
    // 更新资源分类(13/14)
    if (postData.type) {
      await Resource.findOneAndUpdate({ eid: one.camerDevId }, { type: postData.type })
      delete postData.type
    }

    const oldData = await Device.findByIdAndUpdate(one.camerDevId, postData)

    // 发布通知(若修改)
    if (acData.actionOutCtl) { // 若是配置发送报警通知
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
    } else {
      // 若是修改资源发送修改资源通知
      devPut(ctx, [
        {
          before: {
            devIp: oldData.ip + '',
            devPort: +oldData.cport
          },
          after: {
            devIp: postData.ip + '' || oldData.ip + '',
            devPort: +postData.cport || +oldData.cport
          }
        }
      ])
    }

    // 更新存储
    if (Object.keys(storeData).length) {
      const res = await Resource.findOne({ eid: one.camerDevId }).exec()
      if (res) {
        await Storage.findOneAndUpdate({ resource: res._id }, storeData)
      }
    }

    ctx.status = 200
  } catch (error) {
    return ctx.throw(500, error.code ? { code: error.code, message: error.message } : { code: 1001, message: '系统内部错误' })
  }
}

exports.delClient = async (ctx) => {
  ctx.set('loginfo', encodeURI('报警求助-删除报警终端'))
  const ids = ctx.request.header['x-bsc-ids'].split(',') || []
  try {
    for (let i = 0; i < ids.length; i++) {
      const data = await AC.findByIdAndRemove(ids[i])
      const device = await Device.findByIdAndRemove(data.camerDevId)
      const resDatas = await Resource.find({ eid: device._id }).exec()
      const res = await Resource.deleteMany({ eid: device._id })
      resDel(ctx, [res._id])
      const resIds = []
      resDatas.forEach(n => {
        resIds.push(n._id + '')
      })
      await Storage.deleteMany({ resource: { $in: resIds } })
    }
    ctx.status = 200
  } catch (error) {
    return ctx.throw(500, { code: 2101, message: error.message })
  }
}

const devPost = (ctx, newData) => {
  postal.publish({
    channel: 'devices',
    topic: 'item.notice',
    data: {
      ctx: ctx,
      data: {
        module: 'dev',
        varyData: [],
        newData: newData
      }
    }
  })
}
const devPut = (ctx, varyData) => {
  postal.publish({
    channel: 'devices',
    topic: 'item.notice',
    data: {
      ctx: ctx,
      data: {
        module: 'dev',
        varyData: varyData,
        newData: []
      }
    }
  })
}
const resDel = (ctx, ids) => {
  postal.publish({
    channel: 'resources',
    topic: 'array.delete',
    data: {
      ctx,
      ids: `ids`
    }
  })
}

const checkUniqueData = async (schema, obj, id) => {
  let checkTalkId = []
  let checkTalkIp = []
  let checkIpCport = []
  const result = {}
  if (obj.talkId) {
    const search = { talkId: obj.talkId }
    id && (search['_id'] = { $ne: id })
    checkTalkId = await schema.find(search).exec()
  }
  if (obj.talkIp) {
    const search = { talkIp: obj.talkIp }
    id && (search['_id'] = { $ne: id })
    checkTalkIp = await schema.find(search).exec()
  }
  if (obj.ip || obj.cport) {
    const dict = {
      alarmClient: 'camerDevId',
      alarmReceive: 'alarmHostId'
    }
    const populateName = dict[schema.modelName]
    const allData = await schema.find().populate({ path: populateName, select: 'ip cport' }).exec()
    if (id) {
      checkIpCport = allData.filter(n =>
        (n[populateName].ip === obj.ip && n[populateName].cport === obj.cport && (n._id + '') !== (id + ''))
      )
    } else {
      checkIpCport = allData.filter(n =>
        (n[populateName].ip === obj.ip && n[populateName].cport === obj.cport)
      )
    }
  }
  checkTalkId.length && (result['talkId'] = true)
  checkTalkIp.length && (result['talkIp'] = true)
  checkIpCport.length && (result['ipCport'] = true)
  return result
}
