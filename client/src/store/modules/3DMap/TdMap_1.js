import { get, post, put, remove } from 'http/base'
import Vue from 'vue'
import toTreeData from '../../../assets/js/toTreeData'
import map3DUtil from '../../../assets/3DMap/utils/index.js'
import socket from 'socket/index.js'
const state = {
  TdFullScreen: false, // 3d全屏
  pointInformation: null,
  building: {},
  defaultActiveSate: 0,
  buildOneData: null, // 单个楼宇信息
  buildEditList: [], // 楼宇列表
  floorList: [], // 楼层列表
  floorOneData: null, // 单个楼层信息
  mapFloorStic: {}, // 楼层统计
  is3dMapOuter: true,
  goBackToBildingList: false,
  floorId: '',
  TDMapOrgTree: [],
  map3DAlarmHelpList: [], // 报警助列表---胡红勋添加-2018-09-03
  urlModel: false,
  serviceUrl: '',
  dataUrl: '',
  ready: false, // 地图是否加载完成的标志----胡红勋添加
  buildDetailInfo: {}, // 建筑物详情---胡红勋
  activeDraw: false, // 控制激活控件的变量
  activeMeasure: false, // 控制测量控件的变量
  tdpointData: {}, // 3d点位数据
  tdalarmData: {},
  tdpatrolData: {},
  tdalarmhelpData: {}, // 胡红勋添加，报警求助信息----0903
  currentVedioNodeInfo: null, // 视频节点信息
  map3DvideoList: [], // 视频点位列表
  map3dAlarmList: [], // 报警点位列表
  map3dpartrolData: [], // 巡更点位列表
  mapEditRightPage: false, // 控制地图编辑页的右边属性显示面板
  editPageDetail: '',
  mapEditRightContent: '',
  editVedioDraw: false, // 控制2d平面图绘制工具
  modifyActive: false, // 控制2d 平面绘制工具你的启动
  alarmFeatureList: [],
  alarmingFeatureList: [], // 报警闪烁图层要素数组
  patrolFeatureList: [],
  highLightFeatureList: [],
  alarmHelpFeatureList: [], // 报警柱要素列表  胡红勋--2018-09-06
  fireAlarmFeatureList: [],
  showBuildingList: false, // 3d地图编辑header楼宇列表显示状态
  videoIpcFeatures: [], //  图层要素数组
  videoPlayBack: false,
  detail: 'edit',
  formType: 'building',
  modelConfig: null,
  activeModifyDraw: false, // 修改模型的位置的控件
  rightInfoType: '', // 3d应用模式下右侧面板控制
  videoShow: 'video', // 控制 点位资源树、巡更点资源树、报警点位资源树的切换
  floorDataBid: '', // 3d编辑模式下楼层列表对应的楼宇id
  app3DVedioIpcStatusList: [], // 胡红勋添加，2018-09-13，保存soket实时推送的点位状态数据，0：离线，1：在线
  plugin3DState: [],
  volume3d: 50,
  video3DPointArr: [], // 3d应用模式视频播放数组
  single3DArr: [], // 单兵数组 王伟--9/3 16:48
  singleId: '', //  单兵id
  buidlingId: '', // 楼宇id
  floorPatrolAlarms: {}, // 楼层内巡更点位报警集合
  PatrolAlarmListShow: false, // 巡更点位报警集合列表显示
  tickObj: {
    times: 0
  }, // 计数器对象
  patrolTickObj: null, // 计数器对象
  patrolAlarmFea: null, // 3d楼层巡更点位报警fea
  allAlarmPointFea: [], // 全部报警点位
  mapResource: {}, // 获取地图通道资源---胡红勋--2018-09-06
  mapMode: 'point3D', // 地图模式-------胡红勋 ---2018-09-8
  map3DInfo: {
    buildingInfo: 'buildingInfo', // 楼宇面板
    pointInfo: 'pointInfo', //
    floorInfo: 'floorInfo', // 楼层面板
    alarmList: 'alarmList', // 报警列表
    pown: 'pown', // 单兵列表
    patrol: 'patrol',
    alarmAppVideo: 'alarmAppVideo'
  },
  // 胡红勋添加----09-13 地图应用模式
  resourcesTypeObj: {
    deviceTypes: ['boltipc', 'redBoltipc', 'halfBallipc', 'fastBallipc', 'allViewipc'],
    alarmCheck: false,
    commonAlarmCheck: false,
    patrolCheck: false,
    singleCheck: false,
    alarmHelpCheck: false,
    labelCheck: false
  },
  // 胡红勋 09-13 地图编辑模式----
  pointResourcesType: {
    ipcTypes: ['boltipc', 'redBoltipc', 'halfBallipc', 'fastBallipc', 'allViewipc'],
    fireAlarmCheck: true,
    patrolCheck: true,
    alarmHelpCheck: true
  }
}
const getters = {}
const mutations = {
  // 楼宇闪烁定时器
  SET_PATROLTICKOBJ(state, data) {
    state.patrolTickObj = data
  },
  // 设置点位资源类型-胡红勋-09-13
  SET_POINT_RESOURCE_TYPE(state, obj) {
    state.pointResourcesType = obj
  },
  // 设置资源类型-胡红勋-09-13
  SET_RESOURCE_TYPE_OBJ(state, obj) {
    state.resourcesTypeObj = obj
  },
  // 消防报警----胡红勋-----
  SET_2D_FIRE_ALARM_LIST(state, features) {
    state.fireAlarmFeatureList = features
  },
  // 设置地图模式-胡红勋 2018 -09--08
  SET_MAP_MODE(state, mode) {
    state.mapMode = mode
  },
  SET_ALLALARMPOINTFEA(state, data) {
    state.allAlarmPointFea = data
  },
  // 设置报警求助-胡红勋
  SET_ALARM_Help_List(state, data) {
    state.alarmHelpFeatureList = data
  },
  SET_PATROLALARMREA(state, data) {
    state.patrolAlarmFea = data
  },
  // 计数器对象
  SET_TICKOBJ(state, data) {
    state.tickObj = data
  },
  // 巡更点位报警集合列表显示
  SET_PATROLALARMLISTSHOW(state, data) {
    state.PatrolAlarmListShow = data
  },
  // 楼层内点位报警集合
  SET_FLOORPATROLALARMS(state, data) {
    state.floorPatrolAlarms = data
  },
  SET_BUILDINGID(state, data) {
    state.buidlingId = data
  },
  SET_SINGLEID(state, data) {
    state.singleId = data
  },
  // 单兵数组 王伟--9/3 16:48
  SET_SINGLE3DARR(state, data) {
    state.single3DArr = data
  },
  // 3d应用模式视频播放数组
  SET_VIDEO3DPOINTARR(state, data) {
    state.video3DPointArr = data
  },
  // 弹出框音量控制
  SET_VOLUME3D(state, data) {
    state.volume3d = data
  },
  // 弹出框控制
  SET_PLUGIN3DSTATE(state, data) {
    state.plugin3DState = data
  },
  // 控制3d点位树
  SET_3D_VEDIO_SHOW(state, type) {
    state.videoShow = type
  },
  SET_3D_MODIFY_DRAW(state, flag) {
    state.activeModifyDraw = flag
  },
  // 保存地图模型地址
  SET_3D_MODEL_CONFIG(state, config) {
    state.modelConfig = config
  },
  SET_2D_VEDIO_FEATURES(state, features) {
    state.videoIpcFeatures = features
  },
  SET_2D_PATROL_LIST(state, features) {
    console.log('巡更要素列表：' + features.length)
    state.patrolFeatureList = features
  },
  SET_2D_HIGHLIGHT_LIST(state, features) {
    state.highLightFeatureList = features
  },
  SET_2D_ALARM_LIST(state, features) {
    state.alarmFeatureList = features
  },
  // 报警闪烁图层要素-----
  SET_2D_ALARMING_LIST(state, features) {
    state.alarmingFeatureList = features
  },
  SET_2D_EDIT_ACTIVE(state, flag) {
    state.modifyActive = flag
  },
  SET_2D_EDIT_DRAW(state, flag) {
    state.editVedioDraw = flag
  },
  SET_3D_EDIT_RIGHT_PAGE(state, flag) {
    state.mapEditRightPage = flag
  },
  SET_3D_EDIT_RIGHT_CONTENT(state, content) {
    state.mapEditRightContent = content
  },
  // 报警助点位树---胡红勋添加----
  GET_3D_ALARM_HELP_POINT_TREE(state, data) {
    state.map3DAlarmHelpList = data
  },
  GET_3D_VIDEOPOINT_TREE(state, data) {
    state.map3DvideoList = data
  },
  GET_3D_ALARMPOINT_TREE(state, data) {
    state.map3dAlarmList = data
  },
  GET_3D_PARTROLPOINT_TREE(state, data) {
    state.map3dpartrolData = data
  },
  // 操作当前的视频节点信息--
  SET_CURRENT_VEDIO_NODE_INFO(state, data) {
    state.currentVedioNodeInfo = data
  },
  // 获取点位信息
  GET_TD_POINT_DATA(state, data) {
    state.tdpointData = data
  },
  // 获取报警助信息---胡红勋信息------09-03
  GET_TD_ALARM_HELP_DATA(state, data) {
    state.tdalarmhelpData = data
  },
  GET_TD_ALARM_DATA(state, data) {
    state.tdalarmData = data
  },
  GET_TD_PATROL_DATA(state, data) {
    state.tdpatrolData = data
  },
  // 是否激活绘制控件--
  SET_ACTIVE_DRAW(state, flag) {
    state.activeDraw = flag
  },
  SET_ACTIVE_MEASURE(state, flag) {
    state.activeMeasure = flag
  },
  // 地图是否加载完成的标志----胡红勋添加
  SET_READY(state, data) {
    state.ready = data
  },
  SET_FULL_SCREEN(state, data) {
    state.TdFullScreen = data
  },
  SET_BUILDING_DETAIL_INFO(state, info) {
    state.buildDetailInfo = info
  },
  SET_BUILDING(state, data) {
    state.building = data
  },
  SET_DEFAULTACTIVESTATE(state, data) {
    state.defaultActiveSate = data
  },
  SET_BUILDONEDATA(state, data) {
    state.buildOneData = data
  },
  SET_BUILDINGEDITLIST(state, data) {
    state.buildEditList = data
  },
  SET_FLOORLIST(state, data) {
    state.floorList = data
  },
  SET_FLOORONEDATA(state, data) {
    state.floorOneData = data
  },
  SET_ISOUTER(state, data) {
    state.is3dMapOuter = data
  },
  SET_GOBACKTOBUILDINGLIST(state, data) {
    state.goBackToBildingList = data
  },
  SET_FLOORID(state, data) {
    state.floorId = data
  },
  // 地图结构树
  GET_MAPORG_TREE(state, data) {
    state.TDMapOrgTree = data
  },
  SET_URLMODEL(state, data) {
    state.urlModel = data
  },
  SET_SERVICEURL(state, data) {
    state.serviceUrl = data
  },
  SET_DATAURL(state, data) {
    state.dataUrl = data
  },
  // 地图编辑模式弹框控制
  SET_EDITDETAIL_STATE(state, data) {
    state.editPageDetail = data
  },
  SET_SHOWBUILDINGLIST(state, data) {
    state.showBuildingList = data
  },
  // 楼层统计
  GET_FLOOR_STATISTIC(state, data) {
    state.mapFloorStic = data
  },
  SET_VIDEO_PLAYBACK(state, data) {
    state.videoPlayBack = data
  },
  SET_3D_DETAIL(state, data) {
    state.detail = data
  },
  SET_3D_FORMTYPE(state, data) {
    state.formType = data
  },
  SET_3D_RIGHT_INFO_TYPE(state, data) {
    state.rightInfoType = data
  },
  SET_FLOOTDATA_BID(state, data) {
    state.floorDataBid = data
  },
  // 胡红勋添加 2018-9-03 保存实时的点位状态数据
  SET_3D_APPVEDIOIPCSTATUS_LIST(state, data) {
    state.app3DVedioIpcStatusList = data
  },
  // 设置地图资源-------胡红勋--2018-09-06
  SET_MAP_RESOURCE(state, data) {
    state.mapResource = data
  },
  // 过滤楼层平面图
  filterFea(state, id) {
    state.alarmingFeatureList.forEach((item, index) => {
      if (item.attributes.id === id) {
        state.alarmingFeatureList.splice(index, 1)
        this.commit('SET_ALLALARMPOINTFEA', state.alarmingFeatureList)
        this.commit('SET_2D_ALARMING_LIST', state.alarmingFeatureList)
      }
    })
  },
  removePatrolFea(state, fea) {
    let feaIndex
    if (fea !== null && fea.attributes && state.allAlarmPointFea.length) {
      state.allAlarmPointFea.forEach((item, index) => {
        if (fea.attributes.id === item.attributes.id) {
          feaIndex = index
        }
      })
      state.allAlarmPointFea.splice(feaIndex, 1)
      if (state.floorPatrolAlarms[fea.attributes.code] && state.floorPatrolAlarms[fea.attributes.code].length) {
        const arr = state.floorPatrolAlarms[fea.attributes.code]
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].devId === fea.attributes.id) {
            arr.splice(i, 1)
          }
        }
        this.commit('SET_FLOORPATROLALARMS', state.floorPatrolAlarms)
      }
      this.commit('SET_ALLALARMPOINTFEA', state.allAlarmPointFea)
      this.commit('SET_2D_ALARMING_LIST', state.allAlarmPointFea)
    }
  },
  deleteAlarm(state, id) {
    if (state.tickObj[id]) {
      clearInterval(state.tickObj[id])
      delete state.tickObj[id]
      this.commit('SET_TICKOBJ', state.tickObj)
    }
  }
}
const actions = {
  // 胡红勋添加 2018-9-03 监听发送点位数据状态的socket,并保存数据----
  listen3DIpcStatusEvt({ commit }) {
    console.log('准备接收点位状态数据：')
    socket.on('server:devOnline', data => {
      console.log('正在接收视频点位接收状态')
      commit('SET_3D_APPVEDIOIPCSTATUS_LIST', data)
    })
  },
  // 胡红勋添加 2018-9-03 删除socket监听
  removeListen3DIpcStatusEvt() {
    socket.removeAllListeners('server:devOnline')
  },
  // 编辑模式建筑信息保存
  setBuildingInfo({ commit }, data) {
    const param = {
      body: data,
      url: '/map3d/building'
    }
    return new Promise((resolve, reject) => {
      post(param)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 编辑模式建筑信息修改
  buildingInfoEdit({ commit }, arr) {
    const param = {
      body: arr[0],
      url: '/map3d/building/' + arr[1]
    }
    return new Promise((resolve, reject) => {
      put(param)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 获取建筑信息
  getBuildingInfo({ commit }, id) {
    const param = {
      url: '/map3d/building/' + id
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
          commit('SET_BUILDONEDATA', res.data)
          commit('SET_FLOORLIST', res.data.storey)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 获取全部楼宇信息
  getAllBuildingInfo({ commit }) {
    const param = {
      url: '/map3d/building'
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
          commit('SET_BUILDINGEDITLIST', res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  get3DBuildPaging({ commit }, playod) {
    const param = {
      url:
        '/map3d/building?buildpage=' +
        playod.page +
        '&buildlimit=' +
        playod.limit +
        '&buildname=' +
        encodeURIComponent(playod.name.toString())
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
          commit('SET_BUILDINGEDITLIST', res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 删除楼宇
  deleteBuildingInfo({ commit }, id) {
    const param = {
      url: '/map3d/building/' + id
    }
    return new Promise((resolve, reject) => {
      remove(param)
        .then(res => {
          resolve(res.data)
          console('删除' + res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 新增楼层信息
  addFloors({ commit }, data) {
    const param = {
      body: data,
      url: '/map3d/storey'
    }
    return new Promise((resolve, reject) => {
      post(param)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 获取一栋楼宇全部楼层信息 获取一栋楼宇全部楼层信息
  getAllFloors({ commit }, _id) {
    const param = {
      url: '/map3d/building/' + _id + '/storey'
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
          commit('SET_FLOORLIST', res.data.storey)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 修改楼层信息
  editFloorInfo({ commit }, arr) {
    const param = {
      url: '/map3d/storey/' + arr[0],
      body: arr[1]
    }
    return new Promise((resolve, reject) => {
      put(param)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 删除楼层
  removeFloor({ commit }, id) {
    const param = {
      url: '/map3d/storey/' + id
    }
    return new Promise((resolve, reject) => {
      remove(param)
        .then(res => {
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 获取单个楼层信息
  getSingleFloorInfo({ commit }, id) {
    const param = {
      url: '/map3d/storey/' + id
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          commit('SET_FLOORONEDATA', res.data)
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 获取报警助方法-----胡红勋添加---2018-09-03
  get3DAlarmHelpTree({ commit }, playod) {
    const param = {
      url: 'setting/resource/tree/map/alarmhelp',
      query: {
        maptype: playod.maptype
      }
    }
    if (playod.floorId) {
      param.query.storeyId = playod.floorId
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve('报警助:' + res.data)
          commit('GET_3D_ALARM_HELP_POINT_TREE', [JSON.parse(JSON.stringify(res.data))])
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 获取地图结构树
  get3DMapOrgTree({ commit }, playod) {
    const param = {
      url: '/map3d/zone/tree'
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
          commit('GET_MAPORG_TREE', [res.data])
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 获取3d视频点位树列表
  get3DResourceOrg({ commit }, playod) {
    const param = {
      url: '/setting/resource/tree/map/multiresource',
      query: {
        orgtype: 0,
        channelTypes: '0,1',
        maptype: playod.maptype
      }
    }
    if (playod.floorId) {
      param.query.storeyId = playod.floorId
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          console.log(res.data)
          resolve(res.data)
          commit('GET_3D_VIDEOPOINT_TREE', [res.data])
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 获取报警资源树
  getAlarmPointTree({ commit }, playod) {
    const param = {
      url: '/setting/resource/tree/map/firealarmin',
      query: {
        orgtype: 0,
        channelTypes: '11,9',
        maptype: playod.maptype
      }
    }
    if (playod.floorId) {
      param.query.storeyId = playod.floorId
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
          var arr = []
          arr.push(JSON.parse(JSON.stringify(res.data)))
          commit('GET_3D_ALARMPOINT_TREE', toTreeData(arr))
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 获取巡更点位树
  getPatrolPointTree({ commit }, playod) {
    const param = {
      url: '/setting/sentry/point/tree',
      query: {
        mapType: playod.mapType
      }
    }

    if (playod.floorId) {
      param.query.storeyId = playod.floorId
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
          commit('GET_3D_PARTROLPOINT_TREE', toTreeData(res.data))
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 获取3d地图的巡更点位 胡红勋添加
  getPatrolPointIn3DMap({ commit }) {
    const param = {
      url: 'setting/sentry/point/outer?mapType=3d'
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 保存3d视频点位---
  save3DVedioPoint({ commit }, playod) {
    const param = {
      body: playod.body,
      url: '/map/point/' + playod._id,
      maptype: '3d'
    }
    return new Promise((resolve, reject) => {
      put(param)
        .then(res => {
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 在3d地图上获取视频通道资源-----------2018-09-09
  getVedioChannelResource({ commit }, playod) {
    const param = {
      url: '/map/point/three',
      query: {
        channelTypes: playod.channelTypes,
        maptype: '3d'
      }
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 根据楼层id获取报警点位
  get3DAllFloorPoint({ commit }, playod) {
    const param = {
      url: 'map3d/storey/' + playod.id + '/point',
      query: playod.query
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 修改|添加资源点位
  update3DVedioPoint({ commit }, playod) {
    const param = {
      body: playod.body,
      url: '/map/point/' + playod._id,
      maptype: '3d'
    }
    return new Promise((resolve, reject) => {
      put(param)
        .then(res => {
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 胡红勋，删除点位资源--------2018-09-08
  deleteResourceById({ commit }, playod) {
    const param = {
      url: '/map/point/' + playod + '?maptype=3d'
    }
    return new Promise((resolve, reject) => {
      remove(param)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 删除资源点位
  delete3DVedioPoint({ commit }, playod) {
    const param = {
      body: playod,
      url: '/map/point/' + playod,
      maptype: '3d'
    }
    return new Promise((resolve, reject) => {
      remove(param)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 胡红勋添加------删除报警柱点-----09-04
  delete3DAlarmHelpPoint({ commit }, playod) {
    const param = {
      body: playod,
      url: '/map/point/' + playod,
      maptype: '3d'
    }
    return new Promise((resolve, reject) => {
      remove(param)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 根据地理位置获取点位----
  get3DPointByLoc({ commit }, loc) {
    const param = {
      url: '/map/point/loc?loc=' + loc
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data[0])
          commit('GET_TD_POINT_DATA', res.data[0])
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 设置地图地址
  setServiceUrl({ commit }, [serviceUrl, dataUrl]) {
    // const param = {
    //   url: '',
    //   body: ''
    // }
  },
  // 根据点位id获取视频点位详细信息----
  get3DVedioPoint({ commit }, playod) {
    const param = {
      url: '/map/point/' + playod,
      maptype: '3d'
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
          commit('GET_TD_POINT_DATA', res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 获取报警求助的详细信息---胡红勋
  get3dAlarmHelpPoint({ commit }, id) {
    const param = {
      url: '/map/point/' + id,
      maptype: '3d'
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
          commit('GET_TD_ALARM_HELP_DATA', res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 胡红勋添加，保存或者修改报警求助点位----
  saveOrEditAlarmHelpPoint({ commit }, playod) {
    const param = {
      body: playod,
      url: '/map/point/' + playod._id,
      maptype: '3d'
    }
    return new Promise((resolve, reject) => {
      put(param)
        .then(res => {
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 楼层统计
  get3DFloorStatData({ commit }, playod) {
    var param = {
      url: '/map/storey/' + playod + '/statistic'
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
          commit('GET_FLOOR_STATISTIC', res.data)
        })
        .catch(err => reject(err))
    })
  },
  // 获取地图配置相关信息--胡红勋
  get3DMapConfig({ commit }) {
    const param = {
      url: '/map3d/conf/mapconf'
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          commit('SET_3D_MODEL_CONFIG', res.data)
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 统计
  get3DStatData({ commit }, playod) {
    var param = {
      url: '/map3d/zone/statistic',
      body: {
        wkt: playod
      }
    }
    return new Promise((resolve, reject) => {
      post(param)
        .then(res => {
          resolve(res)
        })
        .catch(err => reject(err))
    })
  },
  editPatrolPoint({ commit }, playod) {
    const param = {
      body: playod,
      url: '/setting/sentry/point/' + playod._id + '?mapType=3d'
    }
    return new Promise((resolve, reject) => {
      put(param)
        .then(res => {
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 获取单个巡更点位
  get3DPatrolPoint({ commit }, playod) {
    const param = {
      url: '/setting/sentry/point/' + playod + '?mapType=3d'
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
          commit('SET_MAP_RESOURCE', res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 获取单个报警资源
  get3DAlarmPoint({ commit }, playod) {
    const param = {
      url: '/map/point/' + playod + '/fire?maptype=3d',
      maptype: '3d'
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
          commit('SET_MAP_RESOURCE', res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 修改|添加资源点位
  saveOrUPdateAlarmPoint({ commit }, playod) {
    const param = {
      body: playod.body,
      url: '/map/point/' + playod._id + '/fire?maptype=3d',
      maptype: '3d'
    }
    return new Promise((resolve, reject) => {
      put(param)
        .then(res => {
          console.log(res)
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 胡红勋添加 2018 -09 -08
  removePatrolPoint({ commit }, playod) {
    const param = {
      url: '/setting/sentry/point/clean/' + playod + '?mapType=3d'
    }
    return new Promise((resolve, reject) => {
      remove(param)
        .then(res => {
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 校验楼宇名称
  isBuildName({ commit }, playod) {
    const param = {
      query: playod,
      url: '/map/building/checkRepeat'
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 单兵人员位置信息 王伟 -- 9/3 16:50
  receiveSinglesPos({ commit, state }) {
    // 监听单兵列表
    Vue.socket.on('server:patrol.user', data => {
      let newArr = []
      let deleteArr = []
      if (state.single3DArr.length === 0) {
        newArr = data
      } else {
        console.log('data', data)
        data.forEach(item => {
          if (!state.single3DArr.some(li => item.userId === li.userId)) {
            newArr.push(item)
          }
        })
        state.single3DArr.forEach(item => {
          if (!state.single3DArr.some(li => item.userId === li.userId)) {
            deleteArr.push(item)
          }
        })
      }
      console.log('newArr', newArr)
      console.log('deleteArr', deleteArr)
      const viewer = Vue.prototype.$viewer
      const Cesium = Vue.prototype.$Cesium
      newArr.forEach(item => {
        if (state.ready && state.is3dMapOuter && item.geo) {
          let entities = viewer.entities
          let entity = entities.getById(item.userId)
          let location = [item.geo.lon, item.geo.lat, 50]
          if (!entity) {
            let s3mUrl = state.modelConfig['patrol']
            map3DUtil.addSingleModel(
              {
                viewer,
                Cesium
              },
              item.userId,
              'single',
              s3mUrl,
              location[0],
              location[1],
              location[2]
            )
          }
        }
      })
      deleteArr.forEach(item => {
        if (state.is3dMapOuter && state.ready) {
          const viewer = this.$viewer
          let entities = viewer.entities
          let entity = entities.getById(item.userId)
          if (entity) {
            this.$viewer.entities.removeById(item.userId) // 根据实体id删除实体----
          }
        }
      })
      commit('SET_SINGLE3DARR', data) // 移动单兵列表
    })
  },
  // 根据id获取资源 ---胡红勋--2018-09-06
  getResourceById({ commit }, id) {
    const param = {
      url: '/map/point/' + id + '?maptype=3d'
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
          commit('SET_MAP_RESOURCE', res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 获取单个报警资源
  getOne3DAlarm({ commit }, playod) {
    const param = {
      url: '/map/point/' + playod + '/fire?maptype=3d'
    }
    return new Promise((resolve, reject) => {
      get(param)
        .then(res => {
          resolve(res.data)
          commit('GET_ONEALARM_ONE', res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 修改|添加资源点位
  setOne3DAlarm({ commit }, playod) {
    const param = {
      body: playod.body,
      url: '/map/point/' + playod._id + '/fire?maptype=3d'
    }
    return new Promise((resolve, reject) => {
      put(param)
        .then(res => {
          console.log(res)
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 删除资源点位
  delOne3DAlarm({ commit }, playod) {
    const param = {
      url: '/map/point/' + playod + '?maptype=3d'
    }
    return new Promise((resolve, reject) => {
      remove(param)
        .then(res => {
          resolve(res.data)
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
