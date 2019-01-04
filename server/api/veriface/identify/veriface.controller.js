/*
 * @Author: zhangminbo
 * @Date: 2018-06-05 14:23:18
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-12-21 17:46:07
 */
'use strict'
const mongoose = require('mongoose')
const VerifaceIdentify = mongoose.model('VerifaceIdentify')
// var _ = require('lodash')
const VeriGroup = mongoose.model('VeriGroup')
const VeriUser = mongoose.model('VeriUser')
const Org = mongoose.model('Org')
const OrgRes = mongoose.model('OrgRes')
const DefenseTask = mongoose.model('DefenseTask')
const FaceParameter = mongoose.model('FaceParameter')
const config = require('../../../../config').backend
const { handleSysException } = require('../../../common/tools')
const postal = require('postal')
const fs = require('fs')
const moment = require('moment')
const sdkInterface = require('../sdk.interface')
const faceCache = require('./face.cache')
exports.add = async (data, res, host) => {
  try {
    data = JSON.parse(data)
    const now = moment().unix()
    if (data.type === 'recognize') {
      const hour = moment().hour()
      const nowTime = moment().unix()
      const dateTime = moment().format('YYYY-MM-DD')
      const faceData = {
        dateTime: dateTime,
        hour: hour,
        time: nowTime,
        timestamp: Math.round(data.timestamp / 1000),
        res: res._id,
        resName: res.name,
        resIp: res.ip,
        resPort: res.port,
        resChannel: res.chan
      }
      faceData.gender = Math.round(data.face.attrs.gender.male) + 1
      faceData.age = Math.round(data.face.attrs.age)
      let score = 0
      let tag = ''
      let group = ''
      let groupImgId = ''
      data.result.forEach(n => {
        n.photos.forEach(m => {
          score = Math.max(score, m.score)
          if (score === m.score) {
            tag = m.tag
            group = n.group
            groupImgId = m.id
          }
        })
      })
      faceData.userImage = tag
      faceData.similar = score.toFixed(0)
      faceData.groupImgId = groupImgId
      const faceParameter = await FaceParameter.findOne().lean()
      const user = await VeriUser.findOne({ image: tag }).exec()
      const passerGroup = await VeriGroup.findOne({ name: '路人库' }).lean()
      let faceImagePath
      let fullImagePath
      let fullImageBuffer = null
      const faceImageBuffer = Buffer.from(data.face.crop.image, 'base64')
      faceParameter.pattern.includes('full') && (fullImageBuffer = Buffer.from(data.full.image, 'base64'))
      if (score * 1 >= 50 && user) { // 若分数小于50则为陌生人并且找到对应的用户
        const groupObj = await VeriGroup.findById(group).exec()
        faceData.group = group
        faceData.groupName = groupObj.name
        faceData.userId = user._id + ''
        faceData.userGender = user.gender
        faceData.userName = user.name
        faceData.userAge = user.age
        faceData.userCode = user.code
        const defenseTasks = await DefenseTask.find({ groups: { $in: [groupObj._id] } }).lean()
        for (var task of defenseTasks) {
          if (task.vaild) {
            if (task.always || (nowTime >= task.startTime && nowTime <= task.endTime)) {
              if (task.points.map(item => item + '').includes(res._id + '') && score >= groupObj.similar) {
                faceData.isdefense = true
                faceData.groupName = faceData.groupName + '布控'
                task.always ? faceData.defenseTime = '永久' : faceData.defenseTime = `${moment(task.startTime).format('YYYY-MM-DD hh:mm:dd')}~${moment(task.endTime).format('YYYY-MM-DD hh:mm:dd')}`
                faceData.alarmAudio = groupObj.alarmAudio
                faceData.color = groupObj.color
                break
              } else {
                faceData.isdefense = false
              }
            } else {
              faceData.isdefense = false
              postal.publish({
                channel: 'websocket',
                topic: 'ws.update',
                data: {
                  ids: [res._id + ''],
                  type: 'update'
                }
              })
            }
          }
        }
        if (faceParameter.output === 1) {
          const imgObj = faceCache.checkUpdate(data.track, data.face.quality, now, data.isdefense)
          faceImagePath = imgObj.faceImagePath
          fullImagePath = imgObj.fullImagePath
          if (imgObj.update) {
            fs.unlinkSync(faceImagePath)
            fs.writeFile(faceImagePath, faceImageBuffer)
            require('../veriface.socket').sendMsg('veriFaceData', { faceImagePath: `/image/face/passer${faceImagePath.split('passer').pop()}`, faceDefense: data.isdefense ? data.isdefense : false })
            if (faceParameter.pattern.includes('full')) {
              fs.unlinkSync(fullImagePath)
              fs.writeFile(fullImagePath, fullImageBuffer)
            }
          } else {
            fs.writeFile(faceImagePath, faceImageBuffer)
            faceData.faceImage = `/image/face/passer${faceImagePath.split('passer').pop()}`
            if (faceParameter.pattern.includes('full')) {
              fs.writeFile(fullImagePath, fullImageBuffer)
              faceData.fullImage = `/image/face/passer${fullImagePath.split('passer').pop()}`
            }
            await VerifaceIdentify.create(faceData)
          }
        } else {
          const nowDate = new Date().toLocaleDateString()
          const basePath = `${config.fileDirs.facePasserPictureDir}/${nowDate}`
          if (!fs.existsSync(basePath)) {
            fs.mkdirSync(basePath)
          }
          faceImagePath = `${basePath}/${data.track}_${now}_face.jpg`
          fs.writeFile(faceImagePath, faceImageBuffer)
          faceData.faceImage = `/image/face/passer${faceImagePath.split('passer').pop()}`
          if (faceParameter.pattern.includes('full')) {
            fullImagePath = `${basePath}/${data.track}_${now}_full.jpg`
            fs.writeFile(fullImagePath, fullImageBuffer)
            faceData.fullImage = `/image/face/passer${fullImagePath.split('passer').pop()}`
          }
          await VerifaceIdentify.create(faceData)
        }
        faceData.passerNumber = await VerifaceIdentify.countDocuments({ group: passerGroup._id, dateTime: moment().format('YYYY-MM-DD') }).exec()
        faceData.defenseAlarmNumber = await VerifaceIdentify.countDocuments({ isdefense: true, dateTime: moment().format('YYYY-MM-DD') }).exec()
        return faceData
      } else {
        if (faceParameter.passby) {
          faceData.group = passerGroup._id
          if (faceParameter.output === 1) {
            const imgObj = faceCache.checkUpdate(data.track, data.face.quality, now)
            faceImagePath = imgObj.faceImagePath
            fullImagePath = imgObj.fullImagePath
            if (imgObj.update) {
              fs.unlinkSync(faceImagePath)
              fs.writeFile(faceImagePath, faceImageBuffer)
              require('../veriface.socket').sendMsg('veriFaceData', { faceImagePath: `/image/face/passer${faceImagePath.split('passer').pop()}`, faceDefense: data.isdefense ? data.isdefense : false })
              if (faceParameter.pattern.includes('full')) {
                fs.unlinkSync(fullImagePath)
                fs.writeFile(fullImagePath, fullImageBuffer)
              }
              const existVeriface = await VerifaceIdentify.findOne({ faceImage: `/image/face/passer/${faceImagePath.split('passer').pop()}` }, 'groupImgId').exec()
              await Promise.all([
                VerifaceIdentify.updateOne({ faceImage: `/image/face/passer/${faceImagePath.split('passer').pop()}` }, { groupImgId }).exec(),
                sdkInterface.removeGroupImage(group, existVeriface.groupImgId, host)
              ])
            }
            if (imgObj.add) {
              fs.writeFile(faceImagePath, faceImageBuffer)
              faceData.faceImage = `/image/face/passer${faceImagePath.split('passer').pop()}`
              if (faceParameter.pattern.includes('full')) {
                fs.writeFile(fullImagePath, fullImageBuffer)
                faceData.fullImage = `/image/face/passer${fullImagePath.split('passer').pop()}`
              }
              await VerifaceIdentify.create(faceData)
            } else {
              await sdkInterface.removeGroupImage(group, groupImgId, host)
            }
          } else {
            const nowDate = new Date().toLocaleDateString()
            const basePath = `${config.fileDirs.facePasserPictureDir}/${nowDate}`
            if (!fs.existsSync(basePath)) {
              fs.mkdirSync(basePath)
            }
            faceImagePath = `${basePath}/${data.track}_${now}_face.jpg`
            fullImagePath = `${basePath}/${data.track}_${now}_full.jpg`
            fs.writeFile(faceImagePath, faceImageBuffer)
            fs.writeFile(faceImagePath, fullImageBuffer)
            faceData.faceImage = `/image/face/passer${faceImagePath.split('passer').pop()}`
            faceData.fullImage = `/image/face/passer${fullImagePath.split('passer').pop()}`
            await VerifaceIdentify.create(faceData)
          }
          faceData.passerNumber = await VerifaceIdentify.countDocuments({ group: passerGroup._id, dateTime: moment().format('YYYY-MM-DD') }).exec()
          faceData.defenseAlarmNumber = await VerifaceIdentify.countDocuments({ isdefense: true, dateTime: moment().format('YYYY-MM-DD') }).exec()
          return faceData
        } else {
          faceData.faceImage = `data:image/jpeg;base64,${data.face.crop.image}`
          faceData.fullImage = `data:image/jpeg;base64,${data.full.image}`
          return faceData
        }
      }
    } else {
      return data
    }
  } catch (error) {
    console.log(error.message)
  }
}
// 获取识别数据列表
exports.getInitData = async ctx => {
  try {
    const passerGroup = await VeriGroup.findOne({ name: '路人库' }).lean()
    const [passers, defenseAlarms, passerNumber, defenseAlarmNumber] = await Promise.all([
      VerifaceIdentify.find({ group: passerGroup._id }).sort({ time: -1 }).limit(16).lean(),
      VerifaceIdentify.find({ isdefense: true }).sort({ time: -1 }).limit(64).lean(),
      VerifaceIdentify.countDocuments({ group: passerGroup._id }).exec(),
      VerifaceIdentify.countDocuments({ isdefense: true }).exec()
    ])
    ctx.body = { passers, defenseAlarms, passerNumber, defenseAlarmNumber }
  } catch (error) {
    handleSysException(error)
  }
}
exports.getUserTrack = async ctx => {
  try {
    const beginTime = ctx.query.beginTime || moment(`${moment().format('YYYY-MM-DD')} 00:00:00`).unix()
    const endTime = ctx.query.endTime || moment().unix()
    const similar = ctx.query.similar || 75
    const image = ctx.query.image
    const resStr = ctx.query.resStr
    const isdefense = ctx.query.isdefense
    const groupIdStrs = (await VeriGroup.find({}, '_id').lean()).map(item => item._id).join(',')
    const data = await sdkInterface.searchGroupImage(groupIdStrs, image)
    const groups = []
    const groupImgIds = []
    data && data.length && data.forEach(obj => {
      obj.groups && obj.groups.forEach(g => {
        groups.push(g.group)
        g.photos.forEach(m => {
          groupImgIds.push(m.id)
        })
      })
    })
    const query = {
      groupImgId: { $in: groupImgIds },
      group: { $in: groups },
      time: { $gte: beginTime, $lte: endTime },
      similar: { $gte: similar }
    }
    isdefense && (query.isdefense = isdefense)
    const results = await VerifaceIdentify.find(query).populate({ path: 'res', select: 'point', populate: { path: 'point.bid', select: 'loc center' } }).lean()
    ctx.body = resStr ? results : results.filter(item => resStr.split(',').includes(item.res + ''))
  } catch (error) {
    handleSysException(error)
  }
}
exports.update = async ctx => {
  try {
    const id = ctx.params.id
    await VerifaceIdentify.findByIdAndUpdate(id, ctx.request.body)
    ctx.status = 200
  } catch (error) {
    handleSysException(error)
  }
}

exports.alarmInfo = async ctx => {
  try {
    const id = ctx.params.id
    let result = await VerifaceIdentify.findById(id).populate('alarmPlan').exec()
    result = JSON.parse(JSON.stringify(result))
    result.orgStr = await makeOrgStrByRes(result.res)
    result.deal = !!result.alarmPlan
    ctx.body = result
  } catch (error) {
    handleSysException(error)
  }
}

/**
 *获取机构名称列表
 * @param {*} resId 当前资源id
 * @param {*} type 机构大类
 * @param {*} s 分隔符
 */
const makeOrgStrByRes = async (resId, type = 6, s = '/') => {
  const orgs = await Org.find({ type: type }).exec()
  const rootOrg = orgs.find(x => x.isroot)
  const data = await OrgRes.findOne({ resource: resId, rootorg: rootOrg._id }).exec()
  return getOrgName(orgs, data.org, s)
}
/**
 *
 * @param {Array} x 机构资源
 * @param {String} orgId 当前机构id
 * @param {String} s 分隔符
 * @param {*} t 临时数据
 */
const getOrgName = (x, orgId, s = '/', t = []) => {
  const co = x.find(x => x._id + '' === orgId + '')
  t.unshift(co.name)
  x.map(n => {
    if (n._id + '' === co.pid + '') {
      if (n.pid) {
        getOrgName(x, n.pid, s, t)
      } else {
        t.unshift(n.name)
      }
    }
  })
  return t.join(s)
}
