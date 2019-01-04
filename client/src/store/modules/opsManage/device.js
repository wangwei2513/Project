import { get } from '../../../http/base'
import moment from 'moment'
// import Vue from 'vue'

const state = {
  videoData: [],
  // 报警设备
  alarmData: [],
  // 消防设备
  fireControlData: [],
  // 解码设备
  decodeData: [],
  // 平台服务
  platformServices: [],
  deviceNum: [],
  inPageTotal: 0,
  inpageLimit: 100,
  inPageCur: 1,
  onlineTime: [],
  onlineTimeData: [],
  onlineTimeDataCounts: 0
}
const mutations = {
  SAVE_PLATFORM_SERVICES(stata, param) {
    stata.platformServices = JSON.parse(JSON.stringify(param))
  },
  SAVE_FIRE_CONTROL_DATA(stata, param) {
    stata.fireControlData = JSON.parse(JSON.stringify(param))
  },
  SAVE_DECODE_DATA(stata, param) {
    stata.decodeData = JSON.parse(JSON.stringify(param))
  },
  SAVE_ALARM_DATA(stata, param) {
    stata.alarmData = JSON.parse(JSON.stringify(param))
  },
  SAVE_VIDEO_DATA(stata, param) {
    stata.videoData = JSON.parse(JSON.stringify(param))
  },
  SAVE_DEVICE_NUM(stata, param) {
    stata.deviceNum = JSON.parse(JSON.stringify(param))
  },
  SAVE_IN_PAGE_LIMIT(stata, param) {
    stata.inpageLimit = Number(param['x-bsc-limit'])
  },
  SAVE_IN_PAGE_TOTAL(stata, param) {
    stata.inPageTotal = Number(param['x-bsc-count'])
  },
  SAVE_IN_PAGE_CUR(stata, param) {
    stata.inPageCur = Number(param['x-bsc-cur'])
  },
  SAVE_ONLINE_TIME(stata, param) {
    stata.onlineTime = JSON.parse(JSON.stringify(param))
  },
  SAVE_ONLINE_TIME_DATA(stata, param) {
    stata.onlineTimeData = JSON.parse(JSON.stringify(param))
  },
  SAVE_ONLINE_TIME_DATA_COUNTS(stata, param) {
    stata.onlineTimeDataCounts = JSON.parse(JSON.stringify(param))
  }
}
const actions = {
  getDeviceData({ commit, rootState, state }, data) {
    if (data.bigtype !== 4) { // 如果是平台服务模块 不需要oid
      data.oid = rootState.orgSetting.orgActiveId
    }
    const params = {
      query: data,
      url: 'setting/operation/device'
    }
    return new Promise((resolve, reject) => {
      get(params).then(res => {
        if (data.bigtype === 4 || data.bigtype === 5) {
          commit('SAVE_PLATFORM_SERVICES', res.data)
        } else if (data.bigtype === 0) {
          commit('SAVE_VIDEO_DATA', res.data.devList)
        } else if (data.bigtype === 1) {
          commit('SAVE_ALARM_DATA', res.data.devList)
        } else if (data.bigtype === 2) {
          commit('SAVE_FIRE_CONTROL_DATA', res.data.devList)
        } else if (data.bigtype === 3) {
          commit('SAVE_DECODE_DATA', res.data.devList)
        }
        commit('SAVE_IN_PAGE_LIMIT', res.headers)
        commit('SAVE_IN_PAGE_TOTAL', res.headers)
        commit('SAVE_IN_PAGE_CUR', res.headers)
        resolve(res)
      }).catch(err => {
        reject(err)
      })
    })
  },
  getDeviceNum({ commit, rootState, state }, data) {
    const params = {
      query: {
        id: rootState.orgSetting.orgActiveId,
        never: data ? -1 : 0
      },
      url: 'setting/operation/counts'
    }
    return new Promise((resolve, reject) => {
      get(params).then(res => {
        commit('SAVE_DEVICE_NUM', res.data)
        resolve(res)
      }).catch(err => {
        reject(err)
      })
    })
  },
  getOnlineTime({ commit, rootState, state }, data) {
    const params = {
      query: data,
      url: 'setting/operation/device/details'
    }
    return new Promise((resolve, reject) => {
      get(params).then(res => {
        let title = []
        let data = []
        res.data.forEach((e, index) => {
          title.push({ time: moment(e.createTime * 1000).format('YYYY-MM-DD') })
          const arr = e.Log.reverse()
          data[index] = []
          arr.forEach((j, i) => {
            if (i > 0) {
              data[index].push({
                startTime: arr[i - 1].time * 1000,
                endTime: arr[i].time * 1000,
                type: arr[i - 1].type
              })
            }
          })
        })
        commit('SAVE_ONLINE_TIME', title)
        commit('SAVE_ONLINE_TIME_DATA', data)
        commit('SAVE_ONLINE_TIME_DATA_COUNTS', Number(res.headers['x-bsc-count']))
        resolve(res)
      }).catch(err => {
        reject(err)
      })
    })
  }
}
export default {
  state,
  mutations,
  actions
}
