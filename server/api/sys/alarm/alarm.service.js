/*
 * @Author: chenkaibo
 * @Date: 2018-10-22 19:11:46
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2018-11-21 18:52:13
 */
'use strict'
const mongoose = require('mongoose')
const Resource = mongoose.model('Resource')
const Device = mongoose.model('Device')
const AlarmCfg = mongoose.model('alarmCfg')
const { alarmArm, alarmDisarm, alarmClean, alarmBypass, alarmPass, alarmStatus } = require('../../bstar/dev.interface')
class AlarmService {
  /**
   * 根据id查找设备
   * @param {*} id
   * @memberof AlarmService
   */
  async findDeviceById (id, select) {
    try {
      const devInfo = await Device.findById(id, select).lean().exec()
      return devInfo
    } catch (error) {
      throw error
    }
  }
  /**
   * 根据id查找资源
   * @param {*} id
   * @memberof AlarmService
   */
  async findResourceById (id, select) {
    try {
      const resInfo = await Resource.findById(id, select).lean().exec()
      return resInfo
    } catch (error) {
      throw error
    }
  }
  /**
   * 根据eid查找资源
   * @param {*} id
   * @memberof AlarmService
   */
  async findResourceByQuery (query) {
    try {
      const reses = await Resource.find(query).lean().exec()
      return reses
    } catch (error) {
      throw error
    }
  }
  async mergeAlarmStatus (reses, result) {
    try {
      result && result.length && reses.forEach(res => {
        const temp = result.find(item => +item.channel === res.chan)
        temp && (res.alarmStatus = temp.status)
      })
      return reses
    } catch (error) {
      throw error
    }
  }
  /**
   *
   * 根据资源查找联动视频
   * @param {*} rid
   * @memberof AlarmService
   */
  async getActionVideoByRes (rid) {
    try {
      const alarmCfg = await AlarmCfg.findOne({ resource: rid, type: 1 }, 'actionVideo').lean().exec()
      return (alarmCfg && alarmCfg.actionVideo) ? alarmCfg.actionVideo : []
    } catch (error) {
      throw error
    }
  }

  /**
   * 获取布撤防请求参数
   * @param {*} ctx
   * @returns
   * @memberof AlarmService
   */
  async getReqBody (ctx) {
    try {
      let info
      let body
      if (ctx.request.body.type === 'dev') {
        info = await this.findDeviceById(ctx.params.id, 'ip cport')
        body = { devIp: info.ip, devPort: info.cport }
      } else {
        info = await this.findResourceById(ctx.params.id, 'ip port chan')
        body = { devIp: info.ip, devPort: info.port, channel: info.chan }
      }
      return body
    } catch (error) {
      throw error
    }
  }
  /**
   * 布防
   * @param {*} ctx
   * @memberof AlarmService
   */
  async arm (ctx) {
    try {
      const body = await this.getReqBody(ctx)
      await alarmArm(ctx, body)
    } catch (error) {
      throw (error)
    }
  }
  /**
   * 撤防
   * @param {*} ctx
   * @memberof AlarmService
   */
  async disarm (ctx) {
    try {
      const body = await this.getReqBody(ctx)
      await alarmDisarm(ctx, body)
    } catch (error) {
      throw (error)
    }
  }
  /**
   * 报警清除
   * @param {*} ctx
   * @memberof AlarmService
   */
  async alarmClean (ctx) {
    try {
      const body = await this.getReqBody(ctx)
      await alarmClean(ctx, body)
    } catch (error) {
      throw (error)
    }
  }
  /**
   * 旁路
   * @param {*} ctx
   * @memberof AlarmService
   */
  async bypass (ctx) {
    try {
      const resInfo = await this.findResourceById(ctx.params.id, 'ip port chan')
      await alarmBypass(ctx, { devIp: resInfo.ip, devPort: resInfo.port, channel: resInfo.chan })
    } catch (error) {
      throw (error)
    }
  }
  /**
   * 撤旁
   * @param {*} ctx
   * @memberof AlarmService
   */
  async pass (ctx) {
    try {
      const resInfo = await this.findResourceById(ctx.params.id, 'ip port chan')
      await alarmPass(ctx, { devIp: resInfo.ip, devPort: resInfo.port, channel: resInfo.chan })
    } catch (error) {
      throw (error)
    }
  }
  /**
   * 获取设备的布撤防状态
   * @param {*} ctx
   * @memberof AlarmService
   */
  async getDevAlarmStatus (ctx) {
    try {
      const devInfo = await this.findDeviceById(ctx.query.id, 'ip cport')
      const result = await alarmStatus(ctx, { devIp: devInfo.ip, devPort: devInfo.cport })
      return result
    } catch (error) {
      return ''
    }
  }
  /**
   * 获取通道的布撤防状态
   * @param {*} ctx
   * @memberof AlarmService
   */
  async getResAlarmStatus (ctx) {
    try {
      const devInfo = await this.findDeviceById(ctx.query.eid, 'ip cport')
      const result = await alarmStatus(ctx, { devIp: devInfo.ip, devPort: devInfo.cport })
      return result.channelStatus
    } catch (error) {
      return []
    }
  }
}
module.exports = AlarmService
