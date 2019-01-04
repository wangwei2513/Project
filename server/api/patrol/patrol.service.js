/*
 * @Author: hansen.liuhao
 * @Date: 2018-10-18 11:43:38
 * @Last Modified by: hansen.liuhao
 * @Last Modified time: 2018-11-13 20:12:42
 */
const mongoose = require('mongoose')
const PatrolRecord = mongoose.model('PatrolRecord')
const PatrolMessage = mongoose.model('PatrolMessage')
const PatrolWarnning = mongoose.model('PatrolWarnning')
const Sysparamters = mongoose.model('Sysparamters')
const PatrolTrajectory = mongoose.model('PatrolTrajectory')
const paging = require('../paging')
const moment = require('moment')

class PatrolService {
  /**
   * 查询过去某一天用户的所有巡更记录及巡更点的打卡信息
   * @param query {object} 查询条件
   * @param filed {string} 返回数据的字段
   * @return {object}
   */
  async findAllRecords (query, filed) {
    try {
      const records = await PatrolRecord.find(query, filed)
        .populate('points.message')
        .sort('startTime')
        .lean()
      for (const item of records) {
        item.points.forEach(element => {
          if (element.message) {
            element.content = element.message.content
            element.photo = element.message.photo
            element.video = element.message.video
            element.title = element.message.title
            delete element.message
          }
        })
        // 自由模式下签到的节点排在前面
        // if (item.taskType === CONSTANT.FLOAT) {
        item.points.sort((a, b) => {
          var aduplicate = a.arrivalTime === '' ? '23:59:59' : a.arrivalTime
          var bduplicate = b.arrivalTime === '' ? '23:59:59' : b.arrivalTime
          if (aduplicate > bduplicate) {
            return -1
          } else if (aduplicate === bduplicate) {
            return 0
          }
          return 1
        })
        // }
      }
      return records
    } catch (error) {
      throw error
    }
  }
  /**
   * 获取巡更指定id的巡更记录
   * @param id {string} 文档id
   * @return {object}
   */
  async findById (id) {
    try {
      const record = await PatrolRecord.findById(id).lean()
      return record
    } catch (error) {
      throw error
    }
  }
  /**
   * 更新巡更消息
   * @param id {string} 文档id
   * @param body {object} 文档更新的字段
   * @return void
   */
  async msgFindByIdAndUpdate (id, body) {
    try {
      await PatrolMessage.findByIdAndUpdate(id, body)
    } catch (error) {
      throw error
    }
  }
  /**
   * 创建单兵报警
   * @param entiy {object} 单兵报警实体
   * @return object
   */
  async warnningCreate (entity) {
    try {
      const result = await PatrolWarnning.create(entity)
      return result
    } catch (error) {
      throw error
    }
  }
  /**
   * 获取指定id的单兵报警
   * @param id {string} 单兵报警文档id
   * @return object
   */
  async warnningfindById (id, selection = '-__v -createdAt -updatedAt') {
    try {
      const result = await PatrolWarnning.findById(id, selection)
      return result
    } catch (error) {
      throw error
    }
  }
  /**
   * 获取指定id的单兵报警
   * @param id {string} 单兵报警文档id
   * @return object
   */
  async warnningPageQuery (query, selection = '', sort, paganation, population = '', ctx) {
    try {
      const result = await paging.listQuery(PatrolWarnning, query, selection, sort, paganation, population, ctx)
      return result
    } catch (error) {
      throw error
    }
  }
  /**
   * 获取系统参数
   * @return object
   */
  async getSysParams () {
    try {
      const result = await Sysparamters.findOne({}).lean()
      return result
    } catch (error) {
      throw error
    }
  }
  /**
   * 巡更轨迹记录
   * @param {object} 单兵用户组
   * @param {object} 单兵信息
   * @param {number} 最大有效时间(分钟)
   * @param {object} 地理位置坐标
   */
  async setTrajectory (usrGroup, user, holdTime, geo) {
    try {
      const userId = user._id.toString()
      const date = moment(moment().format('YYYYMMDD')).format('X')
      if (usrGroup[userId]) {
        const now = moment().format('X')
        if (usrGroup[userId] < now) {
          usrGroup[userId] = moment(moment.unix(now).add(holdTime, 'm')).format('X')
          await PatrolTrajectory.update(
            { date, usrId: userId },
            { $push: { trajectory: Object.assign(geo, { moment: moment().format('HH:mm:ss') }) } },
            { upsert: true }
          )
        }
      } else {
        usrGroup[userId] = moment(moment().add(holdTime, 'm')).format('X')
        await PatrolTrajectory.update(
          { date, usrId: userId, realname: user.realname },
          { $push: { trajectory: Object.assign(geo, { moment: moment().format('HH:mm:ss') }) } },
          { upsert: true }
        )
      }
    } catch (error) {
      throw error
    }
  }
  /**
   * 查找满足条件的轨迹
   * @param  query {object} 查询条件
   * @return {object} 巡更轨迹
   */
  async findTrajectory (query, filter) {
    try {
      const result = await PatrolTrajectory.findOne(query).lean()
      if (result) {
        const trajectory = result.trajectory.filter(item => {
          if (item.moment >= filter.start && item.moment <= filter.end) {
            return item
          }
        })
        result.trajectory = trajectory
        return result
      } else {
        return { trajectory: [] }
      }
    } catch (error) {
      throw error
    }
  }
}

module.exports = PatrolService
