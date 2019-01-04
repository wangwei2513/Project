/*
 * @Author: chenkaibo
 * @Date: 2018-06-05 14:24:07
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-12-17 14:41:35
 */
const rp = require('request-promise').defaults({ json: true })
const req = (options) => {
  return new Promise((resolve, reject) => {
    options.uri = `http://${options.host.ip}:${options.host.port}/${options.uri}`
    delete options.host
    rp(options).then((data) => resolve(data)).catch(error => reject(error))
  })
}

exports.req = req
