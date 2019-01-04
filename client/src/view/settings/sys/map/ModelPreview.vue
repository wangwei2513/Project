<!-- 模型预览组件 -->
<template>
  <div class="previewer">
    <sm-viewer v-if="map3DConfig" cesiumPath="/static/supermap3d" ref="tdMap" :navigation="false" @ready="loadViewerReady">
    </sm-viewer>
    <div v-else class="msg-tip"><span>请先配置3D地图服务</span></div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import utils from 'assets/3DMap/utils/index.js'

export default {
  name: 'ModelPreview',
  data() {
    return {
      isMapReady: false,
      modelEntity: null // 模型实体
    }
  },
  computed: {
    ...mapState({
      map3DConfig: ({ tdIndex }) => tdIndex.map3DConfig, // 地图配置-----
      layerSettingsMap: ({ tdIndex }) => tdIndex.layerSettingsMap // 图层设置map(key: 图层名称， value: 图层设置信息)
    })
  },
  created() {
    this.getMap3DParamConfig() // 获取3D地图服务配置
    this.getLayerSettingsList() // 获取图层设置信息
  },
  methods: {
    ...mapActions([
      'getMap3DParamConfig',
      'getLayerSettingsList'
    ]),
    loadViewerReady(param) {
      let { viewer, Cesium } = param
      // 去掉地图上的商标
      let widget = viewer.cesiumWidget
      if (widget.creditContainer) {
        widget.creditContainer.style.display = 'none'
      }
      var scene = viewer.scene
      var { dataSet, dataSource, mapUrl, layer, perspective } = this.map3DConfig
      try {
        var promise = scene.open(mapUrl)
        Cesium.when(promise, layers => {
          let layerName = layer || (dataSet + '@' + dataSource)
          let scenelayer = scene.layers.find(layerName)
          this.adjustSceneByLayerSettings() // 根据图层设置信息调整场景
          if (perspective) { // 有视角信息时，地图定位到给定视角
            viewer.camera.setView({
              destination: Cesium.Cartesian3.fromDegrees(perspective.longitude, perspective.latitude, perspective.height),
              orientation: {
                heading: Cesium.Math.toRadians(perspective.heading),
                pitch: Cesium.Math.toRadians(perspective.pitch),
                roll: Cesium.Math.toRadians(perspective.roll)
              }
            })
          } else { // 无视角信息时地图缩放到显示图层
            viewer.zoomTo(scenelayer)
          }
          this.isMapReady = true
          this.$emit('mapReady', param)
        })
      } catch (e) {
        if (widget._showRenderLoopErrors) {
          var title = '渲染时发生错误，已停止渲染。'
          widget.showErrorPanel(title, undefined, e)
        }
      }
    },
    adjustSceneByLayerSettings() { // 根据图层设置信息调整场景
      let { Cesium, viewer } = this.$refs.tdMap
      for (const settings of this.layerSettingsMap.values()) {
        let layer = viewer.scene.layers.find(settings.name)
        if (layer) { // 图层
          layer.selectedColor = settings.selected ? Cesium.Color.FUCHSIA : Cesium.Color.WHITE
          layer.hue = settings.hue
          layer.saturation = settings.saturation
          layer.brightness = settings.brightness
        } else { // 视图
          let skyAtmosphere = viewer.scene.skyAtmosphere
          if (skyAtmosphere) {
            skyAtmosphere.hueShift = settings.hue
            skyAtmosphere.saturationShift = settings.saturation
            skyAtmosphere.brightnessShift = settings.brightness
          }
        }
      }
    },
    addEntityModel(url, heightPlus, brightness) { // 添加实体模型
      let { Cesium, viewer } = this.$refs.tdMap
      viewer.entities.removeAll() // 视图中清空所有实体
      if (url) {
        let colorParam = utils.getModelExtraColorParam(Cesium, brightness) // 获取模型附加颜色参数
        let position = this.getExtraHeightPosition(heightPlus) // 模型位置世界坐标
        this.modelEntity = viewer.entities.add({ // 向视图中添加实体
          position: position, // 位置
          model: { // 模型
            uri: url, // 地址
            color: colorParam.color, // 模型渲染色
            colorBlendMode: Cesium.ColorBlendMode.MIX, // 模型颜色渲染的方式
            colorBlendAmount: colorParam.amount // 颜色数量
          }
        })
        viewer.zoomTo(this.modelEntity)
        viewer.trackedEntity = this.modelEntity // 设置实体为相机当前追踪的实体
      }
    },
    clearEntityModel() { // 清空地图中的实体模型
      let { viewer } = this.$refs.tdMap
      viewer.entities.removeAll() // 视图中清空所有实体
    },
    getExtraHeightPosition(heightPlus) { // 获取附加高度的位置，世界坐标
      let { Cesium, viewer } = this.$refs.tdMap
      let canvas = viewer.scene.canvas // 场景的画布
      let ellipsoid = viewer.scene.globe.ellipsoid // 视图的椭球体
      let car2_center = new Cesium.Cartesian2(canvas.width / 2.0, canvas.height / 2.0) // canvas中心屏幕坐标（Cartesian2）
      let car3_center = viewer.camera.pickEllipsoid(car2_center) // 中心点世界坐标（Cartesian3）
      let cartographic = ellipsoid.cartesianToCartographic(car3_center) // 经纬度高度对象
      cartographic.height += heightPlus // 添加高度
      let position = ellipsoid.cartographicToCartesian(cartographic) // 新的世界坐标
      return position
    },
    changeModelBrightness(url, heightPlus, brightness) { // 改变模型亮度
      if (this.modelEntity) {
        let { Cesium } = this.$refs.tdMap
        let colorParam = utils.getModelExtraColorParam(Cesium, brightness) // 获取模型附加颜色参数
        this.modelEntity.model.color = colorParam.color
        this.modelEntity.model.colorBlendAmount = colorParam.amount
      } else {
        this.addEntityModel(url, heightPlus, brightness) // 添加实体模型
      }
    },
    changeModelHeight(url, heightPlus, brightness) { // 改变模型高度
      let { viewer } = this.$refs.tdMap
      if (this.modelEntity) {
        let position = this.getExtraHeightPosition(heightPlus) // 模型位置世界坐标
        this.modelEntity.position = position // 修改模型位置
        viewer.zoomTo(this.modelEntity)
      } else {
        this.addEntityModel(url, heightPlus, brightness) // 添加实体模型
      }
    }
  },
  beforeDestroy() {
    let { viewer } = this.$refs.tdMap
    viewer.destroy()
  }
}
</script>

<style scoped>
.previewer {
  width: 100%;
  height: 100%;
  position: relative;
}
.msg-tip {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font: normal bold 14px/30px Microsoft Yahe,sans-serif;
}
</style>
