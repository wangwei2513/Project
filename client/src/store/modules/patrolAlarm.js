import {
  msgReplay,
  confirmAlarm,
  confirmSingleAlarm,
  nearestSingleAlarm
} from '@http/patrolAlarm.api'

const state = {
  nearestSingle: []
}

const getters = {
  nearestSingleList(state) {
    return state.nearestSingle
  }
}

const mutations = {
  GET_NEAREST_SINGLE(state, payload) {
    state.nearestSingle = payload
  }
}

const actions = {
  /**
   * 消息回复发送
   */
  massageReplay({
    commit
  }, payload) {
    return new Promise((resolve, reject) => {
      msgReplay(payload)
        .then(res => {
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  /**
   * 确认报警
   */
  confirmAlarms({
    commit
  }, payload) {
    return new Promise((resolve, reject) => {
      confirmAlarm(payload)
        .then(res => {
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  confirmSingle({}, id) {
    return new Promise((resolve, reject) => {
      confirmSingleAlarm(id)
        .then(res => {
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  /**
   * 地图,获取报警点位附近单兵
   * payload 报警点位id
   */
  nearestSingle({
    commit
  }, payload) {
    return new Promise((resolve, reject) => {
      nearestSingleAlarm(payload)
        .then(res => {
          commit('GET_NEAREST_SINGLE', res.data)
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    })
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
