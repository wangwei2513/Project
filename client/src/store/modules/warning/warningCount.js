import {
  get,
  post
} from '../../../http/base'
const state = {
  historyList: [],
  channel: {},
  warningOrgTreeData: [], // 机构树数据
  warningTypeTreeData: [] // 机构树数据
}

const mutations = {
  // 机构树
  SET_WARNINGORGTREE_DATA(state, data) {
    state.warningOrgTreeData = [data]
  },
  // 报警信息
  GET_WARNIN_DATA(state, payload) {
    let tempArr = payload.map((val) => {
      let alarmContent
      if (val.ackContent && val.ackContent !== 'auto_ack') {
        alarmContent = JSON.parse(val.ackContent)
      }
      return {
        name: val.srcName,
        address: val.orgName,
        time: val.time,
        count: val.count,
        level: val.level,
        status: val.deal,
        other: '无',
        type: val.eventType,
        devIp: val.devIp,
        channel: val.channel,
        channelId: val.chanId,
        devPort: val.devPort,
        content: val.ackContent,
        carDirect: val.carDirect === undefined ? '' : val.carDirect,
        carNum: val.carNum === undefined ? '' : val.carNum,
        carType: val.carType === undefined ? '' : val.carType,
        carImgUrl: val.carImgUrl === undefined ? '' : val.carImgUrl,
        carImg1Url: val.carImg1Url === undefined ? '' : val.carImg1Url,
        carImg2Url: val.carImg2Url === undefined ? '' : val.carImg2Url,
        carNumPicBase64: val.carNumPic === undefined ? '' : val.carNumPic,
        combinedPicUrl: val.combinedPicUrl === undefined ? '' : val.combinedPicUrl,
        id: val._id,
        action: val.action,
        cellClassName: {
          operat: ''
        },
        alarmDeal: val.deal ? (alarmContent ? alarmContent.alarmDeal : '无') : '',
        situationType: val.deal ? (alarmContent ? alarmContent.situationType : '无') : '',
        alertInfo: val.deal ? (alarmContent ? alarmContent.alarmContent : '无') : ''
      }
    })
    state.historyList = tempArr
  },
  GET_WARNIN_CHANNEL(state, payload) {
    state.channel = payload
  },
  // 报警类型
  GET_TYPE_DATA(state, payload) {
    let all = [{
      label: '全部',
      value: 'all'
    }]
    payload.all = all
    state.warningTypeTreeData = payload
  }
}

const actions = {
  // 1-获取机构树
  getWarningOrgTree({
    commit,
    state
  }, type) {
    const param = {
      query: {
        type: 0
      },
      url: '/setting/org/tree/'
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('SET_WARNINGORGTREE_DATA', res.data)
      }).catch((err) => {
        console.log('getWarningOrgTree error: ' + err)
        reject(err)
      })
    })
  },
  // 获取报警分类
  getWarningTypeTree({
    commit
  }) {
    const param = {
      url: 'setting/alarm'
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('GET_TYPE_DATA', res.data)
      }).catch((err) => {
        console.log('getWarningTypeTree error: ' + err)
        reject(err)
      })
    })
  },
  // 获取报警信息
  getWarningNews({
    commit,
    state
  }, playod) {
    const param = {
      // body: playod,
      query: playod,
      url: '/warning/query'
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res)
        commit('GET_WARNIN_DATA', res.data)
      }).catch((err) => {
        console.log('getWarningNews error: ' + err)
        reject(err)
      })
    })
  },
  // 确认报警
  confirmWarning({
    state,
    commit
  }, list) {
    const data = {
      alarmIdList: list
    }
    const param = {
      body: data,
      url: '/alarm/alarmaffirm'
    }
    return new Promise((resolve, reject) => {
      post(param).then(res => {
        resolve(res)
      }).catch((err) => {
        console.log('confirmWarning error: ' + err)
        reject(err)
      })
    })
  }
}

const getters = {}

export default {
  state,
  mutations,
  actions,
  getters
}
