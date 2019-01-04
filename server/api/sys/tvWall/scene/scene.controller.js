/*
 * 场景接口
 * @Author: chenkaibo
 * @Date: 2018-06-06 15:04:49
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-10-10 11:49:28
 */
'use strict'
const mongoose = require('mongoose')
const Scene = mongoose.model('Scene')
const Monitor = mongoose.model('Monitor')
const Polling = mongoose.model('Polling')
const Resource = mongoose.model('Resource')
const Layout = mongoose.model('Layout')
const Wall = mongoose.model('Wall')
const { switchScene, setJointLayout } = require('../../../bstar/tvwall.interface')
const { checkModifyName, checkAddName } = require('../tool')
const { handleSysException, transferPinyin } = require('../../../../common/tools')
const _ = require('lodash')

exports.get = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('电视墙-获取场景'))
    const scene = await Scene.findById(ctx.params.id).exec()
    ctx.status = 200
    ctx.body = scene
  } catch (error) {
    handleSysException(error)
  }
}

exports.add = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('电视墙-添加场景'))
    const res = await checkAddName(Scene, ctx.request.body.name)
    if (res) {
      ctx.throw(500, { code: 5, message: '该名称已存在' })
    }
    ctx.request.body.pinyin = transferPinyin(ctx.request.body.name)
    const scene = new Scene(ctx.request.body)
    const doc = await scene.save()
    ctx.status = 201
    ctx.set('Location', `/scene/${doc._id}`)
    ctx.body = [doc._id]
  } catch (err) {
    handleSysException(err)
  }
}

// exports.modify = async ctx => {   // 场景修改只适用于实时场景
//   try {
//     ctx.set('loginfo', encodeURI('电视墙-修改场景'))
//     const rqScene = ctx.request.body
//     const realScene = JSON.parse(JSON.stringify(rqScene))
//     if (realScene.polling !== null) {
//       realScene.polling = await Polling.findById(realScene.polling).populate({ path: 'channels', populate: { path: 'eid' } }).exec()
//       await Scene.findByIdAndUpdate(rqScene.id, { polling: rqScene.polling })
//     }
//     let noMonitor = false // 检查是否有监视器已经被删除
//     await Promise.all(realScene.info.map(async item => {
//       item.monitor = await Monitor.findById(item.monitor).populate('equipment channel').exec()
//       if (!item.monitor) noMonitor = true
//       await Promise.all(item.resources.map(async item => {
//         item.resource = await Resource.findById(item.resource).populate('eid').exec()
//         return Promise.resolve()
//       }))
//       return Promise.resolve()
//     }))
//     if (noMonitor) return ctx.throw(500, { code: 47, message: '监视器已经被删除!' })
//     // 找出轮询组里监视器与实时场景对应的监视器
//     const monitors = realScene.polling && realScene.polling.toObject().monitorsinfo
//     let infos = []
//     if (!monitors) {
//       infos = realScene.info
//     } else {
//       for (var monitor of monitors) {
//         infos.push(realScene.info.filter(item => item.monitor._id + '' === monitor + '')[0])
//       }
//     }
//     const body = {
//       monitorCount: infos.length,
//       isSceneswitch: realScene.isSceneswitch || false,
//       cameraGroup: {
//         cameraList: !realScene.polling ? [] : realScene.polling.channels.map(item => {
//           return {
//             devIp: item.eid.ip,
//             devPort: item.eid.cport,
//             channel: item.chan,
//             stream: item.stream,
//             streamConnPort: item.eid.dport
//           }
//         }),
//         interval: !realScene.polling ? 0 : realScene.polling.interval
//       },
//       monitorConf: infos && infos.map(item => {
//         return {
//           devIp: item.monitor.equipment.ip,
//           devPort: item.monitor.equipment.cport,
//           monitor: item.monitor.channel.chan,
//           playType: item.type === 2 ? 2 : realScene.polling && realScene.polling.monitorsinfo.findIndex(monitor => monitor.toString() === item.monitor._id.toString()) !== -1 ? 1 : 0,
//           // playType: 1,
//           paneCount: item.panecount,
//           paneTag: item.monitor.startcode,
//           panePlay: item.resources.map(item => {
//             return {
//               pane: item.code,
//               devIp: item.resource.eid.ip,
//               devPort: item.resource.eid.cport,
//               channel: item.resource.chan,
//               stream: item.resource.stream,
//               streamConnPort: item.resource.eid.dport
//             }
//           })
//         }
//       })
//     }
//     if (body.cameraGroup.cameraList.length && !body.monitorConf.length) return ctx.throw(500, { code: 47, message: '监视器已经被删除' })
//     console.log('switchScene----', JSON.stringify(body))
//     try {
//       await switchScene(ctx, body)
//     } catch (error) {
//       return ctx.throw(500, { code: error.error, message: '请求第三方接口异常', type: 'sys' })
//     }
//     await Scene.findByIdAndUpdate(ctx.params.id, rqScene).exec()
//     await Wall.findByIdAndUpdate(realScene.wall, { selectedplan: null })
//     ctx.status = 200
//   } catch (err) {
//     // return ctx.throw(500, err.code ? { code: err.code, message: err.message, type: err.type || '' } : { code: 1001, message: '系统内部错误' })
//     handleSysException(err)
//   }
// }
exports.modify = async ctx => { // 场景修改只适用于实时场景
  try {
    ctx.set('loginfo', encodeURI('电视墙-修改场景'))
    const rqScene = ctx.request.body
    const pollingInfos = []
    if (rqScene.polling && rqScene.polling.length) {
      for (var item of rqScene.polling) {
        const pollingInfo = await Polling.findById(item).populate([{ path: 'channels', select: 'eid chan stream', populate: { path: 'eid', select: 'ip cport dport' } }]).exec()
        pollingInfos.push(pollingInfo)
      }
    }
    let noMonitor = false // 检查是否有监视器已经被删除
    await Promise.all(rqScene.info.map(async item => {
      item.monitor = await Monitor.findById(item.monitor).populate('equipment channel').exec()
      if (!item.monitor) { noMonitor = true }
      await Promise.all(item.resources.map(async item => {
        item.resource = await Resource.findById(item.resource).populate('eid').exec()
        return Promise.resolve()
      }))
      return Promise.resolve()
    }))
    if (noMonitor) { return ctx.throw(500, { code: 47, message: '监视器已经被删除!' }) }
    const infos = rqScene.info
    let pollingMonitors = []
    pollingInfos.forEach(item => {
      pollingMonitors = [...pollingMonitors, ...item.monitorsinfo]
    })
    const monitorConfs = infos && infos.map(item => {
      return {
        devIp: item.monitor.equipment.ip,
        devPort: item.monitor.equipment.cport,
        monitor: item.monitor.channel.chan,
        monitorId: item.monitor._id.toString(),
        playType: item.type === 2 ? 2 : pollingMonitors.length && pollingMonitors.findIndex(monitor => monitor.toString() === item.monitor._id.toString()) !== -1 ? 1 : 0,
        paneCount: item.panecount,
        paneTag: item.monitor.startcode,
        panePlay: item.resources.map(item => {
          return {
            pane: item.code,
            devIp: item.resource.eid.ip,
            devPort: item.resource.eid.cport,
            channel: item.resource.chan,
            stream: item.resource.stream,
            streamConnPort: item.resource.eid.dport
          }
        })
      }
    })
    const body = {
      sceneswitch: [
        ...pollingInfos.map(item => {
          return {
            isSceneswitch: true,
            cameraGroup: {
              cameraList: !item ? [] : item.channels.map(item => {
                return {
                  devIp: item.eid.ip,
                  devPort: item.eid.cport,
                  channel: item.chan,
                  stream: item.stream,
                  streamConnPort: item.eid.dport
                }
              }),
              interval: !item ? 0 : item.interval
            },
            monitorConf: monitorConfs.filter(monitorConf => {
              if (item.monitorsinfo.findIndex(monitior => monitior + '' === monitorConf.monitorId) !== -1) {
                delete monitorConf.monitorId
                delete monitorConf.panePlay
                return monitorConf
              }
            })
          }
        }),
        ...monitorConfs.filter(item => item.playType !== 1).map(item => {
          delete item.monitorId
          return {
            cameraGroup: {
              cameraList: [],
              interval: 0
            },
            monitorConf: [item]
          }
        })
      ]
    }
    // if (!body.sceneswitch.monitorConf.length) return ctx.throw(500, { code: 47, message: '监视器已经被删除' })
    console.log('switchScene----', JSON.stringify(body))
    // 切换布局
    const { sceneid } = await Layout.findById(rqScene.layout, 'sceneid').lean().exec()
    const { jointcontroller } = await Wall.findById(rqScene.wall, 'jointcontroller').lean().exec()
    if (jointcontroller) {
      const setJointLayoutBody = {
        devInfo: {
          devIp: jointcontroller.info.ip,
          port: jointcontroller.info.port
        },
        scenesCall: { sScreenId: 0, scenesId: sceneid }
      }
      try {
        await setJointLayout(ctx, setJointLayoutBody)
      } catch (error) {
        ctx.throw(500, { code: error.error, message: '请求第三方接口异常', type: 'sys' })
      }
    }
    try {
      await switchScene(ctx, body)
    } catch (error) {
      return ctx.throw(500, { code: error.error, message: '请求第三方接口异常', type: 'sys' })
    }
    const newScene = _.cloneDeep(rqScene)
    delete newScene._id
    delete newScene.name
    await Scene.findByIdAndUpdate(rqScene.id, newScene).exec()
    const updateData = { selectedplan: null, selectedscene: rqScene._id }
    if (rqScene.layout) {
      updateData.layout = rqScene.layout
    }
    await Wall.findByIdAndUpdate(rqScene.wall, updateData)
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}
exports.delete = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('电视墙-删除场景'))
    await Scene.findByIdAndRemove(ctx.params.id).exec()
    ctx.status = 200
  } catch (error) {
    handleSysException(error)
  }
}

exports.modifyName = async ctx => {
  try {
    ctx.set('loginfo', encodeURI('电视墙-修改场景名'))
    const res = await checkModifyName(Scene, ctx.params.id, ctx.request.body.name)
    if (res) {
      ctx.throw(500, { code: 5, message: '该名称已存在' })
    }
    const { name } = ctx.request.body
    await Scene.findByIdAndUpdate(ctx.params.id, { name })
    ctx.status = 200
  } catch (err) {
    handleSysException(err)
  }
}
exports.updateSenceResource = async data => {
  try {
    const { resources } = data
    const sences = await Scene.find({}).exec()
    const resLength = resources ? resources.length : 0
    const senLength = sences ? sences.length : 0
    for (let i = 0; i < resLength; i++) {
      for (let j = 0; j < senLength; j++) {
        sences[j].info && sences[j].info.forEach(item => {
          item.resources && item.resources.forEach(item => {
            if ((item.resource + '') === (resources[i]._id + '')) {
              // 删除对应的资源
              if (item instanceof mongoose.mongo.ObjectID) {
                sences[j].resources.deleteMany(item)
              } else {
                sences[j].resources.deleteMany(item + '')
              }
            }
          })
        })
      }
    }
    sences.forEach(item => Scene.findByIdAndUpdate(item._id, item))
  } catch (error) {
    console.log(error)
  }
}
exports.updateSenceMonitorPosition = async monitors => {
  try {
    const sences = await Scene.find({}).exec()
    const resLength = monitors ? monitors.length : 0
    const senLength = sences ? sences.length : 0
    for (let i = 0; i < resLength; i++) {
      for (let j = 0; j < senLength; j++) {
        sences[j].info && sences[j].info.forEach(item => {
          if (item.monitor) {
            if (item.monitor + '' === monitors[i]._id + '') {
              sences[j].info.remove(item)
            }
          }
        })
      }
    }
    sences.forEach(item => Scene.findByIdAndUpdate(item._id, item))
  } catch (error) {
    console.log(error)
  }
}
exports.updateOneSenceResource = async resource => {
  try {
    const sences = await Scene.find({}).exec()
    sences && sences.forEach(async item => {
      if (_.isArray(item.info.resources)) {
        item.info.resources = item.info.resources.filter(item => item.resource + '' !== resource._id + '')
        await item.save()
      }
    })
  } catch (error) {
    console.log(error)
  }
}
exports.updateOneSenceMonitorPosition = async monitor => {
  try {
    const sences = await Scene.find({}).exec()
    sences && sences.forEach(async item => {
      item.info = item.info.filter(item => item.monitor + '' !== monitor._id + '')
      await item.save()
    })
  } catch (error) {
    console.log(error)
  }
}
