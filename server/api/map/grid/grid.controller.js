/*
 * 网格相关接口
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:16:27
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-10-31 09:23:39
 */

'use strict'
const GridModel = require('mongoose').model('Grid')
const BuildingModel = require('mongoose').model('Building')
const ResourceModel = require('mongoose').model('Resource')
const jsts = require('jsts')
const _ = require('lodash')
const tools = require('../../../common/tools')

// 获取所有网格信息
exports.getAll = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('地图管理-获取网格'))
    console.log(ctx.query.page)
    // const grids = await paging.listQuery(GridModel, ctx.query.search, '', '', { page: ctx.query.page, limit: ctx.query.limit }, '', ctx)
    let grids
    let count
    if (ctx.query.gridpage && ctx.query.gridlimit) {
      [count, grids] = await Promise.all([
        GridModel.countDocuments(), ctx.query.gridname ? GridModel.find({
          name: {
            $regex: ctx.query.gridname + '' || ''
          }
        }).skip((+ctx.query.gridpage - 1) * (+ctx.query.gridlimit))
          .limit(+ctx.query.gridlimit).exec() : GridModel.find().skip((+ctx.query.gridpage - 1) * (+ctx.query.gridlimit)).limit(+ctx.query.gridlimit).exec()
      ])
    } else {
      [count, grids] = await Promise.all([
        GridModel.countDocuments(), GridModel.find()
      ])
    }
    // ctx.body = _.isEmpty(grids.results) ? [] : grids.results
    ctx.set({
      'X-BSC-COUNT': count,
      'X-BSC-PAGES': ctx.query.gridlimit ? Math.ceil(count / ctx.query.gridlimit) : 0,
      'X-BSC-CUR': ctx.query.gridpage ? parseInt(ctx.query.gridpage) : 0,
      'X-BSC-LIMIT': ctx.query.gridlimit ? parseInt(ctx.query.gridlimit) : 0
    })
    ctx.body = grids
  } catch (err) {
    tools.handleSysException(err, 4001)
  }
}

// 添加网格
exports.add = async ctx => {
  ctx.set('loginfo', encodeURI('地图管理-添加网格'))
  delete ctx.request.body._id
  // const pids = ctx.request.body.pids
  // let flag = false
  // const nameArr = []
  try {
    const wkt = tools.stringToWkt(ctx.request.body.loc)
    const reader = new jsts.io.WKTReader()
    const geo = reader.read(wkt)
    const bound = geo.getBoundary()
    const point = bound.getCentroid()
    const center = point.getX() + ',' + point.getY()
    const envelope = bound.getEnvelopeInternal()
    const scope = envelope.getMinX() + ',' + envelope.getMinY() + ',' + envelope.getMaxX() + ',' + envelope.getMaxY()
    ctx.request.body.center = center
    ctx.request.body.scope = scope
    // pids.forEach(item => {
    //   nameArr.push(item.name)
    //   if (item.name || item.mobile) {
    //     if (!regex.name.test(item.name) || !(/^[\d-]{1,18}$/.test(item.mobile) && /^(\d+\-?){0,3}\d+$/.test(item.mobile))) flag = true
    //   }
    // })
    // if (flag) {
    //   ctx.throw(500, { code: 4001, message: '参数效验失败' })
    // }
    // const repeatName = [...new Set(nameArr)]
    // if (nameArr.length !== repeatName.length) {
    //   ctx.throw(500, { code: 4001, message: '联系人名称重复' })
    // }
    // const body = _.merge(ctx.request.body, { loc: loc })
    const grid = new GridModel(ctx.request.body)
    const newGrid = await grid.save()
    ctx.body = [newGrid._id]
    ctx.status = 201
  } catch (err) {
    tools.handleSysException(err, 4001)
  }
}

// 获取指定网格信息
exports.getOne = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('地图管理-获取单个网格'))
    const result = await GridModel.findById(ctx.params.id).exec()
    ctx.body = _.isEmpty(result) ? {} : result
  } catch (err) {
    tools.handleSysException(err, 4001)
  }
}

// 修改指定网格
exports.updateOne = async ctx => {
  ctx.set('loginfo', encodeURI('地图管理-修改单个网格'))
  delete ctx.request.body._id
  // const locs = ctx.request.body.loc ? ctx.request.body.loc.split(',') : [] // 新的坐标
  // delete ctx.request.body.loc
  const pids = ctx.request.body.pids
  // let flag = false
  const nameArr = []
  const newPids = []
  pids.forEach((item, index) => {
    if (_.isEmpty(item.name) && _.isEmpty(item.mobile)) {
    } else {
      nameArr.push(item.name)
      newPids.push(item)
    }
    // if (!regex.name.test(item.name) || !(regex.mobile.test(item.mobile) || regex.telephone.test(item.mobile))) flag = true
  })

  const repeatName = [...new Set(nameArr)]
  // if (flag) {
  //   ctx.throw(500, { code: 4001, message: '参数效验失败' })
  // }
  if (nameArr.length !== repeatName.length) {
    ctx.throw(500, { code: 4001, message: '联系人名称重复' })
  }
  ctx.request.body.pids = newPids
  try {
    // const loc = _.chunk(locs, 2)
    // await GridModel.findByIdAndUpdate(ctx.params.id, _.merge(ctx.request.body, _.isEmpty(loc) ? {} : { loc: loc })).exec()
    await GridModel.findByIdAndUpdate(ctx.params.id, ctx.request.body).exec()
    ctx.status = 200
  } catch (err) {
    tools.handleSysException(err, 4001)
  }
}

// 删除指定网格
exports.deleteOne = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('地图管理-删除单个网格'))
    await GridModel.findByIdAndRemove(ctx.params.id).exec() // 删除网格
    const buildings = await BuildingModel.find({ gid: ctx.params.id }).exec()
    const docs = buildings.map(item => {
      delete item._doc.gid
      return item._doc
    })
    await BuildingModel.deleteMany({ gid: ctx.params.id })
    await BuildingModel.insertMany(docs)
    ctx.status = 200
  } catch (err) {
    tools.handleSysException(err, 4001)
  }
}

// 获取指定网格的所有统计信息（摄像机点位数量、楼宇数量）
// exports.statistic = async ctx => {
//   try {
//     ctx.set('loginfo', encodeURI('地图管理-统计网格信息'))
//     const gid = ctx.params.id // 网格id
//     const buildings = await BuildingModel.find({
//       gid: gid
//     }).exec()
//     const grid = await GridModel.findById(gid).exec()
//     const resources = await ResourceModel.find({
//       'point.loc': {
//         $geoWithin: {
//           $geometry: {
//             type: 'Polygon',
//             coordinates: [grid.loc]
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
//       camera: {
//         online: online,
//         offline: offline
//       },
//       building: buildings.length // 楼宇数量
//     }
//   } catch (err) {
//     return ctx.throw(500, err.code ? { code: err.code, message: err.message } : { code: 4001, message: '系统内部错误' })
//   }
// }
// 获取指定网格的所有统计信息（摄像机点位数量、楼宇数量）
exports.statistic = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('地图管理-统计网格信息'))
    const grid = await GridModel.findById(ctx.params.id, 'loc')
    const wkt = tools.stringToWkt(grid.loc)
    const reader = new jsts.io.WKTReader()
    const geo = reader.read(wkt)
    const resources = await ResourceModel.find({ point: { $nin: [null, undefined] } }).exec()
    const buildings = await BuildingModel.find({}, 'loc center').exec()
    let online = 0
    let offline = 0
    let buildLength = 0
    for (var item of resources) {
      if (_.isEmpty(item.point)) {
        continue
      }
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
    ctx.body = {
      camera: { // 资源点位树
        online: online,
        offline: offline
      },
      building: buildLength // 楼宇数量
    }
  } catch (err) {
    tools.handleSysException(err, 4001)
  }
}
exports.checkRepeat = async (ctx, next) => {
  try {
    ctx.set('loginfo', encodeURI('地图管理-效验重复'))
    const id = ctx.query._id === undefined ? '' : ctx.query._id
    const name = ctx.query.name === undefined ? '' : ctx.query.name
    const code = ctx.query.code === undefined ? '' : ctx.query.code
    let result
    if (name) {
      result = await GridModel.find({ name: name })
    }
    if (code) {
      result = await GridModel.find({ code: code })
    }
    let flag = false
    if (_.isEmpty(id)) {
      if (!_.isEmpty(result)) {
        ctx.throw(500, name ? { code: 4005, message: '该名称已存在' } : { code: 4006, message: '该编号已存在' })
      }
    } else {
      result.forEach(item => {
        if (name) {
          if (item._id + '' !== id + '' && item.name + '' === name + '') { flag = true }
        } else {
          if (item._id + '' !== id + '' && item.code + '' === code + '') { flag = true }
        }
      })
    }
    if (flag) {
      ctx.throw(500, name ? { code: 4005, message: '该名称已存在' } : { code: 4006, message: '该编号已存在' })
    }
    ctx.status = 200
    ctx.body = ''
  } catch (err) {
    tools.handleSysException(err, 4001)
  }
}
exports.getGridByMapId = async (ctx) => {
  try {
    let grids
    let count
    if (ctx.query.gridpage && ctx.query.gridlimit) {
      [count, grids] = await Promise.all([
        GridModel.countDocuments({
          mapId: ctx.query.mapId,
          name: {
            $regex: ctx.query.seek + '' || ''
          }
        }), GridModel.find({
          mapId: ctx.query.mapId,
          name: {
            $regex: ctx.query.seek + '' || ''
          }
        }).skip((+ctx.query.gridpage - 1) * (+ctx.query.gridlimit))
          .limit(+ctx.query.gridlimit).exec()
      ])
    } else {
      [count, grids] = await Promise.all([
        GridModel.countDocuments({
          mapId: ctx.query.mapId,
          name: {
            $regex: ctx.query.seek ? ctx.query.seek + '' : ''
          }
        }), GridModel.find({
          mapId: ctx.query.mapId,
          name: {
            $regex: ctx.query.seek ? ctx.query.seek + '' : ''
          }
        })
      ])
    }
    ctx.set({
      'X-BSC-COUNT': count,
      'X-BSC-PAGES': ctx.query.gridlimit ? count ? Math.ceil(count / ctx.query.gridlimit) : 0 : 0,
      'X-BSC-CUR': ctx.query.gridpage ? parseInt(ctx.query.gridpage) : 0,
      'X-BSC-LIMIT': ctx.query.gridlimit ? parseInt(ctx.query.gridlimit) : 0
    })
    ctx.body = grids
  } catch (err) {
    tools.handleSysException(err, 4001)
  }
}
exports.getGridBySid = async (ctx) => {
  try {
    let grids
    let count
    if (ctx.query.gridpage && ctx.query.gridlimit) {
      [count, grids] = await Promise.all([
        GridModel.countDocuments({
          sid: ctx.query.sid,
          name: {
            $regex: ctx.query.seek + '' || ''
          }
        }), GridModel.find({
          sid: ctx.query.sid,
          name: {
            $regex: ctx.query.seek + '' || ''
          }
        }).skip((+ctx.query.gridpage - 1) * (+ctx.query.gridlimit))
          .limit(+ctx.query.gridlimit).exec()
      ])
    } else {
      [count, grids] = await Promise.all([
        GridModel.countDocuments({
          sid: ctx.query.sid,
          name: {
            $regex: ctx.query.seek ? ctx.query.seek + '' : ''
          }
        }), GridModel.find({
          sid: ctx.query.sid,
          name: {
            $regex: ctx.query.seek ? ctx.query.seek + '' : ''
          }
        })
      ])
    }
    ctx.set({
      'X-BSC-COUNT': count,
      'X-BSC-PAGES': ctx.query.gridlimit ? count ? Math.ceil(count / ctx.query.gridlimit) : 0 : 0,
      'X-BSC-CUR': ctx.query.gridpage ? parseInt(ctx.query.gridpage) : 0,
      'X-BSC-LIMIT': ctx.query.gridlimit ? parseInt(ctx.query.gridlimit) : 0
    })
    ctx.body = grids
  } catch (err) {
    tools.handleSysException(err, 4001)
  }
}
