import {
  get,
  post,
  remove
} from 'http/base'
import toTreeData from '../../../assets/js/toTreeData'
const state = {
  // 应急预案模式控制
  emPlanMOdel: 'app',
  // 应急预案树
  emTree: [],
  emNode: {
    isroot: true
  },
  oneEmInfo: {},
  emergencyList: []
}
const getters = {
  emergencyData(state) {
    return state.emergencyList
  }
}
const mutations = {
  SET_EMPLAN_MODEL(state, data) {
    state.emPlanMOdel = data
  },
  GET_EMPLAN_TREE(state, data) {
    state.emTree = data
  },
  // 预案节点
  SET_EMNOSE_STATE(state, data) {
    state.emNode = data
  },
  // 单个预案信息
  SET_ONEEM_INFO(state, data) {
    state.oneEmInfo = data
  },
  EMERGENCY_ACTION(state, data) {
    state.emergencyList = data
  }
}
const actions = {
  // 获取应急预案树
  getEmTree({
    commit
  }, playod) {
    const param = {
      query: {
        type: playod
      },
      url: '/setting/org/tree/'
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res.data)
        var arr = []
        arr.push(JSON.parse(JSON.stringify(res.data)))
        commit('GET_EMPLAN_TREE', toTreeData(arr))
      }).catch(err => {
        reject(err)
      })
    })
  },
  // 获取应急预案信息
  getEmInfo({
    commit,
    state
  }, type) {
    const param = {
      query: {
        type: type.type
      },
      url: '/setting/org/' + type.Id
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res.data)
        // commit('SET_ORG_INFO', res.data)
      }).catch(err => reject(err.response.data.message))
    })
  },
  // 获取全部应急预案信息
  getEmInfoById({
    commit,
    state
  }, obj) {
    const param = {
      query: {
        type: obj.type
      },
      url: '/setting/org/' + obj.id
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res.data)
        // commit('SET_ORG_INFO', res.data)
      }).catch(err => reject(err.response.data.message))
    })
  },
  // 新增应急预案
  // 3-添加机构
  addEm({
    commit,
    state
  }, form) {
    const param = {
      body: form,
      url: '/setting/org/'
    }
    return new Promise((resolve, reject) => {
      post(param).then(res => {
        resolve(res)
      }).catch(err => reject(err.response.data.message))
    })
  },
  // 删除应急预案
  deleteEm({
    commit,
    state
  }, id) {
    const param = {
      url: '/setting/org/' + id
    }
    return new Promise((resolve, reject) => {
      remove(param).then(res => {
        resolve(res.data)
        // commit('SET_ORG_INFO', res.data)
      }).catch(err => {
        reject(err.response.data.message)
      })
    })
  },
  // 获取指定应急预案
  getOneEmPlan({
    commit
  }, id) {
    const param = {
      query: {
        orgid: id
      },
      url: '/emergency/plan/'
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res.data[0])
        commit('SET_ONEEM_INFO', res.data[0])
      }).catch(err => reject(err.response.data.message))
    })
  },
  // 新增应急预案
  addOneEmPlan({
    commit
  }, body) {
    const param = {
      body,
      url: '/emergency/plan'
    }
    return new Promise((resolve, reject) => {
      post(param).then(res => {
        resolve(res.data)
        // commit('SET_ONEM_INFO', res.data)
      }).catch(err => reject(err.response.data.message))
    })
  },
  // 删除应急预案
  deleteOneEm({
    commit,
    state
  }, id) {
    const param = {
      url: '/emergency/plan/' + id
    }
    return new Promise((resolve, reject) => {
      remove(param).then(res => {
        resolve(res.data)
        // commit('SET_ORG_INFO', res.data)
      }).catch(err => {
        reject(err.response.data.message)
      })
    })
  },
  // 获取不同报警类型下的应急预案信息
  emergencyAction({
    commit
  }, payload) {
    const param = {
      url: '/emergency/plan/list?planId=' + payload.planId
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res.data)
        commit('EMERGENCY_ACTION', res.data)
      }).catch(err => reject(err.response.data.message))
    })
  }
}

export default {
  state,
  getters,
  mutations,
  actions
}
