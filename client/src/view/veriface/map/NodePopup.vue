<!-- 人像识别模块轨迹追踪节点气泡框组件 -->
<template>
    <div class="popup">
        <div class="contentContainer">
            <div class="contentTop">
                <img :src="node.passImage">
                <div class="similarity">
                    <span>{{ node.similar + '%' }}</span>
                </div>
            </div>
            <div class="contentBottom">
                <div class="des">{{ node.deviceName }}</div>
                <span>{{ node.passCount + '次' }}</span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
  name: 'Popup',
  data() {
    return {
      popuper: null
    }
  },
  props: { // 父组件传入的数据
    node: { // 节点数据{pointId:设备标识, passImage:最新经过抓拍图片地址, similar:相似度, deviceName:设备名称, passCount:经过次数, timestamp:最新经过时间, coodinates:坐标}
      type: Object
    },
    olLib: { // 地图类库
      type: Object
    },
    map: { // 地图对象
      type: Object
    }
  },
  mounted() { // 组件挂载完成处理函数
    let offsetX = -(this.$el.clientWidth / 2.0) // x方向偏移量
    let offsetY = -(this.$el.clientHeight + 25) // y方向偏移量
    this.popuper = new this.olLib.Overlay(({
      element: this.$el,
      positioning: 'center-center',
      offset: [offsetX, offsetY]
    }))
    this.map.addOverlay(this.popuper)
    let coord = this.node.coodinates
    if (coord && coord.length > 0) {
      this.popuper.setPosition(coord)
    }
  },
  methods: {
  }
}
</script>

<style scoped>
/* 气泡容器样式 */
.popup {
  position: absolute;
  background: #FFFFFF;
  border: 1px solid #D0021B;
  padding: 0;
  border-radius: 5px;
  width: auto;
  height: auto;
}
/* 气泡容器渲染前后的公用样式 */
.popup:after, .popup:before {
  top: 100%;
  left: 50%;
  border: solid transparent;
  content: " ";
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
}
/* 气泡容器渲染后的样式 */
.popup:after {
  border-color: rgba(255, 255, 255, 0);
  border-top-color: #FFFFFF;
  border-width: 11px;
  margin-left: -11px;
}
/* 气泡容器渲染前的样式 */
.popup:before {
  border-color: rgba(255, 255, 255, 0);
  border-top-color: #D0021B;
  border-width: 12px;
  margin-left: -12px;
}
.contentContainer {
  margin: 2px;
  font-family: PingFangSC-Medium;
  font-size: 12px;
}
.contentTop {
  width: 120px;
  height: 90px;
  background: rgba(153, 153, 153, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}
.contentTop img{
  height: 90px;
}
.contentTop .similarity{
  position: absolute;
  top: 0;
  right: 0;
  height: 20px;
  width: 30px;
  text-align: center;
  background: rgba(255,255,255,0.9);
  border-radius: 3px;
}
.contentTop .similarity span{
  line-height: 20px;
  color: #08BA53;
}
.contentBottom {
  position: relative;
  width: 120px;
  height: 34px;
}
.contentBottom .des {
  margin: 3px 4px;
  text-align: left;
  color: rgba(70,49,49,0.80);
  overflow:hidden;
  text-overflow:ellipsis;
  display:-webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-height: 15px;
}
.contentBottom span {
  position: absolute;
  bottom: 2px;
  right: 16px;
  color: rgba(8,186,83,0.80);
}
</style>
