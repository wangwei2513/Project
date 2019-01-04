/*
 * 区域统计接口
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:46:26
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-10-29 17:12:28
 */

'use strict'
const Grid = require('mongoose').model('Grid')
const Org = require('mongoose').model('Org')
const Resource = require('mongoose').model('Resource')
const Building = require('mongoose').model('Building')
const Storey = require('mongoose').model('Storey')
const { handleSysException } = require('../../../common/tools')
const PatrolPoint = require('mongoose').model('PatrolPoint')
const jsts = require('jsts')
const _ = require('lodash')

// 获取地图应用模式下的左侧区域树
exports.getTree = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('地图管理-获取地图应用模式下的左侧区域树'))
    // let arr = await Grid.find({ mapId: ctx.query.mapId }, '_id name bids').populate({
    //   path: 'bids',
    //   select: '_id name sids',
    //   populate: {
    //     path: 'sids',
    //     select: '_id name'
    //   }
    // }).exec()
    // let buildings = await Building.find({ gid: { $exists: false }, mapId: ctx.query.mapId }, '_id name sids').populate({
    //   path: 'sids',
    //   select: '_id name'
    // })
    // buildings = buildings.map(item => {
    //   item = item.toObject()
    //   item.type = 'building'
    //   item.sids = item.sids.map(item => {
    //     item.type = 'storey'
    //     return item
    //   })
    //   return item
    // })
    // arr = arr.map(item => {
    //   item = item.toObject()
    //   item.type = 'grid'
    //   item.bids = item.bids.map(item => {
    //     item.type = 'building'
    //     item.sids = item.sids.map(item => {
    //       item.type = 'storey'
    //       return item
    //     })
    //     return item
    //   })
    //   return item
    // })
    // arr = [...arr, ...buildings]
    // const root = await Org.findOne({ isroot: true, type: 0 }).exec()
    // const result = {
    //   _id: root._id || '1',
    //   name: root.name || '根节点',
    //   children: JSON.parse(JSON.stringify(arr).replace(/bids/g, 'children').replace(/sids/g, 'children'))
    // }
    // ctx.body = result
    // 获取所有网格
    const grids = await Grid.find({ mapId: ctx.query.mapId }, '_id name').lean().exec()
    // 获取所有楼层
    let buildings = await Building.find({ mapId: ctx.query.mapId }, '_id code name gid').lean().exec()
    buildings = buildings.map(item => {
      item.type = 'building'
      return item
    })
    const bids = buildings.map(build => build._id)
    // 获取楼宇
    let stroeys = await Storey.find({ bid: { $in: bids } }, 'name bid').lean().exec()
    stroeys = stroeys.map(storey => {
      storey.type = 'storey'
      return storey
    })
    const stroeyMapping = {}
    stroeys.forEach(storey => {
      !stroeyMapping[storey.bid + ''] && (stroeyMapping[storey.bid + ''] = [])
      stroeyMapping[storey.bid + ''] = [...stroeyMapping[storey.bid + ''], storey]
    })
    const buildingMapping = {}
    const outBuildings = []
    buildings.forEach(building => {
      building.children = stroeyMapping[building._id + '']
      if (building.gid) {
        !buildingMapping[building.gid + ''] && (buildingMapping[building.gid + ''] = [])
        buildingMapping[building.gid + ''] = [...buildingMapping[building.gid + ''], building]
      } else {
        outBuildings.push(building)
      }
    })
    grids.forEach(grid => {
      grid.type = 'grid'
      grid.children = buildingMapping[grid._id + ''] || []
    })
    const root = await Org.findOne({ isroot: true, type: 0 }).exec()
    const result = {
      _id: root._id || '1',
      name: root.name || '根节点',
      children: [...grids, ...outBuildings]
    }
    ctx.body = result
  } catch (err) {
    handleSysException(err)
  }
}

// // 统计
// exports.statistic = async ctx => {
//   try {
//     ctx.set('loginfo', encodeURI('地图管理-统计'))
//     const loc = _.chunk(ctx.query.loc.split(','), 2)
//     const buildings = await Building.find({
//       loc: {
//         $geoIntersects: {
//           $geometry: {
//             type: 'Polygon',
//             coordinates: [loc]
//           }
//         }
//       }
//     }).exec()
//     const resources = await Resource.find({
//       'point.loc': {
//         $geoWithin: {
//           $geometry: {
//             type: 'Polygon',
//             coordinates: [loc]
//           }
//         }
//       },
//       'point.isouter': true
//     }, 'status point.name').exec()
//     let online = 0
//     let offline = 0
//     resources.forEach(item => {
//       parseInt(item.status) === 1 ? online++ : offline++
//     })
//     ctx.body = {
//       camera: {           // 资源点位树
//         online: online,
//         offline: offline
//       },
//       building: buildings.length     // 楼宇数量
//     }
//   } catch (err) {
//     return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 4001, message: '系统内部错误' })
//   }
// }
// 统计
exports.statistic = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('地图管理-统计'))
    const reader = new jsts.io.WKTReader()
    const geo = reader.read(ctx.request.body.wkt)
    const resources = await Resource.find({ point: { $nin: [null, undefined] } }).lean().exec()
    const buildings = await Building.find({}, 'loc center').lean().exec()
    const grids = await Grid.find({}, 'loc center').lean().exec()
    let online = 0
    let offline = 0
    let buildLength = 0
    let gridLength = 0
    for (var item of resources) {
      if (_.isEmpty(item.point)) { continue }
      const pointArr = item.point.loc.split(',')
      let pointStr
      if (pointArr && pointArr.length) { pointStr = pointArr[0] + ' ' + pointArr[1] }
      const point = reader.read(`POINT (${pointStr})`)
      const geometry = geo.contains(point)
      if (geometry) {
        parseInt(item.status) === 1 ? online++ : offline++
      }
    }
    buildings.forEach(item => {
      const pointArr = item.center.split(',')
      let pointStr
      if (pointArr && pointArr.length) { pointStr = pointArr[0] + ' ' + pointArr[1] }
      const point = reader.read(`POINT (${pointStr})`)
      const geometry = geo.contains(point)
      if (geometry) {
        buildLength++
      }
    })
    grids.forEach(item => {
      const pointArr = item.center.split(',')
      let pointStr
      if (pointArr && pointArr.length) { pointStr = pointArr[0] + ' ' + pointArr[1] }
      const point = reader.read(`POINT (${pointStr})`)
      const geometry = geo.contains(point)
      if (geometry) {
        gridLength++
      }
    })
    ctx.body = {
      camera: { // 资源点位树
        online: online,
        offline: offline
      },
      grid: gridLength,
      building: buildLength // 楼宇数量
    }
  } catch (err) {
    handleSysException(err)
  }
}
exports.getAllResourceNum = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('地图管理-统计'))
    const mapId = ctx.query.mapId
    const resources = await Resource.find({ 'point.mapId': mapId }).exec()
    const buildLength = await Building.countDocuments({ mapId }).exec()
    const gridLength = await Grid.countDocuments({ mapId }).exec()
    let fireOnline = 0
    let fireOffline = 0
    let ipcOnline = 0
    let ipcOffline = 0
    for (var item of resources) {
      if (_.isEmpty(item.point)) { continue }
      if (parseInt(item.status) === 1 && (parseInt(item.type) === 0 || parseInt(item.type) === 1)) { ipcOnline++ }
      if (parseInt(item.status) === 0 && (parseInt(item.type) === 0 || parseInt(item.type) === 1)) { ipcOffline++ }
      if (parseInt(item.status) === 1 && parseInt(item.type) === 11) { fireOnline++ }
      if (parseInt(item.status) === 0 && parseInt(item.type) === 11) { fireOffline++ }
    }
    ctx.body = {
      ipc: { // 视频点位点位
        ipcOnline,
        ipcOffline
      },
      fireAlarm: {
        fireOnline,
        fireOffline
      },
      building: buildLength, // 楼宇数量
      grid: gridLength // 网格数量
    }
  } catch (err) {
    handleSysException(err)
  }
}
exports.getAllResource = async ctx => {
  try {
    const limit = ctx.query.limit || 5
    const mapId = ctx.query.mapId
    const [gridsNum, buildingsNum, ipcsNum, firesNum, patrolNum] = await Promise.all([
      Grid.countDocuments({ mapId }).exec(),
      Building.countDocuments({ mapId }).exec(),
      Resource.countDocuments({ 'point.mapId': mapId, type: { $in: [0, 1] } }).exec(),
      Resource.countDocuments({ 'point.mapId': mapId, type: { $in: 11 } }).exec(),
      PatrolPoint.countDocuments({ 'point.mapid': mapId }).exec()
    ])
    const gridRan = Math.ceil(Math.random() * gridsNum)
    const gridSkip = gridRan >= limit ? gridRan - limit : 0
    const buildingRan = Math.ceil(Math.random() * buildingsNum)
    const buildingSkip = buildingRan >= limit ? buildingRan - limit : 0
    const ipcRan = Math.ceil(Math.random() * ipcsNum)
    const ipcSkip = ipcRan >= limit ? ipcRan - limit : 0
    const fireRan = Math.ceil(Math.random() * firesNum)
    const fireSkip = fireRan >= limit ? fireRan - limit : 0
    const patrolRan = Math.ceil(Math.random() * patrolNum)
    const patrolSkip = patrolRan >= limit ? patrolRan - limit : 0
    const [grids, buildings, ipcs, fires, patrols] = await Promise.all([
      Grid.find({ mapId }).skip(+gridSkip).limit(+limit).exec(),
      Building.find({ mapId }).skip((+buildingSkip) * (+limit)).limit(+limit).exec(),
      Resource.find({ 'point.mapId': mapId, type: { $in: [0, 1] } }, 'chan name monitortype status eid alarmintype alarmtemplate maxdelaytime minintervaltime mapsign alarmaffirm point').skip((+ipcSkip) * (+limit)).limit(+limit).exec(),
      Resource.find({ 'point.mapId': mapId, type: { $in: 11 } }, 'chan name monitortype status eid alarmintype alarmtemplate maxdelaytime minintervaltime mapsign alarmaffirm point').skip((+fireSkip) * (+limit)).limit(+limit).exec(),
      PatrolPoint.find({ 'point.mapid': mapId }).skip((+patrolSkip) * (+limit)).limit(+limit).exec()
    ])
    ctx.body = {
      grids,
      buildings,
      ipcs,
      fires,
      patrols
    }
  } catch (err) {
    handleSysException(err)
  }
}
