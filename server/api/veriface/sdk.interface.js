/*
 * @Author: chenkaibo
 * @Date: 2018-12-10 11:56:06
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-12-18 14:14:03
 */
'use strict'
const fs = require('fs')
const req = require('./req.util').req
const config = require('../../../config').backend
const VeriGroup = require('mongoose').model('VeriGroup')
const { CONTENT_TYPE } = require('../../common/constant')
const FaceServer = require('mongoose').model('FaceServer')

/**
 * 添加底库
 * @param {*} id // 底库id
 * @param {*} image // mongoose图片Id
 */
const addGroup = async (id, host) => {
  try {
    if (host) {
      const option = {
        uri: 'g/' + id + '/',
        method: 'put',
        host
      }
      await req(option)
    } else {
      const servers = await FaceServer.find().lean()
      for (let svr of servers) {
        const option = {
          uri: 'g/' + id + '/',
          method: 'put',
          host: { ip: svr.ip, port: svr.port }
        }
        await req(option)
      }
    }
  } catch (error) {
    throw error
  }
}
/**
 * 删除底库
 * @param {*} id // 底库id
 * @param {*} image // mongoose图片Id
 */
const delGroup = async (id) => {
  try {
    const servers = await FaceServer.find().lean()
    for (let svr of servers) {
      const option = {
        uri: 'g/' + id + '/',
        method: 'delete',
        host: { ip: svr.ip, port: svr.port }
      }
      await req(option)
    }
  } catch (error) {
    throw error
  }
}
/**
 *检索底库相似图片方法
 * @param {*} group // 底库名称
 * @param {*} image // mongoose图片Id
 */
const searchGroupImage = async (group, imagePath, target) => {
  try {
    const results = []
    const filePath = target ? `${config.fileDirs.faceUserPictureDir}/${imagePath.split('/').pop()}` : `${config.fileDirs.tempDir}/${imagePath.split('/').pop()}`
    const data = fs.readFileSync(filePath)
    const option = {
      uri: 'search',
      method: 'post',
      formData: {
        group: group,
        image: {
          value: data,
          options: {
            filename: imagePath.split('/').pop(),
            contentType: CONTENT_TYPE[imagePath.split('/').pop().split('.').pop()]
          }
        }
      }
    }
    const servers = await FaceServer.find().lean()
    for (let svr of servers) {
      option.host = { ip: svr.ip, port: svr.port }
      const sdkData = await req(option)
      sdkData.host = { ip: svr.ip, port: svr.port }
      results.push(sdkData)
    }
    return results
  } catch (error) {
    throw error
  }
}
/**
 *上传图片到SDK底库
 * @param {*} imagePath // 本地图片id
 * @param {*} group // 底库名称
 */
const uploadToGroup = async (imagePath, group, host) => {
  try {
    const results = []
    const filePath = `${config.fileDirs.faceUserPictureDir}/${imagePath.split('/').pop()}`
    const data = fs.readFileSync(filePath)
    const option = {
      uri: `g/${group}/`,
      method: 'post',
      formData: {
        group: group,
        tag: imagePath,
        image: {
          value: data,
          options: {
            filename: imagePath.split('/').pop(),
            contentType: CONTENT_TYPE[imagePath.split('/').pop().split('.').pop()]
          }
        }
      }
    }
    const servers = await FaceServer.find().lean()
    if (host) {
      option.host = host
      const sdkData = req(option)
      results.push(sdkData)
    } else {
      for (let svr of servers) {
        option.host = { ip: svr.ip, port: svr.port }
        const sdkData = await req(option)
        sdkData.host = { ip: svr.ip, port: svr.port }
        results.push(sdkData)
      }
    }
    return results
  } catch (error) {
    throw error
  }
}

/**
 *删除底库图片方法
 * @param {*} group // 底库名称
 * @param {*} imageId // 底库图片Id
 */
const removeGroupImage = async (group, any, host) => {
  try {
    const results = []
    if (host) {
      const option = {
        uri: `g/${group}/${any}`,
        method: 'delete',
        host
      }
      const sdkData = req(option)
      results.push(sdkData)
    } else {
      for (let sdk of any) {
        const option = {
          uri: `g/${group}/${sdk.id}`,
          method: 'delete',
          host: sdk.host
        }
        await req(option)
      }
    }
  } catch (error) {
    throw error
  }
}

/**
 * 修改底库图片
 * @param {*} user // 需要修改用户对象
 */
const updateGroupImage = async (user) => {
  const results = await uploadToGroup(user.image, user.group)
  user.sdkImgInfos = []
  results.forEach(item => {
    user.sdkImgInfos.push({
      id: item.id,
      host: item.host
    })
  })
  await removeGroupImage(user.group, user.sdkImgInfos)
  return user
}
const initVeriFace = async (host) => {
  const group =
  {
    name: '路人库',
    color: 'red',
    alarmAudio: '/image/face/voice.mp3',
    type: 'defense'
  }
  const doc = await VeriGroup.findOne({ name: '路人库' })
  if (doc) {
    addGroup(doc._id + '', host)
  } else {
    const data = await VeriGroup.create(group)
    addGroup(data._id + '', host)
  }
}
module.exports = { addGroup, delGroup, searchGroupImage, uploadToGroup, removeGroupImage, updateGroupImage, initVeriFace }
