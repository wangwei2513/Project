import {
  get,
  put
} from '../../http/base'
import { save } from '../../storage/index.js'
const state = {
  styleState: 0,
  styles: {
    // 平台名字描述
    name: '',
    // 字体
    fontfamily: '',
    // 字体大小
    fontSize: '',
    // 字体颜色
    fontColor: '',
    // 字体斜体
    fontItalic: '',
    // 字体粗细
    fontRegular: '',
    // 标题栏背景
    uploadColor: '',
    // logo
    uploadLogoPicture: '',
    // 标题栏背景
    uploadBackgroundPicture: ''
  },
  parameters: {
    // 报警/事件日志天数
    alarmlog: '',
    // 设备/系统日志天数
    equipmentlog: '',
    // 操作日志天数
    operationlog: '',
    // 配置日志天数
    configlog: '',
    // 传输协议
    transport: '',
    // 画质选择
    picture: '',
    // 截图格式
    screenshot: '',
    // 本地录像格式
    videotape: ''
  },
  initialPassword: ''
}
const getters = {
  styleState(state) {
    return state.styleState
  },
  getMenuStyle(state) {
    return state.styles
  },
  getParameter(state) {
    return state.parameters
  }
}
const mutations = {
  // 获取平台参数
  GET_PLATFORM(state, playod) {
    state.styleState = 1
    state.styles.name = playod.name
    const fonts = JSON.parse(playod.titlefont)
    state.styles.fontfamily = fonts.font
    state.styles.fontSize = fonts.size
    state.styles.fontColor = fonts.fontColor
    state.styles.fontItalic = fonts.fontItalic
    state.styles.fontRegular = fonts.fontRegular
    state.styles.uploadColor = playod.titlecolor
    state.styles.uploadLogoPicture = playod.logo
    state.styles.uploadBackgroundPicture = playod.loginimg
    state.parameters.alarmlog = playod.alarmlog
    state.parameters.equipmentlog = playod.equipmentlog
    state.parameters.operationlog = playod.operationlog
    state.parameters.configlog = playod.configlog
    state.parameters.transport = playod.transport
    state.parameters.picture = playod.picture
    state.parameters.screenshot = playod.screenshot
    state.parameters.videotape = playod.videotape
  },
  // 保存平台参数
  SET_PLATFORM(state, playod) {
    state.styleState = 1
    state.styles.name = playod.name
    const fonts = JSON.parse(playod.titlefont)
    state.styles.fontfamily = fonts.font
    state.styles.fontSize = fonts.size
    state.styles.fontColor = fonts.fontColor
    state.styles.fontItalic = fonts.fontItalic
    state.styles.fontRegular = fonts.fontRegular
    state.styles.uploadColor = playod.titlecolor
    state.styles.uploadLogoPicture = playod.logo
    state.styles.uploadBackgroundPicture = playod.loginimg
  },
  // 保存系统参数
  SET_PARAMETER(state, playod) {
    state.parameters.alarmlog = playod.alarmlog
    state.parameters.equipmentlog = playod.equipmentlog
    state.parameters.operationlog = playod.operationlog
    state.parameters.configlog = playod.configlog
    state.parameters.transport = playod.transport
    state.parameters.picture = playod.picture
    state.parameters.screenshot = playod.screenshot
    state.parameters.videotape = playod.videotape
  }
}

const actions = {
  // 获取所有类型的数据信息
  getPlatform({
    commit,
    state
  }, playod) {
    const param = {
      url: '/setting/sysparamters'
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        commit('GET_PLATFORM', res.data)
        resolve(res)
      }).catch((err) => {
        console.log('getPlatform error: ' + err)
        reject(err)
      })
    })
  },
  // 保存参数
  setPlatform({
    commit,
    state
  }, playod) {
    const param = {
      body: playod,
      url: '/setting/sysparamters'
    }
    return new Promise((resolve, reject) => {
      put(param).then(res => {
        resolve(res)
      }).catch((err) => {
        console.log('setPlatform error: ' + err)
        reject(err)
      })
    })
  },
  // 获取koala地址
  getFaceServer({
    commit,
    state
  }, payload) {
    const param = {
      // body: payload,
      url: '/human/pass/server'
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res.data)
      }).catch((err) => {
        console.log('getFaceServer error: ' + err)
        reject(err)
      })
    })
  },
  // 设置koala地址
  setFaceServer({
    commit,
    state
  }, payload) {
    const param = {
      body: {
        host: payload
      },
      url: '/human/pass/server'
    }
    return new Promise((resolve, reject) => {
      put(param).then(res => {
        resolve(res)
      }).catch((err) => {
        console.log('setFaceServer error: ' + err)
        reject(err)
      })
    })
  },
  // 时间配置  设备校时
  // 获取服务器时间和自动校时信息
  getProofInfo({
    commit,
    state
  }, playod) {
    const param = {
      url: '/setting/proof'
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        resolve(res.data)
      }).catch((err) => {
        reject(err)
      })
    })
  },
  // 发送手动校时请求
  manualProof({
    commit
  }, playod) {
    const param = {
      url: '/setting/proof/time'
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        console.log(res)
        resolve(res)
      }).catch((err) => {
        console.log('manualProof error: ' + err)
        reject(err)
      })
    })
  },
  // 增加或者修改自动校时信息
  setAutoProof({
    commit,
    state
  }, playod) {
    const param = {
      body: playod,
      url: '/setting/proof'
    }
    return new Promise((resolve, reject) => {
      put(param).then(res => {
        resolve(res)
      }).catch((err) => {
        console.log('setAutoProof error: ' + err)
        reject(err)
      })
    })
  },
  // 获取2D/3D默认配置
  getTwoImensionalInfo() {
    const param = {
      url: '/setting/maptype'
    }
    return new Promise((resolve, reject) => {
      get(param).then(res => {
        let mapType = res.data.mapType ? '2D' : '3D'
        save('mapType', mapType)
        resolve(res.data)
      }).catch((err) => {
        reject(err)
      })
    })
  },
  // 设置2D/3D默认配置
  setTwoImensionalInfo({
    commit,
    state
  }, obj) {
    // console.log(obj)
    const param = {
      body: obj,
      url: '/setting/maptype'
    }
    return new Promise((resolve, reject) => {
      put(param).then(res => {
        resolve(res.data)
      }).catch((err) => {
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
