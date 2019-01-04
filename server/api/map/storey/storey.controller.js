/*
 * 楼层接口
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:33:39
 * @Last Modified by: hansen.liuhao
 * @Last Modified time: 2018-12-20 15:58:40
 */

'use strict'
const StoreyModel = require('mongoose').model('Storey')
const ResourceModel = require('mongoose').model('Resource')
const postal = require('postal')
const imageSize = require('image-size')
const fs = require('fs')
const gfs = require('../../../common/gridfs.util')
const path = require('path')
const _ = require('lodash')
const config = require('../../../../config')
const { handleSysException, mkdirsSync } = require('../../../common/tools')

// 删除指定楼层
exports.deleteOne = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('地图管理-删除指导楼层'))
    await ResourceModel.updateMany(
      {
        'point.sid': ctx.params.id
      },
      { $unset: { point: '' } },
      { multi: true }
    ).exec()
    postal.publish({
      topic: 'array.delete',
      channel: 'sentry:position',
      data: {
        id: ctx.params.id
      }
    })
    await StoreyModel.findByIdAndRemove(ctx.params.id).exec()
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}

// 新建楼层
exports.add = async ctx => {
  ctx.set('loginfo', encodeURI('地图管理-新建楼层'))
  delete ctx.request.body._id
  const bid = ctx.request.body.bid // 楼层所属楼宇
  try {
    const picId = ctx.request.body.picture.id
    const stream = await gfs.readFileByIdFromGFS({ id: picId })
    const fileInfo = await gfs.getFileInfoByIdFromGFS({ id: picId })
    const result = fileInfo[0].filename.split('.')
    const type = result[result.length - 1]
    const dir = config.backend.fileDirs.tempDir
    mkdirsSync(dir)
    const filePath = path.join(
      dir,
      Math.random()
        .toString(36)
        .replace('.', '') +
        '.' +
        type
    )
    // 根据图片2进制流生成图片
    await new Promise((resolve, reject) => {
      const flow = stream.pipe(fs.createWriteStream(filePath))
      flow.on('finish', () => {
        resolve()
      })
    })
    const picSize = imageSize(fs.readFileSync(filePath))
    fs.unlink(filePath)
    ctx.request.body.picture.size = picSize
    const nameArr = await StoreyModel.find({ bid }, 'name')
    let flag = false
    nameArr.forEach(item => {
      if (item.name + '' === ctx.request.body.name + '') {
        flag = true
      }
    })
    if (flag) {
      ctx.throw(500, { code: 4008, message: '楼层名称重复' })
    }
    const storey = new StoreyModel(_.merge(ctx.request.body))
    const newStorey = await StoreyModel.create(storey)

    ctx.body = [newStorey._id]
    ctx.status = 201
  } catch (err) {
    handleSysException(err)
  }
}

// 修改楼层
exports.updateOne = async ctx => {
  ctx.set('loginfo', encodeURI('地图管理-删除楼层'))
  try {
    const storey = await StoreyModel.findOne({ name: ctx.request.body.name }, 'name picture')
    const oldStorey = await StoreyModel.findById(ctx.params.id, 'name picture')
      .lean()
      .exec()
    if (!_.isEmpty(storey) && ctx.request.body._id !== storey._id && ctx.request.body.name === storey.name) {
      ctx.throw(500, { code: 4008, message: '楼层名称重复' })
    }
    // 更换楼层底图
    if (oldStorey.picture.id + '' !== ctx.request.body.picture.id + '') {
      // 清空楼层点位
      // await ResourceModel.updateMany({ 'point3D.sid': ctx.params.id }, { $unset: { point3D: 1 } }, { multi: true }).exec()
      // 计算图片尺寸
      const picId = ctx.request.body.picture.id
      const stream = await gfs.readFileByIdFromGFS({ id: picId })
      const fileInfo = await gfs.getFileInfoByIdFromGFS({ id: picId })
      const result = fileInfo[0].filename.split('.')
      const type = result[result.length - 1]
      const dir = config.backend.fileDirs.tempDir
      mkdirsSync(dir)
      const filePath = path.join(
        dir,
        Math.random()
          .toString(36)
          .replace('.', '') +
          '.' +
          type
      )
      // 根据图片2进制流生成图片
      await new Promise((resolve, reject) => {
        const flow = stream.pipe(fs.createWriteStream(filePath))
        flow.on('finish', () => {
          resolve()
        })
      })
      const picSize = imageSize(fs.readFileSync(filePath))
      fs.unlink(filePath)
      ctx.request.body.picture.size = picSize
    }
    await StoreyModel.findByIdAndUpdate(ctx.params.id, _.merge(ctx.request.body)).exec()
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}

// 获取楼层信息
exports.getOne = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('地图管理-获取楼层信息'))
    ctx.body = _.isEmpty(
      await StoreyModel.findById(ctx.params.id)
        .populate('bid')
        .exec()
    )
      ? {}
      : await StoreyModel.findById(ctx.params.id)
        .populate('bid')
        .exec()
  } catch (err) {
    handleSysException(err)
  }
}

// 统计
exports.statistic = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('地图管理-统计'))
    const sid = ctx.params.id // 楼层id
    // const storey = await StoreyModel.findById(sid).exec()
    // const building = await BuildingModel.findById(storey.bid).exec()
    const resources = await ResourceModel.find(
      {
        // 'point.loc': {
        //   $geoWithin: {
        //     $geometry: {
        //       type: 'Polygon',
        //       coordinates: [building.loc]
        //     }
        //   }
        // },
        'point.isouter': false, // 楼层内部设备
        'point.sid': sid // 楼层id
      },
      'status point.name'
    ).exec()
    let online = 0
    let offline = 0
    resources.forEach(item => {
      parseInt(item.status) === 1 ? online++ : offline++
    })
    ctx.body = {
      camera: {
        online: online,
        offline: offline
      }
    }
  } catch (err) {
    handleSysException(err)
  }
}

// 获取当前楼层下的所有通道
exports.getReses = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('地图管理-获取该楼层下的所有通道'))
    const reses = await ResourceModel.find({
      type: { $in: ctx.query.channelTypes.split(',') },
      'point.sid': ctx.params.id,
      'point.isouter': false
    }).exec()
    ctx.body = reses
  } catch (err) {
    handleSysException(err)
  }
}
exports.getAllPointByChannelType = async ctx => {
  try {
    const sid = ctx.params.id // 楼层id
    const resources = await ResourceModel.find(
      {
        type: { $in: ctx.query.channelTypes.split(',') },
        'point.isouter': false, // 楼层内部设备
        'point.sid': sid // 楼层id
      },
      'chan name monitortype status eid alarmintype alarmtemplate maxdelaytime minintervaltime mapsign alarmaffirm point'
    ).exec()
    ctx.body = resources
  } catch (err) {
    handleSysException(err)
  }
}
