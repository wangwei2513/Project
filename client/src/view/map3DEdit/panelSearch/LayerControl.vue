<!-- 地图结构-图层控制 组件-->
<template>
  <div class="controller">
    <div>
      <bsr-tree :treeData="treeData[0]||{}" @node-click="handleTreeNodeClick">
        <template slot-scope="{ node }">
          <span :class="{'tree-item': true}" :title="node.name">
            <i class='iconfont icon-electronic-map' v-if="node.type == nodeType.VIEWER" title="地图"></i>
            <i class='iconfont icon-tuceng' v-else-if="node.type == nodeType.LAYER" title="图层"></i>
            {{node.name}}
            <Checkbox  class="checkbox" v-model="node.selected" v-show="node.type == nodeType.LAYER" size="small" :disabled="!(selectedNode && selectedNode.name == node.name)">可选</Checkbox>
          </span>
        </template>
      </bsr-tree>
    </div>
    <div v-if="selectedNode" class="adjust-panel">
      <div class="title"><span>场景调节</span></div>
      <Row type="flex" justify="center" align="middle">
        <Col span="6">色调</Col>
        <Col span="18"><Slider v-model="selectedNode.hue" :step="0.01" :min="0" :max="1" show-input @on-change="changeSceneHue" @on-input="changeSceneHue"></Slider></Col>
      </Row>
      <Row type="flex" justify="center" align="middle">
        <Col span="6">饱和度</Col>
        <Col span="18"><Slider v-model="selectedNode.saturation" :step="0.01" :min="0" :max="1" show-input @on-change="changeSceneSaturation" @on-input="changeSceneSaturation"></Slider></Col>
      </Row>
      <Row type="flex" justify="center" align="middle">
        <Col span="6">亮度</Col>
        <Col span="18"><Slider v-model="selectedNode.brightness" :step="0.01" :min="0" :max="5" show-input @on-change="changeSceneBrightness" @on-input="changeSceneBrightness"></Slider></Col>
      </Row>
      <div class="panel-foot">
        <Button type="ghost" @click="cancelSave()" style="margin-right: -3px" title="点击取消保存调整">取消</Button>
        <Button type="primary" @click="saveSceneSettings()" style="margin-left: 16px" title="点击保存调整">保存</Button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'LayerControl',
  data() {
    return {
      treeData: null, // 图层树数据源
      selectedNode: null, // 选择节点
      nodeType: {
        VIEWER: 'viewer',
        LAYER: 'layer'
      },
      layerMap: null // 图层map（key:图层名称，value: 图层信息对象）
    }
  },
  computed: {
    ...mapState({
      map3DConfig: ({ tdIndex }) => tdIndex.map3DConfig, // 地图配置-----
      ready: ({ tdIndex }) => tdIndex.ready, // 判断地图是否加载完毕----
      layerSettingsMap: ({ tdIndex }) => tdIndex.layerSettingsMap // 图层设置map(key: 图层名称， value: 图层设置信息)
    })
  },
  watch: {
    ready(flag) { // 监听地图是否加载完成
      if (flag) {
        this.getLayerTreeData() // 获取图层树数据源
      }
    }
  },
  created() {
    this.treeData = [{
      _id: 'layer_tree_viewer',
      name: this.nodeType.VIEWER,
      type: this.nodeType.VIEWER,
      isRoot: true,
      children: []
    }]
    if (this.ready) {
      this.getLayerTreeData() // 获取图层树数据源
    }
  },
  methods: {
    ...mapActions([
      'saveLayerSettings', // 添加图层设置信息
      'updateLayerSettingsById', // 根据标识更新图层设置信息
      'getLayerSettingsList' // 获取图层设置信息列表
    ]),
    getLayerTreeData() { // 获取图层树数据源
      let layerArr = [] // 图层节点数组
      let scene = this.$context.viewer.scene
      let layers = scene._layers.layerQueue // 获取地图图层数组
      this.layerMap = new Map()
      for (const layer of layers) {
        let { name, hue, saturation, brightness } = layer
        let layerItem = { _id: 'layer_tree_' + name, name: name, type: this.nodeType.LAYER, hue: hue, saturation: saturation, brightness: brightness, selected: layer.hasOwnProperty('queryParameter') }
        if (this.layerSettingsMap.has(name)) {
          let settings = this.layerSettingsMap.get(name)
          layerItem.selected = settings.selected
        }
        layerArr.push(layerItem)
        let { ...cloneItem } = layerItem
        this.layerMap.set(name, cloneItem)
      }
      if (scene.skyAtmosphere) {
        let { hueShift, saturationShift, brightnessShift } = scene.skyAtmosphere
        this.treeData[0].hue = hueShift // 色调
        this.treeData[0].saturation = saturationShift // 饱和度
        this.treeData[0].brightness = brightnessShift // 亮度
        let { ...cloneView } = this.treeData[0]
        this.layerMap.set(cloneView.name, cloneView)
      }
      this.treeData[0].children = layerArr
    },
    handleTreeNodeClick(item, obj) { // 树节点点击处理
      this.selectedNode = item // 更新选择树节点
    },
    changeSceneHue() { // 修改场景色调
      let { name, type, hue } = this.selectedNode
      if (type === this.nodeType.VIEWER) { // 视图
        let skyAtmosphere = this.$context.viewer.scene.skyAtmosphere
        if (skyAtmosphere) {
          skyAtmosphere.hueShift = hue
        }
      } else if (type === this.nodeType.LAYER) { // 图层
        let selectedLayer = this.$context.viewer.scene.layers.find(name)
        if (selectedLayer) {
          selectedLayer.hue = hue
        }
      }
    },
    changeSceneSaturation() { // 修改场景饱和度
      let { name, type, saturation } = this.selectedNode
      if (type === this.nodeType.VIEWER) { // 视图
        let skyAtmosphere = this.$context.viewer.scene.skyAtmosphere
        if (skyAtmosphere) {
          skyAtmosphere.saturationShift = saturation
        }
      } else if (type === this.nodeType.LAYER) { // 图层
        let selectedLayer = this.$context.viewer.scene.layers.find(name)
        if (selectedLayer) {
          selectedLayer.saturation = saturation
        }
      }
    },
    changeSceneBrightness() { // 修改场景亮度
      let { name, type, brightness } = this.selectedNode
      if (type === this.nodeType.VIEWER) { // 视图
        let skyAtmosphere = this.$context.viewer.scene.skyAtmosphere
        if (skyAtmosphere) {
          skyAtmosphere.brightnessShift = brightness
        }
      } else if (type === this.nodeType.LAYER) { // 图层
        let selectedLayer = this.$context.viewer.scene.layers.find(name)
        if (selectedLayer) {
          selectedLayer.brightness = brightness
        }
      }
    },
    cancelSave() { // 取消场景调整
      let preNode = this.layerSettingsMap.get(this.selectedNode.name) // 获取修改前的节点数据
      if (preNode) { // 回复节点数据
        if (preNode.hasOwnProperty('selected')) {
          this.selectedNode.selected = preNode.selected
        }
        this.selectedNode.hue = preNode.hue
        this.selectedNode.saturation = preNode.saturation
        this.selectedNode.brightness = preNode.brightness
        this.changeSceneHue()
        this.changeSceneSaturation()
        this.changeSceneBrightness()
      }
      this.selectedNode = null // 清空选项
    },
    saveSceneSettings() { // 保存场景设置
      // 构造参数信息
      let { name, hue, saturation, brightness } = this.selectedNode
      let param = { name: name, hue: hue, saturation: saturation, brightness: brightness }
      if (this.selectedNode.hasOwnProperty('selected')) {
        param.selected = this.selectedNode.selected
      }
      if (this.layerSettingsMap.has(this.selectedNode.name)) { // 图层设置已存在，修改图层设置信息
        let settings = this.layerSettingsMap.get(this.selectedNode.name)
        param._id = settings._id
        this.updateLayerSettingsById(param).then(res => {
          this.successMsg('修改图层设置信息成功')
          if (this.selectedNode.hasOwnProperty('selected')) {
            this.changeLayerSelectable(name, param.selected) // 改变图层是否可选
          }
          this.updateLayerSettingsList() // 更新图层设置信息列表
          this.selectedNode = null // 清空选项
        }).catch(err => {
          console.log('修改图层设置信息失败：', err)
          this.errorMsg('修改图层设置信息失败')
        })
      } else { // 图层设置不存在，添加图层设置信息
        this.saveLayerSettings(param).then(res => {
          this.successMsg('添加图层设置信息成功')
          if (this.selectedNode.hasOwnProperty('selected')) {
            this.changeLayerSelectable(name, param.selected) // 改变图层是否可选
          }
          this.updateLayerSettingsList()
          this.selectedNode = null // 清空选项
        }).catch(err => {
          console.log('添加图层设置信息失败：', err)
          this.errorMsg('添加图层设置信息失败')
        })
      }
    },
    updateLayerSettingsList() { // 更新图层设置信息列表
      // 获取图层设置信息
      this.getLayerSettingsList().then(res => {
        console.log('获取到的图层设置信息：', res)
      }).catch(err => {
        console.log('获取到的图层设置信息失败：', err)
      })
    },
    changeLayerSelectable(layerName, flag) { // 改变图层是否可选
      let scene = this.$context.viewer.scene
      let layer = scene.layers.find(layerName) // 根据图层名称获取图层
      if (layer) { // 找到图层，修改图层的选中颜色
        layer.selectedColor = flag ? this.$context.Cesium.Color.FUCHSIA : this.$context.Cesium.Color.WHITE
        if (!flag) { // 图层不可选时，取消之前的选中效果
          layer.setSelection('')
        }
      }
    }
  }
}
</script>

<style scoped>
.controller {
  width: 100%;
  height: 100%;
  position: relative;
}
.controller > div{
  width: 100%;
  height: 50%;
}
.controller > div .checkbox{
  position: absolute;
  right: 24px;
}
.adjust-panel {
  padding: 16px 24px 0 24px;
  position: relative;
}
.adjust-panel .title {
  width: 100%;
  height: 38px;
  background: #0f2343;
  text-align: center;
}
.adjust-panel .title span {
  line-height: 38px;
  font-size: 14px;
}
.adjust-panel .panel-foot {
  bottom: 24px;
  right: 24px;
  position: absolute;
}
.adjust-panel .panel-foot button {
  margin-left: 16px;
}
</style>
