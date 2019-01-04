import {
  getBuildListByPagingApi,
  getOneBuildByIdApi,
  getAllBuildApi,
  saveOneBuildApi,
  editOneBuildByIdApi,
  deleteOneBuildByIdApi,
  getAllFloorsByIdApi
} from '../../../http/map3d'
const state = {
  floorList: [], // 楼层列表
  buildOneData: null, // 单个楼宇信息
  buildList: [], // 楼宇列表
  goBackToBuildList: false, // 是否返回楼宇列表
  buildFeature: null
}
const getters = {}
const mutations = {
  // feature
  SET_FEATURE(state, data) {
    state.buildFeature = data
  },
  // goBackToBuildList
  SET_GOBACKTOBUILDLIST(state, data) {
    state.goBackToBuildList = data
  },
  // 楼层列表
  SET_FLOOR_LIST(state, data) {
    state.floorList = data
  },
  // 单个楼宇信息
  SET_BUILD_DATA(state, data) {
    state.buildOneData = data
  },
  // 获取楼宇列表
  SET_BUILD_LIST(state, data) {
    state.buildList = data
  }
}
const actions = {
  // SET_BUILD_DATA
  setBuildData({ commit }, data) {
    commit('SET_BUILD_DATA', data)
  },
  // SETFEATURE
  setFeature({ commit }, data) {
    commit('SET_FEATURE', data)
  },
  // SET_GOBACKTOBUILDLIST
  setGobackToBuildList({ commit }, data) {
    commit('SET_GOBACKTOBUILDLIST', data)
  },
  // 根据楼宇id获取某一楼宇的具体信息---
  getOneBuildById({ commit }, id) {
    return new Promise((resolve, reject) => {
      getOneBuildByIdApi(id)
        .then(res => {
          resolve(res.data)
          commit('SET_BUILD_DATA', res.data)
          commit('SET_FLOOR_LIST', res.data.storey)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 获取全部楼宇信息
  getAllBuild({ commit }) {
    return new Promise((resolve, reject) => {
      getAllBuildApi()
        .then(res => {
          resolve(res.data)
          commit('SET_BUILD_LIST', res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 建筑物信息保存
  saveOneBuild({ commit }, data) {
    return new Promise((resolve, reject) => {
      saveOneBuildApi(data)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 编辑模式建筑信息修改
  editOneBuildById({ commit }, playod) {
    return new Promise((resolve, reject) => {
      editOneBuildByIdApi(playod)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 根据分页参数获取楼宇列表----
  getBuildListByPaging({ commit }, playod) {
    return new Promise((resolve, reject) => {
      getBuildListByPagingApi(playod)
        .then(res => {
          resolve(res.data)
          commit('SET_BUILD_LIST', res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 删除楼宇
  deleteOneBuildById({ commit }, id) {
    return new Promise((resolve, reject) => {
      deleteOneBuildByIdApi(id)
        .then(res => {
          resolve(res.data)
          console('删除' + res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 获取一栋楼宇全部楼层信息 获取一栋楼宇全部楼层信息
  getAllFloorsById({ commit }, _id) {
    return new Promise((resolve, reject) => {
      getAllFloorsByIdApi(_id)
        .then(res => {
          resolve(res.data)
          commit('SET_FLOOR_LIST', res.data.storey)
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
