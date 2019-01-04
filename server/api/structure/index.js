/**
 * 结构化视频路由
 * @time:207-6-17
 * @author:hansen
 */
'use strict'

const router = require('koa-router')()
const path = require('path')
const fs = require('fs')
const config = require('../../../config').backend
const createFolder = (to) => {
  var sep = path.sep
  var folders = to.split(sep)
  var p = ''
  while (folders.length) {
    p += folders.shift() + sep
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p)
    }
  }
}
const isExist = fs.existsSync(config.videoDir)
if (!isExist) {
  createFolder(config.videoDir)
}
const koaBody = require('koa-body')({
  multipart: true,
  formidable: {
    uploadDir: config.videoDir,
    keepExtensions: true
  }
})
const controller = require('./videoStructure.controller')

router.get('/index', controller.index)
router.post('/upload', koaBody, controller.upload)
router.delete('/:id', controller.delete)

module.exports = router
