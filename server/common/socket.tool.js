/**
 * websocket 信息转发
 */
const faceSocket = require('../api/face/service/face.socket')
const vehiclesocket = require('../api/vehicle/identify/vehiclesocket')
const patrolSocket = require('../api/patrol/patrol.socket')
// const devOnline = require('../api/map/point/point.socket')

module.exports = async (socket, io) => {
  faceSocket.init(socket, io)
  vehiclesocket.init(socket, io)
  patrolSocket.init(socket, io)
  // setInterval(async function () {
  //   await devOnline(socket, io)
  // }, 10000)
  // emitDevStatus(socket, io)
}
// emit dev status
// async function emitDevStatus(socket, io) {
//   setTimeout(async function () {
//     await devOnline(socket, io)
//     emitDevStatu1s(socket, io)
//   }, 10000)
// }
