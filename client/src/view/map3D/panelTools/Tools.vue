<template>
  <section class="tools">
    <button class="btn-shrink" @click="switchTools">
      <Icon :type="isToolShow ? 'chevron-right' : 'chevron-left'" />
    </button>
    <section class="tool-area">
      <ul class="tool-list" :class="{'hidden': !isToolShow}">
        <li class="cut-off-line">
          <i @click="showSecPanel()" class="icon iconfont icon-b_icon__screenshot" :class="{'active': choose3DDraw}" type="ios-crop">
            <div class="box-choose" ref="secPanel" :class="{'sec-panel-show':!boxChooseSecPanelStatus}">
              <p class="icon iconfont icon-dianxuan" title="点选" @click.stop="togglePointChooseStatus"></p>
              <p class="icon iconfont icon-kuangxuan" title="框选" @click.stop="boxChooseStatus"></p>
            </div>
          </i>
        </li>
        <li>
          <i
            @click="openPanel('AlarmList')"
            class="icon iconfont icon-baojing2"
            :class="{
              'active': toolsPanelActive === 'AlarmList',
              'animation-flicker-red': toolsPanelActive !== 'AlarmList' && toolsPanelIsUnread('AlarmList')
            }"
            type="ios-alarm"
          ></i>
        </li>
        <li>
          <i
            @click="openPanel('FireAlarmList')"
            class="icon iconfont icon-xiaofangbaojing"
            :class="{
              'active': toolsPanelActive === 'FireAlarmList',
              'animation-flicker-red': toolsPanelActive !== 'FireAlarmList' && toolsPanelIsUnread('FireAlarmList')
            }"
            type="ios-bell"
          ></i>
        </li>
        <li>
          <i
            @click="openPanel('AlarmHelpList')"
            class="icon iconfont icon-baojingqiuzhu"
            :class="{
              'active': toolsPanelActive === 'AlarmHelpList',
              'animation-flicker-red': toolsPanelActive !== 'AlarmHelpList' && toolsPanelIsUnread('AlarmHelpList')
            }"
            type="android-hand"
          ></i>
        </li>
        <li>
          <i
            @click="openPanel('KeepWatchList')"
            class="icon iconfont icon-xungengbaojing"
            :class="{
              'active': toolsPanelActive === 'KeepWatchList',
              'animation-flicker-red': toolsPanelActive !== 'KeepWatchList' && toolsPanelIsUnread('KeepWatchList')
            }"
            type="arrow-graph-down-right"
          ></i>
        </li>
        <li class="cut-off-line">
          <i
            @click="openPanel('SinglePawnList')"
            class="icon iconfont icon-yidongdanbing"
            :class="{
              'active': toolsPanelActive === 'SinglePawnList',
              'animation-flicker-red': toolsPanelActive !== 'SinglePawnList' && toolsPanelIsUnread('SinglePawnList')
            }"
            type="man"
          ></i>
        </li>
        <li>
          <i
            @click="$emit('Locus')"
            class="icon iconfont icon-guijichaxun"
            :class="{'active': showTrackModal || showDrawTrack}"
            type="ios-shuffle-strong"
          ></i>
        </li>
        <li>
          <i
            @click="openPanel('Flight')"
            class="icon iconfont icon-feihang"
            :class="{'active': toolsPanelActive === 'Flight'}"
            type="ios-paperplane"
          ></i>
        </li>
      </ul>
    </section>
    <!-- 二级面板 -->
    <div class="panel" :class="{'hidden': !isShowToolsPanel}">
      <AlarmList @isUnread="v => { chnageToolIsUnread({type: 'AlarmList', value: v}) }" v-show="toolsPanelActive === 'AlarmList'" />
      <FireAlarmList @isUnread="v => { chnageToolIsUnread({type: 'FireAlarmList', value: v}) }" v-show="toolsPanelActive === 'FireAlarmList'" />
      <AlarmHelpList @isUnread="v => { chnageToolIsUnread({type: 'AlarmHelpList', value: v}) }" v-show="toolsPanelActive === 'AlarmHelpList'" />
      <KeepWatchList @isUnread="v => { chnageToolIsUnread({type: 'KeepWatchList', value: v}) }" v-show="toolsPanelActive === 'KeepWatchList'" />
      <SinglePawnList @isUnread="v => { chnageToolIsUnread({type: 'SinglePawnList', value: v}) }" v-show="toolsPanelActive === 'SinglePawnList'" />
      <Flight v-show="toolsPanelActive === 'Flight'" />
      <box-choose @region="$emit('region')" v-if="toolsPanelActive === 'boxChoose'"/>
      <!-- v-show="toolsPanelActive === 'boxChoose'" -->
      <div class="btn-panel-shrink" @click="closeToolsPanel" v-show="toolsPanelActive !== 'boxChoose'">
        <div class="shape">
          <Icon class="icon" type="chevron-right" />
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import AlarmList from './panels/AlarmList.vue'
import FireAlarmList from './panels/FireAlarmList'
import AlarmHelpList from './panels/AlarmHelpList'
import KeepWatchList from './panels/KeepWatchList'
import SinglePawnList from './panels/SinglePawnList'
import Flight from './panels/Flight'
import boxChoose from './panels/boxChoose'
import { mapState, mapGetters, mapActions } from 'vuex'
// $emit('region')
export default {
  components: {
    AlarmList,
    FireAlarmList,
    AlarmHelpList,
    KeepWatchList,
    SinglePawnList,
    Flight,
    boxChoose
  },
  data() {
    return {
      isToolShow: true,
      choose3DDraw: false
    }
  },
  computed: {
    ...mapState({
      showTrackModal: ({ tdIndex }) => tdIndex.showTrackModal, // 是否显示轨迹查询弹出框
      showDrawTrack: ({ tdIndex }) => tdIndex.showDrawTrack, // 是否显示绘制轨迹
      active3DDraw: ({ tdIndex }) => tdIndex.active3DDraw // 框选激活
    }),
    ...mapGetters('map3DApplyIX', ['isShowToolsPanel', 'toolsPanelActive', 'toolsPanelIsUnread', 'boxChooseSecPanelStatus', 'isShowPTattr'])
  },
  watch: {
    isShowPTattr(val) {
      if (val) {
        this.choose3DDraw = false
        this.changeBoxChooseSecPanelStatus(false)
      }
    }
  },
  methods: {
    ...mapActions(['set3DActiveDraw']),
    ...mapActions('map3DApplyIX', ['openToolsPanel', 'closeToolsPanel', 'chnageToolIsUnread', 'changeBoxChooseSecPanelStatus', 'changePointChooseStatus', 'switchToolsPanel', 'closePTattr']),
    switchTools() {
      this.isToolShow = !this.isToolShow
      if (!this.isToolShow) {
        this.closeToolsPanel()
      }
    },
    showSecPanel() {
      this.closePTattr(false)
      this.choose3DDraw = true
      let status = this.boxChooseSecPanelStatus
      status = !status
      this.changeBoxChooseSecPanelStatus(status)
      this.openToolsPanel('')
      this.switchToolsPanel(false)
    },
    openPanel(v) {
      this.openToolsPanel(v)
      this.choose3DDraw = false
      this.changeBoxChooseSecPanelStatus(false)
    },
    togglePointChooseStatus() {
      this.set3DActiveDraw(false)
      this.changePointChooseStatus(true)
      this.showSecPanel()
    },
    boxChooseStatus() {
      this.showSecPanel()
      this.$emit('region')
    }
  },
  beforeDestroy() {
    this.closeToolsPanel()
  }
}
</script>

<style lang="less" scoped>
.sec-panel-show {
  visibility: hidden;
}
.box-choose {
  position: absolute;
  left: -34px;
  top: 30px;
  background: #4391ed;
  width: 34px;
  text-align: center;
  // transition: all 0.3s ease-in-out;
  p.icon {
    font-size: 20px !important;
  }
}
.tools {
  width: 64px;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  right: 0;
  z-index: 9;
  .btn-shrink {
    flex: 0 0 20px;
    width: 100%;
    background-color: rgba(15, 35, 67, 0.8);
    border: none;
    color: #fff;
    cursor: pointer;
    &:focus {
      outline: none;
    }
  }
  .tool-area {
    display: flex;
    flex: auto;
    width: 100%;
    // overflow: hidden;
    .tool-list {
      display: flex;
      flex-direction: column;
      flex: auto;
      padding: 0 6px;
      background-color: rgba(15, 35, 67, 0.8);
      // transition: all 0.3s ease;
      transform: translateX(0);
      &.hidden {
        transform: translateX(64px);
      }
      li {
        display: flex;
        flex: auto;
        width: 100%;
        justify-content: center;
        align-items: center;
        &.cut-off-line {
          border-bottom: 1px solid rgba(58, 90, 139, 0.4);
        }
        .icon {
          color: #fff;
          font-size: 38px;
          cursor: pointer;
          &.active {
            color: #4699f9;
          }
        }
      }
    }
  }
  .panel {
    width: 272px;
    height: 100%;
    display: block;
    position: absolute;
    top: 0;
    left: -272px;
    background: #0f2343;
    // transition: all 0.3s ease;
    z-index: -1;
    &.hidden {
      left: 76px;
    }
    .btn-panel-shrink {
      width: 16px;
      height: 86px;
      position: absolute;
      top: 50%;
      left: -16px;
      cursor: pointer;
      overflow: hidden;
      .shape {
        position: absolute;
        left: -16px;
        height: 86px;
        border: 16px solid transparent;
        border-right: 16px solid rgba(15, 35, 67, 0.8);
      }
      .icon {
        position: absolute;
        left: 5px;
        top: 50%;
        margin-top: -6px;
      }
    }
  }
}
</style>
