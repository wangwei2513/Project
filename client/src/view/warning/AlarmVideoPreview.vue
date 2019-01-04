<template>
  <div style="height:100%">
    <div class="no-plugin" style="height: 100%;background:#404040;" v-if="showDownload">
      <a :href="pluginDownloadUrl" target="_blank">{{showTips}}</a>
      <Icon type="help-circled" title="安装后仍然提示?" @click.native="showHelp" />
    </div>
    <bs-video :pluginCOM="AlarmPreviewPlugin" :count="16" :showNum="showscreen" style="height: 100%" @handleAlarm="handle" ref="frame" v-if="!showDownload"></bs-video>
    <div class="theme-title" style="padding:6px 10px">
      <div class="realbtn iconfont icon-multi-screen" title="页面分割" @mouseenter="(hoverShowscreen=showscreen)&&(showscreenShow=true)" @mouseleave="showscreenShow=false">
        <ul class="multi-screen" v-show="showscreenShow">
          <i></i>
          <li v-for="screen in showscreenList" :key="screen.value" @mouseenter="hoverShowscreen=screen.value" :class="{active: screen.value===hoverShowscreen}" @click="showscreen = screen.value">{{screen.label+'画面'}}</li>
        </ul>
      </div>
    </div>
  </div>
</template>
<script>
import AlarmPreviewPlugin from './AlarmPreviewPlugin'
import { mapState, mapActions, mapMutations } from 'vuex'
import versionCheck from '../../components/video/pluginVersionCheck'
export default {
  mixins: [versionCheck],
  data() {
    return {
      AlarmPreviewPlugin,
      showscreen: 9,
      showscreenList: [
        {
          value: 1,
          label: '单'
        },
        {
          value: 4,
          label: '四'
        },
        {
          value: 9,
          label: '九'
        },
        {
          value: 16,
          label: '十六'
        }
      ],
      showscreenShow: false,
      hoverShowscreen: 1,
      playingVideos: [],
      usePage: 'video'
    }
  },
  computed: {
    ...mapState({
      videoWarnList: ({ warningDispose }) => warningDispose.videoWarnList,
      activeWarnInfo: ({ warningDispose }) => warningDispose.activeWarnInfo
    }),
    ...mapMutations(['SPLICE_CLOSE_DATA']),
    videos() {
      return this.videoWarnList
    },
    highlightIndex() {
      return this.$lodash.findIndex(this.playingVideos, item => item && item.uid === this.activeWarnInfo.groupId)
    },
    frames() {
      return this.$refs.frame
    }
  },
  watch: {
    highlightIndex(h) {
      if (h !== -1) { this.frames.activeFrame(h) }
    },
    videos() {
      this.openVideos()
    }
  },
  methods: {
    ...mapActions(['setActiveWarnInfo', 'getCameraPower']),
    openVideos() {
      if (this.videos.length !== 0) {
        this.videos.forEach(v => {
          const findV = this.$lodash.find(this.playingVideos, pv => pv && pv.uid === v.uid)
          if (!findV) {
            if (v.url && v.url.length !== 0) {
              v.url.forEach(r => {
                if (r) {
                  this.pushNewImg({ ...v, url: r })
                }
              })
            } else {
              this.pushNewVideo(v)
            }
          }
        })
      }
    },
    pushNewImg(item) {
      const index = this.findAvailableIndex()
      if (index === -1) {
        return
      }
      if (index === this.playingVideos.length) {
        this.playingVideos.push(item)
      } else {
        this.$set(this.playingVideos, index, item)
      }
      this.frames.activeFrame(index)
      const frame = this.frames.getCOM(index)
      frame.close()
      let p = {
        id: '',
        type: 'video',
        ip: item.devIp,
        port: item.devPort,
        channel: item.channel,
        vendor: item.manufacturer,
        streamType: item.streamType || 'main',
        url: item.url
      }
      if (item.nodeId) {
        p = {
          ...p,
          gbDevId: item.nodeId,
          shareServer: item.shareServer
        }
      }
      frame.open(p)
    },
    async pushNewVideo(item) {
      const mainItem = this.$lodash.find(item.actionList, item => item.main)
      if (!mainItem) {
        return
      }
      if (!mainItem.client) {
        return
      }
      const index = this.findAvailableIndex()
      if (index === -1) {
        return
      }
      if (index === this.playingVideos.length) {
        this.playingVideos.push(item)
      } else {
        this.$set(this.playingVideos, index, item)
      }
      // const power = await this.getCameraPower(mainItem.channelId)
      // if (!power || !power.includes('preview')) {
      //   this.$Notice.warning({ desc: `没有权限！`, title: '警告' })
      //   return
      // }
      this.frames.activeFrame(index)
      const frame = this.frames.getCOM(index)
      frame.close()
      let p = {
        id: '',
        type: 'video',
        ip: mainItem.devIp,
        port: mainItem.devPort,
        channel: mainItem.channel,
        vendor: mainItem.manufacturer,
        streamType: mainItem.streamType || 'main'
      }
      if (mainItem.nodeId) {
        p = {
          ...p,
          gbDevId: mainItem.nodeId,
          shareServer: mainItem.shareServer
        }
      }
      frame.open(p).catch(err => {
        console.log(err)
        frame.close()
        // 如果开流失败，不再占用窗格且清除store种报警视频数据
        this.$set(this.playingVideos, index, null)
        this.$store.commit('SPLICE_CLOSE_DATA', item)
      })
    },
    closeAllVideo() {
      Array(16)
        .fill()
        .forEach((_, index) => {
          this.frames.getCOM(index).close()
        })
      this.playingVideos = []
      this.frames.activeFrame(0)
    },
    closeVideo(item) {
      const index = this.$lodash.findIndex(this.playingVideos, it => it && it.uid === item.uid)
      if (index !== -1) {
        this.$set(this.playingVideos, index, null)
        // this.playingVideos.splice(index, 1)
        this.frames.getCOM(index).close()
        this.$store.commit('SPLICE_CLOSE_DATA', item)
      }
    },
    findAvailableIndex() {
      const list = this.playingVideos
      const nullIndex = this.$lodash.findIndex(list, it => it === null)
      if (nullIndex !== -1) {
        return nullIndex
      } else if (list.length < this.showscreen) {
        // 未满
        return list.length
      } else {
        // 找报警级别最低的
        let min = 0
        let minIndex = -1
        this.playingVideos.forEach((item, index) => {
          if (!item) {
            minIndex = index
          } else if (item.level > min) {
            // 数字越大的级别最低
            min = +item.level
            minIndex = index
          }
        })
        return minIndex
      }
    },
    handle(index) {
      const info = this.playingVideos[index]
      this.setActiveWarnInfo(info)
      this.$emit('update:toggleView', true)
    }
  },
  mounted() {
    this.$nextTick(() => {
      if (this.videoWarnList.length > 0) {
        this.openVideos()
      }
    })
  },
  beforeDestroy() {
    this.closeAllVideo()
  }
}
</script>
<style scoped>
ul,
li {
  margin: 0;
  padding: 0;
}

.theme-title {
  width: calc(100% - 16px);
  /*position: relative;*/
  height: 56px;
  /*width: 100%;*/
  padding: 0;
  position: absolute;
  bottom: 0px;
  background: #1b3153;
}

.theme-title .realbtn {
  padding: 6px 10px;
  height: 36px;
  width: 38px;
  color: #cfd7e6;
  /* background: #5676aa;
  margin-left: 18px; */
  display: inline-block;
  position: relative;
  cursor: pointer;
  border-radius: 3px;
  font-size: 20px;
}

.theme-title .realbtn.disable,
.theme-title .realbtn.disable:hover {
  color: #9298a4;
  /* background: #5676aa; */
  cursor: not-allowed;
}

.theme-title .realbtn:hover {
  /* background: #fa893b; */
  color: #fda548;
}

.theme-title .realbtn:active {
  color: #c47019;
  /* background: #d66c23; */
}

.theme-title .theme-title-right .realbtn {
  /* margin-right: 18px; */
  margin-left: 0;
}

.theme-title ul {
  z-index: 99999;
  position: relative;
  list-style: none;
  bottom: 36px;
  color: #fffafa;
  text-align: center;
  /* padding-top: 23px; */
}

.theme-title ul li {
  position: relative;
  z-index: 199999999;
  font-size: 12px;
  line-height: 12px;
  display: inline-block;
  padding: 0 15px;
  border-right: 1px solid rgb(85, 119, 169);
}

.theme-title ul li:last-child {
  border-right: 0;
}

.theme-title ul li.active,
.theme-title ul li:hover {
  color: #fa8a3b;
}

.theme-title ul li.disable,
.theme-title ul li.disable:hover {
  color: #878282;
  cursor: not-allowed;
}

.theme-title ul i {
  display: block;
  position: absolute;
  background: #355284;
  width: 14px;
  height: 14px;
  transform: rotate(45deg);
}

.multi-screen {
  width: 300px;
  left: 32px;
  background: #335589;
  height: 40px;
  line-height: 40px;
  border-radius: 3px;
}

.multi-screen i {
  bottom: 12px;
  left: -7px;
}

.theme-title-bottom {
  width: 100%;
  height: 40px;
  background: #355284;
  position: absolute;
  left: 0;
  bottom: 0px;
}

.theme-title-jiexian {
  width: 100%;
  border-top: 1px solid rgba(58, 90, 139, 0.4);
  /* border-bottom: 1px solid #263e69; */
  position: absolute;
  left: 0;
  bottom: 40px;
}
</style>
<style lang="less" scoped>
.no-plugin {
  position: relative;

  & a {
    position: absolute;
    font-size: 24px;
    left: calc(~'50% - 120px');
    top: calc(~'50% - 18px');
    color: #00a5e3;
  }

  & .ivu-icon {
    position: absolute;
    font-size: 24px;
    left: calc(~'50% + 120px');
    top: calc(~'50% - 18px');
    margin-top: 6px;
    margin-left: 10px;
    cursor: help;
    color: #00a5e3;
  }
}
</style>
