/*
 * @Author: zhangminbo
 * @Date: 2018-06-12 11:11:13
 * @Last Modified by: hansen.liuhao
 * @Last Modified time: 2018-12-20 16:08:43
 */
'use strict'
const mongoose = require('mongoose')
const VerifaceStatistics = mongoose.model('VerifaceStatistics')
const VerifaceIdentify = mongoose.model('VerifaceIdentify')
const VeriGroup = mongoose.model('VeriGroup')
const VeriUser = mongoose.model('VeriUser')
const FaceServer = mongoose.model('FaceServer')
const DefenseTask = mongoose.model('DefenseTask')
const sdkInterface = require('../sdk.interface')
const paging = require('../../paging')
const _ = require('lodash')
const moment = require('moment')
const xlsx = require('node-xlsx')
const { handleSysException } = require('../../../common/tools')
const xl = require('excel4node')
const fs = require('fs')
const resizeImg = require('resize-img')
const Resource = mongoose.model('Resource')
const { devOnlineList } = require('../../bstar/dev.interface')
const config = require('../../../../config').backend

/**
 * 路人检索
 * @param {*} ctx
 */
exports.getPassbyList = async ctx => {
  try {
    ctx.body = await passbyList(ctx)
  } catch (error) {
    handleSysException(error)
  }
}
/**
 * 路人检索
 * @param {*} ctx
 * @param {*} limit
 */
const passbyList = async (ctx, limit = 0) => {
  try {
    const search = ctx.query.search
    const query = {}

    query.age = { $lte: Number(search.endAge) || 100, $gte: Number(search.startAge) || 0 }
    if (search.points && search.points.split(',').length) {
      query.res = { $in: search.points.split(',') }
    }
    if (search.startTime && search.endTime) {
      query.time = { $gte: Number(search.startTime), $lte: Number(search.endTime) }
    }
    if (search.gender && search.gender !== 'all') {
      query.gender = search.gender
    }
    const sort = { time: -1 }
    const page = ctx.query.page
    if (limit !== 0) {
      page.page = 1
      page.limit = limit
    }
    let data = await paging.listQuery(VerifaceIdentify, query, '', sort, ctx.query.page, '', ctx)
    return data.results
  } catch (err) {
    throw err
  }
}
/**
 * 路人以图搜图
 * @param {*} ctx
 */
exports.getImageByImage = async ctx => {
  try {
    const data = await getImgByImg(ctx)
    ctx.body = data
  } catch (error) {
    handleSysException(error)
  }
}
/**
 * 路人以图搜图
 * @param {*} ctx
 */
const getImgByImg = async (ctx, limit = 0) => {
  try {
    const search = ctx.query.search
    const similar = search.similar
    const image = search.image
    const groupIdStrs = (await VeriGroup.find({}, '_id').lean()).map(item => item._id).join(',')
    const data = await sdkInterface.searchGroupImage(groupIdStrs, image)
    const groups = []
    const groupImgIds = []
    data &&
      data.length &&
      data.forEach(obj => {
        obj.groups &&
          obj.groups.forEach(g => {
            groups.push(g.group)
            g.photos.forEach(m => {
              groupImgIds.push(m.id + '')
            })
          })
      })
    const query = {
      groupImgId: { $in: groupImgIds },
      group: { $in: groups },
      time: { $gte: Number(search.startTime), $lte: Number(search.endTime) },
      similar: { $gte: Number(similar) }
    }
    if (search.points && search.points.split(',').length) {
      query.res = { $in: search.points.split(',') }
    }
    let page = ctx.query.page
    if (limit !== 0) {
      page.page = 1
      page.limit = limit
    }
    let result = await paging.listQuery(VerifaceIdentify, query, '', { time: -1 }, page, '', ctx)
    return result.results
  } catch (err) {
    handleSysException(err)
  }
}

/**
 * 路人检索导出(包含图片)
 * @param {*} ctx
 */
exports.strangerExportData = async ctx => {
  try {
    const limit = ctx.query.page.limit
    // 如果有tag标签，表示界面是以图搜图结果导出
    const tag = ctx.query.tag
    let result = await passbyList(ctx, limit)
    if (tag) {
      result = await getImgByImg(ctx, limit)
    }
    const wb = new xl.Workbook()
    const ws = wb.addWorksheet('路人检索记录')
    const myStyle = wb.createStyle({
      font: {
        bold: true
      },
      alignment: {
        wrapText: true,
        horizontal: 'center'
      }
    })
    let count = 5
    if (tag) {
      count = 6
    }
    for (let i = 1; i <= count; i++) {
      ws.column(i).setWidth(25)
    }
    ws
      .cell(1, 1)
      .string('抓拍图片')
      .style(myStyle)
    ws
      .cell(1, 2)
      .string('抓拍时间')
      .style(myStyle)
    ws
      .cell(1, 3)
      .string('抓拍位置')
      .style(myStyle)
    ws
      .cell(1, 4)
      .string('年龄')
      .style(myStyle)
    ws
      .cell(1, 5)
      .string('性别')
      .style(myStyle)
    if (tag) {
      ws
        .cell(1, 6)
        .string('相似度')
        .style(myStyle)
    }
    for (let i = 0; i < result.length; i++) {
      let j = i + 2
      ws.row(j).setHeight(120)
      ws
        .cell(j, 2)
        .string(moment(result[i].time).format('YYYY-MM-DD HH:mm:ss'))
        .style(myStyle)
      ws
        .cell(j, 3)
        .string(result[i].resName)
        .style(myStyle)
      ws
        .cell(j, 4)
        .string(result[i].age + '')
        .style(myStyle)
      let gender = '未知'
      if (result[i].gender === '2') {
        gender = '男'
      } else if (result[i].gender === '1') {
        gender = '女'
      }
      ws
        .cell(j, 5)
        .string(gender)
        .style(myStyle)
      if (tag) {
        ws
          .cell(j, 6)
          .string(result[i].similar + '')
          .style(myStyle)
      }
      const imgPath = `${config.fileDirs.faceUserPictureDir}/${result[i].passImage.split('/').pop()}`
      // 剪切图片为固定大小
      const imgBuff = await resizeImg(fs.readFileSync(imgPath), { width: 150, height: 150 })
      ws.addImage({
        image: imgBuff,
        type: 'picture',
        position: {
          type: 'oneCellAnchor',
          from: {
            col: 1,
            colOff: '.1mm',
            row: j,
            rowOff: '.1mm'
          }
        }
      })
    }
    const buffer = await wb.writeToBuffer()
    const timeStr = moment().format('YYYYMMDD HHmmss')
    let fileName = `路人条件检索记录导出${timeStr}.xlsx`
    if (tag) {
      fileName = `路人以图搜图检索记录导出${timeStr}.xlsx`
    }
    ctx.type = 'application/vnd-openxmlformats'
    ctx.attachment(fileName)
    ctx.body = buffer
  } catch (err) {
    handleSysException(err)
  }
}
/**
 * 报警检索
 * @param {*} ctx
 */
exports.getAlarmList = async ctx => {
  try {
    const data = await AlarmList(ctx)
    ctx.body = data
  } catch (error) {
    handleSysException(error)
  }
}
/**
 * 报警检索
 * @param {*} ctx
 * @param {*} limit
 */
const AlarmList = async (ctx, limit = 0) => {
  try {
    const search = ctx.query.search
    const page = ctx.query.page
    const query = {}
    if (search.group !== 'all') {
      query.group = search.group
    }
    if (search.name) {
      query.userName = { $regex: search.name }
    }
    if (search.gender !== 'all') {
      query.userGender = search.gender
    }
    if (search.similar) {
      query.similar = { $gt: search.similar }
    }
    if (search.startTime && search.endTime) {
      query.time = { $gte: Number(search.startTime), $lte: Number(search.endTime) }
    }
    if (search.points) {
      const res = search.points.split(',')
      query.res = { $in: res }
    }
    query.isdefense = true
    const sort = { time: -1 }
    let data = await paging.listQuery(VerifaceIdentify, query, '', sort, page, '', ctx)
    return data.results
  } catch (err) {}
}
exports.alarmExportData = async ctx => {
  try {
    const limit = ctx.query.page.limit
    const result = await AlarmList(ctx, limit)
    const wb = new xl.Workbook()
    const ws = wb.addWorksheet('报警检索记录')
    const myStyle = wb.createStyle({
      font: {
        bold: true
      },
      alignment: {
        wrapText: true,
        horizontal: 'center'
      }
    })
    for (let i = 1; i <= 8; i++) {
      ws.column(i).setWidth(25)
    }
    ws
      .cell(1, 1)
      .string('抓拍图片')
      .style(myStyle)
    ws
      .cell(1, 2)
      .string('底库图片')
      .style(myStyle)
    ws
      .cell(1, 3)
      .string('报警时间')
      .style(myStyle)
    ws
      .cell(1, 4)
      .string('抓拍位置')
      .style(myStyle)
    ws
      .cell(1, 5)
      .string('相似度')
      .style(myStyle)
    ws
      .cell(1, 6)
      .string('底库名称')
      .style(myStyle)
    ws
      .cell(1, 7)
      .string('姓名')
      .style(myStyle)
    ws
      .cell(1, 8)
      .string('性别')
      .style(myStyle)

    for (let i = 0; i < result.length; i++) {
      let j = i + 2
      ws.row(j).setHeight(120)
      ws
        .cell(j, 3)
        .string(moment(result[i].time).format('YYYY-MM-DD HH:mm:ss'))
        .style(myStyle)
      ws
        .cell(j, 4)
        .string(result[i].resName)
        .style(myStyle)
      ws
        .cell(j, 5)
        .string(result[i].similar + '')
        .style(myStyle)
      ws
        .cell(j, 6)
        .string(result[i].groupName)
        .style(myStyle)
      ws
        .cell(j, 7)
        .string(result[i].userName)
        .style(myStyle)
      let gender = '未知'
      if (result[i].gender === '2') {
        gender = '男'
      } else if (result[i].gender === '1') {
        gender = '女'
      }
      ws
        .cell(j, 8)
        .string(gender)
        .style(myStyle)
      const passbyImgPath = `${config.fileDirs.tempDir}/${result[i].passImage.split('/').pop()}`
      // 剪切图片为固定大小
      const passbyImgBuff = await resizeImg(fs.readFileSync(passbyImgPath), { width: 150, height: 150 })
      ws.addImage({
        image: passbyImgBuff,
        type: 'picture',
        position: {
          type: 'oneCellAnchor',
          from: {
            col: 1,
            colOff: '.1mm',
            row: j,
            rowOff: '.1mm'
          }
        }
      })
      const userImgPath = `${config.fileDirs.faceUserPictureDir}/${result[i].userImage.split('/').pop()}`
      // 剪切图片为固定大小
      const userImgBuff = await resizeImg(fs.readFileSync(userImgPath), { width: 150, height: 150 })
      ws.addImage({
        image: userImgBuff,
        type: 'picture',
        position: {
          type: 'oneCellAnchor',
          from: {
            col: 2,
            colOff: '.1mm',
            row: j,
            rowOff: '.1mm'
          }
        }
      })
    }
    const buffer = await wb.writeToBuffer()
    const time = moment().format('YYYY-MM-DD')
    ctx.type = 'application/vnd-openxmlformats'
    ctx.attachment('报警记录导出' + time + '.xlsx'.toString('utf-8'))
    ctx.body = buffer
  } catch (err) {}
}

/**
 * 定时任务每小时59分30秒写一次数据
 */
exports.add = async () => {
  const now = new Date()
  console.log('SDK统计时间：' + now)
  const nowTime = Math.round(now.getTime() / 100000) * 100 // 当前时间戳(消除各台机器的统计时间差)
  const nowTimeHour = now.getHours() + 1 // 当前小时
  const lastHourTime = nowTime - 1 * 60 * 60 // 上一小时时间戳
  const startTime = now.setHours(0, 0, 0, 0) / 1000 // 凌晨时间戳
  try {
    const staticsData = {
      time: nowTime,
      hour: nowTimeHour,
      date: nowTimeHour ? startTime : startTime + 24 * 60 * 60
    }
    const result = await VerifaceIdentify.find({ time: { $gte: startTime, $lte: nowTime } }).exec() // 查询凌晨到当前识别信息
    const lastHourResult = result.filter(x => x.time > lastHourTime) // 上一个小时识别信息
    const groups = await VeriGroup.find().exec()
    const groupDict = {}
    groups.forEach(n => {
      groupDict[n._id + ''] = n.name
    })
    const passbyGroup = await VeriGroup.findOne({ name: '路人库' }).lean()
    staticsData.passbyCount = lastHourResult.filter(x => x.group + '' === passbyGroup._id + '').length
    staticsData.defenseCount = lastHourResult.filter(x => x.isdefense).length
    lastHourResult.forEach(item => {
      item.group = item + ''
      item.res = item + ''
    })
    const groupData = _.groupBy(lastHourResult, 'group')
    const resData = _.groupBy(lastHourResult, 'res')
    const groupsDatas = []
    for (const gd in groupData) {
      if (gd === passbyGroup._id + '') {
        groupsDatas.push({
          name: groupDict[gd],
          id: gd,
          count: groupData[gd].length
        })
      }
    }
    const resDatas = []
    for (const rd in resData) {
      if (rd) {
        resDatas.push({
          name: rd === 'undefined' ? '其他' : resData[rd][0].resName,
          id: rd,
          count: resData[rd].length
        })
      }
    }
    staticsData.groups = groupsDatas
    staticsData.res = resDatas
    await VerifaceStatistics.create(staticsData)
  } catch (err) {
    throw err
  }
}
/**
 * 获取今日统计数据
 */
exports.today = async ctx => {
  try {
    const todayDate = new Date().setHours(0, 0, 0, 0) / 1000
    const todayStatistics = await VerifaceStatistics.find({ date: todayDate })
      .lean()
      .exec() // 获取当天所有的统计数据(每小时统计一条数据)
    const nowHour = new Date().getHours() // 当前小时
    const todayResult = dealStatistic(todayStatistics, nowHour)
    ctx.body = todayResult
  } catch (err) {
    handleSysException(err)
  }
}
/**
 * 处理今日统计数据
 * @param {*} statistics
 * @param {*} hour
 */
const dealStatistic = (statistics, nowHour) => {
  try {
    const initArr = new Array(nowHour).fill(0)
    for (let i in initArr) {
      initArr[i] = { hour: Number(i) + 1, count: 0 }
    }

    statistics = _.uniqBy(statistics, 'hour')
    statistics.sort((a, b) => {
      return a.hour - b.hour // 按照hour字段升序排序
    })
    let passbyData = [] // 路人识别数量
    // 报警数量
    let alarmData = []

    statistics.forEach(item => {
      const passbyObj = { hour: item.hour, count: item.passbyCount }
      const alarmObj = { hour: item.hour, count: item.defenseCount }
      passbyData.push(passbyObj)
      alarmData.push(alarmObj)
    })
    passbyData = _.concat(passbyData, initArr)
    passbyData = _.uniqBy(passbyData, 'hour')
    alarmData = _.concat(alarmData, initArr)
    alarmData = _.uniqBy(alarmData, 'hour')
    passbyData.sort((a, b) => {
      return a.hour - b.hour
    })
    alarmData.sort((a, b) => {
      return a.hour - b.hour
    })
    return { passbyData, alarmData }
  } catch (err) {
    throw err
  }
}
/**
 *  实时数据每隔10s向前端推送一次
 */
setInterval(() => {
  todaySocket()
}, 10000)
/**
 * 获取今日数据推送【路人识别总量，布控报警数量，查询已经布控人员数量，已分配的人脸相机，在线人脸相机】
 */
const todaySocket = async () => {
  try {
    const earlyTime = new Date().setHours(0, 0, 0, 0) / 1000 // 凌晨时间戳
    const nowTime = moment().unix()
    const passbyCount = await VerifaceIdentify.countDocuments({ dateTime: earlyTime, isdefense: { $exists: false } }) // 路人识别总量
    const alarmCount = await VerifaceIdentify.countDocuments({ isdefense: true, dateTime: earlyTime }) // 布控报警数量
    const defenseTasks = await DefenseTask.find({ endTime: { $lte: nowTime } }).lean()
    let groupIds = []
    if (!_.isEmpty(defenseTasks)) {
      defenseTasks.forEach(item => {
        groupIds = groupIds.concat(item.groups)
      })
    }
    const userCount = await VeriUser.countDocuments({ group: { $in: groupIds } }) // 已经布控人员数量
    const faceServer = await FaceServer.find().lean()
    let resIds = []
    if (!_.isEmpty(faceServer)) {
      faceServer.forEach(item => {
        resIds = resIds.concat(item.resource)
      })
    }
    const faceRes = await Resource.find({ _id: { $in: resIds } }, 'ip').lean()
    const faceResCount = faceRes.length // 绑定sdk服务器的人脸相机数量
    const onlineRes = await devOnlineList() // 查询在线视频通道
    const resIps = faceRes.map(item => item.ip)
    let onlineResIps = []
    if (!_.isEmpty(onlineRes.devOnlineList)) {
      onlineResIps = onlineRes.devOnlineList.map(item => item.devIp)
    }
    const onlineFaceResources = resIps.filter(item => onlineResIps && onlineResIps.includes(item))
    const onlineFaceRes = onlineFaceResources.length //  在线人脸相机

    const data = { passbyCount, alarmCount, userCount, faceResCount, onlineFaceRes }
    require('../veriface.socket').sendMsg('verifaceToday', data)
  } catch (err) {
    handleSysException(err)
  }
}
/**
 * 统计分析
 * @param {} ctx
 */
exports.analysis = async ctx => {
  try {
    const data = await analysisData(ctx)
    ctx.body = data
  } catch (err) {
    handleSysException(err)
  }
}
/**
 * 构建统计数据
 * @param {*} ctx
 */
const analysisData = async ctx => {
  try {
    const startTime = Number(ctx.query.startTime)
    const endTime = Number(ctx.query.endTime)
    const query = { date: { $gte: startTime, $lte: endTime } }
    const points = ctx.query.points
    if (points) {
      query['res.id'] = { $in: points.split(',') }
    }
    const data = await VerifaceStatistics.find(query)
      .sort({ time: 1 })
      .lean()
    const days = (endTime - startTime) / (24 * 60 * 60) + 1 // 根据时间计算天数
    const passbyData = []
    const alarmData = []
    for (let i = 0; i < days; i++) {
      const dayData = data.filter(item => item.date === startTime + i * 24 * 60 * 60)
      let date = startTime + i * 24 * 60 * 60
      let passbyCount = 0
      let alarmCount = 0
      if (!_.isEmpty(dayData)) {
        dayData.forEach(item => {
          passbyCount = passbyCount + item.passbyCount
          alarmCount = alarmCount + item.defenseCount
        })
      }
      const passbyObj = {
        date: date,
        count: passbyCount
      }
      const alarmObj = {
        date: date,
        count: alarmCount
      }
      passbyData.push(passbyObj)
      alarmData.push(alarmObj)
    }
    return { passbyData, alarmData }
  } catch (err) {
    throw err
  }
}
/**
 * 统计分析导出
 * @param {*} ctx
 */
exports.analysisExport = async ctx => {
  try {
    const result = await analysisData(ctx)
    const data = [['日期', '路人识别量', '布控报警量']]
    result.passbyData.forEach((item, i) => {
      const row = []
      row.push(moment(item.date * 1000).format('YYYY-MM-DD'))
      row.push(item.count)
      row.push(result.alarmData[i].count)
      data.push(row)
    })
    const colInfos = [{ width: 15 }, { width: 15 }, { width: 15 }]
    const option = { '!cols': colInfos }
    const buffer = xlsx.build([{ name: '统计分析', data }], option)
    ctx.type = 'application/vnd.openxmlformats'
    const time = moment().format('YYYY-MM-DD')
    ctx.attachment('统计分析' + time + '.xlsx'.toString('utf-8'))
    ctx.body = buffer
  } catch (err) {
    handleSysException(err)
  }
}
