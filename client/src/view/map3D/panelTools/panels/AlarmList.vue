<template>
  <div class="alarmInputList">
    <h3 class="header">普通报警</h3>
    <div class="alarm-scroll">
    <!-- 普通报警消息列表 -->
    <bs-scroll ref="scroller">
        <div class="alarm-item" v-for="(item, index) in alarmInputList" :key="index">
          <Badge :count="item.param.length" overflow-count="10">
            <div class="item-left" @click="getNearestSingleAndPlanData(item)">
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
    <mapAlarmAppVideo v-if="showVideo" @close='closeModal' :modalShow='showVideo' :alarmData='itemAlarmInput' @modalCleanAlarm='modalAlarmClean' type="AlarmList"/>
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
  name: 'alarmInputList',
  components: {
    mapAlarmAppVideo
  },
  data() {
    return {
      showVideo: false,
      itemAlarmInput: {},
      itemAlarmIndex: 0,
      ignoreAlarmVal: null,
      ignoreAlarmIndex: 0,
      alarmInputList: [],
      alarmPower: {}
    }
  },
  mixins: [confirmAlarmFun],
  computed: {
    ...mapGetters('map3DApplyIX', ['isRecAlarm']),
    ...mapGetters(['alarmTypeList'])
  },
  watch: {
    alarmInputList: {
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
      if (newVal) {
        // 是否开启报警
        alarm.on('all', this.receiveAlarmInput)
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
      console.log('查看，视频弹框控制', val)
      if (!this.showVideo) {
        this.showVideo = true
        this.changeOpenAlarmPanel(true)
      }
      this.itemAlarmInput = val
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
            this.mapCleanPoint(index)
            // 报警列表清除该项
            this.alarmInputList.splice(index, 1)
            setTimeout(() => {
              this.$Modal.remove()
            }, 0)
          }
        })
      } else {
        this.warningMsg('该报警资源没有权限')
      }
    },
    /** 报警消息格式处理
     *  入参：收到的报警信息
     */
    receiveAlarmInput(data) {
      if (data.alarmInfo.eventType === 'alarmInput') {
        let infoData = data.alarmInfo
        this.getMapAlarmPower(infoData.channelId || infoData.devId).then(res => {
          this.alarmPower = {}
          if (res.data && res.data.properties.length) {
            res.data.properties.forEach(item => {
              this.alarmPower[item] = item
            })
          }
          infoData.eventTypeName = this.alarmTypeList[infoData.eventType.toString()]
          let repeat = false
          let repeatIndex = null
          if (this.alarmInputList.length === 0) {
            this.alarmInputList.unshift({
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
            for (let j = 0; j < this.alarmInputList.length; j++) {
              if (this.alarmInputList[j].name === infoData.name) {
                repeat = true
                repeatIndex = j
                break
              }
            }
            if (repeat) {
              this.alarmInputList[repeatIndex].param.unshift(infoData)
            } else {
              this.alarmInputList.unshift({
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
    /** 收到自动确认消息，清除页面报警
     *  入参：收到的ackInfo字段内报警信息
     */
    autoSureAlarm(data) {
      const anctionAlarm = this.itemAlarmInput
      if (this.showVideo && anctionAlarm && data.devIp === anctionAlarm.devIp && data.devPort === anctionAlarm.devPort && data.channel === anctionAlarm.channel) {
        this.showVideo = false
      }
      if (data.eventType === 'alarmInput') {
        let arr = []
        arr = this.alarmInputList
        arr.forEach((item, index) => {
          if (data.devIp === item.devIp && data.devPort === item.devPort && data.channel === item.channel) {
            // 清除地图点位
            this.mapCleanPoint(index)
            this.alarmInputList.splice(index, 1)
          }
        })
      }
    },
    /** 弹框中得清除报警
     *  入参：查看报警弹框的清除方法
     */
    modalAlarmClean(val) {
      // 清除地图点位
      this.mapCleanPoint(this.itemAlarmIndex)
      this.alarmInputList.splice(this.itemAlarmIndex, 1)
    },
    /** 地图清除点位事件 */
    mapCleanPoint(index) {
      if (!this.alarmInputList[index]) { return }
      let mapData = this.alarmInputList[index].param[0]
      if (mapData.point3D && mapData.point3D.building3ds) {
        let obj = {
          pointIsouter: mapData.point3D.isouter,
          id: mapData.channelId,
          bcode: mapData.point3D.building3ds.code,
          type: 'commonAlarm'
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
    getNearestSingleAndPlanData(val) {
      if (val.param && val.param[0] && val.param[0].point3D) {
        if (val.param[0].point3D.isouter) {
          mapApi.focueOnALarm(val.param[0].point3D._id, this.$context)
        } else {
          this.focusOnFloorAlarm(val.param[0].point3D.sid)
        }
        this.nearestSingle(val.param[0].point3D._id).catch(() => {
          console.log('获取报警点位附近单兵失败')
        })
        this.emergencyAction({ planId: 1 }).catch(() => {
          console.log('获取普通报警应急预案失败')
        })
      }
    }
  },
  created() {
    if (this.isRecAlarm) {
      // 是否开启报警
      alarm.on('all', this.receiveAlarmInput)
      alarm.on('confirmAlarm', this.autoSureAlarm)
    }
  },
  destroyed() {
    alarm.remove('all', this.receiveAlarmInput)
    alarm.remove('confirmAlarm', this.autoSureAlarm)
    this.$emit('isUnread', false)
  }
}
</script>

<style lang="less" scoped>
</style>
