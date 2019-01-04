import {
  get,
  post,
  put
} from '../../../http/base'
import axios from 'axios'

const state = {
  importData: [],
  addXFTreeData: [],
  affirms: [],
  doorSelList: [],
  fireDeviceTreeData: []
}

const mutations = {
  GET_IMPORT_DATA(state, payload) {
    state.importData = payload
  },
  GET_XF_ADDTREE(state, payload) {
    state.addXFTreeData = [payload]
  },
  GET_AFFIRMS_DATA(state, payload) {
    state.affirms = payload
  },
  DOOR_SEL_DATA(state, payload) {
    state.doorSelList = payload
  },
  GET_FIREDEVICE_TREE(state, payload) {
    state.fireDeviceTreeData = payload
  }
}

const actions = {
  // 获取输入防区表格数据
  getImportData({
    commit,
    state
  }, payload) {
    const param = {
      query: {
        oid: payload.id,
        type: 11,
        never: payload.never,
        seek: payload.name,
        page: payload.page,
        limit: payload.limit
      },
      url: 'setting/resource'
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('GET_IMPORT_DATA', res.data)
      }).catch((err) => {
        console.log('getImportData error: ' + err)
        reject(err)
      })
    })
  },
  // 添加 输入防区
  addImportData({
    commit,
    state
  }, payload) {
    const param = {
      body: payload,
      url: 'setting/resource/distribute'
    }
    return new Promise((resolve, reject) => {
      post(param).then(res => {
        resolve(res)
      }).catch((err) => {
        console.log('addImportData error: ' + err)
        reject(err)
      })
    })
  },
  // 获取添加 弹出框 树
  getXFAddTree({
    commit,
    state
  }, payload) {
    const param = {
      query: {
        type: 11,
        orgtype: 0,
        bigtype: 7,
        oid: payload
      },
      url: 'setting/resource/distributiontree'
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('GET_XF_ADDTREE', res.data)
      }).catch((err) => {
        console.log('getXFAddTree error: ' + err)
        reject(err)
      })
    })
  },
  // 删除 输入防区
  delImportData({
    commit,
    state
  }, payload) {
    return new Promise((resolve, reject) => {
      axios({
        headers: {
          'x-bsc-ids': payload
        },
        url: 'setting/resource/unbind?type=0',
        method: 'delete'
      })
        .then((res) => {
          resolve(res)
        }).catch((err) => {
          console.log('delImportData error：', err)
        })
    })
  },
  // 修改 输入防区
  editImportData({
    commit,
    state
  }, payload) {
    const param = {
      body: payload,
      url: '/setting/resource/' + payload._id
    }
    return new Promise((resolve, reject) => {
      put(param).then(res => {
        resolve(res)
      }).catch((err) => {
        console.log('editImportData error: ' + err)
        reject(err)
      })
    })
  },
  // 批量修改
  editMoreImportData({
    commit,
    state
  }, payload) {
    return new Promise((resolve, reject) => {
      axios({
        method: 'put',
        url: '/setting/resource/patch',
        data: payload.data,
        headers: {
          'x-bsc-ids': payload.ids
        }
      }).then(res => {
        resolve(res)
      }).catch(err => reject(err.response.data.message))
    })
  },
  // 消防联动树获取
  getFireDeviceTree({
    commit,
    state
  }, payload) {
    const param = {
      url: 'setting/resource/tree/link/fire',
      query: payload
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('GET_FIREDEVICE_TREE', res.data)
      }).catch((err) => {
        console.log('getSmartData error: ' + err)
        reject(err)
      })
    })
  },
  // 表格联动设置 获取
  getAffirmsData({
    commit,
    state
  }, payload) {
    const param = {
      url: 'setting/alarmcfg/setfire/' + payload
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('GET_AFFIRMS_DATA', res.data)
      }).catch((err) => {
        console.log('getAffirmsData error: ' + err)
        reject(err)
      })
    })
  },
  // 表格联动设置 确认设置
  setAffirmsData({
    commit,
    state
  }, data) {
    const param = {
      body: data.body,
      url: 'setting/alarmcfg/setfire/' + data.body.resource
    }
    return new Promise((resolve, reject) => {
      put(param).then(res => {
        resolve(res)
      }).catch((err) => {
        console.log('setAffirmsData error: ' + err)
        reject(err)
      })
    })
  },
  // 获取门禁服务器列表
  doorSelData({
    state,
    commit
  }) {
    const params = {
      url: 'door/servers?page=1&limit=100'
    }
    return new Promise((resolve, reject) => {
      get(params).then(res => {
        resolve(res)
        commit('DOOR_SEL_DATA', res.data.results)
      }).catch((err) => {
        console.log('this.doorSelData :' + err)
      })
    })
  }
}
const getters = {
  // 门禁服务器列表处理
  doorList(state) {
    let tempOption = []
    if (state.doorSelList !== undefined && state.doorSelList.length !== 0) {
      state.doorSelList.map((v) => {
        tempOption.push({
          value: v._id,
          label: v.name
        })
      })
    }
    return tempOption
  }
}

export default {
  state,
  mutations,
  actions,
  getters
}
