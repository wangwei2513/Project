<template>
 <div v-resize="listScroll" id='single-alarm'>
   <p class="alarm-title">单兵报警</p>
   <bs-scroll ref="scroller" style="height: calc(100% - 40px); background: #1b3153">
    <div class="single-alarm-list" v-if="alarmList.length !== 0">
      <div class="single-alarm-li" v-for="(alarm, index) in alarmList" :key="index" @click="changeAlarmList(alarm)">
        <div class="left-img"><img class="user-img" :src="`/api/upload/?id=${alarm.photo}`" alt="加载失败" title="用户头像"></div>
        <ul class="left-ul">
          <li title="用户名称"><i class="iconfont icon-admin default-size"></i> <span>{{alarm.realname || alarm.sender}}</span></li>
          <li title="联系电话"><i class="iconfont icon-dianhua default-size"></i> {{alarm.phone}}</li>
          <li title="任务完成百分比"><i class="iconfont icon-jindu" style="font-size:13px;"></i> {{alarm.precentage || '0%'}}</li>
        </ul>
        <div class="right-btn">
          <i class="iconfont icon-baojing1 iconfont-btn animation-flicker-red" v-if="alarm.isAlarm" @click="videoCall(alarm)"></i>
          <i class="iconfont icon-xiaoxi1 iconfont-btn" v-else @click="viewMsg(alarm)"></i>
        </div>
      </div>
    </div>
   </bs-scroll>
   <div class="sendMsg">
     <i class="iconfont icon-xiaoxi1 iconfont-btn" title="发送消息" @click="sendMsg"></i>
   </div>
   <dragBoxs :modal="showAlarmModel" :title="modalTitle" @close="showAlarmModel=false">
     <!-- 视频通话 -->
     <div slot="context" class="alarm-inner" v-if="showAlarmCall">
       <div class="alarm-video">
         <SinglePawn :id="alarmDetail._id" :uniqueId="alarmDetail.uniqueId"></SinglePawn>
       </div>
     </div>
     <!-- 消息详情 -->
     <div slot="context" class="alarm-inner" v-else>
       <div class="inner-left">
         <p class="inner-top">{{msgDetail.title}}</p>
         <PatrolVideo :width="350" :height="240" :type="patrolVideoParam.type" :url="patrolVideoParam.url"></PatrolVideo>
       </div>
       <div class="inner-right">
         <div class="inner-top">
           <div class="alarm-type"><i class='iconfont icon-fenlei' style="font-size:17px;"></i>分类： {{msgDetail.type}}</div>
           <div><i class="iconfont icon-shijian" style="font-size:17px;"></i> {{msgDetail.date}}</div>
         </div>
         <p class="inner-right-des">
           {{msgDetail.content}}
         </p>
       </div>
     </div>
     <div slot="footer">
       <div v-if="!showAlarmCall" style="text-align: center;">
         <Button class="footer-btn" type="info" @click="confirmAlarmMsg(msgDetail.uniqueId, true)">取消</Button>
          <Button class="footer-btn" type="primary" @click="replyMsg">回复</Button>
       </div>
      </div>
   </dragBoxs>
   <!-- <Modal class="alarm-model" v-model="showAlarmModel" :title="modalTitle" :width="700" :mask-closable="false"> -->
     <!-- 视频通话 -->
     <!-- <div class="alarm-inner" v-if="showAlarmCall">
       <div class="alarm-video">
         <SinglePawn :id="alarmDetail._id" :uniqueId="alarmDetail.uniqueId"></SinglePawn>
       </div>
     </div> -->
     <!-- 消息详情 -->
     <!-- <div class="alarm-inner" v-else>
       <div class="inner-left">
         <p class="inner-top">{{msgDetail.title}}</p>
         <PatrolVideo :width="350" :height="240" :type="patrolVideoParam.type" :url="patrolVideoParam.url"></PatrolVideo>
       </div>
       <div class="inner-right">
         <div class="inner-top">
           <div class="alarm-type"><i class='iconfont icon-fenlei' style="font-size:17px;"></i>分类： {{msgDetail.type}}</div>
           <div><i class="iconfont icon-shijian" style="font-size:17px;"></i> {{msgDetail.date}}</div>
         </div>
         <p class="inner-right-des">
           {{msgDetail.content}}
         </p>
       </div>
     </div>
     <div slot="footer">
       <div v-if="!showAlarmCall" style="text-align: center;">
         <Button class="footer-btn" type="info" @click="confirmAlarmMsg(msgDetail.uniqueId, true)">取消</Button>
          <Button class="footer-btn" type="primary" @click="replyMsg">回复</Button>
       </div>
      </div>
   </Modal> -->
   <msg-modal :modalType="msgModelType" :replyUser="replyUser" @addOK="addMsgOk" :modalIsShow.sync="showNewsReply" :isSingleAlarm="isSingleAlarm"></msg-modal>
 </div>
</template>

<script>
import alarm from '../../../../socket/alarm'
import MsgModal from '../../../keepwatch/common/msgModal'
import PatrolVideo from 'components/video/PatrolVideo'
import SinglePawn from 'components/video/SinglePawn'
import mapApi from 'assets/3DMap/utils'
import { mapActions, mapGetters } from 'vuex'
import confirmAlarmFun from '../../alarmFun/confirmAlarmFun'
import dragBoxs from 'components/DragBoxs'
export default {
  components: { MsgModal, PatrolVideo, SinglePawn, dragBoxs },
  mixins: [confirmAlarmFun],
  data() {
    return {
      msgModelType: 2, // 消息回复
      showAlarmModel: false, // 报警弹出框
      showNewsReply: false, // 消息回复
      showAlarmCall: false, // 视频通话
      videoTape: true, // 录像
      singleAlarmList: [], // 单兵报警
      singleAlarmMsg: [], // 单兵消息
      replyUser: {
        // 接收消息用户
        realName: '',
        userId: ''
      },
      msgDetail: {},
      alarmDetail: {},
      spliceAlarm: '', // 保证弹窗关闭在删除消息
      isSingleAlarm: false // 回复组件使用
    }
  },
  computed: {
    ...mapGetters('map3DApplyIX', ['isRecAlarm']),
    modalTitle() {
      return this.showAlarmCall ? '单兵视频' : this.showNewsReply ? '消息回复' : '消息详情'
    },
    patrolVideoParam() {
      return {
        url: this.msgDetail.picture ? this.msgDetail.picture : this.msgDetail.video,
        type: this.msgDetail.picture ? 'image' : 'video'
      }
    },
    alarmList() {
      return this.singleAlarmList.concat(this.singleAlarmMsg)
    }
  },
  watch: {
    showAlarmModel(val) {
      if (!val) {
        if (this.spliceAlarm !== '' && !this.showNewsReply) {
          this.removeEle(this.singleAlarmList, this.spliceAlarm)
          this.successMsg('报警确认成功')
        }
        this.alarmDetail = {}
        this.spliceAlarm = ''
      }
      this['map3DApplyIX/changeOpenAlarmPanel'](val)
    },
    showNewsReply(val) {
      if (!val) {
        this.msgDetail = {}
      }
    },
    alarmList(val) {
      if (val.length === 0) {
        this.$emit('isUnread', false)
      } else {
        this.$emit('isUnread', true)
      }
    },
    isRecAlarm(val) {
      if (val) {
        this.bindSocket()
      } else {
        this.removeSocket()
      }
    }
  },
  methods: {
    ...mapActions(['confirmSingle', 'nearestSingle', 'emergencyAction', 'map3DApplyIX/changeOpenAlarmPanel']),
    listScroll() {
      if (this.$refs.scroller) {
        this.$refs.scroller.update()
      }
    },
    changeAlarmList(obj) {
      // const pointArr = [obj.lon, obj.lat]
      const id = obj.uniqueId || obj._id
      mapApi.focueOnALarm(id, this.$context)
      this.nearestSingle(obj.uniqueId)
      this.emergencyAction({ planId: 4 }).catch(() => {
        console.log('获取普通报警应急预案失败')
      })
    },
    // 查看消息
    viewMsg(obj) {
      this.msgDetail = obj
      this.showAlarmModel = true
      this.showAlarmCall = false
      this.showNewsReply = false
      this.replyUser.realName = obj.sender
      this.replyUser.userId = obj.senderId
    },
    // 一键报警
    videoCall(obj) {
      this.alarmDetail = obj
      this.showAlarmModel = true
      this.showAlarmCall = true
    },
    // 新建消息
    sendMsg() {
      this.msgModelType = 1
      this.isSingleAlarm = false
      this.showNewsReply = true
    },
    // 回复消息
    replyMsg(data) {
      this.msgModelType = 2
      this.isSingleAlarm = true
      this.showNewsReply = true
      this.showAlarmModel = false
    },
    // 回复消息成功
    addMsgOk() {
      if (this.msgDetail.uniqueId) {
        this.confirmAlarmMsg(this.msgDetail.uniqueId, true)
      }
    },
    // 确认消息报警
    confirmAlarmMsg(uniqueId, isMsg) {
      if (isMsg) {
        this.showAlarmModel = false
      }
      this.confirmSingle(uniqueId)
        .then(() => {
          if (!isMsg) {
            this.isStopCall = true
          }
          this.successMsg('报警确认成功')
          this.confirmAlarmData(true, uniqueId, '', 'singleAlarm') // 取消地图点位闪烁
        })
        .catch(err => this.errorMsg(err.response.data.message))
    },
    // 接收单兵报警
    receiveSingleAlarm(data) {
      // console.log('receiveSingleAlarm', data)
      data.isAlarm = true
      this.singleAlarmList.unshift(data)
    },
    // 接收单兵消息
    receiveSingleMsg(data) {
      // console.log('receiveSingleMsg', data)
      const result = {
        isAlarm: false,
        content: data.content,
        date: `${this.$moment(data.date * 1000).format('YYYY-MM-DD')}-${data.moment}:00`,
        phone: data.phone,
        photo: data.picture, // 用户头像
        picture: data.photo, // 消息图片
        sender: data.sender, // 发送人
        senderId: data.senderId,
        title: data.title,
        type: data.type === 0 ? '常规消息' : data.type === 1 ? '报警消息' : '保修消息', // 消息类型： 0常规 || 1报警 || 2保修
        video: data.video,
        uniqueId: data.uniqueId,
        point: data.point // 地图接口需要数组：[0]经度，[1],纬度
      }
      this.singleAlarmMsg.unshift(result)
    },
    // 去除数组指定元素
    removeEle(arr, uniqueId) {
      arr.forEach((item, index) => {
        if (item.uniqueId === uniqueId) {
          arr.splice(index, 1)
        }
      })
    },
    // 确认报警的通知
    confirmNotice(data) {
      if (data.type === 'alarm') {
        this.spliceAlarm = data.uniqueId
      } else {
        this.removeEle(this.singleAlarmMsg, data.uniqueId)
      }
    },
    bindSocket() {
      alarm.on('singlePawnMsg', this.receiveSingleMsg)
      alarm.on('singlePawn', this.receiveSingleAlarm)
      alarm.on('patrolConfirm', this.confirmNotice)
    },
    removeSocket() {
      alarm.remove('singlePawn', this.receiveSingleAlarm)
      alarm.remove('singlePawnMsg', this.receiveSingleMsg)
      alarm.remove('patrolConfirm', this.confirmNotice)
    }
  },
  created() {
    this.listScroll()
    if (this.isRecAlarm) {
      this.bindSocket()
    }
  },
  destroyed() {
    if (this.isRecAlarm) {
      this.$emit('isUnread', false)
      this.removeSocket()
    }
  }
}
</script>

<style>
.alarm-model .ivu-modal-mask {
  z-index: 999;
}
.alarm-model .ivu-modal-wrap {
  z-index: 1000;
}
</style>

<style scoped lang="less">
.alarm-title {
  font-size: 14px;
  height: 38px;
  padding-left: 16px;
  line-height: 38px;
  font-weight: 700;
}
#single-alarm,
.single-alarm-list {
  width: 100%;
  height: 100%;
}
.single-alarm {
  position: relative;
}
.sendMsg {
  text-align: center;
  position: absolute;
  width: 32px;
  height: 32px;
  line-height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  bottom: 16px;
  right: 16px;
  opacity: 0.7;
}
.single-alarm-list {
  padding: 8px 16px;
  background: #1b3153;
}
.single-alarm-li {
  display: flex;
  height: 72px;
  margin: 6px 0;
  background: #50617a;
  border-radius: 5px;
}
.left-ul {
  width: 120px;
  border-right: 1px solid rgba(151, 151, 151, 0.5);
  font-size: 12px;
  margin: 8px 0;
}
.left-ul li {
  line-height: 19px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.left-img {
  width: 40px;
  height: 40px;
  margin: 16px 12px;
  box-sizing: border-box;
}
.user-img {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 50%;
}
.right-btn {
  flex: 1;
  text-align: center;
  line-height: 72px;
}
.alarm-inner {
  display: flex;
  width: 700px;
  height: 286px;
}
.alarm-video {
  width: 656px;
  line-height: 286px;
  text-align: center;
}
.inner-left {
  width: 350px;
  margin-right: 16px;
}
.inner-right {
  flex: 1;
}
.inner-top {
  height: 30px;
  line-height: 30px;
  margin-bottom: 16px;
  display: flex;
}
.alarm-type {
  margin-right: 20px;
  width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.inner-right-des {
  word-wrap: break-word;
  text-indent: 2em;
  padding: 8px;
  border-radius: 5px;
  border: 1px solid #5676a9;
  height: 240px;
}
.footer-btn {
  margin: 0 10px;
}
.iconfont-btn {
  font-size: 20px;
  cursor: pointer;
}
.default-size {
  font-size: 12px;
}
</style>
