/**
 * sdk统计信息表
 * **/
'use strict'
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new Schema(
  {
    time: Number, // 统计时间戳
    date: Number, // 统计时间戳(日期)
    hour: Number, // 统计时间（小时）
    passbyCount: Number,
    defenseCount: Number,
    groups: [
      {
        name: String,
        id: String,
        count: {
          type: Number,
          default: 0
        }
      }
    ],
    res: [
      {
        id: String,
        name: String,
        count: {
          type: Number,
          default: 0
        }
      }
    ]
  },
  { timestamps: true }
)

mongoose.model('VerifaceStatistics', schema)
