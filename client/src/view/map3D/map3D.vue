<template>
  <div class="map-3d">
    <!-- 左侧搜索结构、点位面板 -->
    <section class="panel-search-wrap">
      <PanelSearch />
    </section>
    <!-- 右侧收缩工具栏面板 -->
    <section class="panel-tools">
      <PanelTools @region="region" @Locus="controlTrackSearch"/>
    </section>
    <!-- 全屏底图 -->
    <section class="base-map">
      <base-map @sendEvent="openPTattr" @drawTrack="drawTrackOnMap"/>
    </section>
    <!-- 初始不显示的组件，零散弹框面板 -->
    <section class="substitute-modules">
      <!-- 应急预案及单兵列表 -->
      <planAndSingleList/>
      <PTattribute />
      <TrackModal></TrackModal>
      <DragBox v-if="videoList.length"/>
    </section>
  </div>
</template>

<script>
import baseMap from './baseMap/map3DApp'
import PanelTools from './panelTools/Tools'
import PanelSearch from './panelSearch/PanelSearch'
import PlanAndSingleList from './panelSearch/PlanAndSingleList'
import PTattribute from './components/PTattribute/Panel'
import TrackModal from './components/track/TrackModal'
import DrawTrack from './components/track/DrawTrack'
import DragBox from 'components/drag3D/DragBox'
import { mapState, mapActions } from 'vuex'
export default {
  components: {
    baseMap,
    PanelTools,
    PanelSearch,
    PlanAndSingleList,
    PTattribute,
    TrackModal,
    DragBox
  },
  data() {
    return {}
  },
  computed: {
    ...mapState({
      showTrackModal: ({ tdIndex }) => tdIndex.showTrackModal, // 是否显示轨迹查询弹出框---韩杰---2018-10-25
      showDrawTrack: ({ tdIndex }) => tdIndex.showDrawTrack, // 是否显示绘制轨迹---韩杰---2018-10-25
      trackCoMap: ({ tdIndex }) => tdIndex.trackCoMap, // 轨迹坐标map(key: 坐标点信息，value：三维坐标)---韩杰---2018-10-25
      is3DMapOuter: ({ tdIndex }) => tdIndex.is3DMapOuter,
      videoList: ({tdPoint}) => tdPoint.videoList
    })
  },
  watch: {
    trackCoMap: {
      handler(newVal) {
        if (newVal) {
          console.log('监听到轨迹坐标map变化：', newVal)
          if (newVal) {
            this.drawTrackOnMap(newVal) // 在地图上绘制轨迹
          }
        }
      },
      deep: true
    }
  },
  methods: {
    ...mapActions([
      'set3DActiveDraw',
      'setShowTrackModal', // 设置是否显示轨迹查询弹窗---韩杰---2018-11-7 10:02:04
      'setShowDrawTrack', // 设置是否显示绘制轨迹---韩杰---2018年11月7日10:02:27
      'setTrackCoMap', // 设置轨迹坐标---韩杰---2018年11月7日10:02:47
      'set2DAreaDraw',
      'recordLog'
    ]),
    ...mapActions('map3DApplyIX', [
      'openPTattr' // 打开点位属性面板
    ]),
    region() {
      if (this.is3DMapOuter) {
        this.set3DActiveDraw(true)
      } else {
        this.set2DAreaDraw(true)
      }
    },
    /**
     * 控制轨迹查询
     */
    controlTrackSearch() {
      if (this.showTrackModal || this.showDrawTrack) {
        // 显示绘制轨迹时
        if (this.trackDrawer) {
          this.clearTrackOnMap() // 清空地图上绘制的轨迹
        }
        this.setShowTrackModal(false) // 设置不显示轨迹查询弹出框
        this.setShowDrawTrack(false) // 设置不显示绘制轨迹
      } else if (!this.showTrackModal) {
        // 未打开轨迹查询弹出框时
        this.setShowTrackModal(true) // 设置显示轨迹查询弹出框
      }
    },
    drawTrackOnMap() {
      // 在地图上轨迹绘制
      this.trackDrawer = new DrawTrack(this.$context, this.trackCoMap)
      this.trackDrawer.drawTrack() // 绘制轨迹
    },
    clearTrackOnMap() {
      // 清空地图上绘制的轨迹
      this.trackDrawer.clearTrack()
      this.setTrackCoMap(null)
      this.trackDrawer = null
    },
    // 日志记录
    saveLog(data) {
      this.recordLog(data).then(suc => {
        console.log('日志记录成功')
      }).catch(err => {
        console.log('日志记录失败 ' + err)
      })
    }
  },
  created() {
    this.saveLog({
      logType: '操作日志',
      module: '电子地图',
      operateName: '三维地图',
      operateContent: '进入三维地图'
    })
  },
  beforeDestroy() {
    this.saveLog({
      logType: '操作日志',
      module: '电子地图',
      operateName: '三维地图',
      operateContent: '离开三维地图'
    })
  }
}
</script>

<style lang="less" scoped>
.map-3d {
  width: 100%;
  height: 100%;
  position: relative;
  .base-map {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
  }
  .panel-tools {
    height: 100%;
  }
}
</style>
