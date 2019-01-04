/*
 * @Author: zhangminbo
 * @Date: 2018-06-05 14:24:14
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-12-20 17:54:49
 */
const events = require('events')
const eventEmitter = new events.EventEmitter()
const mongoose = require('mongoose')
const VeriGroup = mongoose.model('VeriGroup')
const FaceServer = mongoose.model('FaceServer')
const FaceParameter = mongoose.model('FaceParameter')
const DefenseTask = mongoose.model('DefenseTask')
const WebSocket = require('ws')
const postal = require('postal')
eventEmitter.setMaxListeners(30)
const queryString = require('querystring')
const _ = require('lodash')
const moment = require('moment')
const config = require('../../../config').backend
// wsObjs 全局对象
const wsObjs = {}
let _res = []

const getFaceWsUrl = async (reses) => {
  try {
    const now = moment().unix()
    const [faceParameter, defenseTasks, passerGroup] = await Promise.all([
      FaceParameter.findOne().lean(),
      DefenseTask.find().lean(),
      VeriGroup.findOne({ name: '路人库' })
    ])
    const cameraCfg = config.veriface.cameraCfg
    const defaultCameraCfg = {
      threshold: `${cameraCfg.roll},${cameraCfg.yaw},${cameraCfg.pitch},${cameraCfg.ambiguity}`,
      facemin: cameraCfg.pixel,
      interval: cameraCfg.interval,
      group: passerGroup._id + ''
    }
    reses.forEach(res => {
      const query = {
        analyze: true,
        crop: faceParameter ? faceParameter.pattern : 'face',
        url: res.rtsp[res.stream].replace('ip', res.rtspIp).replace('port', '554').replace(/\'/g, '')
      }
      if (defenseTasks && defenseTasks.length) {
        for (const task of defenseTasks) {
          if (task.vaild) {
            if (task.always || (now >= task.startTime && now <= task.endTime)) {
              if (task.points.map(item => item + '').includes(res._id + '')) {
                query.threshold = `${task.cameraCfg.roll},${task.cameraCfg.yaw},${task.cameraCfg.pitch},${task.cameraCfg.ambiguity}`
                query.group = task.groups ? task.groups.map(item => item + '').join(',') : passerGroup._id + ''
                query.facemin = task.cameraCfg.pixel
                query.interval = task.cameraCfg.interval
                break
              } else {
                _.merge(query, defaultCameraCfg)
              }
            } else {
              _.merge(query, defaultCameraCfg)
            }
          } else {
            _.merge(query, defaultCameraCfg)
          }
        }
      } else {
        _.merge(query, defaultCameraCfg)
      }
      faceParameter && faceParameter.passby && (query.record = passerGroup._id + '')

      res.verifaceUrl = `${res.serverUrl}/video?${queryString.stringify(query)}` // eslint-disable-line
    })
  } catch (error) {
    console.log(error)
  }
}

const reset = async () => {
  const faceServers = await FaceServer.find().populate({ path: 'res' }).lean().exec()
  const reses = []
  faceServers.forEach(n => {
    n.res.forEach(m => {
      if (m.rtsp[m.stream]) {
        const tmp = _.clone(m)
        tmp.serverUrl = `ws://${n.ip}:${n.port}`
        tmp.rtspIp = n.rtspIp
        reses.push(tmp)
      }
    })
  })
  await getFaceWsUrl(reses)
  _res = reses
  for (let res of _res) {
    initWs(res)
  }
}
// 初始化单个ws
const initWs = (res) => {
  const resObj = wsObjs[res._id + ''] || {}
  try {
    resObj.ws = new WebSocket(res.verifaceUrl || '')
    resObj.ws.on('message', async function (data) {
      console.log(res._id + ' 收到数据')
      const host = resObj.ws.url.substr(5, 18).split(':')
      const hostObj = {
        ip: host[0],
        port: host[1]
      }
      eventEmitter.emit('veriFaceData', await require('./identify/veriface.controller').add(data, res, hostObj))
    })
    resObj.ws.on('open', function () {
      console.log(res._id + ' open')
      eventEmitter.emit('veriFaceData', res._id + '连接成功')
      resObj.status = true
    })
    resObj.ws.on('error', function (error) {
      console.warn('SDKsocketErr:', error.message)
      resObj.status = false
    })
    resObj.ws.on('close', function () {
      resObj.status = false
      console.log('SDKsocket:', ' close')
    })
    wsObjs[res._id + ''] = resObj
  } catch (error) {
    console.warn('SDKsocketErr:', error.message)
  }
}
postal.subscribe({
  channel: 'websocket',
  topic: 'ws.update',
  callback: async function (data) {
    await updateWsObj({ resIds: data.resIds, type: data.type })
  }
})
postal.subscribe({
  channel: 'resources',
  topic: 'array.delete',
  callback: async function (data) {
    await updateWsObj({ resIds: data.ids, type: 'update' })
  }
})
postal.subscribe({
  channel: 'resources',
  topic: 'resource.unbind',
  callback: async function (data) {
    if (data.type * 1 === 6) {
      await updateWsObj({ resIds: data.ids, type: 'update' })
    }
  }
})

const updateWsObj = async (data) => {
  const faceServers = await FaceServer.find().populate({ path: 'res' }).lean().exec()
  const reses = []
  faceServers.forEach(n => {
    n.res.forEach(m => {
      if (data.resIds && data.type !== 'all') {
        if (data.resIds.includes(m + '')) {
          if (m.rtsp[m.stream]) {
            const tmp = _.clone(m + '')
            tmp.serverUrl = `ws://${n.ip}:${n.port}`
            tmp.rtspIp = n.rtspIp
            reses.push(tmp)
          }
        }
      } else {
        const tmp = _.clone(m)
        reses.push(tmp)
      }
    })
  })
  if (data.type === 'add') {
    await getFaceWsUrl(reses)
    for (let res of reses) {
      initWs(res)
    }
    _res = [..._res, ...reses]
  }
  if (data.type === 'update') {
    for (let res of data.resIds) {
      if (wsObjs[res + '']) {
        wsObjs[res + ''].ws.close()
        delete wsObjs[res + '']
      }
    }
    await getFaceWsUrl(reses)
    for (let res of reses) {
      initWs(res)
    }
  }
  if (data.type === 'all') {
    for (let res of _res) {
      if (wsObjs[res._id + '']) {
        wsObjs[res._id + ''].ws.close()
        delete wsObjs[res._id + '']
      }
    }
    await getFaceWsUrl(reses)
    for (let res of reses) {
      initWs(res)
    }
  }
}
const sendMessage = (socket) => {
  socket.on('connection', function (ws) {
    eventEmitter.on('veriFaceData', function (data) {
      ws.emit('veriface', data)
    })
    eventEmitter.on('verifaceToday', function (data) {
      ws.emit('verifaceToday', data)
    })
  }
  )
  socket.on('message', function (ws) {
    eventEmitter.on('veriFaceData', function (data) {
      ws.emit('veriface', data)
    })
  }
  )
}
module.exports = class Wsocket {
  constructor(socket) {
    console.log('initd veriface socketd')
    sendMessage(socket) // 初始化websocket(已经监听连接成功的)
    // 初始化全部ws
    const that = this
    // firstBlood
    reset()
    // 每30秒钟 检查下全部ws异常重连
    setInterval(function () {
      that.reconnect()
    }, 30000)
  }
  reconnect() {
    for (let ws in wsObjs) {
      if (!wsObjs[ws].status) {
        initWs(_res.filter(res => res._id + '' === ws).pop())
      }
    }
  }
  removeResById(id) {
    _res = _res.filter(n => n._id + '' !== id)
  }
  static reset() {
    return reset()
  }
  static sendMsg(event, data) {
    eventEmitter.emit(event, data)
  }
}
