/*
 * @Author: zhangminbo
 * @Date: 2018-06-05 14:23:28
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-12-21 17:45:03
 */
'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema({
  res: {
    type: Schema.Types.ObjectId, // 资源id
    ref: 'Resource'
  },
  resName: {
    type: String // 资源名称
  },
  groupImgId: {
    type: String
  },
  age: {
    type: Number
  },
  gender: {
    type: String
  },
  dateTime: { // 日期时间戳
    type: String
  },
  hour: { // 当日小时
    type: Number
  },
  time: { // 当前时间
    type: Number
  },
  image: {
    type: String
  },
  similar: { // 相似度
    type: Number
  },
  group: {
    type: Schema.Types.ObjectId,
    ref: 'VeriGroup' // 群组id
  },
  groupName: {
    type: String // 群组名称
  },
  timestamp: { // 抓拍时间
    type: Number
  },
  isdefense: {
    type: Boolean
  },
  alarmAudio: {
    type: String
  },
  color: {
    type: String
  },
  // 用户信息方便后期检索
  userId: {
    type: String
  },
  userGender: {
    type: String
  },
  userAge: {
    type: Number
  },
  userName: {
    type: String
  },
  userCode: {
    type: String
  },
  userImage: { // 用户磁盘图片
    type: String
  },
  faceImage: { // 人脸图
    type: String
  },
  fullImage: { // 全景图
    type: String
  },
  resIp: {
    type: String
  },
  resPort: {
    type: String
  },
  resChannel: {
    type: Number
  },
  alarmPlan: {
    type: Schema.Types.ObjectId,
    ref: 'alarmPlan'
  }
})

mongoose.model('VerifaceIdentify', schema)
