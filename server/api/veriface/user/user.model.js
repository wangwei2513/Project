/*
 * @Author: zhangminbo
 * @Date: 2018-06-05 14:23:59
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-12-13 18:41:21
 */
/**
 * SDK人员模型
 * **/
'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schem = new Schema({
  name: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ['0', '1', '2'], // 1:女, 2:男
    default: '0'
  },
  age: {
    type: Number
  },
  code: {
    type: String
  },
  remark: {
    type: String
  },
  sdkImgInfos: [
    {
      id: Number,
      host: {
        ip: String,
        port: Number
      }
    }
  ],
  group: {
    type: Schema.Types.ObjectId,
    ref: 'VeriGroup'
  },
  image: {
    type: String // 图片path
  }
})
mongoose.model('VeriUser', schem)
