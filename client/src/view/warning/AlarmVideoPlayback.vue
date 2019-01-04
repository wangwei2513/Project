<template>
  <div>
    <bs-video class="frame-con" :style="{height: frameHeight}" :count="7" :styles="styles" :pluginCOM="AlarmPlaybackPlugin" @exchange="exchangeStyle" ref="frame"></bs-video>

    <div class="theme-title" style="padding: 10px">
      <button v-if="false" class="theme-btn tv-btn">输出控制</button>
      <!-- <button class="theme-btn tv-btn" @click="speech">{{isSpeech? '关闭对讲': '开启对讲'}}</button> -->
      <button class="theme-btn tv-btn" @click="getCapture">截图</button>
      <button class="theme-btn tv-btn" @click="fullscreen">全屏</button>
      <button v-if="false" class="theme-btn tv-btn">处理流程</button>
      <button class="theme-btn tv-btn" @click="$emit('update:toggleView', false)">返回接警模式</button>
    </div>
    <div style="position: relative;">
      <!-- <Timeline :recordInfo="recordInfo" :value="timelineValue" :canForward="false" @forwardTop="handleDragTop" @ondrag="handleDrag" ref="timeline"></Timeline> -->
      <Timeline v-model="timelineValue" :disabled="false" :recordInfo="recordInfo" @forwardTop="handleDragTop"  @ondrag="handleDrag"  @mouseDown="stopTimer" ref="timeline"></Timeline>
    </div>
  </div>
</template>
<script>
import AlarmPlaybackPlugin from './AlarmPlaybackPlugin'
import Timeline from 'components/timeLine'
import { mapState } from 'vuex'
import { AV_RECORD_LIST } from 'http/video.api'
export default {
  components: {
    Timeline
  },
  props: {
    toggleView: {
      type: Boolean
    }
  },
  data() {
    return {
      AlarmPlaybackPlugin,
      mainIndex: 0,
      isPreview: true,
      styles: [
        {
          left: 0,
          top: 0,
          width: '75%',
          height: '66.6%',
          position: 'absolute'
        },
        {
          left: '75%',
          top: 0,
          width: '25%',
          height: '33.3%',
          position: 'absolute'
        },
        {
          left: '75%',
          top: '33.3%',
          width: '25%',
          height: '33.3%',
          position: 'absolute'
        },
        {
          left: 0,
          bottom: '0.1%',
          height: '33.3%',
          width: '25%',
          position: 'absolute'
        },
        {
          left: '25%',
          bottom: '0.1%',
          width: '25%',
          height: '33.3%',
          position: 'absolute'
        },
        {
          left: '50%',
          bottom: '0.1%',
          width: '25%',
          height: '33.3%',
          position: 'absolute'
        },
        {
          left: '75%',
          bottom: '0.1%',
          width: '25%',
          height: '33.3%',
          position: 'absolute'
        }
      ],
      frameHeight: '700px',
      recordInfo: [],
      timelineValue: (() => {
        const d = new Date()
        d.setHours(12)
        d.setMinutes(0)
        d.setSeconds(0)
        return d.getTime()
      })(),
      allPlugin: true,
      videoParams: [],
      isSpeech: false
    }
  },
  computed: {
    ...mapState({
      activeWarnInfo: ({ warningDispose }) => warningDispose.activeWarnInfo
    }),
    frames() {
      return this.$refs.frame
    }
  },
  watch: {
    toggleView(d) {
      if (!d) {
        this.closeAll()
      } else {
        this.openAllPreview()
        this.resizeTimeline()
        this.$nextTick(() => {
          this.setHeight()
        })
      }
    },
    activeWarnInfo() {
      if (this.toggleView) {
        this.isPreview = true
        this.openAllPreview()
      }
    }
  },
  methods: {
    resizeTimeline() {
      this.$nextTick(() => {
        this.$refs.timeline.resizefun()
      })
    },
    exchangeStyle(index) {
      const s = this.styles[this.mainIndex]
      this.styles[this.mainIndex] = this.styles[index]
      this.styles[index] = s
      this.mainIndex = index
      Array(7)
        .fill()
        .forEach((_, i) => {
          this.frames.getCOM(i).setMainIndex(index)
        })
    },
    closeVideo(p) {
      if (p.uid === this.activeWarnInfo.uid) {
        this.stopTimer()
        this.$emit('update:toggleView', false)
      }
    },
    queryInfo(index, item) {
      AV_RECORD_LIST({
        devIp: item.devIp,
        devPort: item.devPort,
        channel: item.channel,
        startTime: parseInt(
          this.$moment()
            .add(-1, 'days')
            .toDate()
            .getTime() / 1000
        ),
        endTime: parseInt(new Date().getTime() / 1000)
      }).then(suc => {
        this.videoParams[index].queryResult = suc.data.result
      })
    },
    // 查询一天前到现在的记录
    getTimelineInfo() {
      const info = this.$lodash.find(this.activeWarnInfo.actionList, item => item.main)
      return new Promise(resolve => {
        AV_RECORD_LIST({
          devIp: info.devIp,
          devPort: info.devPort,
          channel: info.channel,
          startTime: parseInt(
            this.$moment()
              .add(-1, 'days')
              .toDate()
              .getTime() / 1000
          ),
          endTime: parseInt(new Date().getTime() / 1000)
        }).then(suc => {
          const result = suc.data.result
          this.videoParams[this.mainIndex].queryResult = result
          const timelineinfo = { timedVideo: [], eventVideo: [] }
          if (result && result.eventList && result.eventList.length !== 0) {
            result.eventList.forEach(item => {
              if (item.evtTblInfo.evtType === 800) {
                timelineinfo.timedVideo.push({
                  start: item.evtTblInfo.startTime * 1000,
                  end: item.evtTblInfo.endTime * 1000
                })
              } else {
                timelineinfo.eventVideo.push({
                  start: item.evtTblInfo.startTime * 1000,
                  end: item.evtTblInfo.endTime * 1000
                })
              }
            })
          } else if (result.eventList.length === 0) {
            timelineinfo.eventVideo.push({
              start: new Date().getTime() - 1000,
              end: new Date().getTime() + 1000
            })
          }
          this.$set(this.recordInfo, 0, timelineinfo)
          resolve()
        })
      })
    },
    startTimer(type) {
      // const infos = this.recordInfo[0].eventVideo.length ? this.recordInfo[0].eventVideo : this.recordInfo[0].timedVideo
      const infos = this.recordInfo[0].eventVideo
      let info = []
      if (infos.length) {
        info = infos[infos.length - 1]
      }
      this.stopTimer()
      this.timer = setInterval(() => {
        if (this.isPreview) {
          info.end = new Date().getTime()
          this.$refs.timeline.chengeTime(info.end)
        }
      }, 1000)
    },
    getTimeValue(type) {
      if (type === 'preview') {
        return new Date().getTime()
      } else {
        return this.frames.getCOM(this.mainIndex).getPlayerCurTime()
      }
    },
    stopTimer() {
      clearInterval(this.timer)
    },
    _handleDrag(value) {
      value = String(value).slice(0, 10)
      const now = new Date().getTime() - this.timerStart
      if (this.timerStart && now < 1000) {
        return
      }
      this.isPreview = false
      if (this.allPlugin) {
        this.videoParams.forEach((param, index) => {
          if (param) {
            this.changeToPlayback(index, value)
          }
        })
      } else {
        this.changeToPlayback(this.mainIndex, value)
      }
    },
    _handleDragTop() {
      this.timerStart = new Date().getTime()
      this.videoParams.forEach((info, index) => {
        if (info) {
          this.changeToPreview(index)
        }
      })
      this.isPreview = true
      this.startTimer('preview')
    },
    closeAll(isDestroyPlugin) {
      Array(7)
        .fill()
        .forEach((_, index) => {
          this.frames.getCOM(index).close(isDestroyPlugin)
        })
      this.stopTimer()
      this.recordInfo = []
      this.timelineValue = new Date().getTime()
    },
    changeToPlayback(frameIndex, timeValue) {
      const param = this.videoParams[frameIndex].queryResult
      if (!param || !param.eventList.length) {
        return
      }
      this.openPlayback(frameIndex, {
        startTime: parseInt(timeValue),
        endTime: parseInt(new Date().getTime() / 1000),
        dsIp: param.dsIp,
        strmInfo: param.eventList[0].strmInfo
      })
      this.stopTimer()
      this.timer = setInterval(() => {
        let t = this.getTimeValue('record')
        if (t > 0) {
          // this.timelineValue = t
          this.$refs.timeline.chengeTime(t)
        }
      }, 1000)
    },
    changeToPreview(frameIndex) {
      const info = this.videoParams[frameIndex]
      this.openPreview(frameIndex, {
        id: '',
        type: 'video',
        ip: info.devIp,
        port: info.devPort,
        channel: info.channel,
        vendor: info.manufacturer,
        streamType: info.streamType
      })
    },
    openInfo(index, info) {
      this.$set(this.videoParams, index, info)
      return this.openPreview(index, {
        id: '',
        type: 'video',
        ip: info.devIp,
        port: info.devPort,
        channel: info.channel,
        vendor: info.manufacturer,
        streamType: info.streamType
      })
    },
    openPreview(index, param) {
      this.frames.getCOM(index).openPreview(param)
    },
    closePreview(index) {
      this.frames.getCOM(index).close()
    },
    openPlayback(index, param) {
      this.frames.getCOM(index).openPlayback(param)
    },
    closePlayback(index) {
      this.closePreview(index)
    },
    async _openAllPreview() {
      this.closeAll(false)
      const info = this.activeWarnInfo
      const main = this.$lodash.find(info.actionList, item => item.main)
      this.openInfo(this.mainIndex, main)
      await this.getTimelineInfo()
      if (info.actionList && info.actionList.length) {
        let addIndex = 0
        info.actionList
          .filter(item => !item.main)
          .filter(item => item.client)
          .forEach((item, index) => {
            if (index === this.mainIndex) {
              addIndex++
            }
            this.openInfo(index + addIndex, item)
            this.queryInfo(index + addIndex, item)
          })
      }
      this.startTimer('preview')
    },
    fullscreen() {
      this.frames.getCOM(this.mainIndex).fullscreen()
    },
    getCapture() {
      this.frames.getCOM(this.mainIndex).getCapture()
    },
    speech() {
      if (this.isSpeech) {
        this.frames.getCOM(this.mainIndex).stopSpeech()
        this.frames.getCOM(this.mainIndex).closeSpeech()
      } else {
        const info = this.videoParams[this.mainIndex]
        this.frames.getCOM(this.mainIndex).openSpeechEx({
          id: '',
          type: 'video',
          ip: info.devIp,
          port: info.devPort,
          channel: info.channel,
          vendor: info.manufacturer,
          streamType: info.streamType
        })
      }
    },
    setHeight() {
      this.frameHeight = this.$el.querySelector('.frame-con').clientWidth / 1100 * 600 + 'px'
    }
  },
  created() {
    this.openAllPreview = this.$lodash.debounce(this._openAllPreview.bind(this), 100)
    this.handleDragTop = this.$lodash.debounce(this._handleDragTop.bind(this), 500)
    this.handleDrag = this.$lodash.debounce(this._handleDrag.bind(this), 100)
  },
  mounted() {
    this.setHeight()
  },
  beforeDestroy() {
    clearInterval(this.timer)
    this.closeAll()
    this.openAllPreview = null
    this.handleDragTop = null
    this.handleDrag = null
  }
}
</script>
<style scoped lang="less">
.frame-con {
  height: 700px;
  position: relative;
}

.frame {
  position: absolute;
}

.tv-btn {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 3px;
  cursor: pointer;
  margin: 0 5px;
  border: 1px solid transparent;
}

iframe {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 0;
  border: 0 none;
}

.btn-con {
  position: absolute;
  right: 1px;
  left: 1px;
  bottom: 1px;
  background: #000;
  padding-right: 5px;
  text-align: right;

  i {
    font-size: 20px;
    position: relative;
    cursor: pointer;

    &:hover {
      color: #00a5e3;
    }
  }
}

.theme-btn {
  border: 1px solid #00a5e3;
  background: #00a5e3;
  color: #fff;

  &:hover {
    background: #44add5;
  }
}
</style>
