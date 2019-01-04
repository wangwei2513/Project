<template>
  <div class="AlarmHelpList">
    <h3 class="header">报警求助</h3>
    <div class="alarm-scroll">
      <!-- 报警求助消息列表 -->
      <bs-scroll ref="scroller">
        <div class="alarm-item" v-for="(item, index) in alarmHelpList" :key="index">
          <Badge :count="item.param.length" overflow-count="10">
            <div class="item-left"  @click="getNearestSingle(item)">
              <div class="item-left-main">
                <div class="main-left" :title="item.name">{{item.name}}</div>
                <div class="main-right" :title="changeFormatTime(item.param[0].time)">{{changeFormatTime(item.param[0].time) }}</div>
              </div>
              <div class="item-left-main">
                <div class="main-all" :title="item.eventTypeName">{{item.eventTypeName}}</div>
              </div>
            </div>
            <div class="item-right">
              <div class="item-right-btn" @click="openModal(item, index)">查看</div>
              <div class="item-right-btn" @click="stopAlarm(item, index)">挂断</div>
            </div>
          </Badge>
        </div>
      </bs-scroll>
      <Modal title="提示" v-model="stopModel" :mask-closable="false" @on-ok="sureStopAlarm" @on-cancel="cancelStopAlarm" width='366'>
        <p>确定挂断请求？</p>
      </Modal>
    </div>
    <mapAlarmAppVideo v-if="showVideo" @close='closeModal' :modalShow='showVideo' :alarmData='actionAlarmVal' @modalCleanAlarm='cleanAlarmFromModal' type="AlarmHelpList"/>
  </div>
</template>
<script>
import mapAlarmAppVideo from '../alarmVideo/mapAlarmAppVideo'
import alarm from 'src/socket/alarm.js'
import { mapActions, mapGetters } from 'vuex'
import mapApi from 'assets/3DMap/utils'
import confirmAlarmFun from '../../alarmFun/confirmAlarmFun'

export default {
  name: 'AlarmHelpList',
  components: {
    mapAlarmAppVideo
  },
  data() {
    return {
      showVideo: false,
      stopModel: false,
      actionAlarmVal: null, // 当前弹框对应的报警信息
      stopAlarmVal: null,
      stopAlarmIndex: 0,
      alarmHelpList: [],
      isUnread: false, // 是否有未处理报警
      actionIndex: '',
      alarmPower: {}
    }
  },
  mixins: [confirmAlarmFun],
  computed: {
    ...mapGetters(['alarmTypeList']),
    ...mapGetters('map3DApplyIX', ['isRecAlarm'])
  },
  watch: {
    alarmHelpList: {
      handler: function(val) {
        if (val.length !== 0) {
          this.$emit('isUnread', true)
        } else {
          this.$emit('isUnread', false)
        }
      },
      deep: true
    },
    isRecAlarm(newVal) {
      // 是否开启报警
      if (newVal) {
        alarm.on('all', this.receiveAlarmHelp)
        alarm.on('confirmAlarm', this.autoStopAlarm)
      }
    }
  },
  methods: {
    ...mapActions(['alarmToBeSure', 'nearestSingle', 'emergencyAction', 'getMapAlarmPower']),
    ...mapActions('map3DApplyIX', ['changeOpenAlarmPanel']),
    /** 查看，视频弹框控制 */
    closeModal() {
      this.showVideo = false
      this.changeOpenAlarmPanel(false)
    },
    /** 查看，视频弹框控制 */
    openModal(val, index) {
      if (!this.showVideo) {
        this.showVideo = true
        this.changeOpenAlarmPanel(true)
      }
      this.actionAlarmVal = val
      this.actionIndex = index
    },
    /**
     * 时间戳格式转换
     * 入参：报警时间戳
     * return：转换格式的时间
     */
    changeFormatTime(time) {
      let date = new Date(parseInt(time) * 1000).toLocaleString()
      let s = date
        .replace('年', '/')
        .replace('月', '/')
        .replace('日', '')
        .replace('下午', '')
        .replace('上午', '')
      return s
    },
    /**
     * 手动挂断
     * 入参：当前报警信息，index
     */
    stopAlarm(val, index) {
      this.stopModel = true
      this.stopAlarmVal = val
      this.stopAlarmIndex = index
    },
    /** 挂断弹框，确认挂断该报警求助 */
    sureStopAlarm() {
      let alarmArr = []
      this.stopAlarmVal.param.forEach(item => {
        alarmArr.push({
          _id: item.alarmId,
          ackContent: '',
          devIp: item.devIp,
          devPort: item.devPort,
          channel: item.channel,
          eventType: item.eventType,
          devId: item.devId,
          channelId: item.channelId
        })
      })
      this.alarmToBeSure(alarmArr)
        .then(res => {
          if (this.stopAlarmIndex === this.actionIndex) {
            this.showVideo = false
          }
          // 清除地图点位
          this.mapCleanHelpPoint(this.stopAlarmIndex)
          // 挂断报警（确认报警）成功，清除报警信息
          this.alarmHelpList.splice(this.stopAlarmIndex, 1)
        })
        .catch(err => {
          console.log('alarmToBeSure', err)
          this.errorMsg('挂断失败')
        })
    },
    /** 挂断弹框，取消挂断 */
    cancelStopAlarm() {
      this.stopModel = false
      this.stopAlarmVal = null
      this.stopAlarmIndex = 0
    },
    /** 报警求助消息格式处理 */
    receiveAlarmHelp(data) {
      if (data.alarmInfo.eventType === 'askHelp' || data.alarmInfo.eventType === 'acceptHelp') {
        let infoData = data.alarmInfo
        this.getMapAlarmPower(infoData.channelId || infoData.devId).then(res => {
          this.alarmPower = {}
          if (res.data && res.data.properties.length) {
            res.data.properties.forEach(item => {
              this.alarmPower[item] = item
            })
          }
          let repeat = false
          let repeatIndex = null
          infoData.eventTypeName = this.alarmTypeList[infoData.eventType.toString()]
          if (this.alarmHelpList.length === 0) {
            this.alarmHelpList.unshift({
              name: infoData.name,
              param: [infoData],
              eventType: infoData.eventType,
              eventTypeName: infoData.eventTypeName,
              devIp: infoData.devIp,
              devPort: infoData.devPort,
              channel: infoData.channel,
              alarmPermission: this.alarmPower
            })
          } else {
            for (let j = 0; j < this.alarmHelpList.length; j++) {
              if (this.alarmHelpList[j].name === infoData.name) {
                repeat = true
                repeatIndex = j
                break
              }
            }
            if (repeat && this.alarmHelpList[repeatIndex].eventType === infoData.eventType) {
              this.alarmHelpList[repeatIndex].param.unshift(infoData)
            } else if (repeat && this.alarmHelpList[repeatIndex].eventType !== infoData.eventType) {
              this.alarmHelpList[repeatIndex].eventType = infoData.eventType
              this.alarmHelpList[repeatIndex].eventTypeName = infoData.eventTypeName
              // 当前查看的报警状态 请求对讲 => 接收对讲时
              if (repeatIndex === this.actionIndex) {
                this.actionAlarmVal = this.alarmHelpList[repeatIndex]
              }
            } else {
              this.alarmHelpList.unshift({
                name: infoData.name,
                param: [infoData],
                eventType: infoData.eventType,
                eventTypeName: infoData.eventTypeName,
                devIp: infoData.devIp,
                devPort: infoData.devPort,
                channel: infoData.channel,
                alarmPermission: this.alarmPower
              })
            }
          }
        }).catch(err => {
          console.log('getMapAlarmPower', err)
          this.errorMsg('权限获取失败')
        })
      }
    },
    /** 收到自动确认消息，清除页面报警 */
    autoStopAlarm(data) {
      const anctionAlarm = this.actionAlarmVal
      if (this.showVideo && anctionAlarm && data.devIp === anctionAlarm.devIp && data.devPort === anctionAlarm.devPort && data.channel === anctionAlarm.channel) {
        this.showVideo = false
      }
      if (data.eventType === 'endHelp') {
        let arr = []
        arr = this.alarmHelpList
        arr.forEach((item, index) => {
          if (data.devIp === item.devIp && data.devPort === item.devPort && data.channel === item.channel) {
            // 清除地图点位
            this.mapCleanHelpPoint(index)
            this.alarmHelpList.splice(index, 1)
          }
        })
      }
    },
    /** 弹框中得清除报警 */
    cleanAlarmFromModal(val) {
      // 清除地图点位
      this.mapCleanHelpPoint(this.stopAlarmIndex)
      this.alarmHelpList.splice(this.stopAlarmIndex, 1)
    },
    /** 地图清除点位事件 */
    mapCleanHelpPoint(index) {
      let mapData = this.alarmHelpList[index].param[0]
      if (mapData.bondCarmerRes) {
        let obj = {
          pointIsouter: mapData.bondCarmerRes.point3D.isouter,
          id: mapData.bondCarmerRes._id,
          bcode: '',
          type: 'askHelp'
        }
        // 对地图清除点位方法加try catch,免得影响报警功能
        try {
          this.confirmAlarmData(obj)
        } catch (err) {
          console.log('地图清楚点位方法错误')
        }
      }
    },
    /** 获取报警附件的单兵 */
    getNearestSingle(val) {
      console.log(val)
      if (val.param && val.param[0] && val.param[0].bondCarmerRes) {
        this.nearestSingle(val.param[0].bondCarmerRes._id).catch(() => {
          console.log('获取报警点位附近单兵失败')
        })
        this.emergencyAction({ planId: 1 }).catch(() => {
          console.log('获取报警求助应急预案失败')
        })
      }
      if (val.param[0].bondCarmerRes) {
        // let loc = val.param[0].bondCarmerRes.point3D.loc.split(',').map(item => Number(item))
        mapApi.focueOnALarm(val.param[0].bondCarmerRes._id, this.$context)
      }
    }
  },
  created() {
    if (this.isRecAlarm) {
      // 是否开启报警
      alarm.on('all', this.receiveAlarmHelp)
      alarm.on('confirmAlarm', this.autoStopAlarm)
    }
  },
  destroyed() {
    alarm.remove('all', this.receiveAlarmHelp)
    alarm.remove('confirmAlarm', this.autoStopAlarm)
    this.$emit('isUnread', false)
  }
}
</script>

<style lang="less" scoped>
.AlarmHelpList {
  width: 100%;
  height: 100%;
  color: #fff;
  font-size: 12px;
  background-color: rgb(44, 62, 92);
  border-radius: 5px;
  .header {
    background-color: #0f2343;
    font-size: 14px;
    height: 38px;
    padding: 0 16px;
    line-height: 38px
  }
  .alarm-scroll {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: rgb(27, 49, 83);
    .alarm-item {
      clear: both;
      display: block;
      background-color: #50617a;
      border-radius: 5px;
      height: 80px;
      width: 93%;
      margin: 15px 10px;
      .ivu-badge {
        width: 100%;
      }
      .item-left {
        float: left;
        width: 75%;
        .item-left-main {
          clear: both;
          height: 39px;
          line-height: 39px;
          display: block;
          width: 100%;
          padding: 0 10px;
          cursor: pointer;
          .main-left {
            float: left;
            width: 50%;
            height: 100%;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
          }
          .main-all {
            float: left;
            width: 100%;
            height: 100%;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
          }
          .main-right {
            height: 100%;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
          }
        }
      }
      .item-right {
        float: left;
        width: 22%;
        height: 80px;
        text-align: center;
        border-left: 1px solid #ccc;
        cursor: default;
        .item-right-btn {
          height: 39px;
          line-height: 39px;
          cursor: pointer;
          &.hover {
            color: #20adff;
          }
        }
      }
    }
  }
  .ivu-badge-count {
    position: absolute;
    right: 10px !important;
  }
}
</style>
