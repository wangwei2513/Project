import {
  get,
  post
} from '../../../http/base'

const state = {
  fireOrgTreeData: [],
  receiveData: [],
  alarmIdsStore: [],
  mapAlarmInfo: null, // 地图接受报警信息
  allAlarmDataOnlyFire: [],
  confirmedFireData: [],
  fireAlarmPageData: '',
  fireAlarmNewOneData: '',
  fireAlarmPower: {}
}

const mutations = {
  NAV_FIREALARM_PAGE(state, data) {
    state.fireAlarmPageData = data
  },
  GET_FIRE_TREEDATA(state, payload) {
    state.fireOrgTreeData = [payload]
  },
  RECEIVE_WARNNING(state, payload) {
    let data = {}
    data = JSON.parse(JSON.stringify(payload.alarmInfo))
    data.alarmPower = state.fireAlarmPower
    if (!data.classifyName && !data.classifyId && data.slot) {
      // 相同报警的不同时间报警_id不同，可用groupId归类同一个报警
      data.groupId = `${data.devIp}|${data.devPort}|${data.channel}|${data.eventType}`
      state.allAlarmDataOnlyFire.push(data)
      if (state.fireAlarmPageData !== 'fireAlarmPage') {
        state.receiveData = []
        state.alarmIdsStore = []
        state.receiveData.push(data)
        state.alarmIdsStore.push(data.alarmId)
      } else if (state.fireAlarmPageData === 'fireAlarmPage') {
        let arr = state.receiveData
        let idArr = state.alarmIdsStore
        state.mapAlarmInfo = data
        if (arr.length === 0) {
          arr.push(data)
          idArr.push(data.alarmId)
          state.receiveData = arr
          state.alarmIdsStore = idArr
        } else {
          let isRepeat = false
          for (let i = 0; i < arr.length; i++) {
            if (arr[i].devIp === data.devIp && arr[i].devPort === data.devPort && arr[i].channel === data.channel && arr[i].slot === data.slot) {
              isRepeat = true
              break
            }
          }
          if (!isRepeat) {
            if (arr.length >= 100) {
              arr.shift()
            }
            arr.push(data)
            idArr.push(data.alarmId)
            state.receiveData = arr
            state.alarmIdsStore = idArr
          }
        }
      }
    }
  },
  CONFIRE_FIRE_ALARM(state, payload) {
    let data = JSON.parse(JSON.stringify(payload))
    if (state.fireAlarmPageData !== 'fireAlarmPage') {
      const newData = state.fireAlarmNewOneData
      if (data.devIp === newData.devIp && data.devPort === newData.devPort && data.channel === newData.channel) {
        state.receiveData = []
        state.alarmIdsStore = []
      }
    } else if (state.fireAlarmPageData === 'fireAlarmPage') {
      // 已确认过的报警
      data.groupId = data.devIp + '|' + data.devPort + '|' + data.channel + '|' + data.eventType
      state.confirmedFireData = []
      state.confirmedFireData.push(data)
    }
    for (let i = 0; i < state.allAlarmDataOnlyFire.length; i++) {
      if (state.allAlarmDataOnlyFire[i].alarmId === payload.alarmId) {
        state.allAlarmDataOnlyFire.splice(i, 1)
        break
      }
    }
  },
  SPLICE_FIRE_ALARM(state, payload) {
    state.receiveData.splice(payload, 1)
  },
  GET_FIRE_ALARM_NEW_DATA(state, data) {
    state.fireAlarmNewOneData = data
  },
  CLEAR_FIRE_ALARM() {
    state.receiveData = []
  },
  SPLICE_ALLALARM_DATA_ONLYFIRE(state, payload) {
    for (let i = payload.length - 1; i >= 0; i--) {
      state.allAlarmDataOnlyFire.splice(i, 1)
    }
  },
  SET_MAPALARMINFO(state, data) {
    state.mapAlarmInfo = data
  },
  SET_FIRE_ALARM_POWER(state, data) {
    state.fireAlarmPower = data
  }
}

var warningWebsocket
const actions = {
  // ÷SET_MAPALARMINFO
  setMapAlarmInfo({commit}, data) {
    commit('SET_MAPALARMINFO', data)
  },
  fireAlarmPage({
    commit
  }, data) {
    commit('NAV_FIREALARM_PAGE', data)
  },
  receiveFireWarn({
    commit,
    rootState
  }, data) {
    commit('SET_FIRE_ALARM_POWER', data.alarmPower)
    commit('RECEIVE_WARNNING', data.data)
  },
  receiveConfirmFireWarn({
    commit,
    rootState
  }, data) {
    commit('GET_FIRE_ALARM_NEW_DATA', rootState.allAlarmNewOne)
    commit('CONFIRE_FIRE_ALARM', data)
  },
  spliceFireAlarm({commit}, data) {
    commit('SPLICE_FIRE_ALARM', data)
  },
  clearFireAlarm({commit}) {
    commit('CLEAR_FIRE_ALARM')
  },
  CloseFireWebscoket({
    commit,
    state
  }, data) {
    if (warningWebsocket) {
      // warningWebsocket.close()
    }
  },
  confirmFireWarnMessages({
    state,
    commit
  }, obj) {
    let sendList = []
    let indexList = []
    state.allAlarmDataOnlyFire.map((item, index) => {
      obj.list.map((Ite) => {
        if (item.groupId === Ite.groupId) {
          // 若确认报警的groupId与allAlarmDataOnlyFire里存的相等，则allAlarmDataOnlyFire里的也进行确认处理
          sendList.push({
            _id: item.alarmId,
            ackContent: obj.ackContent,
            devIp: item.devIp,
            devPort: item.devPort,
            channel: item.channel,
            eventType: item.eventType,
            devId: item.devId,
            channelId: item.channelId,
            index: item.index !== undefined ? item.index : ''
          })
          indexList.push(index)
        }
      })
    })
    const data = {
      alarmIdList: sendList
    }
    const param = {
      body: data,
      url: '/alarm/alarmaffirm'
    }
    return new Promise((resolve, reject) => {
      post(param).then(res => {
        commit('SPLICE_ALLALARM_DATA_ONLYFIRE', indexList)
        resolve(res)
      }).catch(err => reject(err))
    })
  },
  // 获取消防主机输入防区 以分配资源的树
  getfireAlarmOrgTree({
    commit,
    state
  }) {
    const param = {
      url: 'setting/resource/tree?type=11&orgtype=0'
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('GET_FIRE_TREEDATA', res.data)
      }).catch((err) => {
        console.log('getfireAlarmOrgTree error: ' + err)
        reject(err)
      })
    })
  },
  // 点击设备树 获取联动配置视频开流信息
  getfireStreamData({
    commit,
    state
  }, id) {
    const param = {
      url: 'setting/alarmcfg/setfire/info/' + id
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res.data)
      }).catch((err) => {
        console.log('getfireStreamData error: ' + err)
        reject(err)
      })
    })
  }
}

const getters = {}

export default {
  state,
  mutations,
  actions,
  getters
}
