import Vue from 'vue'
import {
  AV_RECORD_LIST,
  AV_NVRRECORD_LIST,
  AV_NVRRECORD_OPEN,
  gbQuery,
  gbReplay,
  getDownID,
  gbPlayBackCtrl,
  vodOpen,
  frontVod,
  vodCtrl
} from 'http/video.api'

const state = {
  downloadList: [],
  eventType: {
    1: '报警输入',
    2: '视频丢失',
    3: '移动侦测',
    4: '视频遮挡',
    5: '镜头移位',
    6: '清晰度异常',
    7: '亮度异常',
    8: '噪声检测',
    9: '偏色控制',
    10: '信号缺失',
    11: '画面冻结',
    12: '周界保护',
    13: '绊线',
    14: '遗留物检测',
    15: '物品丢失',
    16: '人数统计',
    17: '斗殴',
    18: '人员滞留',
    19: '人员贴近',
    20: '哨兵管控',
    21: 'ATM看护',
    22: '车辆识别',
    23: '人脸识别',
    40: '报警链路异常',
    500: '硬盘故障',
    501: '硬盘满',
    502: '风扇异常',
    503: '网络断开',
    504: '主板异常',
    505: '通道异常',
    506: '温度异常',
    507: '时间异常',
    508: 'IP地址冲突',
    509: '非法本地访问',
    510: '硬盘坏道',
    511: 'IPC MAC校验异常',
    800: '定时录像'
  },
  activedId: '',
  isSync: false,
  isSyncCheck: false, // 用于UI上的checkbox
  isNVR: false,
  nvrTab: false, // UI上的tab切换
  resourceList: [],
  nvrList: [],
  nvrCount: 0,
  rowId: 0,
  serverId: {}
}

function changeTime(t) {
  function addZero(n) {
    return n.toString().length < 2 ? '0' + n : '' + n
  }
  // const date = t < new Date().getTime() ? new Date(t) : new Date()
  const date = new Date(t)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const secondes = date.getSeconds()
  return `${addZero(year)}-${addZero(month)}-${addZero(day)} ${addZero(hours)}:${addZero(minutes)}:${addZero(secondes)}`
}

function byteConversion(b) {
  const GB = 1024 * 1024 * 1024
  const MB = 1024 * 1024
  const KB = 1024
  if (b / GB >= 1) {
    return (b / GB).toFixed(2) + ' Gb'
  } else if (b / MB >= 1) {
    return (b / MB).toFixed(2) + ' Mb'
  } else if (b / KB >= 1) {
    return (b / KB).toFixed(2) + ' Kb'
  } else {
    return b + ' b'
  }
}

function sort(x, y) {
  const time1 = Vue.moment(x.startTime, 'YYYY-MM-DD HH:mm:ss').valueOf()
  const time2 = Vue.moment(y.startTime, 'YYYY-MM-DD HH:mm:ss').valueOf()
  return time1 - time2
}

const getters = {
  plugins(state, getters, rootState, rootGetters) {
    return rootGetters.plugin
  },
  // 合并所有通道查询结果，便于展示
  mapFilterList(state) {
    const list = []
    state.resourceList.forEach(res => {
      if (!res) {
        return
      }
      if (res.eventList) { // 中心回放录像
        res.eventList.filter(item => item.evtTblInfo.evtType !== 2147483647).forEach(item => {
          list.push({
            name: res.nodeName,
            startTime: changeTime(item.evtTblInfo.startTime * 1000),
            endTime: changeTime(item.evtTblInfo.endTime * 1000),
            size: byteConversion(item.evtTblInfo.size),
            strmInfo: item.strmInfo,
            event: item,
            type: item.evtTblInfo.evtType,
            ip: res.dsIp,
            port: res.dsPort,
            id: res.dsIp + res.dsPort,
            node: res.node
          })
        })
      } else if (res.recordInfo) { // 前端回放录像
        res.recordInfo.forEach(item => {
          list.push({
            name: res.nodeName,
            startTime: changeTime(item.sTime * 1000),
            endTime: changeTime(item.eTime * 1000),
            size: byteConversion(item.filesize * 1024),
            strmInfo: item.strmInfo, //  todo
            event: item,
            type: item.recordType,
            ip: item.devIp,
            port: item.devPort,
            id: item.devIp + item.devPort + item.channel,
            node: res.node
          })
        })
      } else if (res.recordList) { // 国标设备录像
        const recordType = {
          2: 512, // 手动录像
          3: 800, // 定时录像
          4: 'eventVideo' // 事件录像
        }
        res.recordList.forEach(item => {
          list.push({
            name: res.nodeName,
            startTime: changeTime(item.startTime * 1000),
            endTime: changeTime(item.endTime * 1000),
            size: byteConversion(item.fileSize),
            strmInfo: item.strmInfo, //  todo
            event: item,
            type: recordType[item.recordType] || 800, // 下联设备录像默认都是定时录像
            ip: item.devIp,
            port: item.devPort,
            id: item.devIp + item.devPort + item.channel,
            node: res.node,
            param: res.param
          })
        })
      }
    })
    return list.sort(sort)
  },
  nvrTableData(state) {
    return state.nvrList.map(list => list.map(item => ({
      item,
      recordType: item.recordType,
      sTime: Vue.moment(item.sTime * 1000).format('HH:mm:ss'),
      startTime: Vue.moment(item.sTime * 1000).format('YYYY-MM-DD HH:mm:ss'),
      slotTime: formatSpendTime(item.sTime, item.eTime),
      filesize: parseInt(item.filesize * 10 / 1024) / 10 + 'M',
      channel: item.channel
    })))
  }
}

const formatSpendTime = (start, end) => {
  let value = end - start
  if (!value) {
    value = 0
  }
  const seconds = value % 60
  value = parseInt(value / 60)
  const minutes = value % 60
  value = parseInt(value / 60)
  return [value, minutes, seconds].map((item, index) => {
    if (index) {
      return ('00' + item).slice(-2)
    } else {
      return item
    }
  }).filter(item => item).join(':')
}

const getId = () => {
  return new Date().getTime()
}

const mutations = {
  CHANGE_NVRTAB(state, nvr) {
    state.nvrTab = nvr
  },
  CHANGE_NVR(state, nvr) {
    state.isNVR = nvr
  },
  CHECK_SYNC(state, check) {
    state.isSyncCheck = check
  },
  SET_ROWID(state, row) {
    state.rowId = row
  },
  SET_NVRLIST(state, list) {
    state.nvrList = list
  },
  ADD_NVRLIST(state, {
    index,
    list
  }) {
    Vue.set(state.nvrList, index, list)
  },
  SET_NVRCOUNT(state, count) {
    state.nvrCount = count
  },
  ADD_NVRCOUNT(state, count) {
    state.nvrCount += count
  },
  ADD_DOWNLOADLIST(state, data) {
    data.__id = getId()
    if (typeof data.size === 'number') {
      data.size = byteConversion(data.size)
    }
    if (typeof data.type === 'number') {
      data.type = state.eventType[data.type]
    }
    state.downloadList.push(data)
  },
  SET_DOWNLOADLIST(state, list) {
    state.downloadList = list
  },
  UPDATE_PRE(state, payload) {
    state.downloadList.forEach(item => {
      if (item.__id === payload.id) {
        item.pre = payload.pre
        if (payload.pre === '100%' || payload.pre === '100.00%') {
          item.state = '下载完成'
        }
      }
    })
  },
  UP_DOWNLOADSTATE(state, data) {
    state.downloadList.forEach(val => {
      if (data === val.dumpHandle) {
        val.state = '下载完成'
        val.pre = '100%'
        val.dumpHandle = ''
        console.log(val.param.fileName + '下载完成')
      }
    })
  },
  CLOSE_DOWNLOAD(state, data) {
    state.downloadList.forEach(val => {
      if (data === val.dumpHandle) {
        val.state = '已取消'
        val.pre = '--'
        val.dumpHandle = ''
      }
    })
  },
  RE_DOWNLOAD(state, data) {
    state.downloadList.forEach(val => {
      if (val.__id === data.__id) {
        val.param = data.param
        val.state = data.state
        val.dumpHandle = data.dumpHandle
      }
    })
  },
  REMOVE_DOWNLOAD(state) {
    state.downloadList = state.downloadList.filter(item => item.state === '下载中')
  },
  CHANGE_ACTIVEID(state, id) {
    state.activedId = id
  },
  CHANGE_SYNC(state, s) {
    state.isSync = s
  },
  SET_RESOURCE(state, payload) {
    Vue.set(state.resourceList, payload.index, payload.item)
  },
  CONCAT_RESOURCE(state, payload) {
    const info = state.resourceList[payload.index]
    if (info.eventList) {
      info.eventList = info.eventList.concat(payload.item.eventList)
      info.queryTimeArr.push({
        start: payload.query.startTime,
        end: payload.query.endTime
      })
    } else if (info.recordInfo) {
      info.recordInfo = info.recordInfo.concat(payload.item.recordInfo)
    } else if (info.recordList) {
      info.recordList = info.recordList.concat(payload.item.recordList)
      info.queryTimeArr.push({
        start: payload.query.startTime,
        end: payload.query.endTime
      })
    }
    Vue.set(state.resourceList, payload.index, info)
  },
  CLEAR_RESOURCE(state) {
    state.resourceList = []
  },
  SET_SERVERID(state, data) {
    state.serverId[data.shareServer] = data.data
  }
}

const actions = {
  recordDump({
    state,
    commit,
    getters
  }, data) {
    if (typeof data === 'object') {
      data = JSON.stringify(data)
    }
    const dump = JSON.parse(getters.plugins.OpenRecordDump(data))
    const callback = function(index, DumpHandle, c) {
      getters.plugins.CloseRecordDump(+DumpHandle)
      commit('UP_DOWNLOADSTATE', +DumpHandle)
    }
    if (dump.success) {
      getters.plugin.SetRecordDumpNotifyCallback(dump.DumpHandle, callback)
    }
    return dump
  },
  backupDownloadList({
    state
  }) {
    const list = state.downloadList
    window.localStorage.downloadList = JSON.stringify(list)
  },
  recoverDownloadList({
    commit,
    getters
  }) {
    const list = window.localStorage.downloadList
    if (list) {
      const l = JSON.parse(list)
      const li = l.filter(item => item.state === '下载中')
      const json = JSON.parse(getters.plugins.GetAllRecordDump())
      if (json.success && json.handleArray) {
        const result = li.filter(item => json.handleArray.indexOf(Number(item.dumpHandle)) !== -1)
        commit('SET_DOWNLOADLIST', result)
      } else {
        console.log('get all download handler error', json.errno)
      }
    }
  },
  queryRecordlist({
    state
  }, data) {
    return AV_RECORD_LIST(data)
  },
  queryNVRRecordList({
    state
  }, data) {
    return AV_NVRRECORD_LIST(data)
  },
  nvrRecordOpen({
    state
  }, data) {
    return AV_NVRRECORD_OPEN(data)
  },
  clearNVRList({
    commit
  }) {
    commit('SET_NVRLIST', [])
    commit('SET_NVRCOUNT', 0)
  },
  queryNVRList({
    commit
  }, obj) {
    return AV_NVRRECORD_LIST(obj).then(({
      data
    }) => {
      if (!data || !data.total) {
        return data
      }
      commit('ADD_NVRLIST', {
        index: obj.rowId - 1,
        list: data.recordInfo
      })
      commit('SET_NVRCOUNT', data.total)
      commit('SET_ROWID', obj.rowId)
      return data
    })
  },
  // 回放上墙控制
  vodCtrl({ commit }, obj) {
    return vodCtrl(obj).then(({
      data
    }) => { return data }).catch(err => {
      console.log(err)
    })
  },
  // 前端回放上墙
  frontVod({ commit }, obj) {
    return frontVod(obj).then(({
      data
    }) => { return data }).catch(err => {
      console.log(err)
    })
  },
  // 中心回放上墙
  vodOpen({ commit }, obj) {
    return vodOpen(obj).then(({
      data
    }) => {
      return data
    }).catch(err => {
      console.log(err)
    })
  },
  addDownLoadList({ commit }, data) {
    commit('ADD_DOWNLOADLIST', data)
  },
  setResource({ commit }, data) {
    commit('SET_RESOURCE', data)
  },
  concatResource({ commit }, data) {
    commit('CONCAT_RESOURCE', data)
  },
  setRowid({ commit }, data) {
    commit('SET_ROWID', data)
  },
  setNvrList({ commit }, data) {
    commit('SET_NVRLIST', data)
  },
  changeNvrTab({ commit }, data) {
    commit('CHANGE_NVRTAB', data)
  },
  /**
   * 获取下级平台id
   */
  getPlatformID({ state, commit }, data) {
    return new Promise((resolve, reject) => {
      if (state.serverId[data]) {
        resolve(state.serverId[data])
      } else {
        getDownID(data).then((res) => {
          commit('SET_SERVERID', {shareServer: data, data: res.data})
          resolve(res.data)
        }).catch((err) => {
          console.log('logout error: ' + err)
          reject(err)
        })
      }
    })
  },
  gbQueryRecordList({ state }, data) {
    return gbQuery(data).catch(err => err)
  },
  gbRecordOpen({ state }, data) {
    return gbReplay(data).catch(err => err)
  },
  gbPlayBackCtrl({ state }, data) {
    return gbPlayBackCtrl(data).catch(err => err)
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
