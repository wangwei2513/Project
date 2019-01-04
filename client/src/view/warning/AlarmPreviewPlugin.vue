<template>
  <div class="bg">
    <img :src="isShowImg" alt="" v-if="isShowImg&&!isShowPlugin" style="width:100%;height:100%" />
    <div style="width:100%;height:100%" v-if="isShowPlugin">
      <object type="application/x-webplayercontrol" ></object>
    </div>
    <bs-cover class="btn-con" v-if="$BShasPower('BS-ALARM-RECEIVE-WARNING')" v-show="isShowPlugin" v-model="isShowPlugin">
      <i class="icon iconfont icon-deal-alarm" @click="handle" title="处警"></i>
    </bs-cover>
  </div>
</template>
<script>
import { preview } from 'components/bsvue'
import { AV_STREAM_START, getDownID } from 'http/video.api'
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
  name: 'AlarmPreviewPlugin',
  props: ['index'],
  data() {
    return {
      isShowPlugin: false,
      isShowImg: false
    }
  },
  methods: {
    setPluginCallback() {
      if (this.plugin) {
        this.plugin.SetMouseStatusCallback(() => {
          this.$el.click()
        })
      }
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
    async open(param) {
      if (param.url && param.url.length !== 0) {
        this.isShowImg = param.url
        return
      }
      await this.showPlugin()
      try {
        if (param.gbDevId) {
          const r = await getDownID(param.shareServer)
          param.gbPlaNvrId = r.data.serverId
          param.gbPlaDevIp = r.data.ip
          param.gbPlaDevPort = r.data.port
        }
        this.power = param.power
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
    close() {
      if (this.isShowImg) {
        this.isShowImg = ''
        return
      }
      if (!this.plugin) {
        return
      }
      if (this.plugin.SetMouseStatusCallback) {
        this.plugin.SetMouseStatusCallback(null)
      }
      preview.stop(this.plugin)
      this.plugin = null
      this.isShowPlugin = false
    },
    handle() {
      this.$parent.$emit('handleAlarm', this.index)
      // if (this.power && this.power.includes('playbackDownload')) {
      // } else {
      //   this.$Notice.warning({ desc: `没有权限！`, title: '警告' })
      // }
    }
  },
  beforeDestroy() {
    this.close()
  }
}
</script>
<style scoped>
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
.bs-actived .bg {
  border: 2px solid #348ff3;
  padding: 0;
}
.btn-con {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: right;
  background: #244575;
}

.icon-deal-alarm {
  position: relative;
  font-size: 20px;
  margin-right: 10px;
  cursor: pointer;
}

.icon-deal-alarm:hover {
  color: #00a5e3;
}
</style>
