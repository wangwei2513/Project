import {
  post
} from '../../../http/base'
import Vue from 'vue'
import alarm from 'src/socket/alarm'
import { getAlarmPower } from 'http/alarm.api'
import { read } from '../../../storage/index'
const state = {
  receiveWarnList: {
    test: [{}]
  },
  receiveFireWarning: null,
  sendSocket: {
    name: 'stone2'
  },
  activeWarnInfo: {},
  activeWarnTab: 'test',
  videoWarnList: [],
  warnCounts: 0,
  warnNewData: {},
  couldPlay: false,
  allAlarmDataButFire: [],
  // 接收到的数据以确认过
  confirmedData: [],
  activedIndex: 0,
  // 区别于其他报警，单独保存报警求助
  alarmHelpsSocketValue: [],
  allAlarmNewOne: '',
  alarmPageData: '',
  receive: {},
  alarmType: [],
  isAcceptWarn: true, // 报警处理页面是否接收报警
  alarmPower: {} // 报警权限
}
const mutations = {
  CLOSE_VIDEO_WARNLIAT(state, data) {
    state.videoWarnList = data
  },
  CREAT_RECEIVE_WARNLIST(state, data) {
    for (let i = 0; i < data.length; i++) {
      let prop = data[i].value
      state.receive[prop] = []
      if (state.receiveWarnList[prop] && state.receiveWarnList[prop].length !== 0) {
        state.receive[prop] = state.receiveWarnList[prop]
      }
    }
    state.receiveWarnList = state.receive
  },
  SET_WARN_COUNTS(state, payload) {
    let data = {}
    data = JSON.parse(JSON.stringify(payload.alarmInfo))
    data.groupId = `${data.devIp}|${data.devPort}|${data.channel}|${data.eventType}`
    if ((data.classifyName && data.classifyId) || data.eventType === 'focusAttention') {
      state.warnCounts++
      state.warnNewData = data
    }
  },
  SET_RECEIVE_WARNLIAST(state, payload) {
    let data = {}
    data = JSON.parse(JSON.stringify(payload.alarmInfo))
    data.groupId = `${data.devIp}|${data.devPort}|${data.channel}|${data.eventType}`
    data.alarmPower = state.alarmPower
    if (data.eventType === 'focusAttention') {
      data.classifyName = state.alarmType[0].label
      data.classifyId = state.alarmType[0].value
    }
    state.receiveFireWarning = data
    if (data.classifyName && data.classifyId) {
      if (state.alarmPageData !== 'alarmPage') {
        state.receiveWarnList = {
          test: [{}]
        }
        let arrVal = []
        data.count = 1
        arrVal.push(data)
        state.receiveWarnList[data.classifyId] = arrVal
      } else if (state.alarmPageData === 'alarmPage') {
        let arr = state.receiveWarnList[data.classifyId]
        if (arr.length === 0) {
          data.count = 1
          arr.unshift(data)
          state.receiveWarnList[data.classifyId] = arr
        } else {
          if (data.eventType === 'vioRetrograde' || data.eventType === 'vioPark' || data.eventType === 'vioTurnLeft' || data.eventType === 'vioTurnRight') {
            data.groupId = `${data.devIp}|${data.devPort}|${data.channel}|${data.eventType}|${data.alarmId}`
            data.count = 1
            arr.unshift(data)
            state.receiveWarnList[data.classifyId] = arr
          } else {
            let isRepeat = false
            for (let i = 0; i < arr.length; i++) {
              if (arr[i].devIp === data.devIp && arr[i].devPort === data.devPort && arr[i].channel === data.channel && arr[i].eventType === data.eventType) {
                arr[i].count++
                isRepeat = true
                break
              }
            }
            if (!isRepeat) {
              if (arr.length >= 100) {
                arr.shift()
              }
              data.count = 1
              arr.unshift(data)
              state.receiveWarnList[data.classifyId] = arr
            }
          }
        }
      }
    } else {
      if (data.eventType === 'askHelp' || data.eventType === 'acceptHelp' || data.eventType === 'endHelp') {
        if (state.alarmPageData !== 'alarmPage') {
          data.status = (data.eventType === 'askHelp' ? '请求对讲' : '接受对讲')
          state.alarmHelpsSocketValue = []
          state.alarmHelpsSocketValue.push(data)
        } else if (state.alarmPageData === 'alarmPage') {
          let alarmHelps = state.alarmHelpsSocketValue
          if (alarmHelps.length === 0) {
            data.status = (data.eventType === 'askHelp' ? '请求对讲' : '接受对讲')
            alarmHelps.push(data)
          } else {
            let helpRepeat = false
            for (let j = 0; j < alarmHelps.length; j++) {
              if (alarmHelps[j].devIp === data.devIp && alarmHelps[j].devPort === data.devPort && alarmHelps[j].channel === data.channel && alarmHelps[j].eventType === data.eventType) {
                helpRepeat = true
                break
              } else if (alarmHelps[j].devIp === data.devIp && alarmHelps[j].devPort === data.devPort && alarmHelps[j].channel === data.channel && alarmHelps[j].eventType !== data.eventType) {
                alarmHelps[j].status = data.eventType === 'acceptHelp' ? '接受对讲' : '请求对讲'
                Vue.set(state.alarmHelpsSocketValue, j, alarmHelps[j])
                helpRepeat = true
                break
              }
            }
            if (!helpRepeat) {
              if (alarmHelps.length >= 50) {
                state.alarmHelpsSocketValue.shift()
              }
              data.status = (data.eventType === 'askHelp' ? '请求对讲' : '接受对讲')
              state.alarmHelpsSocketValue.push(data)
            }
          }
        }
      }
    }
  },
  CONFIRM_ALARM(state, payload) {
    let data = JSON.parse(JSON.stringify(payload))
    if (state.alarmPageData !== 'alarmPage' && data.devIp === state.allAlarmNewOne.devIp && data.devPort === state.allAlarmNewOne.devPort && data.channel === state.allAlarmNewOne.channel) {
      if (state.allAlarmNewOne.eventType === data.eventType) {
        state.receiveWarnList = {
          test: [{}]
        }
      } else if (data.eventType === 'endHelp') {
        state.alarmHelpsSocketValue = []
      }
      state.videoWarnList = []
    } else if (state.alarmPageData === 'alarmPage') {
      // 报警求助 tabs显示，视频联动显示，统计分析的报警类型显示，不走table
      if (data.eventType === 'endHelp') {
        data.groupId1 = `${data.devIp}|${data.devPort}|${data.channel}|askHelp`
        data.groupId2 = `${data.devIp}|${data.devPort}|${data.channel}|acceptHelp`
        state.confirmedData = []
        state.confirmedData.push(data)
      } else {
        if (data.eventType === 'vioRetrograde' || data.eventType === 'vioPark' || data.eventType === 'vioTurnLeft' || data.eventType === 'vioTurnRight') {
          data.groupId = `${data.devIp}|${data.devPort}|${data.channel}|${data.eventType}|${data.alarmId}`
        } else {
          data.groupId = `${data.devIp}|${data.devPort}|${data.channel}|${data.eventType}`
        }
        state.confirmedData = []
        state.confirmedData.push(data)
      }
    }
    for (let i = 0; i < state.allAlarmDataButFire.length; i++) {
      if (state.allAlarmDataButFire[i].alarmId === payload.alarmId) {
        state.allAlarmDataButFire.splice(i, 1)
        break
      }
    }
  },
  SET_VIDEO_WARN_LIST(state, payload) {
    let data = {}
    data = JSON.parse(JSON.stringify(payload.alarmInfo))
    data.uid = `${data.devIp}|${data.devPort}|${data.channel}|${data.eventType}`
    if (data.eventType === 'vioRetrograde' || data.eventType === 'vioPark' || data.eventType === 'vioTurnLeft' || data.eventType === 'vioTurnRight') {
      data.url = []
      if (data.carImg1Base64) {
        data.url.push(data.carImg1Base64)
      }
      if (data.carImg2Base64) {
        data.url.push(data.carImg2Base64)
      }
      if (data.carImgBase64) {
        data.url.push(data.carImgBase64)
      }
      if (data.carNumPicBase64) {
        data.url.push(data.carNumPicBase64)
      }
      if (data.combinedPicBase64) {
        data.url.push(data.combinedPicBase64)
      }
      data.uid = `${data.devIp}|${data.devPort}|${data.channel}|${data.eventType}|${data.alarmId}`
      if (state.alarmPageData !== 'alarmPage') {
        state.videoWarnList = []
        state.videoWarnList.push(data)
      } else if (state.alarmPageData === 'alarmPage') {
        state.videoWarnList.push(data)
      }
    } else {
      if (state.alarmPageData !== 'alarmPage') {
        state.videoWarnList = []
        state.videoWarnList.push(data)
        state.couldPlay = true
      } else if (state.alarmPageData === 'alarmPage') {
        if (state.videoWarnList && state.videoWarnList.length === 0) {
          state.videoWarnList.push(data)
          state.couldPlay = true
        } else if (state.videoWarnList && state.videoWarnList.length !== 0) {
          let isRepeat = false
          for (let i = 0; i < state.videoWarnList.length; i++) {
            if (state.videoWarnList[i].uid === data.uid) {
              isRepeat = true
              state.couldPlay = false
              break
            } else if (state.videoWarnList[i].devIp === data.devIp && state.videoWarnList[i].devPort === data.devPort && state.videoWarnList[i].channel === data.channel && (state.videoWarnList[i].eventType === 'askHelp' || state.videoWarnList[i].eventType === 'acceptHelp' || data.eventType === 'endHelp')) {
              isRepeat = true
              state.couldPlay = false
              break
            }
          }
          if (!isRepeat) {
            state.couldPlay = true
            if (state.videoWarnList.length >= 500) {
              state.videoWarnList.shift()
            }
            state.videoWarnList.push(data)
          }
        }
      }
    }
  },
  SET_ACTIVE_WARN_INFOS(state, data) {
    state.activeWarnInfo = data
  },
  SET_ACTIVE_WARN_TAB(state, data) {
    state.activeWarnTab = data
  },
  ALL_ALARM_TOBE_SURE(state, payload) {
    let data = {}
    data = JSON.parse(JSON.stringify(payload.alarmInfo))
    // 相同报警的不同时间报警_id不同，可用groupId归类同一个报警
    if (data.eventType === 'vioRetrograde' || data.eventType === 'vioPark' || data.eventType === 'vioTurnLeft' || data.eventType === 'vioTurnRight') {
      data.groupId = `${data.devIp}|${data.devPort}|${data.channel}|${data.eventType}|${data.alarmId}`
    } else {
      data.groupId = `${data.devIp}|${data.devPort}|${data.channel}|${data.eventType}`
    }
    // 判断是否非消防报警
    if (data.eventType !== 'fireAlarm' && data.eventType !== 'fireFailure') {
      state.allAlarmDataButFire.push(data)
    }
  },
  INDEX_CHANGE(state, data) {
    state.activedIndex = data
  },
  SPLICE_CLOSE_DATA(state, data) {
    let arr = state.videoWarnList
    state.videoWarnList.map((item, index) => {
      if (data.uid === item.uid) {
        arr.splice(index, 1)
      }
    })
    state.videoWarnList = arr
  },
  SPLICE_RECEIVE_WARN_LIST(state, data) {
    state.receiveWarnList[data.activeWarnTab].splice(data.index, 1)
  },
  CLEAR_RECEIVE_WARN_LIST(state) {
    state.receiveWarnList = {
      test: [{}]
    }
  },
  CLEAR_ALARMHELP_DATA(state, data) {
    state.alarmHelpsSocketValue = data
  },
  SPLICE_ALARMHELP_DATA(state, data) {
    state.alarmHelpsSocketValue.splice(data, 1)
  },
  ALL_ALARM_NEWONE(state, data) {
    if (data && data.alarmInfo) {
      state.allAlarmNewOne = data.alarmInfo
    } else {
      state.allAlarmNewOne = {}
    }
  },
  NAV_ALARM_PAGE(state, data) {
    state.alarmPageData = data
  },
  SET_ALARM_TYPE(state, data) {
    state.alarmType = data
  },
  SET_IS_ACCEPT_WARN(state, data) {
    state.isAcceptWarn = data
  },
  SPLICE_ALLALARM_DATA_BUT_FIRE(state, data) {
    for (let i = data.length - 1; i >= 0; i--) {
      state.allAlarmDataButFire.splice(i, 1)
    }
  },
  SET_ALARM_POWER_LIST(state, data) {
    state.alarmPower = {}
    data && data.properties && data.properties.forEach(item => {
      state.alarmPower[item] = 1
    })
  }
}

const receiveAlarm = (state, commit, dispatch, data) => {
  /** 导航最新报警消息 */
  commit('ALL_ALARM_NEWONE', data)
  dispatch('getAlarmPowers', data)
}
const removeAlarm = (state, commit, dispatch, val) => {
  const alarmNewOne = state.allAlarmNewOne
  if (val && alarmNewOne && val.devIp === alarmNewOne.devIp && val.devPort === alarmNewOne.devPort && (val.eventType === alarmNewOne.eventType || val.eventType === 'endHelp')) {
    commit('ALL_ALARM_NEWONE', {})
  }
  if (val && val.eventType !== 'fireAlarm' && val.eventType !== 'fireFailure') {
    commit('CONFIRM_ALARM', val)
  } else {
    /** 消防报警确认报警信息 */
    dispatch('receiveConfirmFireWarn', val)
  }
}

const actions = {
  navAlarmPage({
    commit
  }, data) {
    commit('NAV_ALARM_PAGE', data)
  },
  creatReceiveWarnList({
    commit
  }, data) {
    commit('CREAT_RECEIVE_WARNLIST', data)
  },
  alarmWarning({
    state,
    commit,
    dispatch,
    rootGetters
  }) {
    dispatch('getSortData').then(() => {
      commit('SET_ALARM_TYPE', rootGetters.enabledSort)
    })
    alarm.on('all', (data) => {
      receiveAlarm(state, commit, dispatch, data)
    })
    alarm.on('confirmAlarm', (val) => {
      removeAlarm(state, commit, dispatch, val)
    })
  },
  /** 清除导航栏报警信息 */
  clearNavWarningData({
    commit,
    data
  }) {
    commit('ALL_ALARM_NEWONE', data)
  },
  clearWarningList({
    commit,
    data
  }) {
    alarm.remove('all', () => {})
    alarm.remove('confirmAlarm', () => {})
  },
  setActiveWarnInfo({
    commit
  }, data) {
    commit('SET_ACTIVE_WARN_INFOS', data)
  },
  setActiveWarnTab({
    commit
  }, data) {
    commit('SET_ACTIVE_WARN_TAB', data)
  },
  spliceReceiveWarnList({
    commit
  }, data) {
    commit('SPLICE_RECEIVE_WARN_LIST', data)
  },
  confirmWarnMessages({
    state,
    commit
  }, obj) {
    let sendList = []
    let indexList = []
    state.allAlarmDataButFire.map((item, index) => {
      obj.list.map((Ite) => {
        if (item.groupId === Ite.groupId) {
          sendList.push({
            _id: item.alarmId, // String(sel.alarmId),
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
    indexList.sort((a, b) => {
      return a - b
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
        commit('SPLICE_ALLALARM_DATA_BUT_FIRE', indexList)
        resolve(res)
      }).catch(err => reject(err))
    })
  },
  clearAlarmHelpData({
    commit
  }, data) {
    commit('CLEAR_ALARMHELP_DATA', data)
  },
  clearVideoWarnList({commit}, data) {
    commit('CLOSE_VIDEO_WARNLIAT', data)
  },
  spliceAlarmHelpData({commit}, data) {
    commit('SPLICE_ALARMHELP_DATA', data)
  },
  setIsAcceptWarn({commit}, data) {
    commit('SET_IS_ACCEPT_WARN', data)
  },
  /* 获取报警权限 */
  getAlarmPowers({state, commit, dispatch}, data) {
    const param = {
      roleId: read('roleId'),
      resId: data.alarmInfo.channelId || data.alarmInfo.devId
    }
    return new Promise((resolve, reject) => {
      getAlarmPower(param).then(res => {
        commit('SET_ALARM_POWER_LIST', res.data)
        /** 报警处理未确认报警信息 */
        if (data.alarmInfo && data.alarmInfo.eventType !== 'fireAlarm' && data.alarmInfo.eventType !== 'fireFailure') {
          /* 报警处理页面是否接收报警 */
          if (state.isAcceptWarn) {
            commit('SET_RECEIVE_WARNLIAST', data)
            commit('SET_WARN_COUNTS', data)
            commit('SET_VIDEO_WARN_LIST', data)
            commit('ALL_ALARM_TOBE_SURE', data)
          }
        } else {
          /** 消防报警未确认报警信息 */
          dispatch('receiveFireWarn', {alarmPower: state.alarmPower, data: data})
        }
        resolve(res.data)
      }).catch(err => {
        reject(err)
      })
    })
  },
  /* 获取报警主机及防区权限 */
  getAlarmHostPowers(store, data) {
    const param = {
      roleId: read('roleId'),
      resId: data
    }
    return getAlarmPower(param)
  }
}

const getters = {
  allAlarmNewOneData(state) {
    let data = ''
    if (state.allAlarmNewOne.eventType) {
      data = {
        name: state.allAlarmNewOne.name,
        organization: state.allAlarmNewOne.organization,
        time: state.allAlarmNewOne.time,
        eventType: state.allAlarmNewOne.eventType
      }
    } else {
      data = {}
    }
    return data
  }
}
export default {
  state,
  mutations,
  actions,
  getters
}
