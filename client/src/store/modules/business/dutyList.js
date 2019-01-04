import { getDutyListApi, getDutyByNameApi } from '../../../http/business'
import moment from 'moment'

const state = {
  dutyName: [],
  dutylistData: [],
  dutyOptions: [],
  todayDuty: {}
}
const getters = {}
const mutations = {
  /**
   * 值班表名数组
   */
  SET_DUTY_OPTIONS(state, list) {
    state.dutyOptions = []
    state.dutylistData = []
    state.todayDuty = {}
    if (list.names) {
      list.names.forEach((v, n) => {
        state.dutyOptions.push({ value: v, label: v })
      })
    }
  },
  /**
   * 值班表数据
   */
  SET_DUTY_LIST_DATA(state, list) {
    state.dutylistData = []
    state.dutyName = []
    if (list.plans[0] && list.plans[0].template && list.plans[0].template.detail) {
      list.plans[0].template.detail.forEach((v, n) => {
        state.dutyName.push('name' + n)
      })
      list.plans[0].detail.forEach((v, n) => {
        const obj = {}
        obj.time = moment(v.date).format('YYYY-MM-DD')
        v.staffs.forEach((val, index) => {
          let name = ''
          val.forEach((itme, n2) => {
            if (itme.name) {
              name += itme.name + '、'
            } else {
              name = ''
            }
          })
          obj[state.dutyName[index]] = name.slice(0, -1)
        })
        state.dutylistData.push(obj)
      })
    }
  },
  /**
   * 今日值班数据
   */
  SET_TODAY_DUTY: function(state, list) {
    if (list.todayDuty.time) {
      state.todayDuty.date = moment(list.todayDuty.time).format('ll')
      state.todayDuty.time = list.todayDuty.time
    }
    if (list.todayDuty.template) {
      state.todayDuty.content = []
      list.todayDuty.template.forEach((v, n) => {
        state.todayDuty.content.push({ shift: v.shiftName, dutytime: v.startTime + '~' + v.endTime })
      })
      list.todayDuty.staffs[0].staffs.forEach((v1, n1) => {
        state.todayDuty.content[n1].people = []
        v1.forEach((v2, n2) => {
          state.todayDuty.content[n1].people.push({ name: v2.name, title: v2.title, phone: v2.phone })
        })
      })
    }
  }
}
/**
 * 获取值班列表
 */
const actions = {
  /**
   * 获取初始化列表
   */
  getDutyList({ commit }, name) {
    return new Promise((resolve, reject) => {
      name = name || ''
      getDutyListApi(name)
        .then(res => {
          commit('SET_DUTY_OPTIONS', res.data)
          commit('SET_DUTY_LIST_DATA', res.data)
          commit('SET_TODAY_DUTY', res.data)
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  /**
   * 根据表名获取列表信息
   */
  getDutyByName({ commit }, name) {
    return new Promise((resolve, reject) => {
      name = name || ''
      getDutyByNameApi(name)
        .then(res => {
          commit('SET_DUTY_OPTIONS', res.data)
          commit('SET_DUTY_LIST_DATA', res.data)
          commit('SET_TODAY_DUTY', res.data)
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
