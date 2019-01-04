<!--编辑模式 视频点位的视频预览功能 页面-->
<template>
  <div class="MapVideoPreview" style="height: 100%; padding: 10px 12px 0;">
    <SimplePreviewPlugin style="height:335px" ref="frame" @on-dblclick="fullscreen"></SimplePreviewPlugin>
    <div class="btn-con iconfont" style="display:inline-block;margin-left:10px">
      <button @click="pluginState.isPlay? stop(): open()" :title="pluginState.isPlay? '停止': '预览'">{{pluginState.isPlay? '&#xe676;': '&#xe679;'}}</button>
      <button @click="getCapture" title="截图">&#xe67a;</button>
      <button @click="PTZfn" title="云台">&#xe659;</button>
      <button @click="pluginState.isVolumeOpen? closeSound(): openSound()" :title="!pluginState.isVolumeOpen? '静音': '声音'">{{pluginState.isVolumeOpen? '&#xe678;': '&#xe697;'}}</button>
      <div v-show="pluginState.isVolumeOpen" :style="{visibility: pluginState.isVolumeOpen ? 'visible' : 'hidden'}" style="height:30px;margin:-5px 0 0 3px;display:inline-block;vertical-align:middle">
        <slider style="width:60px" color="#20a1ff" :size="100" :minValue='0' @on-change="setVolume" show-tip="never" v-model="volume">
        </slider>
      </div>
    </div>
    <div class="btn-con iconfont" style="float:right;margin-right:10px">
      <button @click="fullscreen" title="全屏">&#xe672;</button>
      <button @click="changeToBack" title="录像回放">&#xe650;</button>
    </div>
  </div>
</template>
<script>
import SimplePreviewPlugin from 'components/video/SimplePreviewPlugin'
import { mapState, mapActions } from 'vuex'
export default {
  components: {
    SimplePreviewPlugin
  },
  props: {
    videoParam: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      pluginState: {
        isPlay: false,
        isVolumeOpen: false,
        isPTZ: false
      },
      showSlider: false,
      volume: 50,
      power: []
    }
  },
  computed: {
    ...mapState({}),
    openParam() {
      if (!this.videoParam) { return }
      let p = {
        id: this.videoParam._id,
        ip: this.videoParam.eid.ip,
        port: this.videoParam.eid.cport,
        channel: this.videoParam.chan,
        streamType: this.videoParam.stream,
        type: 'video',
        vendor: this.videoParam.eid.manufacturer,
        pType: this.videoParam.type
      }
      if (this.videoParam.nodeId) {
        p = {
          ...p,
          gbDevId: this.videoParam.nodeId,
          shareServer: this.videoParam.shareServer
        }
      }
      return p
    }
  },
  methods: {
    ...mapActions(['recordLog', 'getCameraPower']),
    setVolume(v) {
      this.plugin.setVolume(v)
    },
    async open(params = this.openParam) {
      this.power = await this.getCameraPower(this.openParam.id)
      if ((!this.power || !this.power.includes('preview')) && !this.openParam.pType) {
        this.$Notice.warning({ desc: `${params.name || ''}没有权限！`, title: '警告' })
        return
      }
      const success = await this.plugin.open(params)
      if (success) {
        this.pluginState.isPlay = true
        this.recordLog({
          logType: '操作日志',
          module: '电子地图',
          operateName: '视频预览',
          operateContent: '开始视频预览',
          target: this.videoParam.name,
          deviceIp: this.videoParam.nodeId ? this.videoParam.gbPlaDevIp : this.videoParam.eid.ip
        })
        if (params.ip) {
          this.plugin.setStreamIp(params.ip)
        }
      }
    },
    stop(params) {
      this.recordLog({
        logType: '操作日志',
        module: '电子地图',
        operateName: '视频预览',
        operateContent: '停止视频预览',
        target: this.videoParam.name,
        deviceIp: this.videoParam.nodeId ? this.videoParam.gbPlaDevIp : this.videoParam.eid.ip
      })
      this.pluginState = {
        isPlay: false,
        isPTZ: false,
        isVolumeOpen: false
      }
      this.volume = 50
      return this.plugin.close()
    },
    getCapture() {
      this.recordLog({
        logType: '操作日志',
        module: '电子地图',
        operateName: '截图',
        operateContent: '截图',
        target: this.videoParam.name,
        deviceIp: this.videoParam.nodeId ? this.videoParam.gbPlaDevIp : this.videoParam.eid.ip
      })
      const state = this.plugin.getCapture()
      if (state === 0) {
        this.successMsg('保存成功')
      } else if (state !== 1) {
        this.errorMsg('保存失败')
        console.log('save error state', state)
      }
    },
    fullscreen() {
      if (this.plugin.isFullscreen) {
        this.plugin.cancelFullscreen()
      } else {
        this.plugin.fullScreen()
      }
    },
    openSound() {
      if (this.plugin.openSound()) {
        this.pluginState.isVolumeOpen = true
        this.setVolume(50)
      }
    },
    closeSound() {
      if (this.plugin.closeSound()) {
        this.pluginState.isVolumeOpen = false
        this.volume = 50
      }
    },
    PTZfn() {
      if ((!this.power || !this.power.includes('preview')) && !this.openParam.pType) {
        this.$Notice.warning({ desc: `没有权限！`, title: '警告' })
        return
      }
      const type = this.videoParam.monitortype
      if (type === 0 || type === 1) {
        this.warningMsg('此镜头不支持云台功能')
        return
      }
      if (this.pluginState.isPlay) {
        this.recordLog({
          logType: '操作日志',
          module: '电子地图',
          operateName: '云台控制',
          operateContent: '云台控制',
          target: this.videoParam.name,
          deviceIp: this.videoParam.nodeId ? this.videoParam.gbPlaDevIp : this.videoParam.eid.ip
        })
        if (this.isPTZ) {
          this.plugin.closeDome()
        } else {
          this.plugin.openDome()
        }
        this.isPTZ = !this.isPTZ
      }
    },
    changeToBack() {
      if (this.pluginState.isPlay) {
        this.plugin.close()
      }
      this.$emit('update:toggle', 'playBack')
    }
  },
  mounted() {
    this.$root.$on('eventName', target => {
      // this.functionName(target)
    })
    this.$nextTick(() => {
      this.plugin = this.$refs.frame
      this.open(this.openParam)
    })
  },
  beforeDestroy() {
    if (this.pluginState.isPlay) {
      this.plugin.close()
    }
    this.plugin = null
  }
}
</script>
<style scoped>
.MapVideoPreview {
  padding: 0px 5px;
}
.MapVideoPreview .video-plugin-box .video-plugin-inBox .container,
.MapVideoPreview .video-plugin-box .video-plugin-inBox .active,
.MapVideoPreview .video-plugin-box .video-plugin-inBox .bdr,
.MapVideoPreview .video-plugin-box .video-plugin-inBox .bdr1 {
  border: 0px !important;
  margin: 0 !important;
}
.btn-con {
  line-height: 45px;
}
.btn-con button {
  border: 0 none;
  background: transparent;
  color: #fff;
  padding: 0 5px;
  outline: 0 none;
  cursor: pointer;
}
.btn-con button:hover {
  color: #20adff;
}
</style>
<style>
.MapVideoPreview .ivu-slider-button-wrap {
    top: -7px;
}
</style>
