<script>
import { mapActions, mapState, mapGetters } from 'vuex'
import Vue from 'vue'
import layerConfig from 'assets/3DMap/MapConfig.js'
import utils from 'assets/3DMap/utils/index.js'
import mapUtils from 'assets/3DMap/mapUtil.js'
import appPatrol from 'assets/3DMap/appPatrolIpc.js'
import appResource from 'assets/3DMap/appResource.js'
import gridUtil from 'assets/3DMap/gridUtil.js'
export default {
  data() {
    return {
      context: null,
      floorOneData: {
        center: [],
        extent: [],
        mapUrl: ''
      },
      currentSMID: '',
      buildIngAlarm: null,
      allAlarmingFeatureList: [],
      index: 0,
      vedioLayer: layerConfig.layers.vedioLayer, // 视频点位图层配置
      alarmingLayer: layerConfig.layers.alarmingLayer, // 正在报警点位图层配置
      patrolLayer: layerConfig.layers.patrolLayer, // 巡更点图层配置
      commonAlarmLayer: layerConfig.layers.commonAlarmLayer, // 普通报警图层配置
      fireAlarmLayer: layerConfig.layers.fireAlarmLayer, // 消防点位图层配置
      positionLayer: layerConfig.layers.positionHighLightLayer, // 高亮定位图层配置
      alarmBoxLayer: layerConfig.layers.alarmBoxLayer, // 报警求助图层配置
      gridLayer: layerConfig.layers.gridLayer, // 楼层内网格图层配置----
      alarmColumnLayer: layerConfig.layers.alarmColumnLayer,
      areaQuery: layerConfig.layers.areaQuery, // 二维的绘制区域绘制控件样式配置-----
      keyTypes: {},
      clearExtentDraw: false,
      selectedEntitys: [],
      count: 0,
      twinkFlag: false
    }
  },
  computed: {
    ...mapGetters('map3DApplyIX', [
      'isAlarm', // 点位-普通报警
      'isFire', // 点位-消防报警
      'isAlarmBox', // 点位-报警箱
      'isAlarmPillar', // 点位-报警柱
      'isKeepWatch', // 点位-巡更
      'isSinglePawn', // 点位-单兵
      'isShowName', // 是否显示名称标签
      'isShowGrid', // 是否显示网格
      'videoCheckedList'
    ]),
    ...mapGetters('map3DApplyIX', ['isPointChooseStatus']),
    ...mapState({
      floorData: ({ tdFloor }) => tdFloor.floorData,
      map3DConfig: ({ tdIndex }) => tdIndex.map3DConfig, // 地图配置-----
      ready: ({ tdIndex }) => tdIndex.ready, // 三维地图是否加载完成的标识----
      mapMode: ({ tdIndex }) => tdIndex.mapMode, // 地图模式----
      is3DMapOuter: ({ tdIndex }) => tdIndex.is3DMapOuter, // 三维地图和楼层平面图切换的标识
      active3DDraw: ({ tdIndex }) => tdIndex.active3DDraw, // 三维绘制工具的开启关闭
      videoFeatureList: ({ tdPoint }) => tdPoint.videoFeatureList, // 普通视频点位
      fireAlarmFeatureList: ({ tdPoint }) => tdPoint.fireAlarmFeatureList, // 消防报警点位
      alarmColumnFeatureList: ({ tdPoint }) => tdPoint.alarmColumnFeatureList, // 报警柱位
      alarmBoxFeatureList: ({ tdPoint }) => tdPoint.alarmBoxFeatureList, // 报警箱位
      patrolFeatureList: ({ tdPoint }) => tdPoint.patrolFeatureList, // 巡更点位
      alarmFeatureList: ({ tdPoint }) => tdPoint.alarmFeatureList, // 普通报警点位
      alarmingFeatureList: ({ tdPoint }) => tdPoint.alarmingFeatureList, // 报警闪烁点位
      highLightFeatureList: ({ tdPoint }) => tdPoint.highLightFeatureList, // 高亮定位点位
      gridFeatureList: ({ tdPoint }) => tdPoint.gridFeatureList, // 网格列表要素
      showPopup: ({ tdIndex }) => tdIndex.showPopup, // 选择实体的Cartesian3世界坐标---韩杰---2018-10-26 09:25:13
      selectedEntity: ({ tdIndex }) => tdIndex.selectedEntity, // 选择的实体---韩杰---2018-10-26 09:25:13
      selectedEntityScreenCo: ({ tdIndex }) => tdIndex.selectedEntityScreenCo, // 选择实体的Cartesian3世界坐标---韩杰---2018-10-26 09:25:13
      mapResource: ({ tdPoint }) => tdPoint.mapResource, // 地图资源，包括通道资源，巡更资源
      buildIngAlarmObj: ({ tdPoint }) => tdPoint.buildIngAlarmObj, // 楼宇汇聚闪烁对象
      selectBoxVideoData: ({ tdPoint }) => tdPoint.selectBoxVideoData,
      previewPointList: ({ tdPoint }) => tdPoint.previewPointList,
      isBoxChoosePreView: ({ tdPoint }) => tdPoint.isBoxChoosePreView,
      videoList: ({ tdPoint }) => tdPoint.videoList,
      isBoxChooseClosed: ({ tdPoint }) => tdPoint.isBoxChooseClosed,
      area2DDrawActive: ({ tdIndex }) => tdIndex.area2DDrawActive,
      floorAlarmPoints: ({ tdPoint }) => tdPoint.floorAlarmPoints,
      buildingArr: ({ tdPoint }) => tdPoint.buildingArr,
      showDrawTrack: ({ tdIndex }) => tdIndex.showDrawTrack, // 是否显示绘制轨迹---韩杰---2018-10-25
      trackCoMap: ({ tdIndex }) => tdIndex.trackCoMap, // 轨迹坐标map(key: 坐标点信息，value：三维坐标)---韩杰---2018-10-25
      layerSettingsMap: ({ tdIndex }) => tdIndex.layerSettingsMap // 图层设置map(key: 图层名称， value: 图层设置信息)
    })
  },
  watch: {
    twinkFlag(val) {
      if (val) {
        this.alarmTwink3D(this.buildingArr)
      } else {
        this.alarmTwink3D([])
      }
    },
    isBoxChoosePreView(val) {
      if (val) {
        this.$refs.selectBoxVideoModal.openModal(this.$lodash.cloneDeep(this.previewPointList))
      }
    },
    isBoxChooseClosed(val) {
      if (val) {
        this.closeSelectModel()
      }
    },
    // previewPointList(val) {
    //   console.log(val, 'val')
    //   if (val.length === 0 && this.selectBoxVideoData.length) {
    //     this.closeSelectModel()
    //   }
    // },
    // 监听楼层数据的变化切换楼层地图
    floorData(val) {
      if (val) {
        this.setAlarmingList([])
        let width = 200
        let height = 100
        let floor = JSON.parse(JSON.stringify(val))
        if (floor.picture.size) {
          width = floor.picture.size.width
          height = floor.picture.size.height
        }
        this.floorOneData.center = floor.bid.center.split(',').map(item => Number(item))
        let levelExtent = utils.getExtent(this.floorOneData.center, [width, height])
        this.floorOneData.extent = levelExtent
        this.floorOneData.mapUrl = '/api/upload?id=' + floor.picture.id
        // 加载楼层中点位控制列表默认要显示的点位
        this.$nextTick(() => {
          this.displayAllFloorResourcePoint()
          let object = this.floorAlarmPoints[this.floorData._id]
          console.log('this.floorAlarmPoints[this.floorData._id]', object)
          for (const key in object) {
            if (object.hasOwnProperty(key)) {
              const element = object[key]
              let type = this.getType(element)
              this.addAlarmingPoint(element, key, type)
            }
          }
          console.log(this.alarmingFeatureList, 'this.alarmingFeatureList')
          this.allAlarmingFeatureList = this.$lodash.cloneDeep(this.alarmingFeatureList)
        })
      }
    },
    alarmingFeatureList: {
      handler(val) {
        // if (val.length > 0) {
        this.allAlarmingFeatureList = this.$lodash.cloneDeep(val)
        // }
        //
      },
      deep: true
    }
  },
  methods: {
    ...mapActions([
      'setReady',
      'getSinglePatrolPoint',
      'setAreaDialogShow',
      'set3DActiveDraw',
      'getStaticDataByMapExtent',
      'getResourcePointsByChannelType',
      'getAllPatrolPoint',
      'setMapResource',
      'setShowBuildingAlarm',
      'getOneBuildById',
      'setIsOuter',
      'setAlarmingList',
      'setShowPopup',
      'setSelectedEntity',
      'setSelectedEntityScreenCo',
      'getResourceById',
      'setVideoDragList',
      'getOneFloorPatrols',
      'getGridList',
      'setGridList',
      'setFirAlarmList',
      'setAlarmList',
      'setAlarmBoxList',
      'setAlarmColumnList',
      'setPatrolList',
      'setVideoList',
      'getResourceById',
      'getMap3DOneGridById',
      'getUserOne',
      'getMap3DParamConfig',
      'getAllBuild',
      'set2DAreaDraw',
      'getAssistHoleList',
      'getLayerSettingsList',
      'setPreviewPointList'
    ]),
    ...mapActions('map3DApplyIX', ['changeToolsPanelToBoxChoose', 'changeBoxChooseSecPanelStatus', 'switchToolsPanel']),
    /**
     * @msg: 返回底图
     */
    goBack() {
      this.setIsOuter(true)
    },
    // 三维地图加载完成调用的方法-----
    readyEvt(param) {
      // --------------------------------限制相机视角高度----------------------
      // param.viewer.scene.screenSpaceCameraController.minimumZoomDistance = mapUtils.TDDEFAULTOPS.minCameraHeight // 相机的高度的最小值
      // param.viewer.scene.screenSpaceCameraController.maximumZoomDistance = mapUtils.TDDEFAULTOPS.maxCameraHeight // 相机高度的最大值
      this.context = param
      let scene = param.viewer.scene
      let widget = param.viewer.cesiumWidget
      let { dataSet, dataSource, dataUrl, key, mapUrl, layer, perspective } = this.map3DConfig
      let { showDrawTrack, trackCoMap } = this
      // 去掉地图上的商标
      if (widget.creditContainer) {
        widget.creditContainer.style.display = 'none'
      }
      try {
        let promise = scene.open(mapUrl)
        param.Cesium.when(promise, layers => {
          Vue.prototype.$context = param
          this.setReady(true) // 地图图层加载完成的标志，其他组件可以以此为标志调用地图的方法
          // let layerName = layer ? layer : dataSet + '@' + dataSource
          let layerName
          if (layer) {
            layerName = layer
          } else {
            layerName = dataSet + '@' + dataSource
          }
          let scenelayer = scene.layers.find(layerName)
          // 设置拾取图层查询条件
          scenelayer.setQueryParameter({
            url: dataUrl,
            dataSourceName: dataSource,
            dataSetName: dataSet,
            keyWord: key
          })
          scenelayer.selectedColor = param.Cesium.Color.FUCHSIA
          this.adjustSceneByLayerSettings() // 根据图层设置信息调整场景
          // 设置地图方位
          if (perspective) {
            // 有视角信息时，地图定位到给定视角
            param.viewer.camera.setView({
              destination: param.Cesium.Cartesian3.fromDegrees(
                perspective.longitude,
                perspective.latitude,
                perspective.height
              ),
              orientation: {
                heading: param.Cesium.Math.toRadians(perspective.heading),
                pitch: param.Cesium.Math.toRadians(perspective.pitch),
                roll: param.Cesium.Math.toRadians(perspective.roll)
              }
            })
          } else {
            // 无视角信息时地图缩放到显示图层
            param.viewer.zoomTo(scenelayer)
          }
          // 测试------监听视图场景请求重新渲染事件，（可用于实时监听地图移动）
          // param.viewer.scene.postRender.addEventListener(this.handleScenePostUpdate)
          param.viewer.scene.postRender.addEventListener(this.handleScenePostUpdate)
          this.reloadAlarmingEntities() // 重载报警点位模型
          // 监听视图场景请求更新或重新渲染之前事件，（可用于实时监听地图移动）---韩杰---2018-10-25 18:04:09
          // param.viewer.clock.onTick.addEventListener(this.handleClockUpdate) // ---韩杰---2018-10-25 18:04:09
          // 获取所有的3d点位----结束---
          // 地理实体添加单击事件---------------开始-----
          let handler = new param.Cesium.ScreenSpaceEventHandler(param.viewer.canvas)
          handler.setInputAction(movement => {
            this.removeBuildingNameLabel() // 移除之前的楼宇名称标签
            let pickedPrimitive = param.viewer.scene.pick(movement.position)
            let pickedEntity = param.Cesium.defined(pickedPrimitive) ? pickedPrimitive.id : undefined
            // 是否拾取实体--------
            if (pickedEntity) {
              console.log('单击点选空间要素：', pickedEntity)
              this.switchDetailPage(pickedEntity.id, pickedEntity.name)
            }
          }, param.Cesium.ScreenSpaceEventType.LEFT_CLICK)
          // 双击
          param.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
            param.Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
          )
          handler.setInputAction(movement => {
            let pickedPrimitive = param.viewer.scene.pick(movement.position)
            let pickedEntity = param.Cesium.defined(pickedPrimitive) ? pickedPrimitive.id : undefined
            // 是否拾取实体--------
            if (pickedEntity) {
              console.log('双击点选空间要素：', pickedEntity)
              // this.switchDetailPage(pickedEntity.id, pickedEntity.name)
              if (pickedEntity.name === mapUtils.CHANNELTYPE.vedioResource) {
                this.addVideoPreview(pickedEntity.id)
              }
            }
          }, param.Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
          // 地理实体添加单击事件---------------结束-----
          // 三维建筑物拾取事件添加监听----开始------
          param.viewer.pickEvent.addEventListener(feature => {
            console.log('拾取空间要素:' + feature)
            if (feature) {
              // 如果楼宇处于报警状态，楼宇闪烁，单击楼宇的事件处理-----
              if (this.buildIngAlarmObj[feature.SMID]) {
                this.currentSMID = feature.SMID
                this.buildIngAlarm = JSON.parse(JSON.stringify(this.buildIngAlarmObj[feature.SMID]))
                this.changeTreeData(this.buildIngAlarm)
                this.setShowBuildingAlarm(true)
              } else {
                // 楼宇如果没有报警---抛出事件--显示楼宇属性面板--------
                this.getOneBuildById(feature.SMID).then(res => {
                  this.$emit('sendEvent', { type: mapUtils.CHANNELTYPE.building, data: res })
                })
              }
            }
          })
          this.displayAllResourcePoint()
          if (showDrawTrack && trackCoMap && trackCoMap.size > 0) {
            // 显示绘制轨迹，有轨迹位置信息时
            this.$emit('drawTrack') // 抛出绘制轨迹
          }
        })
      } catch (e) {
        if (widget._showRenderLoopErrors) {
          let title = '渲染时发生错误，已停止渲染。'
          widget.showErrorPanel(title, undefined, e)
        }
      }
    },
    adjustSceneByLayerSettings() {
      // 根据图层设置信息调整场景
      let scene = this.$context.viewer.scene
      for (const settings of this.layerSettingsMap.values()) {
        let layer = scene.layers.find(settings.name)
        if (layer) {
          // 图层
          layer.selectedColor = settings.selected
            ? this.$context.Cesium.Color.FUCHSIA
            : this.$context.Cesium.Color.WHITE
          layer.hue = settings.hue
          layer.saturation = settings.saturation
          layer.brightness = settings.brightness
        } else {
          // 视图
          let skyAtmosphere = scene.skyAtmosphere
          if (skyAtmosphere) {
            skyAtmosphere.hueShift = settings.hue
            skyAtmosphere.saturationShift = settings.saturation
            skyAtmosphere.brightnessShift = settings.brightness
          }
        }
      }
    },
    handleBuildingFeature(bid) {
      // 处理点击楼宇元素
      if (this.buildIngAlarmObj[bid]) {
        this.currentSMID = bid
        this.buildIngAlarm = JSON.parse(JSON.stringify(this.buildIngAlarmObj[bid]))
        this.changeTreeData(this.buildIngAlarm)
        this.setShowBuildingAlarm(true)
      } else {
        // 楼宇如果没有报警---抛出事件--显示楼宇属性面板--------
        this.getOneBuildById(bid).then(res => {
          this.$emit('sendEvent', { type: mapUtils.CHANNELTYPE.building, data: res })
        })
      }
    },
    removeBuildingNameLabel() {
      if (!this.isShowName) {
        // 移除楼宇名称标签
        let labels = mapUtils.entitys.labels
        for (const label of labels) {
          // 遍历楼宇名称标签
          this.$context.viewer.entities.remove(label) // 实体集合中移除名称标签
        }
      }
    },
    handleScenePostUpdate(scene, time) {
      if (this.buildingArr) {
        if (this.count < Number.MAX_VALUE) {
          this.count++
        } else {
          this.count = 0
        }
        if (this.count % 15 > 7) {
          this.twinkFlag = true
        } else {
          this.twinkFlag = false
        }
      }
    },
    // 根据点位控制多选框的选择项，加载默认的资源---
    displayAllFloorResourcePoint() {
      if (this.isFire) {
        this.loadDefaultMapResourcePoint({ sid: this.floorData._id, channelTypes: mapUtils.pointTypes.fireAlarm }).then(
          res => {
            let features = appResource.convertPointDataToFeatures(res, this.mapMode)
            this.setFirAlarmList(features)
          }
        )
      } else {
        this.setFirAlarmList([])
      }
      if (this.isAlarm) {
        this.loadDefaultMapResourcePoint({
          sid: this.floorData._id,
          channelTypes: mapUtils.pointTypes.commonAlarm
        }).then(res => {
          let features = appResource.convertPointDataToFeatures(res, this.mapMode)
          this.setAlarmList(features)
        })
      } else {
        this.setAlarmList([])
      }
      if (this.isAlarmBox) {
        this.loadDefaultMapResourcePoint({
          tab: mapUtils.TABTYPE.alarmHelp,
          sid: this.floorData._id,
          channelTypes: mapUtils.pointTypes.vedio
        }).then(res => {
          let result = mapUtils.getAlarmBoxOrColumnByType(res, mapUtils.CHANNELTYPE.alarmBoxResource)
          let features = appResource.convertPointDataToFeatures(result, this.mapMode)
          this.setAlarmBoxList(features)
        })
      } else {
        this.setAlarmBoxList([])
      }
      if (this.isAlarmPillar) {
        this.loadDefaultMapResourcePoint({
          tab: mapUtils.TABTYPE.alarmHelp,
          sid: this.floorData._id,
          channelTypes: mapUtils.pointTypes.vedio
        }).then(res => {
          let result = mapUtils.getAlarmBoxOrColumnByType(res, mapUtils.CHANNELTYPE.alarmColumnResource)
          let features = appResource.convertPointDataToFeatures(result, this.mapMode)
          this.setAlarmColumnList(features)
        })
      } else {
        this.setAlarmColumnList([])
      }
      if (this.isKeepWatch) {
        this.getOneFloorPatrols(this.floorData._id).then(res => {
          let patrols = appPatrol.convertPointDataToFeatures(res, this.mapMode)
          this.setPatrolList(patrols)
        })
      } else {
        this.setPatrolList([])
      }
      if (this.isShowGrid) {
        this.getGridList({ id: this.floorData._id }).then(res => {
          let features = gridUtil.convertGridDatasToFeatures(res)
          this.setGridList(features)
        })
      } else {
        this.setGridList([])
      }
      if (this.videoCheckedList.length) {
        this.loadDefaultMapResourcePoint({
          tab: mapUtils.TABTYPE.video,
          sid: this.floorData._id,
          channelTypes: mapUtils.pointTypes.vedio
        }).then(res => {
          let features = appResource.convertPointDataToFeatures(res, this.mapMode)
          features = appResource.getVedioPointFeaturesByTypes(features, this.videoCheckedList)
          this.setVideoList(features)
        })
      } else {
        this.setVideoList([])
      }
    },
    displayAllResourcePoint() {
      // 获取辅助杆列表
      this.getAssistHoleList()
        .then(res => {
          res.forEach(res => {
            res.type = mapUtils.CHANNELTYPE.assist
          })
          utils.addEntitysToMap(this.keyTypes.pole, res, this.mapMode, this.context)
        })
        .catch(err => {
          console.log('获取辅助杆列表数据失败：', err)
        })
      if (this.isFire) {
        this.loadDefaultMapResourcePoint({ channelTypes: mapUtils.pointTypes.fireAlarm }).then(res => {
          utils.addEntitysToMap(this.keyTypes.fireAlarm, res, this.mapMode, this.context, false)
        })
      }
      if (this.isAlarm) {
        this.loadDefaultMapResourcePoint({ channelTypes: mapUtils.pointTypes.commonAlarm }).then(res => {
          utils.addEntitysToMap(this.keyTypes.commonAlarm, res, this.mapMode, this.context, false)
        })
      }
      if (this.isKeepWatch) {
        this.getAllPatrolPoint().then(res => {
          utils.addEntitysToMap(this.keyTypes.patrol, res, this.mapMode, this.context, false)
        })
      }
      if (this.isAlarmBox) {
        this.loadDefaultMapResourcePoint({
          tab: mapUtils.TABTYPE.alarmHelp,
          channelTypes: mapUtils.pointTypes.vedio
        }).then(res => {
          let result = mapUtils.getAlarmBoxOrColumnByType(res, mapUtils.CHANNELTYPE.alarmBoxResource)
          utils.addEntitysToMap(this.keyTypes.alarmBox, result, this.mapMode, this.context, false)
        })
      }
      if (this.isAlarmPillar) {
        this.loadDefaultMapResourcePoint({
          tab: mapUtils.TABTYPE.alarmHelp,
          channelTypes: mapUtils.pointTypes.vedio
        }).then(res => {
          let result = mapUtils.getAlarmBoxOrColumnByType(res, mapUtils.CHANNELTYPE.alarmColumnResource)
          utils.addEntitysToMap(this.keyTypes.alarmColumn, result, this.mapMode, this.context, false)
        })
      }
      // 是否显示标签----
      if (this.isShowName) {
        this.getAllBuild().then(res => {
          res.forEach(item => {
            if (item.center && item.height) {
              let coValues = item.center.split(',').map(item => Number(item)) // 二维经纬度坐标数组
              let position = { lon: coValues[0], lat: coValues[1], height: item.height }
              let labelEntity = utils.addLabel(this.context, position, item.name)
              if (labelEntity) {
                mapUtils.entitys.labels.push(labelEntity)
              }
            }
          })
        })
      }
      // 是否显示在线单兵----
      if (this.isSinglePawn) {
      }
      if (this.videoCheckedList.length) {
        this.loadDefaultMapResourcePoint({ tab: mapUtils.TABTYPE.video, channelTypes: mapUtils.pointTypes.vedio }).then(
          res => {
            if (res && res.length > 0) {
              let result = appResource.fitlerArrByTypes(res, this.videoCheckedList)
              utils.addEntitysToMap(this.keyTypes.vedio, result, this.mapMode, this.context, false)
            }
          }
        )
      }
    },
    // 增加视频弹框
    addVideoPreview(id) {
      let repeat = false
      let idIndex
      this.videoList.forEach((item, index) => {
        if (id === item.data.channelId) {
          repeat = true
          idIndex = index
        }
      })
      let list = JSON.parse(JSON.stringify(this.videoList))
      if (!repeat) {
        this.getResourceById(id).then(res => {
          console.log(res)
          let videoObj = {
            data: res,
            active: true
          }
          if (list.length > 3) {
            list.splice(0, 1)
            list.push(videoObj)
          } else {
            list.push(videoObj)
          }
          this.setVideoDragList(list)
        })
      } else {
        let delPoint = list.splice(idIndex, 1)
        list.push(delPoint)
        this.setVideoDragList(list)
      }
    },
    async loadDefaultMapResourcePoint(param) {
      let result = []
      result = await this.getResourcePointsByChannelType(param)
      return result
    },
    // 根据拾取点位的类型跳转页面--------
    async switchDetailPage(id, type) {
      if (type === mapUtils.CHANNELTYPE.patrol) {
        let patrolData = await this.getSinglePatrolPoint(id)
        this.$emit('sendEvent', { type, data: patrolData })
      }
      if (
        type === mapUtils.CHANNELTYPE.vedioResource ||
        type === mapUtils.CHANNELTYPE.commonAlarmResource ||
        type === mapUtils.CHANNELTYPE.fireAlarmResource ||
        type === mapUtils.CHANNELTYPE.alarmHostResource ||
        type === mapUtils.CHANNELTYPE.alarmBoxResource ||
        type === mapUtils.CHANNELTYPE.alarmColumnResource
      ) {
        let resource = await this.getResourceById(id)
        if (type === mapUtils.CHANNELTYPE.vedioResource && this.isPointChooseStatus) {
          console.log(resource, 'resource')
          let repeat = false
          let previewPointLArr = JSON.parse(JSON.stringify(this.previewPointList))
          for (const key in previewPointLArr) {
            const item = previewPointLArr[key]
            if (item._id === resource._id) {
              repeat = true
              continue
            }
          }
          if (!repeat) {
            let pointResource = JSON.parse(JSON.stringify(resource))
            pointResource.ip = pointResource.eid.ip
            pointResource.port = pointResource.eid.cport
            pointResource.eid = pointResource.eid._id
            previewPointLArr.push(pointResource)
            console.log(pointResource, 'pointResource')
            this.setPreviewPointList(previewPointLArr)
            this.switchToolsPanel(true)
            this.changeToolsPanelToBoxChoose('boxChoose')
          }
        } else {
          this.$emit('sendEvent', { type, data: resource })
        }
      }
      if (type === mapUtils.CHANNELTYPE.grid) {
        let grid = await this.getMap3DOneGridById(id)
        this.$emit('sendEvent', { type, data: grid })
      }
      if (type === mapUtils.CHANNELTYPE.single) {
        let user = await this.getUserOne(id)
        this.$emit('sendEvent', { type, data: user })
      }
    },
    // 单击楼层平面地图的回调方法
    mapClickEvt(evt) {
      let attributes = evt.attributes
      if (attributes && attributes.id) {
        // 根据点位类型切换属性面板，显示点位的属性--------
        this.switchDetailPage(attributes.id, attributes.type)
      }
    },
    // 楼层平面地图加载完成调用的方法
    getMap(obj) {
      // 切换到楼层平面地图后，如果报警要素列表中有值，楼层平面地图中的点位接收到报警，点位的闪烁----
      if (this.allAlarmingFeatureList.length) {
        this.allAlarmingFeatureList = this.$lodash.cloneDeep(this.alarmingFeatureList)
        console.log('this.$lodash.cloneDeep(this.alarmingFeatureList)', this.allAlarmingFeatureList)
        this.$refs.mapFloorContainer && this.$refs.mapFloorContainer.render()
      }
    },
    getType(data) {
      let type
      if (data.alarmInfo) {
        type = data.alarmInfo.eventType
      } else {
        type = 'patrolAlarm'
      }
      return type
    },
    addAlarmingPoint(id, data, type) {
      let fea
      let alarmingFea = JSON.parse(JSON.stringify(this.alarmingFeatureList))
      let repeat = false
      alarmingFea.forEach((item, index) => {
        if (item.attributes.id === id) {
          repeat = true
        }
      })
      if (!repeat) {
        if (type === 'commonAlarm') {
          fea = utils.addAlarmingFea(data, 'alarmPointAlarmSymbol')
        } else if (type === 'fireAlarm') {
          fea = utils.addAlarmingFea(data, 'alarmPointAlarmSymbol')
        } else if (type === 'patrolAlarm') {
          fea = utils.addAlarmingFea(data, 'patrolAlarmSymbol')
        } else if (type === 'alarmBox') {
          fea = utils.addAlarmingFea(data, 'patrolAlarmSymbol')
        }
        if (fea) {
          alarmingFea.push(fea)
          this.setAlarmingList(alarmingFea)
        }
      }
    },
    // 楼层平面图点位闪烁调用的方法---胡红勋添加
    alarmingTwinkEvt() {
      if (this.alarmingFeatureList.length > 0) {
        this.index = this.index >= 120 ? 0 : this.index
        let num = this.index % 30
        if (num < 5) {
          // this.setAlarmingList([])
          this.allAlarmingFeatureList = []
        } else {
          this.allAlarmingFeatureList = this.$lodash.cloneDeep(this.alarmingFeatureList)
        }
        this.index++
        this.$refs.mapFloorContainer && this.$refs.mapFloorContainer.render()
      }
    },
    // 三维绘制工具绘制范围完成后调用----
    drawFinish(res) {
      let wkt = ''
      let sid = ''
      if (this.is3DMapOuter) {
        this.set3DActiveDraw(false)
        if (res && res.result.object.positions.length > 0) {
          let postion = []
          res.result.object.positions.forEach(item => {
            let loc = this.context.Cesium.Cartographic.fromCartesian(item)
            let longitude = this.context.Cesium.Math.toDegrees(loc.longitude)
            let latitude = this.context.Cesium.Math.toDegrees(loc.latitude)
            postion.push([longitude, latitude])
          })
          let location = []
          if (postion.length) {
            postion.forEach(item => {
              location.push(item.join(' '))
            })
          }
          let endPoint = location[0]
          wkt = 'MULTIPOLYGON(((' + location.join(',') + ',' + endPoint + ')))'
          console.log('绘制的范围字符串：' + wkt)
        }
      } else {
        sid = this.floorData._id
        wkt = res.wkt
        this.set2DAreaDraw(false)
      }
      this.getStaticDataByMapExtent({ wkt, sid })
        .then(() => {
          if (this.is3DMapOuter) {
            this.selectedEntitys.forEach(elem => {
              elem.model.color = this.context.Cesium.Color.WHITE
            })
            this.selectedEntitys = []
            this.selectBoxVideoData.forEach(res => {
              let _entity = mapUtils.getVedioEntityById(res._id)
              if (_entity) {
                this.selectedEntitys.push(_entity)
                _entity.model.color = this.context.Cesium.Color.RED
              }
            })
            if (this.selectedEntitys.length) {
              this.context.viewer.zoomTo(this.selectedEntitys)
            }
          }
          console.log(this.selectBoxVideoData + '框选数据')
          this.changeToolsPanelToBoxChoose('boxChoose')
          // this.$refs.selectBoxVideoModal.openModal(this.$lodash.cloneDeep(this.selectBoxVideoData))
        })
        .catch(err => {
          console.log(err)
        })
    },
    // 三维绘制工具激活后调用
    handlerActiveDraw() { },
    // 单击回退按钮调用的方法---
    rebackOuter() { },
    // 打开要素气泡框---韩杰---2018-10-25 18:04:09
    openFeaturePopup(entity) {
      // if (entity) {
      //   this.setShowPopup(true)
      //   let cartesian3Co = entity.position._value
      //   let cartesian2Co = this.$context.Cesium.SceneTransforms.wgs84ToWindowCoordinates(this.$context.viewer.scene, cartesian3Co) // 世界坐标转换为屏幕坐标
      //   console.log('选中要素的位置：', cartesian3Co.toString())
      //   let entityObj = {name: entity.name, position: entity.position._value}
      //   this.setSelectedEntity(entityObj)
      //   this.setSelectedEntityScreenCo(cartesian2Co)
      // } else {
      //   this.setShowPopup(false)
      // }
      // this.setIsOuter(true)
    },
    // 处理时钟更新---韩杰---2018年10月25日19:34:51
    handleClockUpdate(clock) {
      if (this.selectedEntity && this.selectedEntity.hasOwnProperty('lng')) {
        // let cartesian3Co = this.selectedEntity.position.getValue(this.$context.Cesium.JulianDate.now())
        let cartesian3Co = this.$context.Cesium.Cartesian3.fromDegrees(
          this.selectedEntity.lng,
          this.selectedEntity.lat,
          this.selectedEntity.alt
        )
        let cartesian2Co = this.$context.Cesium.SceneTransforms.wgs84ToWindowCoordinates(
          this.$context.viewer.scene,
          cartesian3Co
        ) // 世界坐标转换为屏幕坐标
        console.log('实体当前位置的cartesian2屏幕坐标：', cartesian2Co.toString())
        this.setSelectedEntityScreenCo(cartesian2Co) // 设置选择物体当前前位置的cartesian2屏幕坐标
      }
    },
    // 关闭要素弹出气泡---韩杰---2018-10-25 18:06:38
    closePopup() {
      this.setShowPopup(false)
      this.setSelectedEntity({})
      this.setSelectedEntityScreenCo({})
    },
    closeSelectModel() {
      if (this.is3DMapOuter) {
        this.clearExtentDraw = true
        this.selectedEntitys.forEach(elem => {
          elem.model.color = this.context.Cesium.Color.WHITE
        })
      }
      this.setAreaDialogShow(false)
    }
  },
  mounted() {
    this.keyTypes = mapUtils.getKeyType()
    this.getMap3DParamConfig()
    this.getLayerSettingsList() // 获取图层设置信息
  },
  beforeDestroy() {
    this.setIsOuter(true)
    this.context.viewer.destroy()
  }
}
</script>

<style>
</style>
