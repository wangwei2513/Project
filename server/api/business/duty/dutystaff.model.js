/*
 * @Author: linhang
 * @Date: 2018-09-10 09:22:58
 * @Last Modified by: linhang
 * @Last Modified time: 2018-09-19 10:53:43
 */
'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const DutyStaffSchema = new Schema(
  {
    // 员工号
    code: {
      type: String,
      required: '员工号必填',
      unique: true
    },
    // 姓名
    name: {
      type: String,
      required: '姓名必填'
    },
    // 性别,0|女性，1|男性
    gender: {
      type: Number,
      required: '性别必填',
      enum: [0, 1]
    },
    // 联系方式
    phone: {
      type: String,
      required: '联系方式必填'
    },
    // 所属班组
    group: {
      type: Schema.Types.ObjectId,
      ref: 'Org'
    },
    // 部门
    department: String,
    // 职务
    title: String,
    // 通讯地址
    address: String
  },
  { timestamps: true }
)

mongoose.model('DutyStaff', DutyStaffSchema)
