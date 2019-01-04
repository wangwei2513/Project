/*
 * @Author: linhang
 * @Date: 2018-09-10 09:22:53
 * @Last Modified by: linhang
 * @Last Modified time: 2018-09-13 19:51:46
 */
'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const DutyPlanSchema = new Schema(
  {
    // 排班计划名称
    name: {
      type: String,
      required: '名称必填'
    },
    // 值班开始时间
    startTime: {
      type: Number,
      required: '开始时间必填'
    },
    // 值班结束时间
    endTime: {
      type: Number,
      required: '结束时间必填'
    },
    // 排班模板
    template: {
      type: Schema.Types.ObjectId,
      ref: 'DutyTemplate'
    },
    // 班组列表
    group: [
      {
        org: {
          type: Schema.Types.ObjectId,
          ref: 'Org'
        },
        sort: Number
      }
    ],
    // 排班详情
    detail: [
      {
        date: Number,
        staffs: [
          [
            {
              type: Schema.Types.ObjectId,
              ref: 'DutyStaff'
            }
          ]
        ]
      }
    ]
  },
  { timestamps: true }
)

mongoose.model('DutyPlan', DutyPlanSchema)
