<template>
  <div v-resize="listScroll" class="patrol-alarm">
    <h3 class="header-style">巡更报警</h3>
    <!--巡更报警信息列表-->
    <bs-scroll ref="scroller" style="height: calc(100% - 59px);">
      <div v-for="(items, indexs) in patrolAlarmData" class="outer-layer" style="border-radius: 4px;" :key="indexs">
        <div class="patrol-left">
          <!--消息主体-->
          <div style="float:left;width:76%;height:100%;cursor:pointer" @click="messageMain(items)">
            <p style="padding-top:2px">
              <span style="float:left;width:42%"><i class="font-common icon iconfont icon-Location"></i>{{items.message.position}}</span>
            </p>
            <p>
              <span style="float:left;width:42%"><i class="font-common icon iconfont icon-admin"></i>{{items.message.sender}}</span>
            </p>
            <p>
              <span><i class="font-common icon iconfont icon-shijian"></i>{{items.message.date}}</span>
            </p>
          </div>
          <p style="float:left;width:24%;height:66px;line-height:66px;margin:5px 0;border-left:1px solid #6f7d92">
            <span class="alarm-flashing icon iconfont animation-flicker-red" :class="items.msgType === 1 ? 'icon-baojing1': 'icon-repair'"></span>
          </p>
        </div>
        <div class="patrol-bottom">
          <p>
            <span><i class="font-common-style icon iconfont icon-dianzixungeng"></i>{{items.finished}}</span>
            <span class="alarm-icon"><i class="font-common-style icon iconfont icon-baojing1"></i>{{items.alarm}}</span>
            <span><i class="font-common-style icon iconfont icon-repair"></i>{{items.warranty}}</span>
          </p>
          <p style="margin-left:36px;">
            <span class="video-style icon iconfont icon-paisheluxiang" @click="videoShow(items)"></span>
            <span class="video-style icon iconfont icon-127" style="height:30px;cursor:pointer" @click="deal(items)"></span>
          </p>
        </div>
      </div>
    </bs-scroll>
    <!--点位报警、报修信息公用弹出框-->
    <dragBoxs :modal="pointAlarm" @close="closeDragBox" :title="!repairInfor?'点位报警':'报修信息'">
      <div slot="context" class="modol-body" style="height: 500px; width: 1000px; padding: 24px 22px">
        <div style="float:left;width:60%">
          <PatrolVideo :width="550" :height="445" :url="videoUrl" :type="showType"></PatrolVideo>
        </div>
        <div style="float:left;width:40%">
          <Form :model="pointAlarmData" label-position="left" :label-width="82">
            <Form-item label="发起人">
              <Input readonly v-model="pointAlarmData.sponsor"></Input>
            </Form-item>
            <Form-item label="巡更点">
              <Input readonly v-model="pointAlarmData.patrolPoint"></Input>
            </Form-item>
            <Form-item label="标题">
              <Input readonly v-model="pointAlarmData.title"></Input>
            </Form-item>
            <Form-item label="详情">
              <Input readonly v-model="pointAlarmData.details"></Input>
            </Form-item>
            <Form-item label="警情确认">
              <Select v-model="pointAlarmData.selectionPlan">
                <Option v-for="item in plansData" @click.native="selectWarnPlan(item)" :value="item.value" :key="item.value">{{ item.label }}</Option>
              </Select>
            </Form-item>
            <Form-item v-show="!repairInfor" label="备注">
              <Input type="textarea" :autosize="{minRows: 3,maxRows: 4}" v-model="pointAlarmData.remarks"></Input>
            </Form-item>
            <Form-item v-show="repairInfor" label="点位负责人">
              <span>{{pointAlarmData.pointLeader}}</span>
            </Form-item>
            <Form-item v-show="repairInfor" label="电话">
              <span>{{pointAlarmData.phoneNumber}}</span>
            </Form-item>
          </Form>
          <p v-show="!repairInfor" style="margin:48px 0 0 70px">
            <Button type="ghost" style="margin-right:62px" @click="cancel">取消</Button>
            <Button type="primary" @click="confirmAlarm">确认报警</Button>
          </p>
          <p v-show="repairInfor" style="margin:48px 0 0 70px">
            <Button type="ghost" style="margin-right:62px" @click="cancel">取消</Button>
            <Button style="margin-right:62px" @click="reply">回复</Button>
            <Button type="primary" @click="confirmAlarm">确认</Button>
          </p>
        </div>
      </div>
    </dragBoxs>
    <!-- <Modal class="mapAlarm" v-model="pointAlarm" width="1000" :title="!repairInfor?'点位报警':'报修信息'" :mask-closable="false">
      <div class="modol-body" style="height: 445px">
        <div style="float:left;width:60%">
          <PatrolVideo :width="550" :height="445" :url="videoUrl" :type="showType"></PatrolVideo>
        </div>
        <div style="float:left;width:40%">
          <Form :model="pointAlarmData" label-position="left" :label-width="82">
            <Form-item label="发起人">
              <Input readonly v-model="pointAlarmData.sponsor"></Input>
            </Form-item>
            <Form-item label="巡更点">
              <Input readonly v-model="pointAlarmData.patrolPoint"></Input>
            </Form-item>
            <Form-item label="标题">
              <Input readonly v-model="pointAlarmData.title"></Input>
            </Form-item>
            <Form-item label="详情">
              <Input readonly v-model="pointAlarmData.details"></Input>
            </Form-item>
            <Form-item label="选择预案">
              <Select v-model="pointAlarmData.selectionPlan">
                <Option v-for="item in plansData" @click.native="selectWarnPlan(item)" :value="item.value" :key="item.value">{{ item.label }}</Option>
              </Select>
            </Form-item>
            <Form-item v-show="!repairInfor" label="备注">
              <Input type="textarea" :autosize="{minRows: 3,maxRows: 4}" v-model="pointAlarmData.remarks"></Input>
            </Form-item>
            <Form-item v-show="repairInfor" label="点位负责人">
              <span>{{pointAlarmData.pointLeader}}</span>
            </Form-item>
            <Form-item v-show="repairInfor" label="电话">
              <span>{{pointAlarmData.phoneNumber}}</span>
            </Form-item>
          </Form>
          <p v-show="!repairInfor" style="margin:48px 0 0 70px">
            <Button type="ghost" style="margin-right:62px" @click="cancel">取消</Button>
            <Button type="primary" @click="confirmAlarm">确认报警</Button>
          </p>
          <p v-show="repairInfor" style="margin:48px 0 0 70px">
            <Button type="ghost" style="margin-right:62px" @click="cancel">取消</Button>
            <Button style="margin-right:62px" @click="reply">回复</Button>
            <Button type="primary" @click="confirmAlarm">确认</Button>
          </p>
        </div>
      </div>
      <div slot="footer"></div>
    </Modal> -->
    <!--单兵视频弹出框-->
    <dragBoxs :modal="individualVideo" @close="individualVideo=false" title="单兵视频">
      <div slot="context" class="modol-body" style="height: 500px; width: 1000px; padding: 24px 22px">
        <SinglePawn :id="singlePawnId"></SinglePawn>
      </div>
    </dragBoxs>
    <!-- <Modal v-model="individualVideo" width="1000" title="单兵视频" :mask-closable="false">
      <div class="modol-body" style="height: 445px">
        <SinglePawn :id="singlePawnId"></SinglePawn>
      </div>
      <div slot="footer"></div>
    </Modal> -->
    <msgModal :isShowMsgModal="isShowMsgModal" :replyUser="replyUser" @pointAlarmModal="pointAlarmChange" @senderSuccess="isSenderSuccess"></msgModal>
  </div>
</template>

<script>
import alarm from 'src/socket/alarm.js'
import moment from 'moment'
import msgModal from './keepWatchChildren/messageReply.vue'
import confirmAlarmFun from '../../alarmFun/confirmAlarmFun.vue'
import PatrolVideo from 'components/video/PatrolVideo.vue'
import SinglePawn from 'components/video/SinglePawn.vue'
import mapApi from 'assets/3DMap/utils'
import dragBoxs from 'components/DragBoxs'
import { mapActions, mapGetters } from 'vuex'
export default {
  components: {
    msgModal,
    PatrolVideo,
    SinglePawn,
    dragBoxs
  },
  mixins: [confirmAlarmFun],
  data() {
    return {
      showType: '',
      singlePawnId: '', // 巡更单兵的id
      pointAlarmTxt: '点位报警',
      devRepair: '设备报修',
      videoUrl: '',
      isShowMsgModal: false,
      replyUser: {
        realName: '',
        userId: ''
      },
      patrolAlarmData: [],
      pointAlarm: false,
      individualVideo: false,
      pointAlarmData: {
        sponsor: '',
        patrolPoint: '',
        title: '',
        details: '',
        selectionPlan: '',
        remarks: '',
        pointLeader: '',
        phoneNumber: '',
        planName: ''
      },
      plansData: [],
      repairInfor: false,
      isDisableCancel: false,
      confirmAlarmsPramas: [],
      currDealId: '',
      mapPositionDeal: {
        pointIsouter: false,
        id: '', // 点位id
        bcode: '', // 楼宇编码
        type: 'patrolAlarm'
      }
    }
  },
  computed: {
    ...mapGetters('map3DApplyIX', ['isRecAlarm'])
  },
  watch: {
    patrolAlarmData: {
      handler: function(val) {
        if (val.length !== 0) {
          this.$emit('isUnread', true)
        } else {
          this.$emit('isUnread', false)
        }
      },
      deep: true
    }
  },
  created() {
    this.listScroll()
    alarm.on('patrol', this.receivePatrolAlarm)
    alarm.on('patrolConfirm', this.confirmPatrolAlarm)
  },
  mounted() {},
  beforeDestroy() {
    alarm.remove('patrol', this.receivePatrolAlarm)
    alarm.remove('patrolConfirm', this.confirmPatrolAlarm)
    this.$emit('isUnread', false)
  },
  methods: {
    ...mapActions(['confirmAlarms', 'getPrearranged', 'nearestSingle', 'emergencyAction']),
    ...mapActions('map3DApplyIX', ['changeOpenAlarmPanel']),
    /**
     * 选择预案
     */
    selectWarnPlan(data) {
      this.pointAlarmData.selectionPlan = data.value
      this.pointAlarmData.remarks = data.content
      this.pointAlarmData.planName = data.label
    },
    listScroll() {
      if (this.$refs.scroller) {
        this.$refs.scroller.update()
      }
    },
    /**
     * 接收巡更报警
     */
    receivePatrolAlarm(data) {
      if (!this.isRecAlarm) {
        // 通过this.isRecAlarm判断是否开启报警，true为接收，false不接收
        return
      }
      console.log(data, '接收一条新报警/新报修信息')
      const alarmData = JSON.parse(JSON.stringify(data))
      alarmData.message.date =
        moment(alarmData.message.date * 1000).format('YYYY-MM-DD') + ' ' + alarmData.message.moment
      this.patrolAlarmData.unshift(alarmData)
    },
    /**
     * 确认报警后接收到的已被确认报警信息
     */
    confirmPatrolAlarm(data) {
      console.log(data, '某条报警/报修已经被确认')
      for (let i = 0; i < this.patrolAlarmData.length; i++) {
        if (data.uniqueId === this.patrolAlarmData[i].message._id) {
          this.mapPositionDeal.bcode = this.patrolAlarmData[i].map3D.bcode
          this.mapPositionDeal.pointIsouter = this.patrolAlarmData[i].map3D.isouter
          this.mapPositionDeal.id = this.patrolAlarmData[i]._id
          try {
            this.confirmAlarmData(this.mapPositionDeal)
          } catch (err) {}
          this.patrolAlarmData.splice(i, 1)
        }
      }
    },
    /**
     * 在弹出的巡更报警列表中
     * 点击消息主体可直接定位发生报警的闪烁模型(若该点位不在当前图层，地图会跳转并定位)
     * 同时在应急预案面板【单兵人员】发生排列变化
     */
    messageMain(item) {
      if (item.map3D) {
        // const pointArray = item.map3D.geo.split(',').map(item => Number(item))
        if (item.map3D.isouter) {
          mapApi.focueOnALarm(item._id, this.$context)
        } else {
          this.focusOnFloorAlarm(item.map3D.sid)
        }
      }
      this.nearestSingle(item._id).catch(err => {
        console.log('nearestSingle 获取报警点位附近单兵失败' + err)
      })
      this.emergencyAction({ planId: 5 }).catch(() => {
        console.log('获取普通报警应急预案失败')
      })
    },
    isSenderSuccess(arg) {
      this.isDisableCancel = arg
    },
    /**
     * 点击"视频"按钮弹出"单兵视频"框
     */
    videoShow(item) {
      this.singlePawnId = item.message.senderId
      this.individualVideo = true
    },
    /**
     * 点击"处理"按钮弹出报警处理框
     */
    deal(item) {
      this.mapPositionDeal.bcode = item.map3D.bcode
      this.mapPositionDeal.pointIsouter = item.map3D.isouter
      this.mapPositionDeal.id = item._id
      this.currDealId = item.message._id
      if (item.msgType === 1) {
        this.repairInfor = false
      } else {
        this.repairInfor = true
      }
      // 获取报警管理处预案
      this.plansData = []
      this.getPrearranged({ page: 1, limit: 1000 })
        .then(suc => {
          const warnPlanList = JSON.parse(JSON.stringify(suc.data))
          for (let i = 0; i < warnPlanList.length; i++) {
            this.pointAlarmData.selectionPlan = warnPlanList[0]._id
            this.pointAlarmData.remarks = warnPlanList[0].content
            this.pointAlarmData.planName = warnPlanList[0].name
            const obj = {
              value: warnPlanList[i]._id,
              label: warnPlanList[i].name,
              content: warnPlanList[i].content
            }
            this.plansData.push(obj)
          }
        })
        .catch(err => {
          console.log('getPrearranged error: ' + err)
        })
      // 赋值发起人、巡更点、标题、详情、点位负责人、电话
      this.pointAlarmData.sponsor = item.message.sender
      this.replyUser.realName = item.message.sender
      this.replyUser.userId = item.message.senderId
      this.pointAlarmData.patrolPoint = item.message.position
      this.pointAlarmData.title = item.message.title
      this.pointAlarmData.details = item.message.content
      this.pointAlarmData.pointLeader = item.charger
      this.pointAlarmData.phoneNumber = item.phone
      if (item.message.photo) {
        this.videoUrl = item.message.photo
        this.showType = 'image'
      } else if (item.message.video) {
        this.videoUrl = item.message.video
        this.showType = 'video'
      }
      this.isShowMsgModal = false
      this.pointAlarm = true
      this.changeOpenAlarmPanel(true)
    },
    /**
     * 点击"回复"按钮弹出消息回复框
     */
    reply() {
      this.pointAlarm = false
      this.changeOpenAlarmPanel(false)
      this.isShowMsgModal = true
    },
    /**
     * 点击【确认报警】警情处理完成
     */
    confirmAlarm() {
      const param = {
        id: this.currDealId,
        planId: this.pointAlarmData.selectionPlan,
        planName: this.pointAlarmData.planName,
        remark: this.pointAlarmData.remarks
      }
      this.confirmAlarms(param)
        .then(resp => {
          if (this.repairInfor) {
            this.successMsg('确认报修成功')
          } else {
            this.successMsg('确认报警成功')
          }
          this.isDisableCancel = false
          for (let i = 0; i < this.patrolAlarmData.length; i++) {
            if (this.currDealId === this.patrolAlarmData[i].message._id) {
              this.patrolAlarmData.splice(i, 1)
            }
          }
        })
        .catch(err => {
          this.errorMsg(err.response.data.message)
          console.log('confirmAlarms error: ' + err)
        })
      this.pointAlarm = false
      this.changeOpenAlarmPanel(false)
    },
    /**
     * 取消
     */
    cancel() {
      if (this.isDisableCancel) {
        return
      }
      this.pointAlarm = false
      this.changeOpenAlarmPanel(false)
    },
    /**
     * 点击消息回复弹框【发送】返回至上一级(处理详情页面)
     */
    pointAlarmChange(bool) {
      this.pointAlarm = bool
      if (this.pointAlarm) {
        this.changeOpenAlarmPanel(true)
      } else {
        this.changeOpenAlarmPanel(false)
      }
      this.isShowMsgModal = !bool
    },
    closeDragBox() {
      this.pointAlarm = false
      this.changeOpenAlarmPanel(false)
    }
  }
}
</script>

<style scoped>
.patrol-alarm {
  height: 100%;
  background-color: #1b3153;
}
.outer-layer {
  width: 240px;
  height: 106px;
  margin: 16px;
  background: #5f6f86;
}
.patrol-left {
  width: 100%;
  height: 76px;
}
.patrol-left p {
  height: 33.3%;
  line-height: 23px;
  padding-left: 10px;
}
.video-style {
  height: 30px;
  line-height: 30px;
  padding-left: 10px;
  cursor: pointer;
}
.alarm-flashing {
  font-size: 26px;
  color: red;
  padding-left: 8px;
}
.alarm-icon {
  padding: 0px 16px;
}
.patrol-bottom {
  width: 100%;
  height: 30px;
  border-radius: 4px;
  background-color: #6f7d92;
  padding: 2px 0px 0px 12px;
}
.patrol-bottom p {
  float: left;
}
.font-common-style {
  color: #fff;
  padding-right: 4px;
  font-size: 16px;
}
.font-common {
  color: #fff;
  padding-right: 8px;
  font-size: 14px;
}
.header-style {
  padding-left: 16px;
  background-color: #0f2343;
  height: 38px;
  line-height: 38px;
}
</style>
