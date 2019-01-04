<template>
  <div class="bg">
     <div v-if="isShowPlugin" class="objectBox" :style="{position:'absolute',top:pluTop,left: pluLeft }">
       <object type="application/x-webplayercontrol"></object>
      </div>
    <img style="position:absolute;top:0;left:0;width:100%;height:100%" :src="imgSrc" v-if="imgSrc" draggable='false'/>
    <div v-show="isPTZ" class="buttonBars" @mouseup.stop="controlDome(item.addess,0)" @mousedown.stop="controlDome(item.addess)" v-for="(item, i) in xy" :key="i" :style="{left: `calc(50% + ${-20 + item.x}px)`, top: `calc(50% + ${-20 + item.y}px)`}">
      <bs-cover v-model="isPTZ" class="buttonBar-box buttonBar-boxs" :style="{transform: `rotate(${item.angle}deg)`, textAlign: 'center'}">
        <img :src="item.img" />
      </bs-cover>
    </div>
  </div>
</template>
<script>
import { preview } from 'components/bsvue'
import { AV_STREAM_START, YUNNAN_CTRL_SET } from 'http/video.api'
import { mapActions } from 'vuex'
const previewOpen = (
  p,
  { streamType, vendor, ip, port, channel, tsPort, tsIp, gbPlaDevIp, gbPlaDevPort, gbDevId, gbPlaNvrId }
) => {
  let cmd = {
    streamType: streamType || 'main',
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
  name: 'SimplePreviewPlugin',
  data() {
    const R = 100
    return {
      isShowPlugin: false,
      isPTZ: false,
      isFullscreen: false,
      saveParam: null,
      xy: [
        { x: 0, y: -R, angle: '0', addess: 'tiltUp', img: '/static/yuntai/bottom1.png' },
        { x: 0, y: R, angle: '180', addess: 'tiltDown', img: '/static/yuntai/bottom1.png' },
        { x: -R, y: 0, angle: '-90', addess: 'panLeft', img: '/static/yuntai/bottom1.png' },
        { x: R, y: 0, angle: '90', addess: 'panRight', img: '/static/yuntai/bottom1.png' },
        {
          x: -Math.sqrt(R * R / 2),
          y: -Math.sqrt(R * R / 2),
          angle: '-90',
          addess: 'swayUpLeft',
          img: '/static/yuntai/bottom2.png'
        },
        {
          x: -Math.sqrt(R * R / 2),
          y: Math.sqrt(R * R / 2),
          angle: '-180',
          addess: 'swayDownLeft',
          img: '/static/yuntai/bottom2.png'
        },
        {
          x: Math.sqrt(R * R / 2),
          y: -Math.sqrt(R * R / 2),
          angle: '0',
          addess: 'swayUpRight',
          img: '/static/yuntai/bottom2.png'
        },
        {
          x: Math.sqrt(R * R / 2),
          y: Math.sqrt(R * R / 2),
          angle: '90',
          addess: 'swayDownRight',
          img: '/static/yuntai/bottom2.png'
        }
      ],
      imgSrc: '',
      pluTop: 0,
      pluLeft: 0
    }
  },
  methods: {
    ...mapActions(['getPlatformID']),
    setPluginCallback() {
      this.plugin.SetKeyboardCallback((index, type, keyCode) => {
        if (+keyCode === 27) {
          this.cancelFullscreen()
        }
      })
      this.plugin.SetMouseStatusCallback((index, status) => {
        if (status === 1) {
          this.$emit('on-click', index)
        } else {
          this.$emit('on-dblclick', index)
        }
      })
    },
    cancelPluginCallback() {
      this.plugin.SetKeyboardCallback(null)
      this.plugin.SetMouseStatusCallback(null)
    },
    showPlugin() {
      this.isShowPlugin = true
      return new Promise(resolve => {
        this.$nextTick(() => {
          this.plugin = this.$el.querySelector('object')
          if (!this.plugin.valid) {
            return
          }
          setTimeout(() => {
            this.setPluginCallback()
          }, 100)
          resolve()
        })
      })
    },
    async open(param) {
      await this.showPlugin()
      try {
        if (param.gbDevId) {
          const r = await this.getPlatformID(param.shareServer)
          param.gbPlaNvrId = r.serverId
          param.gbPlaDevIp = r.ip
          param.gbPlaDevPort = r.port
        }
        const res = await AV_STREAM_START(param)
        this.saveParam = {
          ...param,
          tsIp: res.data.tsIp,
          tsPort: res.data.tsPort
        }
        let state = previewOpen(this.plugin, this.saveParam)
        return state === 0
      } catch (e) {
        console.error('open alarm video error', e)
        this.errorMsg('打开视频失败')
      }
    },
    setStreamIp(ip) {
      this.plugin.SetStreamPlayerToolString('IP:' + ip)
    },
    close() {
      if (!this.plugin) {
        return
      }
      this.saveParam = null
      preview.stop(this.plugin)
      this.isPTZ = false
      this.cancelPluginCallback()
      this.plugin = null
      this.isShowPlugin = false
    },
    getCapture() {
      const path = preview.saveFile(this.plugin, 'jpg', 'JPG Files (*.jpg)')
      if (typeof path === 'number') {
        return 1
      }
      return preview.saveCapture(this.plugin, path.slice(-3) === 'jpg' ? path : path + '.jpg')
    },
    fullScreen() {
      preview.fullScreen(this.plugin)
      this.isFullscreen = true
    },
    cancelFullscreen() {
      preview.normalScreen(this.plugin)
      this.isFullscreen = false
    },
    openSound() {
      return preview.openSound(this.plugin) === 0
    },
    closeSound() {
      return preview.closeSound(this.plugin) === 0
    },
    setVolume(v) {
      return preview.setVolume(this.plugin, v)
    },
    openDome() {
      this.isPTZ = true
    },
    closeDome() {
      this.isPTZ = false
    },
    controlDome(ctrlCmdEnum, speed = 1, presetIndex = 1, route = 1, stopTime = 5, opt = 1, channel = 1) {
      const item = this.saveParam
      if (!item) { return Promise.reject(new Error(false)) }
      let devInfo = {}
      if (item.gbDevId) {
        const id = this.getPlatformID(item.shareServer)
        devInfo = {
          gbPlaDevIp: id.ip,
          gbPlaDevPort: id.port,
          gbDevId: item.gbDevId,
          gbPlaNvrId: id.serverId
        }
      } else {
        devInfo = {
          devIp: item.ip,
          devPort: item.port
        }
      }
      const param = {
        devCtl: {
          ctrlCmdEnum: ctrlCmdEnum,
          speed: speed,
          presetIndex: presetIndex,
          route: route,
          stopTime: stopTime,
          opt: opt,
          channel: item.channel || channel
        },
        devInfo: devInfo
      }
      return new Promise((resolve, reject) => {
        YUNNAN_CTRL_SET(param, item.id, item.type)
          .then(suc => {
            resolve(suc)
          })
          .catch(error => {
            reject(error)
            console.log(`云台控制${ctrlCmdEnum}接口错误码：`, error)
          })
      })
    },
    moveToCapture() {
      this.imgSrc = preview.getCapture(this.plugin, 10)
      this.pluTop = '-9999px'
      this.pluLeft = '-9999px'
    },
    moveToBack() {
      this.imgSrc = ''
      this.pluTop = '0'
      this.pluLeft = '0'
    },
    async openVideoCall(obj) { // 打开视频通话
      await this.showPlugin()
      const param = JSON.stringify({
        port: String(obj.port),
        ip: String(obj.ip),
        cmdStr: JSON.stringify(obj.cmdStr)
      })
      return this.plugin.OpenRealStreamEx(param) === 0
    },
    closeVideoCall() { // 关闭视频通话
      return preview.stop(this.plugin) === 0
    }
  },
  beforeDestroy() {
    // this.close()
  }
}
</script>
<style lang="less" scoped>
object, .objectBox {
  height: 100%;
  width: 100%;
}
.bg {
  background: rgb(64, 64, 64);
  box-sizing: border-box;
  border: 1px solid #1f2224;
  height: 100%;
  position: relative;
}
.buttonBars {
  position: absolute;
  width: 20px;
  height: 20px;
  z-index: 2;
  background: #ddddee;

  .buttonBar-box {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 100;
    bottom: 0;
  }
  img {
    width: 100%;
    height: 100%;
    cursor: pointer;
  }
}
</style>
