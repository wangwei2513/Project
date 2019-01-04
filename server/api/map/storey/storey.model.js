/*
 * 楼层模型
 * @Author: chenkaibo
 * @Date: 2018-06-06 14:42:15
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-08-08 18:08:42
 */

'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const StoreySchema = new Schema({
  name: { // 名称
    type: String,
    required: true
  },
  picture: { // 楼层图片
    id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    size: {
      width: Number,
      height: Number
    }
  },
  mapId: {
    type: Schema.Types.ObjectId, // 承载底图
    ref: 'MapList'
  },
  desc: { // 楼层描述
    type: String
  },
  class: { // 楼层层级
    type: Number
  },
  bid: { // 所属楼宇
    type: Schema.Types.ObjectId,
    ref: 'Building',
    required: true
  },
  pid: { // 当前楼层负责人
    name: { // 负责人名称
      type: String
    },
    mobile: { // 负责人电话
      type: String
    }
  }
}, { timestamps: true })

mongoose.model('Storey', StoreySchema)
