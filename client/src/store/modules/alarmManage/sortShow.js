import { get, put } from '../../../http/base'
const state = {
  sortData: [],
  alarmPicData: [],
  normalPicData: [],
  hasGetSortData: false
}
const getters = {
  // 分类筛选
  enabledSort(state) {
    let sortAllData = state.sortData
    let enabledData = []
    if (sortAllData !== undefined && sortAllData.length !== 0) {
      sortAllData.map((v) => {
        if (v.status === true) {
          // 封装成报警管理需要的格式
          enabledData.push({
            value: v._id,
            label: v.name,
            alarmaffirm: {
              affirmflag: v.alarmAffirm.status,
              autoaffirm: {
                status: v.alarmAffirm.autoAffirm.status,
                intervaltime: v.alarmAffirm.autoAffirm.maxDelay
              },
              handaffirm: {
                status: v.alarmAffirm.manualAffirm.status
              }
            },
            actionRule: JSON.parse(JSON.stringify(v.actionRule)),
            level: v.alarmLevel,
            maxdelaytime: v.maxDelay,
            minintervaltime: v.minInterval,
            alarmtemplate: v.timeTemplate
          })
        }
      })
    }
    return enabledData
  },
  isGetSortData(state) {
    return state.hasGetSortData
  }
}
const mutations = {
  GET_SORT_DATA(state, data) {
    state.sortData = data
    state.hasGetSortData = true
  },
  GET_ALARM_PIC(state, data) {
    state.alarmPicData = data
  },
  GET_NORMAL_PIC(state, data) {
    state.normalPicData = data
  }
}
const actions = {
  // 获取报警分类配置
  getSortData({ commit, state }) {
    const param = {
      url: 'setting/alarmcfg/alarmtype'
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('GET_SORT_DATA', res.data)
      }).catch(err => reject(err))
    })
  },
  // 更新报警分类配置
  updataSort({ commit, state }, data) {
    const param = {
      body: data,
      url: 'setting/alarmcfg/alarmtype/' + data._id
    }
    return new Promise((resolve, reject) => {
      put(param).then(res => {
        resolve(res)
      }).catch(err => reject(err))
    })
  }
}
export default {
  state,
  mutations,
  actions,
  getters
}
