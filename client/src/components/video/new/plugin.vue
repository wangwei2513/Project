<template>
  <div @dblclick="emitDblclick" style="height: 100%">
    <object type="application/x-webplayercontrol" v-if="init" id='objPlugin'></object>
  </div>
</template>
<script>
import API from '../pluginImp'
import { mapState } from 'vuex'
let recordPlugin
let previewPlugin
export default {
  name: 'plugin',
  props: {
    index: {
      type: Number
    }
  },
  data() {
    return {
      init: false,
      plugin: null,
      pluginState: {
        isPlay: false,
        isStopped: true,
        isVolumeOpen: false,
        volumeValue: 0,
        isFullScreen: false
      }
    }
  },
  computed: {
    ...mapState({
      strFilter: ({ videoOrg }) => videoOrg.strFilter,
      parameters: ({ platform }) => platform.parameters
    })
  },
  watch: {
    pluginState: {
      deep: true,
      handler(v) {
        this.$parent.$emit('update:state', this.index, v)
      }
    }
  },
  methods: {
    initPlugin() {
      return new Promise(resolve => {
        if (this.init) {
          resolve()
        } else {
          this.init = true
          this.$nextTick(() => {
            this.plugin = this.$el.querySelector('object')
            if (this.plugin && this.plugin.valid) {
              recordPlugin = API.recordPlugin
              previewPlugin = API.previewPlugin
              setTimeout(() => {
                this.plugin.SetMouseStatusCallback(this.pluginClickEvent)
                this.plugin.SetKeyboardCallback(this.pluginEscCall)
                resolve()
              }, 100)
            } else {
              recordPlugin = API.emptyPlugin
              previewPlugin = API.emptyPlugin
            }
          })
        }
      })
    },
    pluginClickEvent(index, status) {
      if (status === 1) {
        this.$el.click()
      } else {
        this.emitDblclick()
      }
    },
    pluginEscCall(index, type, keyCode) {
      if (this.pluginState.isFullScreen && +keyCode === 27) {
        this.fullScreen(false)
      }
    },
    emitDblclick() {
      this.$parent.$emit('dblclick', this.index)
      if (this.pluginState.isFullScreen) {
        this.fullScreen(false)
      }
    },
    async videoPlay(param) {
      await this.initPlugin()
      const state = await recordPlugin.open(this.plugin, param)
      if (state.open) {
        this.pluginState.isStopped = false
        this.pluginState.isPlay = true
        if (this.pluginState.isVolumeOpen) {
          this.pluginState.isVolumeOpen = false
          this.videoVolume()
        }
      }
    },
    videoResume() {
      this.pluginState.isPlay = true
      return recordPlugin.resume(this.plugin)
    },
    videoPause() {
      this.pluginState.isPlay = false
      return recordPlugin.pause(this.plugin)
    },
    videoStop() {
      this.pluginState.isStopped = true
      this.pluginState.isPlay = false
      this.pluginState.isVolumeOpen = false
      return recordPlugin.stop(this.plugin)
    },
    videoScreenshot() {
      const type = this.parameters.screenshot === 'JPG' ? 'jpg' : 'bmp'
      const picType = this.parameters.screenshot === 'JPG' ? 1 : 0
      const file = this.strFilter[type]
      const res = JSON.parse(
        recordPlugin.getFileBrowser(this.plugin, {
          type: 0,
          defaultName: type,
          file
        })
      )
      let path = ''
      if (res.success) {
        path = res.fileName
      } else {
        // this.$Notice.error({ title: '失败', desc: '获取保存位置出错！' })
        return
      }
      const state = JSON.parse(
        recordPlugin.getPicture(this.plugin, {
          path: path,
          type: picType
        })
      )
      if (state === 0) {
        this.$Notice.success({ title: '成功', desc: `<p>截图已保存到</p>${path}` })
      } else {
        this.$Notice.error({ title: '失败', desc: '截图失败！' })
      }
    },
    videoVolume() {
      if (this.pluginState.isVolumeOpen) {
        recordPlugin.closeSound(this.plugin)
        this.pluginState.isVolumeOpen = false
        this.pluginState.volumeValue = 0
      } else {
        recordPlugin.openSound(this.plugin)
        recordPlugin.setVolume(this.plugin, 50)
        this.pluginState.isVolumeOpen = true
        this.pluginState.volumeValue = 50
      }
    },
    setVolume(v) {
      recordPlugin.setVolume(this.plugin, v)
      this.pluginState.volumeValue = v
    },
    videoDownLoad(param) {
      const type = this.parameters.videotape === 'BSR' ? 'bsr' : 'avi'
      // const picType = this.parameters.screenshot === 'JPG' ? 1 : 0
      const file = this.strFilter[type]
      const res = JSON.parse(
        recordPlugin.getFileBrowser(this.plugin, {
          type: 0,
          defaultName: type,
          file
        })
      )
      let path = ''
      if (res.success) {
        path = res.fileName
      } else {
        // this.errorMsg('获取保存位置出错！')
        return
      }
      recordPlugin
        .recordSave(this.plugin, {
          ...param,
          path
        })
        .then(_ => {
          this.successMsg('下载成功')
        })
        .catch(_ => {
          this.errorMsg('下载失败')
        })
    },
    getPlayerCurTime() {
      return recordPlugin.getPlayerCurTime(this.plugin)
    },
    // 预览
    async previewOpen(param) {
      await this.initPlugin()
      const state = await previewPlugin.open(this.plugin, param)
      if (state.open) {
        this.pluginState.isStopped = false
        this.pluginState.isPlay = true
        this.pluginState.isVolumeOpen = false
        if (param.ip) {
          previewPlugin.setTipsText(this.plugin, param.ip)
        }
      } else {
        this.$Notice.error({ title: '失败', desc: '开流失败！' })
      }
    },
    previewStop(param) {
      this.pluginState.isStopped = true
      this.pluginState.isPlay = false
      this.pluginState.isVolumeOpen = false
      return previewPlugin.stop(this.plugin)
    },
    fullScreen(isFull = true) {
      recordPlugin.fullScreen(this.plugin, isFull)
      this.pluginState.isFullScreen = !this.pluginState.isFullScreen
    }
  },
  beforeDestroy() {
    if (this.plugin && this.plugin.valid) {
      this.plugin.SetMouseStatusCallback(null)
      this.plugin = null
    }
  }
}
</script>
<style>
#objPlugin {
  width: 100%;
  height: 100%;
}
#alarmVideoMadel .bs-video,
#selectBoxVideo .bs-video {
  position: relative;
  height: 326px;
  width: 527px;
}
#alarmVideoMadel .bs-video-single,
#selectBoxVideo .bs-video-single {
  position: absolute;
  background: rgb(64, 64, 64);
}
.bs-actived {
  border: 1px solid #348ff3;
}
</style>
