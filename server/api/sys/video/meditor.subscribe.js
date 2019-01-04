const postal = require('postal')
const Storage = require('mongoose').model('Storage')
const Record = require('mongoose').model('Record')
const Snapshot = require('mongoose').model('Snapshot')
const notice = require('../../bstar/video.interface')
const Transication = require('mongoose').model('Transication')
const { addsystem, addOperate } = require('../../log/log.controller')

// 订阅资源删除信息，删除对应的配置(单个)
postal.subscribe({
  channel: 'resources',
  topic: 'item.delete',
  callback: async function (data, envelope) {
    const id = data.id
    try {
      await addOperate({ info: '关联操作-删除资源同步删除资源对应的录像管理配置', role: 'system', user: 'system', tasktype: '录像管理', reqBody: id, method: 'delete' })
      await Promise.all([
        Storage.findOneAndRemove({ resource: id }),
        Record.findOneAndRemove({ resource: id }),
        Snapshot.findOneAndRemove({ resource: id })
      ])
      Promise.all([
        notice.info(data.ctx, { module: 'recordcfg', newData: [], varyData: [] }),
        notice.info(data.ctx, { module: 'plantimerecord', newData: [], varyData: [] }),
        notice.info(data.ctx, { module: 'planeventrecord', newData: [], varyData: [] })
      ]).catch(err => {
        console.log({ code: 4106, message: 'bstar资源配置通知接口异常' }, err)
        addsystem({ worknum: 106, msg: 'bstar资源配置通知接口异常' })
      })
    } catch (err) {
      Transication.create({
        module: '录像管理',
        method: '删除',
        data: JSON.stringify(id),
        table: 'Storage|Record|',
        function: 'findOneAndRemove'
      })
      console.log(err)
      addsystem({ worknum: 106, msg: err.message })
    }
  }
})
// 订阅资源删除信息，删除对应的配置(多个)
postal.subscribe({
  channel: 'resources',
  topic: 'array.delete',
  callback: async function (data, envelope) {
    const ids = data.ids
    console.log('录像管理中同步删除的配置资源', ids)
    try {
      await addOperate({ info: '关联操作-批量删除资源同步删除资源对应的录像管理配置', role: 'system', user: 'system', tasktype: '录像管理', reqBody: JSON.stringify(ids), method: 'delete' })
      await Promise.all([
        Storage.remove({ resource: { $in: ids } }),
        Record.remove({ resource: { $in: ids } }),
        Snapshot.remove({ resource: { $in: ids } })
      ])
      Promise.all([
        notice.info(data.ctx, { module: 'recordcfg', newData: [], varyData: [] }),
        notice.info(data.ctx, { module: 'plantimerecord', newData: [], varyData: [] }),
        notice.info(data.ctx, { module: 'planeventrecord', newData: [], varyData: [] })
      ]).catch(err => {
        console.log({ code: 4106, message: 'bstar资源配置通知接口异常' }, err.message)
        addsystem({ worknum: 106, msg: 'bstar资源配置通知接口异常' })
      })
    } catch (err) {
      Transication.create({
        module: '录像管理',
        method: '删除',
        data: JSON.stringify(ids),
        table: 'Storage|Record|',
        function: 'findOneAndRemove'
      })
      addsystem({ worknum: 106, msg: err.message })
      console.log(err)
    }
  }
})
