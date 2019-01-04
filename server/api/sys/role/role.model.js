/*
 * @Author: linhang
 * @Date: 2018-10-15 19:01:25
 * @Last Modified by: linhang
 * @Last Modified time: 2018-12-18 14:05:44
 */
'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var RoleSchema = new Schema(
  {
    // 名称
    name: {
      type: String,
      required: '角色名称必填',
      unique: true
    },
    // action id集合
    actions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Action'
      }
    ],
    resources: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Resource'
      }
    ],
    // 登录类型,1|账户登录，2|ukey登录，3|账户或者ukey，4|账户和ukey
    loginType: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: 1
    },
    // 顺序
    order: Number
  },
  { timestamps: true }
)
mongoose.model('Role', RoleSchema)
