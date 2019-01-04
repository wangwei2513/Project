/**
 * Socket.io configuration
 */

'use strict'
let io = null

// var socketioJwt = require('socketio-jwt')
// var config = require('../../config').backend

// When the user disconnects.. perform this
// function onDisconnect(socket) { }

// When the user connects.. perform this
function onConnect (socket) {
  // When the client emits 'info', this listens and executes
  socket.on('info', function (data) {
    console.info('[%s] %s', socket.address, JSON.stringify(data, null, 2))
  })

  socket.on('client:hello', function (data) {
    console.info('Received from client: %s', data)
    socket.emit('server:hello', 'server hello')
  })
  require('../common/socket.tool.js')(socket, io)
}
const Wsocket = require('../api/veriface/veriface.socket')
module.exports = function (socketio) {
  io = socketio
  Wsocket.instance = new Wsocket(socketio)
  socketio.on('connection', function (socket) {
    console.log('socket_id==%s', socket.id)
    // Call onConnect.
    onConnect(socket)
    // console.info('[%s] CONNECTED', socket.address)
  }).on('unauthorized', function (error) {
    console.log(error)
    if (error.data.type === 'UnauthorizedError' || error.data.code === 'invalid_token') {
      // redirect user to login page perhaps?
      console.log("User's token has expired")
    }
  })
}
// module.exports = function (socketio) {
//   socketio.sockets.on('connection', socketioJwt.authorize({
//     secret: config.secrets.session,
//     timeout: 15000 // 15 seconds to send the authentication message
//   })).on('authenticated', function (socket) {
//     console.log(socket.decoded_token)
//     // this socket is authenticated, we are good to handle more events from it.
//     socket.address = socket.handshake.address ||
//       socket.handshake.headers.host || process.env.DOMAIN
//     socket.connectedAt = new Date()
//     // Call onDisconnect.
//     socket.on('disconnect', function () {
//       onDisconnect(socket)
//       console.info('[%s] DISCONNECTED', socket.address)
//     })

//     // Call onConnect.
//     onConnect(socket)
//     console.info('[%s] CONNECTED', socket.address)
//   }).on('unauthorized', function (error) {
//     console.log(error)
//     if (error.data.type === 'UnauthorizedError' || error.data.code === 'invalid_token') {
//       // redirect user to login page perhaps?
//       console.log("User's token has expired")
//     }
//   })
// }
