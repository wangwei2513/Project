<template>
  <div class="fireAlarmList">
    <h3 class="header">消防报警</h3>
    <div class="alarm-scroll">
    <!-- 消防报警消息列表 -->
    <bs-scroll ref="scroller">
        <div class="alarm-item" v-for="(item, index) in fireAlarmList" :key="index">
          <Badge :count="item.param.length" overflow-count="10">
            <div class="item-left" @click="getNearestSingle(item)">
              <div class="item-left-main">
                <div class="main-all" :title="item.name">{{item.name}}</div>
              </div>
              <div class="item-left-main">
                <div class="main-left" :title="item.eventTypeName">{{item.eventTypeName}}</div>
                <div class="main-right" :title="changeFormatTime(item.param[0].time)">{{changeFormatTime(item.param[0].time) }}</div>
              </div>
              <div class="item-left-main">
                <div class="main-left" :title="item.param[0].organization">{{item.param[0].organization}}</div>
                <div class="main-right">{{item.param[0].level}}级</div>
              </div>
            </div>
            <div class="item-right">
              <div class="item-right-btn" @click="openModal(item, index)">查看</div>
              <div class="item-right-btn" @click="ignoreAlarm(item, index)">清除</div>
            </div>
          </Badge>
        </div>
      </bs-scroll>
    </div>
    <mapAlarmAppVideo v-if="showVideo" @close='closeModal' :modalShow='showVideo' :alarmData='itemAlarmVal' @modalCleanAlarm='cleanModalAlarm' type="FireAlarmList"/>
  </div>
</template>
<script>
import mapAlarmAppVideo from '../alarmVideo/mapAlarmAppVideo'
import alarm from 'src/socket/alarm.js'
import { mapActions, mapGetters } from 'vuex'
import './alarm.less'
import mapApi from 'assets/3DMap/utils'
import confirmAlarmFun from '../../alarmFun/confirmAlarmFun'

export default {
  name: 'fireAlarmList',
  components: {
    mapAlarmAppVideo
  },
  data() {
    return {
      showVideo: false,
      itemAlarmVal: null,
      itemAlarmIndex: 0,
      ignoreAlarmVal: null,
      ignoreAlarmIndex: 0,
      fireAlarmList: [],
      alarmPower: {}
    }
  },
  mixins: [confirmAlarmFun],
  computed: {
    ...mapGetters(['alarmTypeList']),
    ...mapGetters('map3DApplyIX', ['isRecAlarm'])
  },
  watch: {
    fireAlarmList: {
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
        alarm.on('all', this.receiveFireAlarm)
        alarm.on('confirmAlarm', this.autoSureAlarm)
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
    /** 查看，视频弹框控制
     * 入参：当前报警信息
     * return：index
     */
    openModal(val, index) {
      if (!this.showVideo) {
        this.showVideo = true
        this.changeOpenAlarmPanel(true)
      }
      this.itemAlarmVal = val
      this.itemAlarmIndex = index
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
    /** 清除报警
     *  入参：当前报警信息
     * return：index
     */
    ignoreAlarm(val, index) {
      if (val.alarmPermission.clean) {
        this.$Modal.confirm({
          title: '警告',
          content: '<p>确认清除此报警吗?</p>',
          loading: true,
          onOk: () => {
            if (index === this.itemAlarmIndex) {
              this.showVideo = false
            }
            // 清除地图点位
            this.mapCleanFriePoint(index)
            // 报警列表清除该项
            this.fireAlarmList.splice(index, 1)
            setTimeout(() => {
              this.$Modal.remove()
            }, 0)
          }
        })
      } else {
        this.warningMsg('该报警资源没有权限')
      }
    },
    /** 消防报警消息格式处理
     *  入参：收到的报警信息
     */
    receiveFireAlarm(data) {
      if (data.alarmInfo.eventType === 'fireAlarm' || data.alarmInfo.eventType === 'fireFailure') {
        let infoData = data.alarmInfo
        this.getMapAlarmPower(infoData.channelId).then(res => {
          this.alarmPower = {}
          if (res.data && res.data.properties.length) {
            res.data.properties.forEach(item => {
              this.alarmPower[item] = item
            })
          }
          let repeat = false
          let repeatIndex = null
          infoData.eventTypeName = this.alarmTypeList[infoData.eventType.toString()]
          if (this.fireAlarmList.length === 0) {
            this.fireAlarmList.unshift({
              name: infoData.name,
              param: [infoData],
              eventType: infoData.eventType,
              eventTypeName: infoData.eventTypeName,
              slot: infoData.slot,
              devIp: infoData.devIp,
              devPort: infoData.devPort,
              channel: infoData.channel,
              alarmPermission: this.alarmPower
            })
          } else {
            for (let j = 0; j < this.fireAlarmList.length; j++) {
              if (this.fireAlarmList[j].name === infoData.name) {
                repeat = true
                repeatIndex = j
                break
              }
            }
            if (repeat) {
              this.fireAlarmList[repeatIndex].param.unshift(infoData)
            } else {
              this.fireAlarmList.unshift({
                name: infoData.name,
                param: [infoData],
                eventType: infoData.eventType,
                eventTypeName: infoData.eventTypeName,
                slot: infoData.slot,
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
    /** 收到自动确认消息，清除页面报警
     *  入参：收到的ackInfo自动确认的报警信息
     */
    autoSureAlarm(data) {
      const anctionAlarm = this.itemAlarmVal
      if (this.showVideo && anctionAlarm && data.devIp === anctionAlarm.devIp && data.devPort === anctionAlarm.devPort && data.channel === anctionAlarm.channel) {
        this.showVideo = false
      }
      if (data.eventType === 'fireAlarm' || data.eventType === 'fireFailure') {
        let arr = []
        arr = this.fireAlarmList
        arr.forEach((item, index) => {
          if (data.devIp === item.devIp && data.devPort === item.devPort && data.channel === item.channel) {
            // 清除地图点位
            this.mapCleanFriePoint(index)
            this.fireAlarmList.splice(index, 1)
          }
        })
      }
    },
    /** 弹框中得清除报警
     *  入参：查看报警弹框的清除方法
     */
    cleanModalAlarm(val) {
      // 清除地图点位
      this.mapCleanFriePoint(this.itemAlarmIndex)
      this.fireAlarmList.splice(this.itemAlarmIndex, 1)
    },
    /** 地图清除点位事件 */
    mapCleanFriePoint(index) {
      let mapData = this.fireAlarmList[index].param[0]
      if (mapData.point3D) {
        let obj = {
          pointIsouter: mapData.point3D.isouter,
          id: mapData.channelId,
          bcode: mapData.point3D.building3ds ? mapData.point3D.building3ds.code : '',
          type: 'fireAlarm'
        }
        // 对地图清除点位方法加try catch,免得影响报警功能
        try {
          this.confirmAlarmData(obj)
        } catch (err) {
          console.log('地图清楚点位方法错误')
        }
      }
    },
    /** 获取报警附件的单兵及地图点位定位 */
    getNearestSingle(val) {
      if (val.param && val.param[0] && val.param[0].point3D) {
        // let locData = val.param[0].point3D.loc.split(',')
        // let pointPosition = [parseFloat(locData[0]), parseFloat(locData[1])]
        if (val.param[0].point3D.isouter) {
          mapApi.focueOnALarm(val.param[0].channelId, this.$context)
        } else {
          this.focusOnFloorAlarm(val.param[0].point3D.sid)
        }
        this.nearestSingle(val.param[0].channelId).catch(() => {
          console.log('获取报警点位附近单兵失败，')
        })
        this.emergencyAction({ planId: 2 }).catch(() => {
          console.log('获取消防报警应急预案失败')
        })
      }
    }
  },
  created() {
    if (this.isRecAlarm) {
      // 是否开启报警
      alarm.on('all', this.receiveFireAlarm)
      alarm.on('confirmAlarm', this.autoSureAlarm)
    }
  },
  destroyed() {
    alarm.remove('all', this.receiveFireAlarm)
    alarm.remove('confirmAlarm', this.autoSureAlarm)
    this.$emit('isUnread', false)
  }
}
</script>

<style lang="less" scoped>
</style>
