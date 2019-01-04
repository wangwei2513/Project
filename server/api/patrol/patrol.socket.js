/**
 * 巡更socket推送接口
 * @time:2018-3-21
 * @author: hansen
 */
const _ = require('lodash')
const controller = require('./patrol.controller')
let socketIo = null
const appUserSet = []
const pcUserSet = []

// 保存io对象
const init = (socket, io) => {
  if (socketIo === null) {
    socketIo = io
  }
  // 巡更APP用户socket注册
  socket.on('client:sentry', function (data) {
    if (!_.find(appUserSet, item => item.usrid === data.usrid)) {
      appUserSet.push(_.assign(data, { sid: socket.id }))
    }
    controller.updDevStatus(data, 'online')
    io.sockets.emit('patrol:sentry.status', { userid: data.usrid, status: 'online' })
  })
  // PC电子地图即时通讯socket人员注册
  socket.on('patrol:instant.message', function (data) {
    if (!_.find(pcUserSet, item => item.usrid === data.usrid)) {
      pcUserSet.push(_.assign(data, { sid: socket.id }))
    }
  })
  socket.on('disconnect', function () {
    const app = _.find(appUserSet, item => item.sid === socket.id)
    _.remove(pcUserSet, item => item.sid === socket.id)
    if (!app) {
      return
    }
    controller.updDevStatus(app, 'offline')
    io.sockets.emit('patrol:sentry.status', { userid: app.usrid, status: 'offline' })
    _.remove(appUserSet, item => item.sid === socket.id)
  })
}

// 巡更报警
const patrolAlarm = data => {
  if (socketIo) {
    socketIo.sockets.emit('server:patrol.alarm', data)
  }
}

// 巡更状态通知
const patrolStatus = data => {
  if (socketIo) {
    socketIo.sockets.emit('server:patrol.status', data)
  }
}

// 单兵消息采集
const sentryMessage = data => {
  if (socketIo) {
    socketIo.sockets.emit('server:sentry.message', data)
  }
}

// 中心消息推送单兵
const patrolMessage = data => {
  if (socketIo) {
    socketIo.sockets.emit('server:patrol.message', data)
  }
}

// 单兵消息推送中心
const instantMessage = data => {
  if (socketIo) {
    let receiver = ''
    if (data.source === 'app') {
      receiver = pcUserSet.find(item => item.usrid === data.receiver)
    } else {
      receiver = appUserSet.find(item => item.usrid === data.receiver)
    }
    if (receiver) {
      socketIo.sockets.sockets[receiver.sid].emit('server:instant.message', data)
    }
  }
}

// 单兵巡更确认
const patrolConfirm = data => {
  if (socketIo) {
    socketIo.sockets.emit('server:patrol.confirm', data)
  }
}

// 单兵在线用户
const patrolUser = data => {
  if (socketIo) {
    socketIo.sockets.emit('server:patrol.user', data)
  }
}
// 单兵报警
const sentryAlarm = data => {
  if (socketIo) {
    socketIo.sockets.emit('server:sentry.alarm', data)
  }
}
// 单兵实时位置
const sentryLocation = data => {
  if (socketIo) {
    socketIo.sockets.emit('server:sentry.location', data)
  }
}
// 巡更app实时视频推流、关流
const patrolRtmp = data => {
  if (socketIo) {
    const usr = appUserSet.find(item => item.usrid === data.id)
    if (usr) {
      socketIo.sockets.sockets[usr.sid].emit('app:rtmp', data)
    }
  }
}
module.exports = {
  init,
  patrolAlarm,
  sentryMessage,
  patrolMessage,
  patrolUser,
  sentryAlarm,
  patrolRtmp,
  sentryLocation,
  patrolConfirm,
  patrolStatus,
  instantMessage
}
