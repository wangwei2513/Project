<!-- 人像识别模块轨迹追踪地图组件 -->
<template>
  <div class="TMap">
    <div v-if="loading" class='map_tips'>加载中...</div>
    <div v-else-if="mapConfigList.length === 0" class='map_tips'>地图无配置信息，不能显示</div>
    <div v-else class="TMapMain">
      <div class="mapPositionCenter">
        <div class="flagClss">
          <bs-map v-for="(item, index) in mapConfigList" :key="index" v-if="activeMap === item.mapId" class="mapHome" :center="item.center" :extent="item.extent" ref="bsMap" :updateSize="isUpdate" :resolutions="item.resolutions" @ready="loadBSMapReady">
            <!-- geo -->
            <div v-if="item.mapType === 'geoserver'">
              <bs-wtmslayer :url="item.mapUrl" :layerName="item.layerName" :gridNames="item.gridSets" :matrixSet="item.matrixSet" :origin="item.origin"></bs-wtmslayer>
            </div>
            <!-- 超图 -->
            <div v-if="item.mapType === 'iserver'">
              <bs-supermaplayer :url="item.mapUrl"></bs-supermaplayer>
            </div>
            <!-- 静态底图模式 -->
            <div v-if="item.mapType === 'static'">
              <bs-staticlayer :url="item.mapUrl"></bs-staticlayer>
            </div>
          </bs-map>
        </div>
      </div>
      <NodePopup ref="nodePopups" v-for="(node, index) in trackNodes" :key="index" :node="node" :map="map" :olLib="olLib"></NodePopup>
    </div>
  </div>
</template>
<script>
import { mapActions, mapState } from 'vuex'
import DrawTrack from './DrawTrack'
import NodePopup from './NodePopup'
export default {
  name: 'TMap',
  components: { NodePopup },
  data() {
    return {
      resolutions: [
        2.5152827955346596e-5,
        1.8864620966509947e-5,
        1.2576413977673298e-5,
        6.288206988836649e-6,
        2.5152827955346597e-6,
        1.2576413977673299e-6
      ],
      loading: true, // 地图加载中
      activeMap: '', // 当前显示的地图标识
      isUpdate: false, // 是否更新
      map: null, // 地图
      olLib: null, // 地图类库
      drawTrack: null // 轨迹绘制工具
    }
  },
  computed: {
    ...mapState({
      mapConfigList: ({ mapGisData }) => mapGisData.mapConfigList, // 地图配置列表
      trackList: ({ veriface }) => veriface.trackList // 人脸轨迹数据
    }),
    trackNodes() { // 位置坐标数组
      return this.drawTrack ? this.drawTrack.lineNodes : []
    }
  },
  created() {
    this.getMapServerList() // 获取地图服务列表
      .then(res => {
        this.getMapConfigList(res)
      })
      .catch(err => {
        console.log('地图信息获取失败，请联系管理员', err)
      })
  },
  mounted() {
    this.$nextTick(() => {})
  },
  watch: {
    trackList: { // 监听地图资源变化
      handler(newArr) {
        console.log('人脸轨迹列表：', newArr)
        this.getTrackLineCoords() // 获取轨迹线的坐标数组
        this.getTrackNodes() // 获取轨迹节点信息数据
      },
      deep: true
    }
  },
  methods: {
    ...mapActions(['getMapServerList']),
    getMapConfigList(val) { // 获取地图配置列表
      if (val.length > 0) {
        this.loading = false
        if (val[0].mapId) {
          this.activeMap = val[0].mapId
        }
      }
    },
    loadBSMapReady(param) { // 加载加载完成
      this.olLib = param.ol
      this.map = param.map
      this.drawTrack = new DrawTrack(param.ol, param.map)
    },
    getTrackLineCoords() { // 获取轨迹线的坐标
      let lineCoords = []
      for (const item of this.trackList) {
        if (item.res && item.res.point) {
          let point = item.res.point
          let coord = this.getPointCoodinates(point)
          if (coord && coord.length > 0) {
            lineCoords.push(coord)
          }
        }
      }
      console.log('人脸轨迹线坐标数组：', lineCoords)
      this.drawTrack.drawTrackLine(lineCoords)
    },
    getTrackNodes() { // 获取轨迹节点信息数据
      let trackNodeMap = new Map() // 节点map(key: 人脸设备标识, value: 地图需要显示的信息对象：{pointId:设备标识, passImage:最新经过抓拍图片地址, similar:相似度, deviceName:设备名称, passCount:经过次数, timestamp:最新经过时间, coodinates:坐标})
      for (const item of this.trackList) {
        let pointId = item.res._id
        if (pointId) {
          let node = null
          if (trackNodeMap.has(pointId)) { // 节点map中已有设备信息
            node = trackNodeMap.get(pointId)
            if (node.timestamp < item.timestamp) {
              node.passImage = item.faceImage || node.passImage
              node.similar = item.similar || node.similar
              node.passCount += 1
            }
          } else { // 节点map中没有设备信息
            let point = item.res.point
            let coord = this.getPointCoodinates(point) // 获取点位坐标
            if (coord && coord.length > 0) {
              node = {
                pointId: pointId, // 设备标识
                passImage: item.faceImage, // 最新经过抓拍图片地址
                similar: item.similar, // 相似度
                deviceName: item.resName, // 设备名称
                passCount: 1, // 经过次数
                timestamp: item.timestamp, // 最新经过时间
                coodinates: coord // 设备的坐标
              }
            }
          }
          if (node) {
            trackNodeMap.set(pointId, node) // 将节点放入map中
          }
        }
      }
      let lineNodes = [...trackNodeMap.values()]
      console.log('人脸轨迹线节点信息数组：', lineNodes)
      this.drawTrack.addTrackNodes(lineNodes)
    },
    getPointCoodinates(point) { // 获取点位坐标
      let coord = [] // 点位坐标数组
      let loc = ''
      if (point.isouter) { // 楼外点位
        loc = point.loc
      } else if (point.bid && point.bid.center) { // 楼内点位
        loc = point.bid.center
      }
      if (loc) {
        coord = loc.split(',').map(item => Number(item))
      }
      return coord
    },
    clearTrack() { // 清除轨迹绘制
      let nodePopups = this.$refs.nodePopups
      if (nodePopups) {
        // 去掉之前的节点弹出框
        for (const nodePopup of this.$refs.nodePopups) {
          this.map.removeOverlay(nodePopup.popuper)
        }
        this.drawTrack.clearTrack()
        this.$forceUpdate() // 强制刷新
      }
    },
    trackAnimate() {
      this.drawTrack.controlAnimation()
    }
  },
  beforeDestroy() {}
}
</script>
<style scoped>
.TMap {
  width: 100%;
  height: 100%;
  clear: both;
  display: flex;
  flex: 1;
}

.TMap .map_tips {
  position: relative;
  width: 100%;
  height: 100%;
  color: white;
  text-align: center;
  border: 1px solid #fff;
  /* vertical-align: center; */
  /* padding-top: 43%; */
}

.TMap .TMapMain {
  width: 100%;
  display: flex;
  flex: 1;
}

.TMap .TMapMain .mapPositionCenter {
  width: 100%;
  display: flex;
  flex: 1;
  flex-direction: column;
}

.TMap .TMapMain .mapPositionCenter .flagClss {
  width: 100%;
  display: flex;
  flex: 1;
  border: 1px soli red;
}

.TMap .TMapMain .flagClss .mapHome {
  display: flex;
  flex: 1;
  position: relative;
}
</style>
