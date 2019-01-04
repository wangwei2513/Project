/*
 * @Author: chenkaibo
 * @Date: 2018-12-07 11:23:48
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-12-20 16:16:51
 */
'use strict'

var FaceServer = require('mongoose').model('FaceServer')
var paging = require('../../paging')
const rp = require('request-promise').defaults({ json: true })
const Wsocket = require('../veriface.socket')
const { handleSysException } = require('../../../common/tools')
const sdkInterface = require('../sdk.interface')
const postal = require('postal')
/**
 * 查询服务器列表
 * @param {*} ctx
 */
exports.index = async ctx => {
  try {
    const result = await paging.listQuery(FaceServer, {}, '', {}, ctx.query.page, '', ctx)
    ctx.status = 200
    ctx.body = result
  } catch (err) {
    handleSysException(err)
  }
}

/**
 * 新增人脸服务器
 */
exports.add = async ctx => {
  try {
    const postData = ctx.request.body
    const checkUq = await FaceServer.findOne({ ip: postData.ip }).exec()
    if (checkUq) {
      ctx.throw(500, { code: 0, message: '该IP服务器已经存在' })
    }
    await FaceServer.create(postData)
    await updateSkdInit(postData)
    ctx.body = {
      code: 1,
      data: 'ok'
    }
  } catch (err) {
    handleSysException(err)
  }
}

/**
 * 修改
 */
exports.put = async ctx => {
  try {
    const putData = ctx.request.body
    const id = ctx.params.id
    const checkUq = await FaceServer.findOne({ ip: putData.ip, _id: { $ne: id } }).exec()
    if (checkUq) {
      ctx.throw(500, { code: 0, message: '该IP服务器已经存在' })
    }
    if (putData.res.length) {
      postal.publish({
        channel: 'websocket',
        topic: 'ws.update',
        data: {
          resIds: putData.res,
          type: 'update'
        }
      })
    }
    await FaceServer.findByIdAndUpdate(id, ctx.request.body)
    await updateSkdInit(putData)
    ctx.body = {
      code: 1,
      data: 'ok'
    }
  } catch (err) {
    handleSysException(err)
  }
}

/**
 * 单个删除
 */
exports.del = async ctx => {
  try {
    const id = ctx.params.id
    await FaceServer.findByIdAndRemove(id)
    Wsocket.reset()
    ctx.body = {
      code: 1,
      data: 'ok'
    }
  } catch (err) {
    handleSysException(err)
  }
}
/**
 * 批量删除
 * @param {*} ctx
 */
exports.delBatch = async ctx => {
  try {
    const ids = ctx.request.header['x-bsc-ids'].split(',') || []
    await FaceServer.deleteMany({ _id: { $in: ids } })
    Wsocket.reset()
    ctx.body = {
      code: 1,
      data: 'ok'
    }
  } catch (err) {
    handleSysException(err)
  }
}

const updateSkdInit = data => {
  return new Promise((resolve, reject) => {
    rp(`http://${data.ip}:${data.port}/version`)
      .then(d => {
        sdkInterface
          .initVeriFace({ ip: data.ip, port: data.port })
          .then(() => {
            new Wsocket()
              .reset()
              .then(() => {
                resolve()
              })
              .catch(se => {
                reject(se)
              })
          })
          .catch(ie => {
            reject(ie)
          })
        resolve(d)
      })
      .catch(err => {
        reject(err)
      })
  })
}
