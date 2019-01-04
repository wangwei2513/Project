/*
 * 人脸数据缓存(实现质量优先方案)
 * @Author: chenkaibo
 * @Date: 2018-12-14 11:22:41
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-12-21 14:13:36
 */
'use strict'
let cache = {}
const config = require('../../../../config').backend
const filePath = config.fileDirs.facePasserPictureDir
const postal = require('postal')
const fs = require('fs')
module.exports = {
  checkUpdate: function (track, quality, time, faceDefense) {
    const cacheFacePath = cache[track + '_' + cache.createTime + '_face']
    const cacheFullPath = cache[track + '_' + cache.createTime + '_full']
    cache.updateTime = time
    if (cacheFacePath) {
      if (quality > cache.quality) {
        return {
          update: true,
          faceImagePath: cacheFacePath,
          fullImagePath: cacheFullPath
        }
      }
    } else {
      const nowDate = new Date().toLocaleDateString()
      const basePath = `${filePath}/${nowDate}`
      if (!fs.existsSync(basePath)) {
        fs.mkdirSync(basePath)
      }
      const faceImagePath = `${basePath}/${track}_${time}_face.jpg`
      const fullImagePath = `${basePath}/${track}_${time}_full.jpg`
      cache.createTime = time
      cache.quality = quality
      faceDefense && (cache.faceDefense = faceDefense)
      cache[track + '_' + time + '_face'] = faceImagePath
      cache[track + '_' + time + '_full'] = fullImagePath
      return {
        add: true,
        faceImagePath,
        fullImagePath
      }
    }
  }
}
let id
id = setInterval(() => {
  const now = (new Date().getTime()) / 1000
  if (cache.updateTime && now - cache.updateTime > 5) {
    cache = {}
  }
}, 5000)
function startInterval() {
  id = setInterval(() => {
    const now = (new Date().getTime()) / 1000
    if (cache.updateTime && now - cache.updateTime > 5) {
      cache = {}
    }
  }, 5000)
}
function stopInterval() {
  clearInterval(id)
}
postal.subscribe({
  channel: 'faceParameter',
  topic: 'open.passer',
  callback: function () {
    startInterval()
  }
})
postal.subscribe({
  channel: 'faceParameter',
  topic: 'colse.passer',
  callback: function () {
    stopInterval()
  }
})
