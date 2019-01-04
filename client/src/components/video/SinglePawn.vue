<!--单兵视频通话-->
<template>
  <div class="video-call">
    <span v-if="!isPlaying" class="icon iconfont icon-play" @click="openVideo"></span>
    <div class="plu-collter" :style="position">
      <div class="sing-plugin">
        <SimplePreviewPlugin ref="frame" @on-dblclick="fullscreen"></SimplePreviewPlugin>
      </div>
      <div class="btn-con">
        <span class="icon iconfont icon-shexiangtoufanzhuan" title="切换摄像头"></span>
        <span class="icon iconfont icon-volume" title="声音"></span>
        <span class="icon iconfont icon-guaduan" title="挂断" @click="closeVideo"></span>
        <span :class="['icon', 'iconfont', isRecording?'icon-videotape-stop':'icon-videotape']" title="录像" @click="videoRecording"></span>
      </div>
    </div>
  </div>
</template>
<script>
/**
 * id 巡更单兵的id,必须
 * uniqueId 单兵报警的id,预留
 * $emit('stopCalling') 挂断视频时的事件
 */
import SimplePreviewPlugin from 'components/video/SimplePreviewPlugin'
import { mapActions } from 'vuex'
export default {
  components: {
    SimplePreviewPlugin
  },
  props: {
    id: {
      type: [String, Number],
      require: true,
      default: ''
    },
    uniqueId: {
      type: [String, Number],
      default: ''
    }
  },
  data() {
    return {
      isPlaying: false, // 是否正在视频通话
      isRecording: true, // 是否正在录像
      callInfo: null,
      canStart: true
    }
  },
  computed: {
    plugin() {
      return this.$refs.frame
    },
    position() {
      if (this.isPlaying) {
        return {
          position: 'absolute',
          left: 0,
          top: 0
        }
      } else {
        return {
          position: 'absolute',
          left: '-9999px',
          top: '-9999px'
        }
      }
    }
  },
  methods: {
    ...mapActions(['getSinglePawnVideo', 'getSingleStream', 'stopSingleStream', 'startRecord', 'stopRecord', 'recordLog']),
    openVideo() { // 打开视频通话
      if (!this.canStart) {
        console.log('no touch')
        return
      }
      let param = {}
      let cmdStr = {}
      this.canStart = false
      this.getSinglePawnVideo({ id: this.id, command: 'open', uniqueId: this.uniqueId }).then((res) => {
        this.callInfo = res
        param = {
          url: res.rtmp,
          dsId: res.storage, // dsServerId
          dir: String(res.path) // 存储目录
        }
        cmdStr = {
          name: res.name,
          sn: res.sn
        }
        return this.getSingleStream(param)
      }).then((suc) => {
        const obj = {
          port: suc.tsPort,
          ip: suc.tsIp,
          cmdStr: cmdStr
        }
        this.recordLog({
          logType: '操作日志',
          module: '电子巡查',
          operateName: '打开直播',
          operateContent: '打开直播' + this.id,
          target: this.id
        })
        const state = this.plugin.openVideoCall(obj)
        if (state) {
          this.isPlaying = true
          this.startRecord(param)
        } else {
          this.errorMsg('打开视频通话失败！')
          this.isPlaying = false
        }
        this.canStart = true
      }).catch((err) => {
        this.errorMsg('打开视频通话失败！')
        this.isPlaying = false
        console.log(err, '单兵视频')
        this.canStart = true
      })
    },
    closeVideo() { // 挂断,关闭视频通话
      const param = {
        url: this.callInfo.rtmp
      }
      this.$emit('stopCalling')
      this.getSinglePawnVideo({ id: this.id, command: 'close', uniqueId: this.uniqueId }).then((res) => {
        return this.stopSingleStream(param)
      }).then(() => {
        this.recordLog({
          logType: '操作日志',
          module: '电子巡查',
          operateName: '关闭直播',
          operateContent: '关闭直播' + this.id,
          target: this.id
        })
        const state = this.plugin.closeVideoCall()
        if (state) {
          this.isPlaying = false
          if (this.isRecording) {
            this.stopRecord(param)
          }
        } else {
          this.errorMsg('关闭视频通话失败！')
        }
      }).catch((err) => {
        this.errorMsg('关闭视频通话失败！')
        console.log(err)
      })
    },
    videoRecording() { // 录像
      if (this.isRecording) {
        this.stopRecord({ url: this.callInfo.rtmp }).then(() => {
          this.isRecording = !this.isRecording
        }).catch((err) => {
          console.log(err, '手机停止录像失败')
        })
      } else {
        const param = {
          url: this.callInfo.rtmp,
          dsId: this.callInfo.storage, // dsServerId
          dir: this.callInfo.path // 存储目录
        }
        this.startRecord(param).then(() => {
          this.isRecording = !this.isRecording
        }).catch((err) => {
          console.log(err, '手机开始录像失败')
        })
      }
    },
    fullscreen() {
      if (this.plugin.isFullscreen) {
        this.plugin.cancelFullscreen()
      } else {
        this.plugin.fullScreen()
      }
    }
  },
  mounted() {
  },
  beforeDestroy() {
    if (this.isPlaying) {
      this.closeVideo()
    }
  }
}
</script>
<style lang="less" scoped>
.video-call {
  width: 100%;
  height: 100%;
  padding: 0px 5px;
  background-color: #1c3053;
  display: flex;
  justify-content: center;
  align-items:center;
  position: relative;
  .sing-plugin {
    width: 100%;
    height: ~'calc(100% - 32px)';
  }
}
.plu-collter {
  width:100%;
  height: 100%;
}
.video-call .icon-play {
  font-size: 60px;
  line-height: 60px;
  cursor: pointer;
}
.btn-con {
  line-height: 30px;
  display:inline-block;
  margin-left:10px;
  position: absolute;
  bottom: 0;
  right: 10px;
}
.btn-con span {
  user-select: none;
  cursor: pointer;
  margin-left: 15px;
}
.btn-con .icon-guaduan,
.btn-con .icon-videotape-stop,
.btn-con .icon-videotape {
  border: 0 none;
  background: transparent;
  color: #fff;
  padding: 0 5px;
  outline: 0 none;
}
.btn-con .icon-guaduan:hover,
.btn-con .icon-videotape-stop:hover,
.btn-con .icon-videotape:hover {
  color: #20adff;
}
</style>
