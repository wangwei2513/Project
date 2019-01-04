/**
 * 应急预案数据模型
 * @since: 2018-3-9
 * @author:hansne
 */
'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const subDoc = new Schema(
  {
    name: {
      type: String,
      required: [true, '姓名不能为空']
    },
    position: {
      type: String
    },
    phone: {
      type: String,
      required: [true, '电话必填']
    }
  },
  { _id: false }
)
const Plan = new Schema(
  {
    // 预案图片id
    planPhoto: {
      type: String,
      required: [true, '缺少预案图片']
    },
    // 备注
    remark: {
      type: String
    },
    // 所属组织
    orgid: {
      type: Schema.Types.ObjectId,
      ref: 'Org'
    },
    // 预案类型名称
    plan: {
      type: String
    },
    // 预案类型id
    planId: {
      type: Number
    },
    // 预案人员
    group: {
      type: [subDoc]
    }
  },
  { timestamps: true }
)

mongoose.model('EmergencyPlan', Plan)
