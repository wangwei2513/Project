import {
  getMap3DParamConfig,
  setMap3DParamConfig,
  saveLayerSettingsApi,
  updateLayerSettingsApi,
  getLayerSettingsApi
} from '../../../http/map3d'
const state = {
  // 应用模式属性---
  isClearDrawExtent: false,
  isShowAreaDailog: false, // 地图上绘制区域后是否显示对话框
  is3DMapOuter: true, // 判断是在3d地图还是在平面地图的标志---
  ready: false, // 地图是否加载完成的标志----胡红勋添加
  active3DDraw: false, // 控制3d绘制工具的激活
  active2DDraw: false, // 控制2d绘制工具的激活
  active2DEdit: false, // 控制2d编辑工具的激活
  active2DGridDraw: false, // 控制2d网格绘制工具的激活---
  active3DPoleDraw: false, // 控制3D辅助杆绘制工具的激活---韩杰--2018-11-6 14:21:32
  area2DDrawActive: false, // 楼层平面图的区域绘制工具
  map3DConfig: null, // 3d地图下的地图配置属性
  active3DChangePositionDraw: false, // 控制3d绘制工具的激活以修改模型的位置
  mapConfigModal: false, // 3D地图配置框控制---高鹏添加
  map3DParam: null, // 3D地图配置参数
  mapMode: 'point3D', // 地图模式-------胡红勋 ---2018-09-8
  rightPanelType: '',
  rightPanelShow: false,
  showBuildingAlarm: false, // 楼宇报警列表控制
  videoPreviewFlag: false,
  // 地图编辑下的点位控制
  editResourcesTypeControl: {
    videoCheck: true,
    alarmCheck: true,
    alarmHelpCheck: true,
    patrolCheck: true,
    tipCheck: false
  },
  showTrackModal: false, // 是否显示轨迹查询弹出框---韩杰---2018-10-25
  showDrawTrack: false, // 是否显示绘制轨迹---韩杰---2018-10-25
  trackCoMap: null, // 轨迹坐标map(key: 坐标点信息，value：三维坐标)---韩杰---2018-11-2 14:06:33
  showPopup: false, // 是否显示气泡弹出框---韩杰---2018-10-26 09:25:13
  selectedEntity: {}, // 选择的实体---韩杰---2018-10-26 09:25:13
  selectedEntityScreenCo: {}, // 选择实体的Cartesian2屏幕坐标---韩杰---2018-10-26 09:25:13
  viewSetting: false,
  layerSettingsMap: new Map() // 图层设置map(key: 图层名称， value: 图层设置信息)
}
const getters = {}
const mutations = {
  // viewSetting
  SET_VIEWSETTING(state, data) {
    state.viewSetting = data
  },
  // videoPreviewFlag
  SET_VIDEO_PREVIEW_FLAG(state, data) {
    state.videoPreviewFlag = data
  },
  // showBuildingAlarm
  SET_SHOW_BUILDING_ALARM(state, data) {
    state.showBuildingAlarm = data
  },
  SET_IS_CLEAR_DRAW_EXTENT(state, data) {
    state.isClearDrawExtent = data
  },
  SET_IS_SHOW_AREA_DIALOG(state, data) {
    state.isShowAreaDailog = data
  },
  SET_RIGHTPANEL_SHOW(state, data) {
    state.rightPanelShow = data
  },
  // 右侧面板控制
  SET_RIGHT_PANEL_TYPE(state, data) {
    state.rightPanelType = data
  },
  // 楼层外
  SET_ISOUTER(state, data) {
    state.is3DMapOuter = data
  },
  // 地图是否加载完成的标志----胡红勋添加
  SET_READY(state, data) {
    state.ready = data
  },
  // 是否激活3d绘制工具--
  SET_3D_ACTIVE_DRAW(state, flag) {
    state.active3DDraw = flag
  },
  SET_2D_AREA_ACTIVE_DRAW(state, flag) {
    state.area2DDrawActive = flag
  },
  // 是否激活2d绘制工具---
  SET_2D_ACTIVE_DRAW(state, flag) {
    state.active2DDraw = flag
  },
  // 是否激活2d编辑工具
  SET_2D_ACTIVE_EDIT(state, flag) {
    state.active2DEdit = flag
  },
  // 是否激活2d网格绘制工具 ---胡红勋
  SET_2D_ACTIVE_GRID_DRAW(state, flag) {
    state.active2DGridDraw = flag
  },
  // 保存3d地图的配置文件
  SET_3D_MAP_CONFIG(state, config) {
    state.map3DConfig = config
  },
  // 3D地图配置弹框控制
  SET_3D_EDIT_CONFIG_MODAL(state, flag) {
    state.mapConfigModal = flag
  },
  // 保存3D地图的配置参数
  SET_MAP_3D_PARAM(state, val) {
    state.map3DParam = val
  },
  // 是否激活改变3d模型的位置的绘制工具
  SET_3D_ACTIVE_CHANGE_POSITION_DRAW(state, flag) {
    state.active3DChangePositionDraw = flag
  },
  // 设置地图模式-胡红勋 2018 -09--08
  SET_MAP_MODE(state, mode) {
    state.mapMode = mode
  },
  // 设置地图编辑模式下点位资源类型控制-胡红勋
  SET_EDIT_RESOURCES_TYPE_CONTROL(state, obj) {
    state.editResourcesTypeControl = obj
  },
  // 设置是否显示轨迹查询弹出框---韩杰---2018-10-25
  SET_SHOW_TRACK_MODAL(state, flag) {
    state.showTrackModal = flag
  },
  // 设置是否显示绘制轨迹---韩杰---2018-10-25
  SET_SHOW_DRAW_TRACK(state, flag) {
    state.showDrawTrack = flag
  },
  // 设置是否显示气泡弹窗---韩杰---2018-10-26 09:26:11
  SET_SHOW_POPUP(state, flag) {
    state.showPopup = flag
  },
  // 设置选择的实体对象---韩杰---2018-10-26 09:26:11
  SET_SELECTED_ENTITY(state, obj) {
    state.selectedEntity = obj
  },
  // 设置选择的实体对象的屏幕坐标Cartesian2对象---韩杰---2018-10-26 09:26:11
  SET_SELECTED_ENTITY_SCREEN_CO(state, obj) {
    state.selectedEntityScreenCo = obj
  },
  // 设置轨迹坐标map(key: 坐标点信息，value：三维坐标)---韩杰---2018-11-2 14:12:16
  SET_TRACK_CO_MAP(state, map) {
    state.trackCoMap = map
  },
  // 设置激活3D辅助杆绘制工具---韩杰---2018年11月6日14:23:28
  SET_ACTIVE_3D_POLE_DRAW(state, flag) {
    state.active3DPoleDraw = flag
  },
  // 设置图层设置map
  SET_LAYER_SETTINGS_MAP(state, map) {
    state.layerSettingsMap = map
  }
}
const actions = {
  // SET_VIEWSETTING
  setViewSetting({ commit }, data) {
    commit('SET_VIEWSETTING', data)
  },
  set2DAreaDraw({ commit }, data) {
    commit('SET_2D_AREA_ACTIVE_DRAW', data)
  },
  // SET_VIDEO_PREVIEW_FLAG
  setVideoPreviewFlag({ commit }, data) {
    commit('SET_VIDEO_PREVIEW_FLAG', data)
  },
  // SET_SHOW_BUILDING_ALARM
  setShowBuildingAlarm({ commit }, data) {
    commit('SET_SHOW_BUILDING_ALARM', data)
  },
  setClearDrawExtent({ commit }, data) {
    commit('SET_IS_CLEAR_DRAW_EXTENT', data)
  },
  // 区域对话框显示---
  setAreaDialogShow({ commit }, data) {
    commit('SET_IS_SHOW_AREA_DIALOG', data)
  },
  // SET_RIGHTPANEL_SHOW
  setRightPanelShow({ commit }, data) {
    commit('SET_RIGHTPANEL_SHOW', data)
  },
  // 提交SET_RIGHT_PANEL_TYPE
  setRightPanelType({ commit }, data) {
    commit('SET_RIGHT_PANEL_TYPE', data)
  },
  // 提交SET_ISOUTER 楼层内外
  setIsOuter({ commit }, data) {
    commit('SET_ISOUTER', data)
  },
  // 提交SET_READY 3d地图加载完成标识
  setReady({ commit }, data) {
    commit('SET_READY', data)
  },
  // 提交SET_ACTIVE_DRAW 绘制控件
  set3DActiveDraw({ commit }, data) {
    commit('SET_3D_ACTIVE_DRAW', data)
  },
  set2DActiveDraw({ commit }, data) {
    commit('SET_2D_ACTIVE_DRAW', data)
  },
  set2DActiveEdit({ commit }, data) {
    commit('SET_2D_ACTIVE_EDIT', data)
  },
  // 绘制网格工具---
  set2DActiveGridDraw({ commit }, data) {
    commit('SET_2D_ACTIVE_GRID_DRAW', data)
  },
  set3DActiveChangePositionDraw({ commit }, data) {
    commit('SET_3D_ACTIVE_CHANGE_POSITION_DRAW', data)
  },
  // 3d地图参数配置弹框控制
  set3DEditConfigModal({ commit }, data) {
    commit('SET_3D_EDIT_CONFIG_MODAL', data)
  },
  // 设置地图模式
  setMapMode({ commit }, data) {
    commit('SET_MAP_MODE', data)
  },
  setEditResourceTypeControl({ commit }, data) {
    commit('SET_EDIT_RESOURCES_TYPE_CONTROL', data)
  },
  // 设置是否显示轨迹查询弹出框---韩杰---2018-10-25
  setShowTrackModal({ commit }, flag) {
    commit('SET_SHOW_TRACK_MODAL', flag)
  },
  // 设置是否显示绘制轨迹---韩杰---2018-10-25
  setShowDrawTrack({ commit }, flag) {
    commit('SET_SHOW_DRAW_TRACK', flag)
  },
  // 设置是否显示气泡弹窗---韩杰---2018-10-26 09:26:11
  setShowPopup({ commit }, flag) {
    commit('SET_SHOW_POPUP', flag)
  },
  // 设置选择的实体对象---韩杰---2018-10-26 09:26:11
  setSelectedEntity({ commit }, obj) {
    commit('SET_SELECTED_ENTITY', obj)
  },
  // 设置选择的实体对象的屏幕坐标Cartesian2对象---韩杰---2018-10-26 09:26:11
  setSelectedEntityScreenCo({ commit }, obj) {
    commit('SET_SELECTED_ENTITY_SCREEN_CO', obj)
  },
  // 设置轨迹坐标map(key: 坐标点信息，value：三维坐标)---韩杰---2018年11月2日14:10:45
  setTrackCoMap({ commit }, map) {
    commit('SET_TRACK_CO_MAP', map)
  },
  // 获取3D地图配置参数
  getMap3DParamConfig({ commit }) {
    return new Promise((resolve, reject) => {
      getMap3DParamConfig()
        .then(res => {
          console.log(res, '3DParam')
          if (res.data.dataSet) {
            commit('SET_3D_MAP_CONFIG', res.data)
          }
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 设置3D地图配置参数
  setMap3DParamConfig({ commit }, payload) {
    return new Promise((resolve, reject) => {
      setMap3DParamConfig(payload)
        .then(res => {
          console.log(res)
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 设置控制3D辅助杆绘制工具---韩杰---2018-11-6 14:25:17
  setActive3DPoleDraw({ commit }, flag) {
    commit('SET_ACTIVE_3D_POLE_DRAW', flag)
  },
  // 添加图层设置信息
  saveLayerSettings({ commit }, playod) {
    return new Promise((resolve, reject) => {
      saveLayerSettingsApi(playod)
        .then(res => {
          resolve(res.data)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 根据标识更新图层设置信息
  updateLayerSettingsById({ commit }, playod) {
    return new Promise((resolve, reject) => {
      updateLayerSettingsApi(playod)
        .then(res => {
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    })
  },
  // 获取图层设置信息列表
  getLayerSettingsList({ commit }) {
    return new Promise((resolve, reject) => {
      getLayerSettingsApi()
        .then(res => {
          let settingsArr = res.data
          let settingsMap = new Map()
          for (const settings of settingsArr) {
            settingsMap.set(settings.name, settings)
          }
          commit('SET_LAYER_SETTINGS_MAP', settingsMap)
          resolve(settingsArr)
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
