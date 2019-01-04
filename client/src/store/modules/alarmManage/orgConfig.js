import {
  get,
  post,
  put
} from '../../../http/base'
// import Vue from 'vue'
import axios from 'axios'

const state = {
  alarmInData: [], // 报警输入数据
  alarmOutData: [], // 报警输出数据
  alarmSmartData: [], // 智能报警数据
  alarmJkdData: [], // 监控点数据
  orgTreeData: [], // 机构树数据
  deviceTreeData: [], // 设备树数据
  orgIdList: [], // 查询机构ID
  linkOutTreeData: [], // 联动报警输出树
  addTreeData: [], // 添加报警输入/报警输出树
  inPageNum: 0,
  outPageNum: 0,
  smartPageNum: 0,
  jkdPageNum: 0,
  affirms: [],
  jdkMessageData: '',
  smartMessageData: '',
  initLinkData: {
    resource: '',
    actionVideo: [],
    actionOutCtl: [],
    actionRule: [{
      status: false,
      beginTime: 0,
      endTime: 86399,
      actionVideo: false,
      actionOutPut: false
    }, {
      status: false,
      beginTime: 0,
      endTime: 86399,
      actionVideo: false,
      actionOutPut: false
    }, {
      status: false,
      beginTime: 0,
      endTime: 86399,
      actionVideo: false,
      actionOutPut: false
    }, {
      status: false,
      beginTime: 0,
      endTime: 86399,
      actionVideo: false,
      actionOutPut: false
    }]
  }
}
const mutations = {
  // 1.机构树
  GET_ALARM_ORG_TREE(state, data) {
    state.orgTreeData = [data]
  },
  // 1-1.设备树
  GET_DEVICE_TREE(state, data) {
    state.deviceTreeData = [data]
  },
  // 1-2.获取父及子机构ID
  SET_ORGID_LIST(state, data) {
    state.orgIdList = data
  },
  // 获取联动报警输出设备树
  GET_LINK_OUT_TREE(state, data) {
    state.linkOutTreeData = [data]
  },
  // 报警输入数据
  GET_ALARM_IN_DATA(state, data) {
    state.alarmInData = data
  },
  // 报警输入分页
  SET_ALARM_IN_PAGE(state, payload) {
    state.inPageNum = Number(payload['x-bsc-count'])
  },
  // 报警输出数据
  GET_ALARM_OUT_DATA(state, data) {
    state.alarmOutData = data
  },
  // 报警输出分页
  SET_ALARM_OUT_PAGE(state, payload) {
    state.outPageNum = Number(payload['x-bsc-count'])
  },
  // 智能报警数据
  GET_ALARM_SMART_DATA(state, data) {
    state.alarmSmartData = data
  },
  // 智能报警分页
  SET_ALARM_SMART_PAGE(state, payload) {
    state.smartPageNum = Number(payload['x-bsc-count'])
  },
  // 智能报警详情获取
  GET_ALARM_SMARTMESSAGE_DATA(state, data) {
    state.smartMessageData = data
  },
  // 监控点报警数据
  GET_ALARM_JKD_DATA(state, data) {
    state.alarmJkdData = data
  },
  // 监控点报警分页
  SET_ALARM_JKD_PAGE(state, payload) {
    state.jkdPageNum = Number(payload['x-bsc-count'])
  },
  // 监控点报警详情获取
  GET_ALARM_JKDMESSAGE_DATA(state, data) {
    state.jdkMessageData = data
  },
  // 添加树 报警输入/报警输出
  GET_ADD_TREE(state, data) {
    state.addTreeData = [data]
  },
  // 从本地存储的表格数据中删除选中的数据
  DEL_IN_DATA(state, data) {
    data.map((w, j) => {
      state.alarmInData.map((v, i) => {
        if (v._id === w) {
          state.alarmInData.splice(i, 1)
        }
      })
    })
  },
  DEL_OUT_DATA(state, data) {
    data.map((w, j) => {
      state.alarmOutData.map((v, i) => {
        if (v._id === w) {
          state.alarmOutData.splice(i, 1)
        }
      })
    })
  },
  // 报警 获取联动
  GET_ALARM_LINK(state, payload) {
    state.affirms = payload
  }
}
const actions = {
  // 1-1.获取机构树
  getAlarmOrgTree({
    commit,
    state
  }) {
    const param = {
      query: {
        type: 0
      },
      url: '/setting/org/tree'
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('GET_ALARM_ORG_TREE', res.data)
      }).catch(err => reject(err))
    })
  },
  // 1-2.获取父及子机构ID
  setOrgIdList({
    commit,
    state
  }, data) {
    commit('SET_ORGID_LIST', data)
  },
  // 1-4.获取设备设备树
  getDeviceTree({
    commit,
    state
  }, data) {
    const param = {
      query: data,
      url: '/setting/resource/tree/link/alarm'
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('GET_DEVICE_TREE', res.data)
      }).catch(err => reject(err))
    })
  },
  // 1-6.报警输入/报警输出 添加弹框的树
  getAddTree({
    commit,
    state
  }, data) {
    const param = {
      query: {
        orgtype: data.orgtype,
        channelTypes: data.channelTypes,
        bigTypes: '0,1',
        oid: data.oid
      },
      url: '/setting/resource/distributiontreeforalarm'
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('GET_ADD_TREE', res.data)
      }).catch(err => reject(err))
    })
  },
  // 1-7.添加成功-数据过滤
  filterData({
    commit,
    state
  }, data) {
    const param = {
      body: data,
      url: '/setting/orgres'
    }
    return new Promise((resolve, reject) => {
      post(param).then(res => {
        resolve(res)
      }).catch(err => reject(err))
    })
  },

  // 2-1.获取报警输入
  getAlarmInData({
    commit,
    state
  }, payload) {
    const param = {
      url: 'setting/resource/alarmlist',
      query: {
        oid: payload.id,
        channelTypes: payload.channelTypes,
        never: payload.never,
        seek: payload.name,
        page: payload.page,
        limit: payload.limit
      }
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('GET_ALARM_IN_DATA', res.data)
        commit('SET_ALARM_IN_PAGE', res.headers)
      }).catch((err) => {
        console.log('getAlarmInData error: ' + err)
        reject(err)
      })
    })
  },
  // 2-2.添加报警输入
  addAlarmInData({
    commit,
    state
  }, data) {
    const param = {
      body: data,
      url: '/setting/resource/distribute'
    }
    return new Promise((resolve, reject) => {
      post(param).then(res => {
        resolve(res)
      }).catch(err => reject(err))
    })
  },
  // 2-3.删除报警输入
  delAlarmInData({
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
          console.log('delAlarmInData error：', err)
        })
    })
  },
  delInData({
    commit,
    state
  }, data) {
    commit('DEL_IN_DATA', data)
  },
  // 2-4.修改报警输入
  editAlarmInData({
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
        console.log('editAlarmInData error: ' + err)
        reject(err)
      })
    })
  },
  // 批量修改
  editMoreAlarmInData({
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

  // 3-1.获取报警输出
  getAlarmOutData({
    commit,
    state
  }, payload) {
    const param = {
      url: 'setting/resource/alarmlist',
      query: {
        oid: payload.id,
        channelTypes: payload.channelTypes,
        never: payload.never,
        seek: payload.name,
        page: payload.page,
        limit: payload.limit
      }
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('GET_ALARM_OUT_DATA', res.data)
        commit('SET_ALARM_OUT_PAGE', res.headers)
      }).catch((err) => {
        console.log('getAlarmOutData error: ' + err)
        reject(err)
      })
    })
  },
  // 3-2.添加报警输出
  addAlarmOutData({
    commit,
    state
  }, data) {
    const param = {
      body: data,
      url: '/setting/resource/distribute'
    }
    return new Promise((resolve, reject) => {
      post(param).then(res => {
        resolve(res)
      }).catch(err => reject(err))
    })
  },
  // 3-3.删除报警输出
  delAlarmOutData({
    commit,
    state
  }, data) {
    return new Promise((resolve, reject) => {
      axios({
        headers: {
          'x-bsc-ids': data
        },
        url: 'setting/resource/unbind?type=0',
        method: 'delete'
      })
        .then((res) => {
          resolve(res)
        }).catch((err) => {
          console.log('delAlarmOutData error：', err)
        })
    })
  },
  delOutData({
    commit,
    state
  }, data) {
    commit('DEL_OUT_DATA', data)
  },
  // 3-4.修改报警输出
  editAlarmOutData({
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
        console.log('editAlarmOutData error: ' + err)
        reject(err)
      })
    })
  },
  // 批量修改
  editMoreAlarmOutData({
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

  // 4-1.获取智能报警
  getSmartData({
    commit,
    state
  }, payload) {
    const param = {
      url: 'setting/resource/alarmlist/dependvideo',
      query: {
        oid: payload.id,
        category: 'intelligentAlarm',
        never: payload.never,
        seek: payload.name,
        page: payload.page,
        limit: payload.limit
      }
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('GET_ALARM_SMART_DATA', res.data)
        commit('SET_ALARM_SMART_PAGE', res.headers)
      }).catch((err) => {
        console.log('getSmartData error: ' + err)
        reject(err)
      })
    })
  },
  // 智能详情获取
  getSmartMessageData({
    commit,
    state
  }, id) {
    const param = {
      url: 'setting/resource/video/intelligentalarm/' + id
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('GET_ALARM_SMARTMESSAGE_DATA', res.data)
      }).catch((err) => {
        console.log('getSmartMessageData error: ' + err)
        reject(err)
      })
    })
  },

  // 获取监控点报警
  getJkdData({
    commit,
    state
  }, payload) {
    const param = {
      url: 'setting/resource/alarmlist/dependvideo',
      query: {
        oid: payload.id,
        category: 'monitoryPointAlarm',
        never: payload.never,
        seek: payload.name,
        page: payload.page,
        limit: payload.limit
      }
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('GET_ALARM_JKD_DATA', res.data)
        commit('SET_ALARM_JKD_PAGE', res.headers)
      }).catch((err) => {
        console.log('getJkdData error: ' + err)
        reject(err)
      })
    })
  },
  // 监控点详情获取
  getJkdMessageData({
    commit,
    state
  }, id) {
    const param = {
      url: 'setting/resource/video/monitorypointalarm/' + id
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('GET_ALARM_JKDMESSAGE_DATA', res.data)
      }).catch((err) => {
        console.log('getJkdMessageData error: ' + err)
        reject(err)
      })
    })
  },

  // 6-1.获取 输入\智能\监控点 联动动作
  getAlarmLink({
    commit,
    state
  }, data) {
    const param = {
      body: data.body,
      url: 'setting/alarmcfg/set/' + data.id
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('GET_ALARM_LINK', res.data)
      }).catch(err => reject(err))
    })
  },
  // 6-2.设置 输入\智能\监控点  联动动作
  setAlarmLink({
    commit,
    state
  }, data) {
    const param = {
      body: data,
      url: 'setting/alarmcfg/set/' + data.resource
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
  actions
}
