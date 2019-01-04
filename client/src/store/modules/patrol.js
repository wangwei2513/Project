import { get, post, put, remove } from '../../http/base'
import { getSocket } from 'src/socket/socket.js'
const state = {
  singleInfo: [],
  singleList: [],
  taskList: [],
  recordList: [],
  recordInfo: {},
  messageList: [],
  patrolUserList: [],
  userTasks: [],
  messagesOfTask: [],
  pageInfo: {
    pages: 0,
    cur: 1,
    limit: 10,
    counts: 0
  },
  watchReceiveAlarm: {},
  watchMoveSinglePosition: null // 移动单兵推送的实时位置
}
const mutations = {
  UPDATE_SINGLE_INFO(state, data) {
    state.singleInfo = data
  },
  UPDATE_SINGLE_LIST(state, data) {
    state.singleList = data
  },
  UPDATE_TASK_LIST(state, data) {
    state.taskList = data
  },
  UPDATE_RECORD_LIST(state, data) {
    state.recordList = data
  },
  UPDATE_RECORD_INFO(state, data) {
    state.recordInfo = data
  },
  UPDATE_MESSAGE_LIST(state, data) {
    state.messageList = data
  },
  UPDATE_PAGEINFO(state, data) {
    if (data) {
      state.pageInfo.pages = parseInt(data['x-bsc-pages'])
      state.pageInfo.count = parseInt(data['x-bsc-count'])
      state.pageInfo.cur = parseInt(data['x-bsc-cur'])
      state.pageInfo.limit = parseInt(data['x-bsc-limit'])
    } else {
      state.pageInfo.pages = 0
      state.pageInfo.count = 0
      state.pageInfo.cur = 1
      state.pageInfo.limit = 10
    }
  },
  UPDATE_PATROL_USERLIST(state, data) {
    data.map((item, index) => {
      data[index].isSingleAlarm = false
    })
    // state.patrolUserList = data
  },
  UPDATE_USER_TASKS(state, data) {
    state.userTasks = []
    state.userTasks = data
  },
  UPDATE_TASK_OF_MSG(state, data) {
    state.messagesOfTask = data
  },
  // 地图上接收报警
  SET_WARTCHRECEIVE_ALARMING(state, data) {
    if (data.type === 'patrolAlarm') {
      if (!data.map2D.geo) {
        return
      }
    } else {
      if (!data.point) {
        return
      }
    }
    state.watchReceiveAlarm = data
  },
  // 移动单兵的实时位置信息
  SET_WATCHMOVESINGLE_POSITION(state, data) {
    state.watchMoveSinglePosition = data
  }
}
const actions = {
  watchReceiveAlarmEvt({ commit, state }) {
    // 监听单兵报警
    getSocket().on('server:patrol.alarm', data => {
      console.log(data, 'data')
      data.type = 'patrolAlarm'
      commit('SET_WARTCHRECEIVE_ALARMING', data)
    })
    // 监听单兵报警
    getSocket().on('server:sentry.alarm', data => {
      console.log(data, 'data')
      data.type = 'singleAlarm'
      commit('SET_WARTCHRECEIVE_ALARMING', data)
    })
    // 监听单兵位置
    getSocket().on('server:sentry.location', data => {
      console.log(data, 'data')
      data.type = 'sentry_geo'
      commit('SET_WATCHMOVESINGLE_POSITION', data) // 移动单兵的实时位置信息
    })
  },
  searchRecordRuning({ commit }, payload) {
    const param = {
      url: '/patrol/record/running/query',
      query: payload || {}
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          commit('UPDATE_PATROL_USERLIST', res.data)
          commit('UPDATE_PAGEINFO', res.headers)
          resolve(res.data)
        })
        .catch(err => reject(err))
    })
  },
  getPatrolUsers({ commit }, payload) {
    const param = {
      url: '/patrol/record/running',
      query: payload || {}
    }
    param.query.limit = 100
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          commit('UPDATE_PATROL_USERLIST', res.data)
          commit('UPDATE_PAGEINFO', res.headers)
          resolve(res.data)
        })
        .catch(err => reject(err))
    })
  },
  getPatrolUserTasks({ commit }, payload) {
    const param = {
      url: `/patrol/record/${payload.userId}/date`,
      query: payload
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res)
          commit('UPDATE_USER_TASKS', res.data)
        })
        .catch(err => reject(err))
    })
  },
  getMsgsForTask({ commit }, payload) {
    const param = {
      url: `/patrol/message/task/${payload.id}`
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          commit('UPDATE_TASK_OF_MSG', res.data)
          resolve(res)
        })
        .catch(err => reject(err))
    })
  },
  // 获取带巡更人员的机构树
  getSentryUserTree() {
    const param = {
      url: 'setting/sentry/user/tree'
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => reject(err))
    })
  },
  // 获取待点位的机构树
  getSentryPointTree() {
    const param = {
      url: 'setting/sentry/point/tree'
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => reject(err))
    })
  },

  getTaskById({ commit }, payload) {
    const param = {
      url: 'patrol/task/' + payload.id
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => reject(err))
    })
  },
  // 获取任务列表
  getTaskList({ commit }, payload) {
    const param = {
      url: 'patrol/task',
      query: payload || {}
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          commit('UPDATE_TASK_LIST', res.data.results)
          commit('UPDATE_PAGEINFO', res.headers)
        })
        .catch(err => reject(err))
    })
  },
  // 搜索任务列表
  searchTaskList({ commit }, payload) {
    const param = {
      url: 'patrol/task/query',
      query: payload || {}
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          commit('UPDATE_TASK_LIST', res.data.results)
          commit('UPDATE_PAGEINFO', res.headers)
        })
        .catch(err => reject(err))
    })
  },
  // 添加任务
  addTask({ state, commit }, payload) {
    const param = {
      url: '/patrol/task',
      body: payload
    }
    return new Promise((resolve, reject) => {
      post(param)
        .then(res => {
          resolve(res)
        })
        .catch(err => reject(err))
    })
  },
  // 修改任务
  updateTask({ state }, payload) {
    const param = {
      url: `/patrol/task/${payload._id}`,
      body: payload
    }
    return new Promise((resolve, reject) => {
      put(param)
        .then(res => {
          resolve(res)
        })
        .catch(err => reject(err))
    })
  },
  // 单个删除巡更任务
  deleteTask({ state }, payload) {
    const param = {
      url: '/patrol/task/' + payload.id
    }
    return new Promise((resolve, reject) => {
      remove(param)
        .then(res => {
          resolve(res)
        })
        .catch(err => reject(err))
    })
  },
  // 批量删除巡更任务
  deleteTasks({ state }, ids) {
    const param = {
      url: '/patrol/task'
    }
    return new Promise((resolve, reject) => {
      remove(param, {
        headers: {
          'x-bsc-ids': ids
        }
      })
        .then(res => {
          resolve(res)
        })
        .catch(err => reject(err))
    })
  },
  // 获取巡更记录数据
  getRecordList({ state, commit }, payload) {
    const param = {
      url: '/patrol/record',
      query: payload || {}
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          commit('UPDATE_RECORD_LIST', res.data.results)
          commit('UPDATE_PAGEINFO', res.headers)
        })
        .catch(err => reject(err))
    })
  },
  // 搜做巡更记录数据
  searchRecordList({ state, commit }, payload) {
    const param = {
      url: '/patrol/record/query',
      query: payload || {}
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          commit('UPDATE_RECORD_LIST', res.data.results)
          commit('UPDATE_PAGEINFO', res.headers)
        })
        .catch(err => reject(err))
    })
  },
  // 单条巡更记录详情
  getRecordInfo({ commit, state }, payload) {
    const param = {
      url: `/patrol/record/${payload.id}`,
      query: {}
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res)
          commit('UPDATE_RECORD_INFO', res.data)
        })
        .catch(err => reject(err))
    })
  },
  // 批量删除巡更记录
  deleteRecord({ state, commit }, payload) {
    const param = {
      url: '/patrol/record',
      body: payload
    }
    var ids = []
    payload.map(item => {
      ids.push(item._id)
    })
    return new Promise((resolve, reject) => {
      remove(param, {
        headers: {
          'x-bsc-ids': ids
        }
      })
        .then(res => {
          resolve(res)
        })
        .catch(err => reject(err))
    })
  },
  // 获取消息列表
  getMessageList({ state, commit }, payload) {
    var param = {
      url: '/patrol/message',
      query: payload || {}
    }

    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          commit('UPDATE_MESSAGE_LIST', res.data.results)
          commit('UPDATE_PAGEINFO', res.headers)
          resolve(res)
        })
        .catch(err => reject(err))
    })
  },
  getMessageById({ commit }, payload) {
    var param = {
      url: `/patrol/message/${payload.id}`
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => reject(err))
    })
  },
  // 检索消息列表
  searchMessageList({ commit }, payload) {
    var param = {
      url: '/patrol/message/query',
      query: payload || {}
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          commit('UPDATE_MESSAGE_LIST', res.data.results)
          commit('UPDATE_PAGEINFO', res.headers)
        })
        .catch(err => reject(err))
    })
  },
  // 新建消息
  addMessage({ state }, payload) {
    var param = {
      url: '/patrol/message',
      body: payload
    }
    return new Promise((resolve, reject) => {
      post(param)
        .then(res => {
          resolve(res)
        })
        .catch(err => reject(err))
    })
  },
  // 删除消息
  deleteMessage({ commit, state }, ids) {
    var param = {
      url: `/patrol/message`
    }
    return new Promise((resolve, reject) => {
      remove(param, {
        headers: {
          'x-bsc-ids': ids
        }
      })
        .then(res => resolve(res))
        .catch(err => reject(err))
    })
  },
  updateTaskMessage({ commit, state }, payload) {
    const param = {
      url: `/patrol/message/${payload.id}`,
      body: payload
    }
    return new Promise((resolve, reject) => {
      put(param)
        .then(res => resolve(res))
        .catch(err => reject(err))
    })
  },
  // 获取单兵报警记录数据
  getSingleList({ state, commit }, payload) {
    const param = {
      url: '/patrol/warnning',
      query: payload || {}
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          commit('UPDATE_SINGLE_LIST', res.data.results)
          commit('UPDATE_PAGEINFO', res.headers)
        })
        .catch(err => reject(err))
    })
  },
  // 单条单兵报警记录数据
  getSingleInfo({ commit, state }, payload) {
    const param = {
      url: `/patrol/warnning/${payload.id}`,
      query: {}
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res)
          commit('UPDATE_SINGLE_INFO', res.data)
        })
        .catch(err => reject(err))
    })
  }
}
export default {
  state,
  actions,
  mutations
}
