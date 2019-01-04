<template>
  <div class="bg">
    <div v-if="isShowPlugin" style="width:100%;height:100%;">
      <object type="application/x-webplayercontrol" ></object>
    </div>
    <bs-cover class="btn-con" v-model="isCover" v-if="isCover && isShowPlugin">
      <i class="icon iconfont icon-large-window" @click="exchange(index)" title="大窗口显示"></i>
    </bs-cover>
  </div>
</template>
<script>
import { preview, playback } from 'components/bsvue'
import { AV_STREAM_START, getDownID } from 'http/video.api'
import { mapGetters, mapState } from 'vuex'
const previewOpen = (
  p,
  { streamType, vendor, ip, port, channel, tsPort, tsIp, gbPlaDevIp, gbPlaDevPort, gbDevId, gbPlaNvrId }
) => {
  let cmd = {
    streamType,
    // vendor,
    // session: '',
    devIp: ip,
    devPort: port,
    channel
  }
  if (gbDevId) {
    cmd = { gbPlaDevIp, gbPlaDevPort, gbDevId, gbPlaNvrId }
  }
  const param = JSON.stringify({
    port: tsPort + '',
    ip: tsIp,
    cmdStr: JSON.stringify(cmd)
  })
  return p.OpenRealStreamEx(param)
}
export default {
  name: 'AlarmPlaybackPlugin',
  props: ['index'],
  data() {
    return {
      mainIndex: 0,
      isShowPlugin: false,
      isFullscreen: false
    }
  },
  computed: {
    isCover() {
      return this.mainIndex !== this.index
    },
    ...mapState({
      parameters: ({ platform }) => platform.parameters
    }),
    ...mapGetters(['getParameter'])
  },
  methods: {
    exchange(index) {
      this.$parent.$emit('exchange', index)
    },
    setMainIndex(index) {
      this.mainIndex = index
    },
    setPluginCallback() {
      this.plugin.SetKeyboardCallback((index, type, keyCode) => {
        if (+keyCode === 27) {
          preview.normalScreen(this.plugin)
        }
      })
    },
    showPlugin() {
      this.isShowPlugin = true
      return new Promise(resolve => {
        this.$nextTick(() => {
          this.plugin = this.$el.querySelector('object')
          if (!this.plugin.valid) {
            return
          }
          this.setPluginCallback()
          resolve()
        })
      })
    },
    async openPreview(param) {
      await this.showPlugin()
      try {
        if (param.gbDevId) {
          const r = await getDownID(param.shareServer)
          param.gbPlaNvrId = r.data.serverId
          param.gbPlaDevIp = r.data.ip
          param.gbPlaDevPort = r.data.port
        }
        const res = await AV_STREAM_START(param)
        previewOpen(this.plugin, {
          ...param,
          tsIp: res.data.tsIp,
          tsPort: res.data.tsPort
        })
        if (param.ip) {
          this.plugin.SetStreamPlayerToolString('IP:' + param.ip)
        }
      } catch (e) {
        console.error('open alarm video error', e)
        this.errorMsg('打开视频失败')
      }
    },
    async openPlayback(param) {
      await this.showPlugin()
      playback.open(this.plugin, param)
    },
    /**
     * 关闭视频
     * 关闭时 是否注销插件
     */
    close(isDestroyPlugin = true) {
      if (!this.plugin) {
        return
      }
      preview.stop(this.plugin)
      if (isDestroyPlugin) {
        this.plugin.SetKeyboardCallback(null)
        this.plugin = null
        this.isShowPlugin = false
      }
    },
    fullscreen() {
      this.isFullscreen = !this.isFullscreen
      preview.fullScreen(this.plugin)
    },
    getCapture() {
      const type = this.parameters.screenshot === 'JPG' ? 'JPG Files (*.jpg)' : 'BMP Files (*.bmp)'
      let path = playback.saveFile(this.plugin, this.screenshot, type)
      if (!path) {
        return
      }
      if (this.parameters.screenshot === 'JPG') {
        path = path + '.JPG'
      }
      if (this.parameters.screenshot === 'BMP') {
        path = path + '.BMP'
      }
      playback.saveCapture(this.plugin, path)
    },
    stopSpeech() {
      preview.stopSpeech(this.plugin)
    },
    closeSpeech() {
      preview.closeSpeech(this.plugin)
    },
    openSpeechEx(param) {
      const state = preview.openSpeech(this.plugin, param)
      let state2
      if (state === 0) {
        state2 = preview.startSpeech(this.plugin)
      }
      if (state !== 0 || state2 !== 0) {
        this.errorMsg('开启对讲失败')
      }
    },
    getPlayerCurTime() {
      return playback.getCurTime(this.plugin)
    }
  },
  mounted() {},
  beforeDestroy() {
    this.close()
  }
}
</script>
<style lang="less" scoped>
object {
  height: 100%;
  width: 100%;
}
.bg {
  background: rgb(64, 64, 64);
  box-sizing: border-box;
  border: 2px solid #1f2224;
  height: 100%;
  position: relative;
}
.btn-con {
  position: absolute;
  right: 0;
  left: 0;
  bottom: 0;
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
</style>
