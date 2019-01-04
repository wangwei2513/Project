import {
  alarmToBeSureApi,
  getAlarmDeal,
  getAlarmDealStatus,
  getAlarmPower
} from 'src/http/alarm.api'
import { read } from '../../../storage/index'
const state = {
  alarmType: {
    alarmInput: '报警输入',
    alarmOut: '报警输出',
    focusAttention: '重点关注',
    // 智能类
    perimeter: '周界保护',
    tripwire: '绊线',
    leftObject: '物品遗留',
    missingObject: '物品丢失',
    loitering: '非法停留',
    retrogradeDetection: '逆行检测',
    lingerDetection: '徘徊检测',
    doubleCordon: '双警戒线',
    blackList: '黑名单',
    whiteList: '白名单',
    dispatch: '布控',
    areaInvade: '区域入侵',
    fastMove: '快速移动',
    parkDetect: '停车检测',
    humanAssemble: '人员聚集',
    objectMove: '物品搬移',
    // 监控点类
    alarmMoveSense: '移动侦测',
    videoMask: '视频遮挡',
    sceneSwitch: '镜头移位',
    definitionAbnormal: '清晰度异常',
    brightnessAbnormal: '亮度异常',
    screenFreeze: '画面冻结',
    noise: '噪声检测',
    signalLoss: '信号缺失',
    colorCast: '偏色检测',
    // 消防类
    fireAlarm: '消防报警',
    fireFailure: '消防故障',
    // 违章报警
    vioRetrograde: '违章逆行',
    vioPark: '违章停车',
    vioTurnLeft: '违章左转',
    vioTurnRight: '违章右转',
    // 报警求助
    askHelp: '请求对讲',
    acceptHelp: '接受对讲',
    endHelp: '结束对讲',
    // 设备报警
    hardDiskFailure: 'sd卡故障',
    hardDiskFull: 'sd卡满',
    networkDown: '网络断开',
    ipConflict: 'IP冲突',
    timeAbnormal: '时间异常',
    illegalNetworkAccess: '非法网络访问',
    // 其他
    alarmVideoLost: '视频丢失',
    vehicleBlack: '车辆识别黑名单',
    vehicleWhite: '车辆白名单',
    vehicleDispatch: '车辆布控',
    faceBlack: '人脸识别',
    faceWhite: '人脸白名单',
    faceDispatch: '人脸布控',
    peopleCount: '人数统计',
    fight: '斗殴',
    approach: '人员贴近',
    armyGuard: '哨兵管控',
    atmCare: 'ATM看护',
    fanAbnormal: '风扇异常',
    mainBoardAbnormal: '主板异常',
    channelAbnormal: '通道异常',
    temperatureAbnormal: '温度异常',
    damagedDiskSectors: '硬盘坏道',
    ipcMacCheckException: 'MAC校验异常'
  }
}

const getters = {
  alarmTypeList(state) {
    return state.alarmType
  }
}

const actions = {
  /* 报警确认（普通、消防、报警助） */
  alarmToBeSure({
    commit
  }, payload) {
    const data = {
      alarmIdList: payload
    }
    return new Promise((resolve, reject) => {
      alarmToBeSureApi(data)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 获取警情处理数据
  getMapAlarmDealList({commit}, data) {
    return getAlarmDeal(data)
  },
  // 获取警情处理启用状态
  getMapAlarmDealStatus({commit}, data) {
    return getAlarmDealStatus()
  },
  // 报警权限
  getMapAlarmPower({commit}, data) {
    const param = {
      roleId: read('roleId'),
      resId: data
    }
    return getAlarmPower(param)
  }
}

export default {
  state,
  actions,
  getters
}
