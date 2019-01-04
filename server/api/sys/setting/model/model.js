/*
 * 地图模型库
 * @Author: chenkaibo
 * @Date: 2018-10-28 17:01:00
 * @Last Modified by: hansen.liuhao
 * @Last Modified time: 2018-12-18 09:49:13
 */
'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Model = new Schema({
  name: String, // 模型名称
  // type: { // 类型
  //   type: String,
  //   enum: ['video', 'alarm', 'alarmHelp', 'petrol', 'sentry', 'auxiliary']
  // },
  // category: { // 类别
  //   type: String,
  //   enum: ['bolt', 'hemisphere', 'fastball', 'InfraredBolt', 'panorama', 'generalAlarm', 'fireAlarm', 'alarmBox', 'alarmPillar', 'general', 'gather'] // bolt:枪机, InfraredBolt:红外枪机, hemisphere:半球, fastball:快球, panorama: 全景 alarmBox：报警箱 alarmPillar：报警柱 generalAlarm:普通报警, fireAlarm:消防报警, general:常规, gather:集合
  // },
  files: [
    {
      status: {
        type: String,
        enum: ['online', 'offline', 'alarm']
      },
      name: String, // 模型名称
      path: String // 模型文件
    }
  ],
  picture: {
    // 模型图片
    name: String, // 图片名称
    path: String // 图片id
  },
  default: {
    type: Boolean,
    default: false
  },
  oid: {
    type: String
  },
  // 模型的亮度
  brightness: Number,
  // 距地高度
  height: Number
})
mongoose.model('Model', Model)
