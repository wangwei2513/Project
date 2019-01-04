import Vue from 'vue'
import Vuex from 'vuex'
import {read, save} from '../storage'
import routeLoading from './modules/route'
import config from './modules/global-config'
import user from './modules/user'
import pagination from './modules/page'
import playback from './modules/playback'
import preview from './modules/preview'
import mapGisData from './modules/map/mapGisdata'
import mapPageState from './modules/map/mapPageState'
import mapAreaData from './modules/map/mapAreaData'
import mapVedioData from './modules/map/mapVedioData'
import mapAlarmData from './modules/map/mapAlarmData'
import mapFormCheck from './modules/map/mapFormCheck'
import localConfig from './modules/localConfig.api'
import orgSetting from './modules/orgSetting'
import equipment from './modules/equipment'
import newEquipment from './modules/newEquipment'
import resource from './modules/resource'
import vehicle from './modules/vehicle'
import orgConfig from './modules/alarmManage/orgConfig'
import sortShow from './modules/alarmManage/sortShow'
import timeTemplate from './modules/alarmManage/timeTemplate'
import paramsSetting from './modules/alarmManage/paramsSetting'
import videoManage from './modules/videoManange'
import tvwall from './modules/tvwall'
import videoOrg from './modules/videoOrg'
import platform from './modules/platform'
import warningCount from './modules/warning/warningCount'
import warningDispose from './modules/warning/warningDispose'
import dict from './modules/dict'
import face from './modules/face'
import homePage from './modules/homepage'
import query from './modules/query'
import structure from './modules/structure'
import fireManage from './modules/fire/manage'
import manageConfig from './modules/fire/manageConfig'
import firecontrol from './modules/fire/control'
import sysDoor from './modules/door/sysDoor'
import funDoor from './modules/door/funDoor'
// 单兵管理
import sentry from './modules/sentry'
// 巡更任务
import patrol from './modules/patrol'
// 应急预案
import emergencyMan from './modules/emergency/emergencyMan'
// 地图巡更
import patrolData from './modules/map/patrol/patrolData'
// 地图移送单兵
import mobilePatrol from './modules/map/patrol/mobilePatrol'
// 人脸抓拍
import veriface from './modules/veriface'
// 报警求助
import alarmHelps from './modules/alarmHelps'
import tdBuild from './modules/3DMap/build'
import tdFloor from './modules/3DMap/floor'
import tdPoint from './modules/3DMap/point'
import tdIndex from './modules/3DMap/index'
import alarmThreeD from './modules/3DMap/alarm'
// 智能交通
import traffic from './modules/traffic'
// 运维管理
import opsManage from './modules/opsManange'
// 运维配置
import opsConfig from './modules/opsConfig'
// 业务管理_接警
import businessAlarm from './modules/business/receiveAlarm'
import dutyLog from './modules/business/dutyLog'
// 业务管理_值班列表
import dutyList from './modules/business/dutyList'
// 平台互联
import interconnect from './modules/interconnect'
// 用户管理
import userManage from './modules/userManage/setUser'
import roleManage from './modules/userManage/setRole'
import securityPolicy from './modules/userManage/setSecurityPolicy'
import powerDist from './modules/userManage/setPowerDist'
// 巡更报警
import patrolAlarm from './modules/patrolAlarm'
import alarmMainFrame from './modules/warning/alarmMainFrame'
// 三维地图模型库
import threeMap from './modules/threeMap'
// 3D地图应用模式交互状态
import map3DApplyIX from './modules/3DMap/map3DApplyInteractive'
// 用户
import security from './modules/security'
Vue.use(Vuex)
Vue.config.devtools = true
let plugin = null
let modules = {
  homePage,
  user,
  config,
  routeLoading,
  pagination,
  playback,
  videoManage,
  localConfig,
  preview,
  equipment,
  newEquipment,
  userManage,
  roleManage,
  securityPolicy,
  powerDist,
  resource,
  vehicle,
  orgConfig,
  sortShow,
  timeTemplate,
  paramsSetting,
  orgSetting,
  tvwall,
  videoOrg,
  platform,
  warningCount,
  dict,
  face,
  warningDispose,
  query,
  structure,
  mapGisData,
  mapPageState,
  mapAreaData,
  mapVedioData,
  mapAlarmData,
  mapFormCheck,
  patrol,
  fireManage,
  manageConfig,
  firecontrol,
  sysDoor,
  funDoor,
  emergencyMan,
  sentry,
  patrolData,
  mobilePatrol,
  veriface,
  alarmHelps,
  // TdMap,
  traffic,
  opsManage,
  opsConfig,
  dutyList,
  businessAlarm,
  dutyLog,
  interconnect,
  tdBuild,
  tdFloor,
  tdPoint,
  tdIndex,
  patrolAlarm,
  alarmMainFrame,
  threeMap,
  alarmThreeD,
  map3DApplyIX,
  security
}
// 刷新页面后把保存到stroage的数据还原到store中
let state = read('state') || '{}'
state = JSON.parse(state)
for (const key in state) {
  const obj = state[key] || modules[key].state
  modules[key].state = {...obj}
}
save('state', '{}')
const store = new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  modules: modules,
  getters: {
    plugin() {
      return plugin
    }
  },
  mutations: {
    SET_PLUGIN(state, pl) {
      plugin = pl
    }
  }
})

export default store
