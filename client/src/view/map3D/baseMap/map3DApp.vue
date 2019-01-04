<template>
  <div class="mapAppComponent">
    <!-- 三维气泡弹出框 -->
    <feature-popup v-show="showPopup"></feature-popup>
    <!-- 三维地图的显示区域 -->
    <alarm-tree v-show="showBuildingAlarm && is3DMapOuter" :buildIngAlarm="treeData"/>
    <div v-if="is3DMapOuter && map3DConfig" class="mapPositionCenter">
      <sm-viewer cesiumPath="/static/supermap3d" class="viewer"  @ready="readyEvt" :animation="false" :selectionIndicator="true" :shouldAnimate="true">
        <!-- 三维地图的绘制工具 -->
        <sm-draw :actived='active3DDraw' type='Polygon' clampMode='space' @drawend='drawFinish' @active="handlerActiveDraw" :isClear.sync="clearExtentDraw"></sm-draw>
        <!-- <drag-box v-if="videoList.length" /> -->
      </sm-viewer>
    </div>
    <!-- 三维地图的显示区域 -->
    <!--楼层平面图的显示区域  -->
    <div v-if="!is3DMapOuter" class="mapPositionCenter">
      <!-- 返回按钮 -->
      <div class="go-back iconfont icon-upper-level" @click="goBack"></div>
      <!--楼层平面图地图部分  -->
      <div class="mapFloorFooter">
        <bs-staticmap class="mapHome" :url="floorOneData.mapUrl" :center="floorOneData.center" :extent="floorOneData.extent" ref="mapFloorContainer" @click="mapClickEvt" @ready="getMap"  @postcompose="alarmingTwinkEvt">
            <!-- 高亮图层 -->
            <bs-layer :id="positionLayer.id" :name="positionLayer.name"  :zIndex="7" :features="highLightFeatureList" ></bs-layer>
            <!--普通视频点位  -->
            <bs-layer :id="vedioLayer.id" :name="vedioLayer.name"  :zIndex="2"  :features="videoFeatureList"></bs-layer>
            <!-- 巡更点位 胡红勋添加-->
            <bs-layer :id="patrolLayer.id" :name="patrolLayer.name"  :zIndex="3" :features="patrolFeatureList"></bs-layer>
            <!-- 普通报警点位图层 胡红勋添加 -->
            <bs-layer :id="commonAlarmLayer.id" :name="commonAlarmLayer.name"  :zIndex="4" :features="alarmFeatureList"></bs-layer>
            <!-- 消防报警点位图层 胡红勋添加 -->
            <bs-layer :id="fireAlarmLayer.id" :name="fireAlarmLayer.name"  :zIndex="6" :features="fireAlarmFeatureList"></bs-layer>
            <!-- 报警箱图层 胡红勋-->
            <bs-layer :id="alarmBoxLayer.id" :name="alarmBoxLayer.name"  :zIndex="5" :features="alarmBoxFeatureList"></bs-layer>
            <!-- 报警柱图层 胡红勋-->
            <bs-layer :id="alarmColumnLayer.id" :name="alarmColumnLayer.name"  :zIndex="7" :features="alarmColumnFeatureList"></bs-layer>
             <!-- 所有点位的报警闪烁图层 胡红勋，显示报警的信息 -->
            <bs-layer :id="alarmingLayer.id" :name="alarmingLayer.name"  :zIndex="9" :features="allAlarmingFeatureList"></bs-layer>
            <!-- 楼层内网格图层 -->
            <bs-layer :id="gridLayer.id" :name="gridLayer.name"  :zIndex="9" :features="gridFeatureList"></bs-layer>
            <bs-draw :id="areaQuery.id" :name="areaQuery.name" :type="areaQuery.type" :actived="area2DDrawActive" :layerStyle="areaQuery.layerStyle" :drawStyle="areaQuery.drawStyle" @drawend="drawFinish"></bs-draw>
        </bs-staticmap>
      </div>
    </div>
    <!--楼层平面图的显示区域  -->
    <selectBoxVideo @close='closeSelectModel' ref='selectBoxVideoModal'></selectBoxVideo>
  </div>
</template>

<script>
import mapBase from './applyBase'
import featurePopup from './featurePopup'
import alarmTree from '../alarmFun/alarmTree'
import alarmFun from '../alarmFun/alarmFun'
import selectBoxVideo from '../panelTools/alarmVideo/selectBoxVideo'
export default {
  mixins: [mapBase, alarmFun],
  components: {
    alarmTree,
    featurePopup,
    selectBoxVideo
  }
}
</script>

<style scoped>
.mapAppComponent {
  width: 100%;
  height: 100%;
  display: flex;
  flex: 1;
  flex-direction: row;
}
.mapAppComponent .mapPositionCenter,
.mapPositionCenter .mapPositionMain {
  flex: 1;
  display: flex;
  flex-direction: column;
  clear: both;
}
.mapAppComponent .mapPositionCenter .flagClss,
.mapAppComponent .mapPositionCenter .mapFloorFooter {
  position: relative;
  display: flex;
  flex: 1;
}
.mapAppComponent .mapPositionCenter .mapFloorCon {
  flex: 1;
  display: flex;
  flex-direction: row;
  clear: both;
}
.mapAppComponent .mapPositionCenter .mapFloor {
  display: flex;
  flex: 1;
  float: left;
  height: 100%;
  flex-direction: column;
}
.mapAppComponent .mapPositionCenter .mapFloor .mapFloorHeader {
  height: 40px;
  width: 100%;
  line-height: 40px;
  text-align: center;
  background-color: #0f2343;
  cursor: default;
}
.mapFloorBtn {
  height: 40px;
  width: 60px;
  text-align: center;
  line-height: 40px;
  background-color: #1c3053;
}
.mapHome {
  display: flex;
  flex: 1;
}
.go-back {
  position: absolute;
  left: 300px;
  top: 29px;
  width: 32px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  background: #1c3053;
  cursor: pointer;
  z-index: 20;
  border-radius: 4px;
}
</style>
