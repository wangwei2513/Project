/*
 * @Author: hansen.liuhao
 * @Date: 2018-08-01 16:08:01
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-08-07 10:57:56
 */

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TrafficLane = new Schema({

  deptParent: String, // 父级部门id
  devChnFactory: String, // 厂商
  devChnType: String, // 设备类型
  devChnName: String, // 设备名称
  devChnId: String, // 设备编号
  deptName: String, // 部门名称
  deptId: String, // 部门id
  channel: String, // 通道号
  devChnDirect: String, // 车道方向
  devChnLane: String, // 车道号
  // 服务器id
  sid: {
    type: Schema.Types.ObjectId,
    ref: 'Device'
  }
}, { timestamps: true })

mongoose.model('TrafficLane', TrafficLane)
