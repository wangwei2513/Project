<script>
import { mapActions, mapState } from 'vuex'
import Vue from 'vue'
import layerConfig from 'assets/3DMap/MapConfig.js'
import utils from 'assets/3DMap/utils/index.js'
import mapUtil from 'assets/3DMap/mapUtil.js'
import DrawSymbol from 'assets/3DMap/DrawSymbol.js'
import editResource from 'assets/3DMap/editResource.js'
import editPatrol from 'assets/3DMap/editPatrolIpc.js'
import { GeometryType } from 'assets/3DMap/GeometryType.js'
import gridStyle from 'assets/3DMap/gridStyle.js'
import gridUtil from 'assets/3DMap/gridUtil.js'
export default {
  data() {
    return {
      dragContainerPositionLeft: 0,
      context: null, // 保存获取全局三维地图实例以及类库的变量----
      isClearTempDrawPositon: false, // 绘制三维点位的坐标位置时清除绘制的临时点
      isClearTempEditPositon: false, // 修改三维点位的坐标位置时清除绘制的临时点
      editFeature: null, // 保存要进行编辑的要素------
      floorOneData: {
        center: [],
        extent: [],
        mapUrl: ''
      },
      vedioLayer: layerConfig.layers.vedioLayer, // 视频点位图层配置
      patrolLayer: layerConfig.layers.patrolLayer, // 巡更点图层配置
      commonAlarmLayer: layerConfig.layers.commonAlarmLayer, // 普通报警图层配置
      fireAlarmLayer: layerConfig.layers.fireAlarmLayer, // 消防点位图层配置
      positionLayer: layerConfig.layers.positionHighLightLayer, // 高亮定位图层配置
      alarmHelpLayer: layerConfig.layers.alarmHelpLayer, // 报警求助图层配置
      gridLayer: layerConfig.layers.gridLayer, // 楼层内网格图层配置----
      editLayer: layerConfig.layers.editLayer, // 临时编辑要素的图层---
      drawConfig: layerConfig.layers.drawConfig, // 楼层平面地图绘制工具的相关配置
      gridConfig: layerConfig.layers.gridConfig, // 楼层内网格绘制的控制---
      keyTypes: {}
    }
  },
  computed: {
    ...mapState({
      mapMode: ({ tdIndex }) => tdIndex.mapMode,
      floorData: ({ tdFloor }) => tdFloor.floorData,
      map3DConfig: ({ tdIndex }) => tdIndex.map3DConfig, // 地图配置-----
      is3DMapOuter: ({ tdIndex }) => tdIndex.is3DMapOuter, // 楼层平面图和三维地图切换的标识-----
      active3DDraw: ({ tdIndex }) => tdIndex.active3DDraw, // 控制三维绘制工具的启动绘制三维点位-----
      ready: ({ tdIndex }) => tdIndex.ready, // 判断三维地图是否加载成功的标识-----
      active3DChangePositionDraw: ({ tdIndex }) => tdIndex.active3DChangePositionDraw, // 控制三维绘制工具的启动以便修改模型的位置
      active2DDraw: ({ tdIndex }) => tdIndex.active2DDraw, // 控制楼层平面地图绘制工具的启动绘制二维点位--
      active2DEdit: ({ tdIndex }) => tdIndex.active2DEdit, // 控制楼层平面地图编辑工具的启动编辑二维点位---
      videoFeatureList: ({ tdPoint }) => tdPoint.videoFeatureList, // 普通视频点位
      fireAlarmFeatureList: ({ tdPoint }) => tdPoint.fireAlarmFeatureList, // 消防报警点位
      alarmHelpFeatureList: ({ tdPoint }) => tdPoint.alarmHelpFeatureList, // 报警求助点位
      patrolFeatureList: ({ tdPoint }) => tdPoint.patrolFeatureList, // 巡更点位
      alarmFeatureList: ({ tdPoint }) => tdPoint.alarmFeatureList, // 普通报警点位
      highLightFeatureList: ({ tdPoint }) => tdPoint.highLightFeatureList, // 高亮定位点位
      gridFeatureList: ({ tdPoint }) => tdPoint.gridFeatureList, // 网格列表要素
      treeNodeType: ({ tdPoint }) => tdPoint.treeNodeType, // 树节点类型
      mapResource: ({ tdPoint }) => tdPoint.mapResource, // 地图资源，包括通道资源，巡更资源
      rightPanelShow: ({ tdIndex }) => tdIndex.rightPanelShow,
      rightPanelType: ({ tdIndex }) => tdIndex.rightPanelType,
      mapConfigModal: ({ tdIndex }) => tdIndex.mapConfigModal,
      active2DGridDraw: ({ tdIndex }) => tdIndex.active2DGridDraw,
      gridLoc: ({ tdFloor }) => tdFloor.gridLoc, // 楼宇内网格位置----胡红勋
      editGridData: ({ tdFloor }) => tdFloor.editGridData,
      editFeaturesList: ({ tdFloor }) => tdFloor.editFeaturesList,
      isEditGrid: ({ tdFloor }) => tdFloor.isEditGrid,
      videoPreviewFlag: ({ tdIndex }) => tdIndex.videoPreviewFlag,
      active3DPoleDraw: ({ tdIndex }) => tdIndex.active3DPoleDraw, // 控制3D辅助杆绘制
      layerSettingsMap: ({ tdIndex }) => tdIndex.layerSettingsMap // 图层设置map(key: 图层名称， value: 图层设置信息)
    })
  },
  watch: {
    rightPanelShow(val) {
      if (val) {
        this.$refs.mapHeader.style.right = '316px'
      } else {
        this.$refs.mapHeader.style.right = '170px'
      }
    },
    videoPreviewFlag() {
      this.dragContainerPositionLeft = document.querySelector('.mapPositionCenter').offsetWidth - 600
    },
    editGridData(val) {
      // 编辑网格---网格高亮，网格处于高亮状态----
      let gridFeature = {
        geom: {
          type: GeometryType.MULTIPOLYGON,
          points: val.loc
        },
        attributes: {
          id: val._id
        },
        symbol: gridStyle.gridEditStyle
      }
      this.setEditFeaturesList([gridFeature])
      this.$nextTick(() => {
        if (this.$refs.editLayer) {
          const vector = this.$refs.editLayer.getFeatureById(val._id)
          this.set2DActiveEdit(true)
          this.editFeature = vector.feature
        }
      })
    },
    is3DMapOuter(flag) {
      if (flag) {
        this.setGridList([]) // 清空楼层内网格数据
        this.updatePatrolResourceTree({ mapType: '3D' })
        this.updateVedioResourceTree({ mapType: '3D' })
        this.updateAlarmHelpResourceTree({ mapType: '3D' })
        this.updateAlarmResourceTree({ mapType: '3D' })
        this.close2DDrawer() // 关闭2D绘制工具
      } else {
        this.close3DDrawer() // 关闭3D绘制工具
        this.updatePatrolResourceTree({ floorId: this.floorData._id, mapType: '3D' })
        this.updateVedioResourceTree({ floorId: this.floorData._id, mapType: '3D' })
        this.updateAlarmHelpResourceTree({ floorId: this.floorData._id, mapType: '3D' })
        this.updateAlarmResourceTree({ floorId: this.floorData._id, mapType: '3D' })
      }
    },
    // 监听楼层数据的变化切换楼层地图
    floorData(val) {
      if (val) {
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
      }
    },
    // 楼层平面地图绘制工具激活时，鼠标在地图上的绘制图标样式----
    active2DDraw(flag) {
      // 绘制工具激活时
      if (flag) {
        // 当绘制的点位为巡更点时，鼠标的样式--
        if (this.treeNodeType === mapUtil.CHANNELTYPE.patrol) {
          this.drawConfig.drawStyle = DrawSymbol.patrolPointDrawSymbol
        } else {
          if (this.treeNodeType === mapUtil.CHANNELTYPE.vedioResource) {
            this.drawConfig.drawStyle = mapUtil.getDrawSymbolByIpcKey(this.mapResource.monitortype)
          }
          if (this.treeNodeType === mapUtil.CHANNELTYPE.commonAlarmResource) {
            this.drawConfig.drawStyle = DrawSymbol.alarmPointDrawSymbol
          }
          if (this.treeNodeType === mapUtil.CHANNELTYPE.fireAlarmResource) {
            this.drawConfig.drawStyle = DrawSymbol.fireAlarmPointDrawSymbol
          }
          if (this.treeNodeType === mapUtil.CHANNELTYPE.alarmHostResource) {
            this.drawConfig.drawStyle = DrawSymbol.alarmHostPointDrawSymbol
          }
          if (this.treeNodeType === mapUtil.CHANNELTYPE.alarmBoxResource) {
            this.drawConfig.drawStyle = DrawSymbol.alarmBoxDrawSymbol
          }
          if (this.treeNodeType === mapUtil.CHANNELTYPE.alarmColumnResource) {
            this.drawConfig.drawStyle = DrawSymbol.alarmColumnDrawSymbol
          }
        }
      }
    }
  },
  methods: {
    ...mapActions([
      'getMap3DParamConfig',
      'getLayerSettingsList', // 获取图层配置信息
      'setReady',
      'getVedioChannelResource',
      'setRightPanelType',
      'getOneBuildById',
      'setRightPanelShow',
      'set3DActiveDraw', // 开启三维绘制工具的开启----
      'set2DActiveDraw', // 开始平面楼宇地图工具的开启---
      'set3DActiveChangePositionDraw',
      'saveOrUpdateVedioPoint', // 保存或者更新视频点位---
      'getVedioResourceOrgTree', // 更新视频点位树
      'saveOrUPdatePatrolPoint',
      'getPatrolOrgTree',
      'getAlarmResourceOrgTree',
      'getAlarmHelpOrgTree',
      'saveOrUpdateAlarmHelpPoint',
      'setPatrolList',
      'setVideoList',
      'setAlarmHelpList',
      'setAlarmList',
      'getOneFloorPatrols',
      'set2DActiveEdit',
      'getSinglePatrolPoint',
      'getResourceById',
      'setMapResource',
      'getAllBuild',
      'setIsOuter',
      'set3DEditConfigModal',
      'setFeature',
      'set2DActiveGridDraw', // 激活平面楼层地图的网格绘制工具
      'getResourcePointsByChannelType',
      'getAllPatrolPoint',
      'setGridList',
      'setGridLoc',
      'setViewSetting',
      'setEditFeaturesList',
      'setHighLightList', // 设置2D高亮选中要素列表
      'setActive3DPoleDraw', // 设置控制3D辅助杆绘制
      'saveAssistHole', // 添加辅助杆
      'getAssistHoleList', // 获取辅助杆列表
      'getAssistHoleById', // 根据标识获取辅助杆
      'getModelSettingParams' // 获取模型设置参数
    ]),
    close2DDrawer() {
      // 关闭2D绘制工具
      this.set2DActiveDraw(false)
      this.set2DActiveEdit(false)
    },
    close3DDrawer() {
      // 关闭3D绘制工具
      this.setActive3DPoleDraw(false)
      this.set3DActiveChangePositionDraw(false)
      this.set3DActiveDraw(false)
    },
    // 地图上添加单击的方法
    mapClickEvt(obj) {
      // 网格处于编辑状态，不可点选点位----
      if (this.isEditGrid) {
        return
      }
      this.setHighLightList([]) // 清空2D高亮选中要素列表
      let { attributes, feature } = obj
      if (feature) {
        if (obj.type === GeometryType.POINT) {
          this.editFeature = feature // 编辑控件设置要编辑的要素
          this.set2DActiveEdit(true) // 激活编辑控件
          if (attributes && attributes.id) {
            this.switchResourcePageByType(attributes.id, attributes.type)
          }
        }
      }
    },
    // 根据点位类型切换点位编辑页面框------胡红勋 2018-09-06
    switchResourcePageByType(id, type) {
      if (type === mapUtil.CHANNELTYPE.patrol) {
        // 巡更点位
        this.getSinglePatrolPoint(id).then(res => {
          this.setRightPanelShow(true) // 显示右侧的信息面板
          this.setRightPanelType('patrolEditPanel') // 信息面板显示巡更点位信息
        })
      } else if (type === mapUtil.CHANNELTYPE.assist) {
        // 辅助杆
        this.getAssistHoleById(id).then(res => {
          this.setRightPanelShow(true) // 显示右侧的信息面板
          this.setRightPanelType('assistEditPanel') // 信息面板显示视频点位信息
        })
      } else {
        // 其它点位
        this.getResourceById(id).then(res => {
          if (type === mapUtil.CHANNELTYPE.vedioResource) {
            this.setRightPanelShow(true) // 显示右侧的信息面板
            this.setRightPanelType('videoEditPanel') // 信息面板显示视频点位信息
          } else if (
            type === mapUtil.CHANNELTYPE.commonAlarmResource ||
            type === mapUtil.CHANNELTYPE.fireAlarmResource ||
            type === mapUtil.CHANNELTYPE.alarmHostResource
          ) {
            // 报警点位（普通报警、消防报警、普通报警）
            this.setRightPanelShow(true) // 显示右侧的信息面板
            this.setRightPanelType('alarmEditPanel') // 信息面板显示报警点位信息
          } else if (
            type === mapUtil.CHANNELTYPE.alarmColumnResource ||
            type === mapUtil.CHANNELTYPE.alarmBoxResource
          ) {
            // 报警求助点位
            this.setRightPanelShow(true) // 显示右侧的信息面板
            this.setRightPanelType('alarmHelpEditPanel') // 信息面板显示视频点位信息
          }
        })
      }
    },
    // 楼层平面地图加载完成后调用的方法----
    getMap(obj) {
      this.addPointFeatureToMap() // 视频点位添加到楼层平面地图上
      this.addPatrolPointToMap() // 巡更点位添加到楼层平面地图上
    },
    // 绘制点位结束后调用的方法----
    drawPointFinish(res) {
      let param = {}
      if (this.is3DMapOuter) {
        this.isClearTempDrawPositon = true // 清除临时绘制的三维点位---
        this.set3DActiveDraw(false) // 关闭三维绘制工具----
        let point = res.result.object
        let loc = this.context.Cesium.Cartographic.fromCartesian(point.position)
        let longitude = this.context.Cesium.Math.toDegrees(loc.longitude)
        let latitude = this.context.Cesium.Math.toDegrees(loc.latitude)
        let height = loc.height
        param.lon = longitude
        param.lat = latitude
        param.height = height
      } else {
        this.set2DActiveDraw(false) // 关闭二维绘制工具-
        param.lon = res.coods[0]
        param.lat = res.coods[1]
      }
      if (this.active3DPoleDraw) {
        // 辅助杆绘制,添加辅助杆
        this.saveAssistPole(param)
        this.setActive3DPoleDraw(false) // 关闭3D辅助杆的绘制
      } else if (this.treeNodeType && this.treeNodeType === mapUtil.CHANNELTYPE.patrol) {
        // 巡更点位保存--
        if (this.is3DMapOuter) {
          this.save3DPatrolResource(param)
        } else {
          this.save2DPatrolResource(param)
        }
      } else {
        if (
          this.treeNodeType === mapUtil.CHANNELTYPE.vedioResource ||
          this.treeNodeType === mapUtil.CHANNELTYPE.commonAlarmResource
        ) {
          if (this.is3DMapOuter) {
            this.save3DVedioChannelOrCommonAlarmResource(param)
          } else {
            this.save2DVedioChannelOrCommonAlarmResource(param)
          }
        }
        // 消防报警，报警主机报警的保存
        if (
          this.treeNodeType === mapUtil.CHANNELTYPE.fireAlarmResource ||
          this.treeNodeType === mapUtil.CHANNELTYPE.alarmHostResource
        ) {
          if (this.is3DMapOuter) {
            this.save3DAlarmResource(param)
          } else {
            this.save2DAlarmResource(param)
          }
        }
        // 报警柱、报警箱的保存
        if (
          this.treeNodeType === mapUtil.CHANNELTYPE.alarmBoxResource ||
          this.treeNodeType === mapUtil.CHANNELTYPE.alarmColumnResource
        ) {
          if (this.is3DMapOuter) {
            this.save3DAlarmHelpResource(param)
          } else {
            this.save2DAlarmHelpResource(param)
          }
        }
      }
    },
    // 清除绘制的临时要素----
    clearDrawTempFeature() {
      let drawLayer = this.$refs.mapFloorContainer.getLayer(this.drawConfig.id)
      drawLayer.getSource().clear()
    },
    // 更新视频资源树
    updateVedioResourceTree(param) {
      this.getVedioResourceOrgTree(param)
        .then(res => {
          console.log('楼层:')
          console.log(res)
        })
        .catch(err => {
          console.log(err)
        })
    },
    // 更新巡更资源树----
    updatePatrolResourceTree(param) {
      this.getPatrolOrgTree(param)
        .then(res => {})
        .catch(err => {
          console.log(err)
        })
    },
    // 更新报警资源树----
    updateAlarmResourceTree(param) {
      this.getAlarmResourceOrgTree(param)
        .then(res => {})
        .catch(err => {
          console.log(err)
        })
    },
    // 更新报警求助资源树----
    updateAlarmHelpResourceTree(param) {
      this.getAlarmHelpOrgTree(param)
        .then(res => {})
        .catch(err => {
          console.log(err)
        })
    },
    saveAssistPole(obj) { // 添加辅助杆
      let assitOid = mapUtil.MODELOID.assist // 辅助模型资源标识
      this.getModelSettingParams(assitOid).then(res => { // 获取辅助模型设置参数
        if (res && res.hasOwnProperty('height') && res.height > obj.height) {
          obj.height = res.height
        }
        let point = this.initPointData() // 初始化点位数据
        point.loc = obj.lon + ',' + obj.lat + ',' + obj.height
        point.height = obj.height
        this.saveAssistHole(point).then(res => {
          this.successMsg('辅助杆添加成功')
          this.addAssistHoleModelToMap(res, this.keyTypes.pole) // 添加辅助杆模型到地图中
        }).catch(err => {
          this.$Modal.confirm({
            title: '警告',
            content: '<p>' + err.response.data.message + '</p>'
          })
        })
      }).catch(err => {
        console.log('获取辅助模型设置参数失败：', err)
        this.errorMsg('获取辅助模型设置参数失败')
      })
    },
    save2DVedioChannelOrCommonAlarmResource(obj) {
      let pointDataAdd = JSON.parse(JSON.stringify(this.mapResource))
      let point = this.initPointData() // 初始化点位数据
      point.name = this.mapResource.name // 名称
      point.loc = obj.lon + ',' + obj.lat
      point.sid = this.floorData._id // 楼层id
      point.bid = this.floorData.bid._id // 楼宇id
      // 根据模式选择点位属性----
      pointDataAdd[this.mapMode] = point
      this.saveOrUpdateVedioPoint({ _id: pointDataAdd._id, body: pointDataAdd })
        .then(res => {
          this.successMsg('点位添加成功')
          this.getResourceById(pointDataAdd._id).then(data => {
            // 清除绘制的临时要素--
            this.clearDrawTempFeature()
            // 更新视频点位树-----开始
            this.updateVedioResourceTree({ floorId: this.floorData._id, mapType: '3D' })
            this.addPointFeatureToMap()
            if (this.treeNodeType === mapUtil.CHANNELTYPE.vedioResource) {
              this.setRightPanelShow(true) // 显示右侧的信息面板
              this.setRightPanelType('videoEditPanel') // 信息面板显示视频点位信息
            } else if (this.treeNodeType === mapUtil.CHANNELTYPE.commonAlarmResource) {
              this.setRightPanelShow(true) // 显示右侧的信息面板
              this.setRightPanelType('alarmEditPanel') // 信息面板显示视频点位信息
            }
          })
        })
        .catch(err => {
          this.$Modal.confirm({
            title: '警告',
            content: '<p>' + err.response.data.message + '</p>'
          })
        })
    },
    save3DVedioChannelOrCommonAlarmResource(obj) {
      let videoOid = mapUtil.MODELOID.video // 视频模型资源标识
      this.getModelSettingParams(videoOid).then(res => { // 获取辅助模型设置参数
        if (res && res.hasOwnProperty('height') && res.height > obj.height) {
          obj.height = res.height
        }
        let key = this.keyTypes.vedio
        if (this.treeNodeType === mapUtil.CHANNELTYPE.commonAlarmResource) {
          key = this.keyTypes.alarm
        }
        let pointDataAdd = JSON.parse(JSON.stringify(this.mapResource))
        let point = this.initPointData() // 初始化点位数据
        point.name = this.mapResource.name // 名称
        point.loc = obj.lon + ',' + obj.lat + ',' + obj.height
        point.height = obj.height
        // 根据模式选择点位属性----
        pointDataAdd[this.mapMode] = point
        // 保存点位-----
        this.saveOrUpdateVedioPoint({ _id: pointDataAdd._id, body: pointDataAdd }).then(res => {
          this.successMsg('点位添加成功')
          this.getResourceById(pointDataAdd._id).then(data => {
            this.updateVedioResourceTree({ mapType: '3D' }) // 更新视频点位资源树
            utils.addEntitysToMap(key, [data], this.mapMode, this.context)
            if (this.treeNodeType === mapUtil.CHANNELTYPE.vedioResource) {
              this.setRightPanelShow(true) // 显示右侧的信息面板
              this.setRightPanelType('videoEditPanel') // 信息面板显示视频点位信息
            } else if (this.treeNodeType === mapUtil.CHANNELTYPE.commonAlarmResource) {
              this.setRightPanelShow(true) // 显示右侧的信息面板
              this.setRightPanelType('alarmEditPanel') // 信息面板显示视频点位信息
            }
          })
        }).catch(err => {
          this.$Modal.confirm({
            title: '警告',
            content: '<p>' + err.response.data.message + '</p>'
          })
        })
      }).catch(err => {
        console.log('获取视频模型设置参数失败：', err)
        this.errorMsg('获取视频模型设置参数失败')
      })
    },
    save2DPatrolResource(obj) {
      let partrolPoint = JSON.parse(JSON.stringify(this.mapResource))
      let point = this.initPointData() // 初始化点位数据
      point.geo = obj.lon + ',' + obj.lat
      point.sid = this.floorData._id // 楼层id
      point.bid = this.floorData.bid._id // 楼宇id
      // 巡更点位的模式---2018 -09-08 胡红勋
      partrolPoint[this.mapMode] = point
      // 保存巡更点-----
      this.saveOrUPdatePatrolPoint(partrolPoint)
        .then(res => {
          this.successMsg('巡更点位添加成功')
          this.getSinglePatrolPoint(partrolPoint._id).then(data => {
            // 清除绘制图层上的要素
            this.clearDrawTempFeature()
            this.updatePatrolResourceTree({ floorId: this.floorData._id, mapType: '3D' })
            this.addPatrolPointToMap()
            this.setRightPanelShow(true) // 显示右侧的信息面板
            this.setRightPanelType('patrolEditPanel') // 信息面板显示巡更点位信息
          })
        })
        .catch(err => {
          this.$Modal.confirm({
            title: '警告',
            content: '<p>' + err.response.data.message + '</p>'
          })
        })
    },
    save3DPatrolResource(obj) {
      let patrolOid = mapUtil.MODELOID.patrol // 巡更模型资源标识
      this.getModelSettingParams(patrolOid).then(res => { // 获取巡更模型设置参数
        if (res && res.hasOwnProperty('height') && res.height > obj.height) {
          obj.height = res.height
        }
        let partrolPoint = JSON.parse(JSON.stringify(this.mapResource))
        let point = this.initPointData() // 初始化点位数据
        point.geo = obj.lon + ',' + obj.lat + ',' + obj.height
        point.height = obj.height
        // 巡更点位的模式---2018 -09-08 胡红勋
        partrolPoint[this.mapMode] = point
        // 保存巡更点-----
        this.saveOrUPdatePatrolPoint(partrolPoint).then(res => {
          this.successMsg('巡更点位添加成功')
          this.getSinglePatrolPoint(partrolPoint._id).then(data => {
            this.updatePatrolResourceTree({ mapType: '3D' }) // 更新巡更资源树
            utils.addEntitysToMap(this.keyTypes.patrol, [data], this.mapMode, this.context)
            this.setRightPanelShow(true) // 显示右侧的信息面板
            this.setRightPanelType('patrolEditPanel') // 信息面板显示巡更点位信息
          })
        }).catch(err => {
          this.$Modal.confirm({
            title: '警告',
            content: '<p>' + err.response.data.message + '</p>'
          })
        })
      }).catch(err => {
        console.log('获取巡更模型设置参数失败：', err)
        this.errorMsg('获取巡更模型设置参数失败')
      })
    },
    save2DAlarmResource(obj) {
      let alarmPoint = JSON.parse(JSON.stringify(this.mapResource))
      let point = this.initPointData() // 初始化点位数据
      point.name = this.mapResource.name // 名称
      point.loc = obj.lon + ',' + obj.lat
      point.sid = this.floorData._id // 楼层id
      point.bid = this.floorData.bid._id // 楼宇id
      // 设置地理信息位置--胡红勋 --2018 -09- 08
      alarmPoint[this.mapMode] = point
      this.saveOrUpdateVedioPoint({ _id: alarmPoint._id, body: alarmPoint })
        .then(res => {
          this.successMsg('报警点位添加成功')
          this.getResourceById(alarmPoint._id).then(res => {
            // 清除绘制图层上的要素
            this.clearDrawTempFeature()
            this.updateAlarmResourceTree({ floorId: this.floorData._id, mapType: '3D' })
            this.addPointFeatureToMap()
            this.setRightPanelShow(true) // 显示右侧的信息面板
            this.setRightPanelType('alarmEditPanel') // 信息面板显示报警点位信息
          })
        })
        .catch(err => {
          this.$Modal.confirm({
            title: '警告',
            content: '<p>' + err.response.data.message + '</p>'
          })
        })
    },
    save3DAlarmResource(obj) {
      let alarmOid = mapUtil.MODELOID.alarm // 报警模型资源标识
      this.getModelSettingParams(alarmOid).then(res => { // 获取报警模型设置参数
        if (res && res.hasOwnProperty('height') && res.height > obj.height) {
          obj.height = res.height
        }
        let alarmPoint = JSON.parse(JSON.stringify(this.mapResource))
        let point = this.initPointData() // 初始化点位数据
        point.name = this.mapResource.name // 名称
        point.loc = obj.lon + ',' + obj.lat + ',' + obj.height
        point.height = obj.height
        alarmPoint[this.mapMode] = point
        this.saveOrUpdateVedioPoint({ _id: alarmPoint._id, body: alarmPoint }).then(res => {
          this.successMsg('报警点位添加成功')
          this.getResourceById(alarmPoint._id).then(res => {
            this.updateAlarmResourceTree({ mapType: '3D' }) // 更新报警资源树
            utils.addEntitysToMap(this.keyTypes.alarm, [res], this.mapMode, this.context)
            this.setRightPanelShow(true) // 显示右侧的信息面板
            this.setRightPanelType('alarmEditPanel') // 信息面板显示报警点位信息
          })
        }).catch(err => {
          this.$Modal.confirm({
            title: '警告',
            content: '<p>' + err.response.data.message + '</p>'
          })
        })
      }).catch(err => {
        console.log('获取报警模型设置参数失败：', err)
        this.errorMsg('获取报警模型设置参数失败')
      })
    },
    save2DAlarmHelpResource(obj) {
      let alarmHelpPoint = JSON.parse(JSON.stringify(this.mapResource))
      let point = this.initPointData() // 初始化点位数据
      point.name = this.mapResource.name // 名称
      point.loc = obj.lon + ',' + obj.lat
      point.sid = this.floorData._id // 楼层id
      point.bid = this.floorData.bid._id // 楼宇id
      alarmHelpPoint[this.mapMode] = point
      this.saveOrUpdateAlarmHelpPoint({ _id: alarmHelpPoint._id, body: alarmHelpPoint })
        .then(res => {
          this.successMsg('报警求助点位添加成功')
          this.getResourceById(alarmHelpPoint._id).then(res => {
            // 清除绘制图层上的要素
            this.clearDrawTempFeature()
            // 更新报警求助树-----开始--
            this.updateAlarmHelpResourceTree({ floorId: this.floorData._id, mapType: '3D' })
            this.addPointFeatureToMap()
            this.setRightPanelShow(true) // 显示右侧的信息面板
            this.setRightPanelType('alarmHelpEditPanel') // 信息面板显示视频点位信息
          })
        })
        .catch(err => {
          this.$Modal.confirm({
            title: '警告',
            content: '<p>' + err.response.data.message + '</p>'
          })
        })
    },
    save3DAlarmHelpResource(obj) {
      let alarmHelpOid = mapUtil.MODELOID.alarmHelp // 报警求助模型资源标识
      this.getModelSettingParams(alarmHelpOid).then(res => { // 获取报警求助模型设置参数
        if (res && res.hasOwnProperty('height') && res.height > obj.height) {
          obj.height = res.height
        }
        let alarmHelpPoint = JSON.parse(JSON.stringify(this.mapResource))
        let point = this.initPointData() // 初始化点位数据
        point.name = this.mapResource.name // 名称
        point.loc = obj.lon + ',' + obj.lat + ',' + obj.height
        point.height = obj.height
        alarmHelpPoint[this.mapMode] = point
        this.saveOrUpdateAlarmHelpPoint({ _id: alarmHelpPoint._id, body: alarmHelpPoint }).then(res => {
          this.successMsg('报警求助点位添加成功')
          this.getResourceById(alarmHelpPoint._id).then(res => {
            this.updateAlarmHelpResourceTree({ mapType: '3D' }) // 更新报警求助资源树
            utils.addEntitysToMap(this.keyTypes.alarmHelp, [res], this.mapMode, this.context)
            this.setRightPanelShow(true) // 显示右侧的信息面板
            this.setRightPanelType('alarmHelpEditPanel') // 信息面板显示视频点位信息
          })
        }).catch(err => {
          this.$Modal.confirm({
            title: '警告',
            content: '<p>' + err.response.data.message + '</p>'
          })
        })
      }).catch(err => {
        console.log('获取报警求助模型设置参数失败：', err)
        this.errorMsg('获取报警求助模型设置参数失败')
      })
    },
    addAssistHoleModelToMap(pointId, key) { // 添加其他资源（视频、报警、报警求助）模型到地图中
      this.getAssistHoleById(pointId).then(res => {
        res.type = mapUtil.CHANNELTYPE.assist
        utils.addEntitysToMap(key, [res], this.mapMode, this.context)
        this.setRightPanelShow(true) // 显示右侧的信息面板
        this.setRightPanelType('assistEditPanel') // 信息面板显示辅助模型点位信息
      })
    },
    // 将楼层内的巡更点位添加到楼层平面地图上-----
    addPatrolPointToMap() {
      this.getOneFloorPatrols(this.floorData._id)
        .then(patrolDatas => {
          let patrols = editPatrol.convertPatrolPointsToFeatures(patrolDatas, this.mapMode)
          this.setPatrolList(patrols)
        })
        .catch(err => {
          console.log('加载楼层：', this.floorData._id, '巡更点失败：', err)
        })
    },
    // 将数据库中的所有楼层内的资源点位添加到地图上
    addPointFeatureToMap() {
      let channelTypes =
        mapUtil.CHANNELTYPE.vedioResource +
        ',' +
        mapUtil.CHANNELTYPE.commonAlarmResource +
        ',' +
        mapUtil.CHANNELTYPE.fireAlarmResource +
        ',' +
        mapUtil.CHANNELTYPE.alarmHostResource
      let param = { sid: this.floorData._id, channelTypes: channelTypes }
      this.getResourcePointsByChannelType(param).then(res => {
        console.log('楼层ID：', this.floorData._id, '的所有点位数据：', res)
        let videoArr = []
        let alarmArr = []
        let alarmHelpArr = []
        res.forEach(item => {
          if (item.type === mapUtil.CHANNELTYPE.vedioResource) {
            if (item.eid && item.eid.type) {
              if (
                item.eid.type === mapUtil.CHANNELTYPE.alarmBoxResource ||
                item.eid.type === mapUtil.CHANNELTYPE.alarmColumnResource
              ) {
                // 报警求助
                alarmHelpArr.push(item)
              } else {
                // 视频
                videoArr.push(item)
              }
            }
          } else {
            // 报警
            alarmArr.push(item)
          }
        })
        let vedios = editResource.convertPointDataToFeatures(videoArr, this.mapMode)
        let alarms = editResource.convertPointDataToFeatures(alarmArr, this.mapMode)
        let alarmHelps = editResource.convertPointDataToFeatures(alarmHelpArr, this.mapMode)
        this.setVideoList(vedios)
        this.setAlarmHelpList(alarmHelps)
        this.setAlarmList(alarms)
      })
    },
    // 编辑要素开始时调用的方法---
    editFeatureStart(res) {},
    // 编辑要素结束时调用的方法----
    editFeatureEnd(coods) {
      // 保存面的修改后的坐标----
      if (this.isEditGrid) {
        let pos = gridUtil.consistMutiPolyCoods(coods)
        const isSelfIntersect = gridUtil.isSelfInterMultiPolygon(pos)
        const isInterIntersect = gridUtil.isInterMultiPolygon(pos)
        const features = gridUtil.deleteSameGrid([...this.gridFeatureList], this.editFeaturesList[0])
        const isBetweenIntersect = gridUtil.isInterBetweenMultiPolygon(pos, features)
        if (isSelfIntersect || isInterIntersect || isBetweenIntersect) {
          this.$Notice.warning({
            title: '提示',
            desc: '网格内的多个多边形之间有相交，请重新变价',
            duration: 2
          })
          return
        }
        this.setGridLoc(pos)
        return
      }
      let _pointData = JSON.parse(JSON.stringify(this.mapResource))
      const type = _pointData.type || _pointData.device
      if (type === mapUtil.CHANNELTYPE.patrol) {
        _pointData[this.mapMode].geo = coods.join(',') // 根据地图模式关联地理属性 胡红勋-0908
      } else {
        _pointData[this.mapMode].loc = coods.join(',') // 根据地图模式关联地理属性 胡红勋-0908
      }
      this.setMapResource(_pointData) // 更新点位表单坐标数据
    },
    // 改变三维模型的位置----
    changeModelPosition(res) {
      this.isClearTempEditPositon = true
      let pos = res.result.object.position
      let _pointData = JSON.parse(JSON.stringify(this.mapResource))
      const location = this.context.Cesium.Cartographic.fromCartesian(pos)
      let longitude = this.context.Cesium.Math.toDegrees(location.longitude)
      let latitude = this.context.Cesium.Math.toDegrees(location.latitude)
      let height = location.height
      const type = _pointData.device || _pointData.type
      let modelOid = mapUtil.MODELOID.assist // 模型资源标识，默认为辅助模型资源标识
      let modelTypeLabel = '辅助'
      if (typeof type !== 'undefined') {
        if (type === mapUtil.CHANNELTYPE.vedioResource) { // 视频
          if (_pointData.eid.type === mapUtil.CHANNELTYPE.alarmBoxResource || _pointData.eid.type === mapUtil.CHANNELTYPE.alarmColumnResource) { // 报警求助
            modelOid = mapUtil.MODELOID.alarmHelp
            modelTypeLabel = '报警求助'
          } else {
            modelOid = mapUtil.MODELOID.video
            modelTypeLabel = '视频'
          }
        } else if (type === mapUtil.CHANNELTYPE.commonAlarmResource || type === mapUtil.CHANNELTYPE.alarmHostResource || type === mapUtil.CHANNELTYPE.fireAlarmResource) { // 报警
          modelOid = mapUtil.MODELOID.alarm
          modelTypeLabel = '报警'
        } else if (type === mapUtil.CHANNELTYPE.alarmBoxResource || type === mapUtil.CHANNELTYPE.alarmColumnResource) { // 报警求助
          modelOid = mapUtil.MODELOID.alarmHelp
          modelTypeLabel = '报警求助'
        } else if (type === mapUtil.CHANNELTYPE.patrol) { // 巡更
          modelOid = mapUtil.MODELOID.patrol
          modelTypeLabel = '巡更'
        }
      }
      this.getModelSettingParams(modelOid).then(res => { // 获取模型设置参数
        if (res && res.hasOwnProperty('height') && res.height > height) {
          height = res.height
        }
        let point3D = _pointData[this.mapMode]
        if (typeof type !== 'undefined') {
          if (type === mapUtil.CHANNELTYPE.patrol) {
            _pointData[this.mapMode].geo = longitude + ',' + latitude + ',' + height
          } else {
            _pointData[this.mapMode].loc = longitude + ',' + latitude + ',' + height
          }
        } else {
          _pointData.loc = longitude + ',' + latitude + ',' + height
          point3D = _pointData
        }
        utils.changeEntityPosition(this.$context, _pointData._id, point3D)
        this.setMapResource(_pointData) // 更新点位表单坐标数据
      }).catch(err => {
        console.log('获取' + modelTypeLabel + '模型设置参数失败：', err)
        this.errorMsg('获取' + modelTypeLabel + '模型设置参数失败')
      })
    },
    readyEvt(param) {
      // --------------------------------限制相机视角高度----------------------
      // param.viewer.scene.screenSpaceCameraController.minimumZoomDistance = mapUtil.TDDEFAULTOPS.minCameraHeight // 相机的高度的最小值
      // param.viewer.scene.screenSpaceCameraController.maximumZoomDistance = mapUtil.TDDEFAULTOPS.maxCameraHeight // 相机高度的最大值
      this.context = param // 保存三维全局地图变量以及类库
      let scene = param.viewer.scene
      let widget = param.viewer.cesiumWidget
      let { dataSet, dataSource, dataUrl, key, mapUrl, layer, perspective } = this.map3DConfig
      // 去掉地图上的商标
      if (widget.creditContainer) {
        widget.creditContainer.style.display = 'none'
      }
      try {
        let promise = scene.open(mapUrl)
        param.Cesium.when(promise, layers => {
          Vue.prototype.$context = param
          this.setReady(true) // 地图图层加载完成的标志，其他组件可以以此为标志调用地图的方法
          let layerName = layer || (dataSet + '@' + dataSource)
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
          if (perspective) { // 有视角信息时，地图定位到给定视角
            param.viewer.camera.setView({
              destination: param.Cesium.Cartesian3.fromDegrees(perspective.longitude, perspective.latitude, perspective.height),
              orientation: {
                heading: param.Cesium.Math.toRadians(perspective.heading),
                pitch: param.Cesium.Math.toRadians(perspective.pitch),
                roll: param.Cesium.Math.toRadians(perspective.roll)
              }
            })
          } else { // 无视角信息时地图缩放到显示图层
            param.viewer.zoomTo(scenelayer)
          }
          // 测试------监听视图场景请求重新渲染事件，（可用于实时监听地图移动）
          // param.viewer.scene.postRender.addEventListener(this.handleScenePostUpdate)
          // 去掉默认的双击事件
          param.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
            param.Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
          )
          // 地理实体添加单击事件---------------开始-----
          let handler = new param.Cesium.ScreenSpaceEventHandler(param.viewer.canvas)
          handler.setInputAction(movement => {
            if (!this.active3DChangePositionDraw) {
              // 不是3D改变位置时，拾取事件
              let pickedPrimitive = param.viewer.scene.pick(movement.position)
              let pickedEntity = param.Cesium.defined(pickedPrimitive) ? pickedPrimitive.id : undefined
              // 是否拾取实体--------
              if (pickedEntity) {
                console.log('单击点选空间要素：', pickedEntity)
                this.switchResourcePageByType(pickedEntity.id, pickedEntity.name) // 根据选择的实体类型切换编辑页面-------胡红勋
              }
            } else {
              // 3D改变位置时，关闭绘制
              this.set3DActiveChangePositionDraw(false)
              this.$context.viewer.trackededEntity = null // 取消三维视图的选中效果
              this.$context.viewer.selectedEntity = null // 取消三维视图的选中效果
            }
          }, param.Cesium.ScreenSpaceEventType.LEFT_CLICK)
          // 地理实体添加鼠标移动--------------开始-----
          // handler.setInputAction(movement => {
          //   let pickedPrimitive = param.viewer.scene.pick(movement.endPosition)
          //   let pickedEntity = param.Cesium.defined(pickedPrimitive) ? pickedPrimitive.id : undefined
          //   if (pickedEntity) {
          //     console.log('鼠标悬浮选空间要素：', pickedEntity)
          //   }
          // }, param.Cesium.ScreenSpaceEventType.MOUSE_MOVE)
          // 地理实体添加单击事件---------------结束-----
          // 三维建筑物拾取事件添加监听----开始------
          param.viewer.pickEvent.addEventListener(feature => {
            if (feature) {
              if (!this.active3DChangePositionDraw) {
                // 不是3D改变位置时，拾取事件
                this.getOneBuildById(feature.SMID)
                  .then(res => {
                    this.setFeature(feature)
                    this.setRightPanelShow(true)
                    this.setRightPanelType('buildForm')
                  })
                  .catch(err => {
                    console.log(err)
                  })
              } else {
                // 3D改变位置时，关闭绘制
                this.set3DActiveChangePositionDraw(false)
              }
            }
          })
          this.displayAllResourcePoint() // 显示所有点位实体
        })
      } catch (e) {
        if (widget._showRenderLoopErrors) {
          let title = '渲染时发生错误，已停止渲染。'
          widget.showErrorPanel(title, undefined, e)
          console.log(title)
        }
      }
    },
    adjustSceneByLayerSettings() { // 根据图层设置信息调整场景
      let scene = this.$context.viewer.scene
      for (const settings of this.layerSettingsMap.values()) {
        let layer = scene.layers.find(settings.name)
        if (layer) { // 图层
          layer.selectedColor = settings.selected ? this.$context.Cesium.Color.FUCHSIA : this.$context.Cesium.Color.WHITE
          layer.hue = settings.hue
          layer.saturation = settings.saturation
          layer.brightness = settings.brightness
        } else { // 视图
          let skyAtmosphere = scene.skyAtmosphere
          if (skyAtmosphere) {
            skyAtmosphere.hueShift = settings.hue
            skyAtmosphere.saturationShift = settings.saturation
            skyAtmosphere.brightnessShift = settings.brightness
          }
        }
      }
    },
    handleScenePostUpdate(scene, time) {
      let lot = this.context.Cesium.Math.toDegrees(this.context.viewer.camera.positionCartographic.longitude)
      let lat = this.context.Cesium.Math.toDegrees(this.context.viewer.camera.positionCartographic.latitude)
      let altitude = this.context.viewer.camera.positionCartographic.height // 高度（单位：米）
      let heading = this.context.Cesium.Math.toDegrees(this.context.viewer.camera.heading)
      let pitch = this.context.Cesium.Math.toDegrees(this.context.viewer.camera.pitch)
      let roll = this.context.Cesium.Math.toDegrees(this.context.viewer.camera.roll)
      console.log('当前相机经度：', lot, '，纬度：', lat, '，高度：', altitude)
      console.log('当前相机方位信息：heading', heading, '，pitch：', pitch, '，roll：', roll)
    },
    displayAllResourcePoint() {
      // 获取辅助杆列表
      this.getAssistHoleList()
        .then(res => {
          res.forEach(res => {
            res.type = mapUtil.CHANNELTYPE.assist
          })
          utils.addEntitysToMap(this.keyTypes.pole, res, this.mapMode, this.context)
        })
        .catch(err => {
          console.log('获取辅助杆列表数据失败：', err)
        })
      // 获取视频点位列表
      this.getResourcePointsByChannelType({
        tab: mapUtil.TABTYPE.video,
        channelTypes: mapUtil.CHANNELTYPE.vedioResource
      })
        .then(res => {
          utils.addEntitysToMap(this.keyTypes.vedio, res, this.mapMode, this.context)
        })
        .catch(err => {
          console.log(err)
        })
      // 获取报警（普通报警、消防报警、报警主机报警）点位列表
      let alarmChannelTypes =
        mapUtil.CHANNELTYPE.commonAlarmResource +
        ',' +
        mapUtil.CHANNELTYPE.fireAlarmResource +
        mapUtil.CHANNELTYPE.alarmHostResource
      this.getResourcePointsByChannelType({ channelTypes: alarmChannelTypes })
        .then(res => {
          utils.addEntitysToMap(this.keyTypes.alarm, res, this.mapMode, this.context)
        })
        .catch(err => {
          console.log(err)
        })
      // 获取报警求助（报警柱、报警箱）点位列表
      this.getResourcePointsByChannelType({
        tab: mapUtil.TABTYPE.alarmHelp,
        channelTypes: mapUtil.CHANNELTYPE.vedioResource
      })
        .then(res => {
          utils.addEntitysToMap(this.keyTypes.alarmHelp, res, this.mapMode, this.context)
        })
        .catch(err => {
          console.log(err)
        })
      // 获取巡更点位列表
      this.getAllPatrolPoint().then(res => {
        utils.addEntitysToMap(this.keyTypes.patrol, res, this.mapMode, this.context)
      })
      // 加载所有视频通道资源----------结束-----------
    },
    // 返回楼层外
    goBack() {
      if (!this.is3DMapOuter) {
        this.setIsOuter(true)
        this.setRightPanelType('buildingList')
      }
    },
    // 添加支架
    addPole() {
      this.setActive3DPoleDraw(true)
      this.set3DActiveDraw(true)
    },
    // 楼宇列表
    building() {
      if (this.rightPanelShow && this.rightPanelType === 'buildingList') {
        this.setRightPanelShow(false)
      } else {
        this.getAllBuild().then(res => {
          this.setRightPanelShow(true)
          this.setRightPanelType('buildingList')
        })
      }
    },
    // 地图配置
    mapSetting() {
      if (this.mapConfigModal) {
        this.set3DEditConfigModal(false)
      } else {
        this.set3DEditConfigModal(true)
      }
    },
    // 添加网格
    addGrid() {
      if (this.rightPanelShow && this.rightPanelType === 'Map3DGrid') {
        this.setRightPanelShow(false)
      } else {
        this.setRightPanelShow(true)
        this.setRightPanelType('Map3DGrid')
      }
    },
    // 全屏
    fullScreen() {},
    drawGridFinish(res) {
      let loc = res.coods[0][0].toString()
      const isInsectorsWithExistFeatures = gridUtil.isInterBetweenMultiPolygon(loc, this.gridFeatureList)
      if (isInsectorsWithExistFeatures) {
        this.$Notice.warning({
          title: '提示',
          desc: '网格和已绘制的网格有重叠，请重新绘制',
          duration: 2
        })
      }
      // 判断绘制的多边形是否自相交
      const isSelfIntersects = gridUtil.isSelfIntersects(loc)
      if (isSelfIntersects) {
        this.$Notice.warning({
          title: '提示',
          desc: '网格区域自相交，请重新绘制',
          duration: 2
        })
      }
      let coods = ''
      let isMutiPolygonSelfInterSects = false
      if (this.gridLoc) {
        // 判断绘制是否和已经绘制的多边形相交---
        coods = this.gridLoc + '|' + loc
        isMutiPolygonSelfInterSects = gridUtil.isInterMultiPolygon(coods)
      } else {
        coods = loc
      }
      if (isMutiPolygonSelfInterSects) {
        this.$Notice.warning({
          title: '提示',
          desc: '网格内的多个多边形之间有相交，请重新绘制',
          duration: 2
        })
      }
      if (isInsectorsWithExistFeatures || isSelfIntersects || isMutiPolygonSelfInterSects) {
        let tempFeature = null
        this.$nextTick(() => {
          let gridFeatures = this.$refs.mapFloorContainer
            .getLayer(this.gridConfig.id)
            .getSource()
            .getFeatures()
          gridFeatures.forEach(vector => {
            console.log(vector.get('attributes'))
            if (!vector.get('attributes')) {
              tempFeature = vector
            }
          })
          this.$refs.mapFloorContainer
            .getLayer(this.gridConfig.id)
            .getSource()
            .removeFeature(tempFeature)
        })
        return
      }
      this.setGridLoc(coods) // 保存绘制的位置------
      console.log('绘制网格完成:' + this.gridLoc)
      let gridFeature = {
        geom: {
          type: GeometryType.MULTIPOLYGON,
          points: coods
        },
        attributes: {
          id: 'temp'
        },
        symbol: gridStyle.gridDrawEndStyle
      }
      let features = [...this.gridFeatureList]
      let vectors = gridUtil.addFeatureToLayer(features, gridFeature)
      this.setGridList(vectors)
    },
    mapViewSetting() {
      console.log('视角配置')
      this.setViewSetting(true)
    },
    initPointData() {
      // 初始化点位数据---韩杰---2018-10-31 11:00:14
      let point = {
        isouter: this.is3DMapOuter, // 是否在楼层外
        principal: [{ name: '', mobile: '' }]
      }
      if (this.is3DMapOuter) {
        // 楼外3D地图时，初始化模型信息
        point.mid = '' // 模型标识
        point.scale = 1.0 // 大小
        point.height = 0 // 高度
        point.heading = 0 // 朝向角
        point.pitch = 0 // 俯仰角
        point.roll = 0 // 滚动角
      }
      return point
    }
  },
  mounted() {
    this.keyTypes = mapUtil.getKeyType() // 获取类型配置信息
    // 获取3D地图配置信息
    this.getMap3DParamConfig()
    // 获取图层设置信息
    this.getLayerSettingsList().then(res => {
      console.log('获取到的图层设置信息：', res)
    }).catch(err => {
      console.log('获取到的图层设置信息失败：', err)
    })
  },
  beforeDestroy() {
    this.setIsOuter(true)
    this.context.viewer.destroy() // 销毁三维视角视图
  }
}
</script>

<style>
</style>
