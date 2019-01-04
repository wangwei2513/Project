import { put, get, post, remove } from '../../../http/base'
import { getAlarmDeal, addAlarmDeal, reviseAlarmDeal, deleteAlarmDeal, getAlarmDealStatus, reviseAlarmDealStatus } from 'http/alarm.api.js'

const state = {
  firePlanData: [],
  fireConfData: true,
  fireDealList: [],
  fireDealStatus: {
    id: '',
    isFireAlarmEnable: false
  }
}

const mutations = {
  GET_FIRE_PLAN(state, payload) {
    state.firePlanData = payload
  },
  GET_FIRE_CONF(state, payload) {
    state.fireConfData = payload.ismap
  },
  GET_DEAL_LIST(state, payload) {
    state.fireDealList = payload.map(item => {
      return {
        id: item._id,
        name: item.name
      }
    })
  },
  GET_FIRE_DEAL_STATUS(state, payload) {
    if (payload) {
      state.fireDealStatus.id = payload._id
      state.fireDealStatus.isFireAlarmEnable = payload.fireOpen ? payload.fireOpen : false
    }
  }
}

const actions = {
  // 3-1.应用模式获取
  getUseType({ commit, state }) {
    const param = {
      url: 'setting/alarmcfg/setfireconf'
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('GET_FIRE_CONF', res.data)
      }).catch(err => reject(err))
    })
  },
  // 保存应用模式
  setUseType({ commit, state }, payload) {
    const param = {
      body: payload,
      url: 'setting/alarmcfg/setfireconf'
    }
    return new Promise((resolve, reject) => {
      put(param).then(res => {
        resolve(res)
      }).catch((err) => {
        console.log('setUseTypeData error: ' + err)
        reject(err)
      })
    })
  },
  // 3-1.预案-获取
  getFirePlan({ commit, state }, payload) {
    const param = {
      query: {
        page: payload.page,
        limit: payload.limit
      },
      url: 'setting/alarmcfg/plan?type=' + payload.type
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('GET_FIRE_PLAN', res.data)
      }).catch(err => reject(err))
    })
  },
  // 3-2.预案-增加
  addFirePlan({ commit, state }, data) {
    const param = {
      body: data,
      url: 'setting/alarmcfg/plan'
    }
    return new Promise((resolve, reject) => {
      post(param).then(res => {
        resolve(res)
      }).catch(err => reject(err))
    })
  },
  // 3-3.预案-删除
  delFirePlan({ commit, state }, id) {
    const param = {
      url: 'setting/alarmcfg/plan/' + id
    }
    return new Promise((resolve, reject) => {
      remove(param).then(res => {
        resolve(res)
      }).catch(err => reject(err))
    })
  },
  // 3-4.预案-修改
  editFirePlan({ commit, state }, data) {
    const param = {
      body: data.plan,
      url: 'setting/alarmcfg/plan/' + data._id
    }
    return new Promise((resolve, reject) => {
      put(param).then(res => {
        resolve(res)
      }).catch(err => reject(err))
    })
  },
  // 获取警情处理数据
  getFireAlarmDealList({commit}, data) {
    return new Promise((resolve, reject) => {
      getAlarmDeal(data).then(resp => {
        commit('GET_DEAL_LIST', resp.data)
        resolve(resp)
      }).catch(err => {
        console.error('getDecoderListApi', err)
        reject(err)
      })
    })
  },
  // 警情处理addAlarmDeal
  addFireAlarmDeal({commit}, data) {
    return addAlarmDeal(data)
  },
  // 修改警情处理reviseAlarmDeal
  reviseFireAlarmDeal({commit}, data) {
    return reviseAlarmDeal(data)
  },
  // 删除deleteAlarmDeal
  deleteFireAlarmDeal({commit}, data) {
    return deleteAlarmDeal(data)
  },
  // 获取警情处理启用状态
  getFireDealStatus({commit}, data) {
    return new Promise((resolve, reject) => {
      getAlarmDealStatus().then(resp => {
        commit('GET_FIRE_DEAL_STATUS', resp.data)
        resolve(resp)
      }).catch(err => {
        console.error('getDecoderListApi', err)
        reject(err)
      })
    })
  },
  // 修改警情处理启用状态
  reviseFireDealStatus({commit}, data) {
    return reviseAlarmDealStatus(data)
  }
}

const getters = {}

export default {
  state,
  mutations,
  actions,
  getters
}
