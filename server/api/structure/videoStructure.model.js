/**
 * 结构化视频模型
 * @time: 2017-7-5
 * @author: hansen
 *
 */

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const videoStructureSchema = new Schema({
  // 文件名称
  fileName: {
    type: String,
    required: true,
    index: true
  },
  // 文件真实路径
  filePath: {
    type: String,
    required: true
  },
  // 文件播放路径
  path: {
    type: String,
    required: true
  },
  // 文件上传日期
  date: {
    type: Number,
    required: true
  },
  // 视频类型 [1|人脸，2|车辆]
  type: {
    type: Number,
    required: true
  }
}, { timestamps: true })

mongoose.model('videoStructure', videoStructureSchema)
