<template>
  <div>
    <Modal width="890px" v-model="modal" :mask-closable="false" :closable="false" :title="msgInfo.type===1?'点位报警':'报修信息'">
      <div class="patrol-video">
          <PatrolVideo :width="500" :height="420" :url="videoUrl" :type="showType"></PatrolVideo>
      </div>
      <Form class="msg-form" ref="msgInfo" :model="msgInfo" :label-width="80" label-position="left">
        <div class="msg-info">
          <FormItem label="发起人">
            <Input readonly type="text" v-model="msgInfo.sender" :disabled="!!msgInfo.planName"></Input>
          </FormItem>
          <FormItem label="巡更点">
            <Input readonly type="text" v-model="msgInfo.position" :disabled="!!msgInfo.planName"></Input>
          </FormItem>
          <FormItem label="标题">
            <Input readonly v-model="msgInfo.title" :disabled="!!msgInfo.planName"></Input>
          </FormItem>
          <FormItem label="详情">
            <Input readonly v-model="msgInfo.content" :disabled="!!msgInfo.planName"></Input>
          </FormItem>
          <FormItem label="选择预案">
            <Select v-model="msgInfo.planId" :disabled="!!msgInfo.planName">
              <Option @click.native="selectWarnPlan(item)" v-for="item in warnPlanListOpt" :value="item.value" :key="item.value">{{ item.label }}</Option>
            </Select>
          </FormItem>
            <Form-item v-show="msgInfo.type===2" label="点位负责人">
              <span>{{msgInfo.pointLeader}}</span>
            </Form-item>
            <Form-item v-show="msgInfo.type===2" label="电话">
              <span>{{msgInfo.phoneNumber}}</span>
            </Form-item>
        </div>
      </Form>
      <div slot="footer">
        <p v-show="msgInfo.type===1">
          <Button size="large" @click="modalClose">取消</Button>
          <Button v-show="msgInfo.type===1&&!msgInfo.planName" size="large" type="primary" @click="confirmAlarm">报警确认</Button>
          <Button v-show="msgInfo.planName" type="primary" size="large" @click="replyClick">回复</Button>
        </p>
        <p v-show="msgInfo.type===2">
          <Button type="primary" size="large" @click="modalClose">取消</Button>
          <Button type="primary" size="large" @click="replyClick">回复</Button>
          <Button v-show="!msgInfo.planName" size="large" type="ghost" @click="confirmAlarm">确认</Button>
        </p>
        <p v-show="msgInfo.type===0">
          <Button type="primary" size="large" @click="modalClose">取消</Button>
          <Button type="primary" size="large" @click="replyClick">回复</Button>
        </p>
      </div>
    </Modal>
    <div v-if="isPointAlarm">
      <Modal v-model="isPointAlarm" width="890px" title="消息详情" :mask-closable="false">
        <div class="msg-content">
          <div class="msg-content-left">
            <div class="patrol-video">
            <PatrolVideo :width="400" :height="299" :url="videoUrl" :type="showType"></PatrolVideo>
          </div>
          </div>
          <div class="msg-content-right">
            <p>
              <span>
                <Icon type="ios-location-outline" size="24" style="margin-right:5px"/>{{msgInfo.position}}
              </span>
              <span>
                <Icon type="android-time" size="24" style="margin-right:5px"/>{{msgInfo.date}}
              </span>
            </p>
            <textarea class="msgInfo-content" disabled v-model="msgInfo.content">
            </textarea>
          </div>
        </div>
        <div slot="footer">
          <p v-show="!repairInfor" class="patrol-btn">
              <Button  size="large" @click="pointAlarmClose">关闭</Button>
              <Button  type="primary" size="large" @click="replyClick">回复</Button>
          </p>
        </div>
      </Modal>
    </div>
  </div>
</template>

<script>
import defaultImg from '../../../../static/noSolider.jpg'
import cxtImg from '../../../../static/car/vehicleMap1.jpg'
import { mapActions } from 'vuex'
import PatrolVideo from '../../../components/video/PatrolVideo'
import moment from 'moment'
export default {
  components: {
    PatrolVideo
  },
  props: {
    modalInfoIsShow: {
      type: Boolean
    },
    data: {
      type: Object
    }
  },
  data() {
    return {
      showType: '',
      isPointAlarm: false,
      videoUrl: '',
      repairInfor: false,
      defaultImg: defaultImg,
      modal: false,
      warnPlanListOpt: [],
      msgInfo: {
        phoneNumber: '',
        pointLeader: '',
        remarks: '',
        position: '',
        pointName: '',
        title: '',
        content: '',
        receiver: [],
        sender: '',
        senderId: {
          photo: '',
          _id: ''
        },
        senderImg: defaultImg
      },
      selectedPlan: {
        value: '',
        label: '',
        content: ''
      },
      cxtImg: cxtImg,
      videoSrc: '/static/car/car-video.mp4',
      receiverStr: []
    }
  },
  watch: {
    modalInfoIsShow: function(val) {
      this.modal = val
      this.selectedPlan.value = ''
      this.selectedPlan.label = ''
      this.selectedPlan.content = ''
    },
    data: {
      handler: function(val) {
        this.msgInfo = JSON.parse(JSON.stringify(val))
        this.msgInfo.date = moment(this.msgInfo.date * 1000).format('YYYY-MM-DD') + ' ' + this.msgInfo.moment
        if (this.msgInfo.type === 0) {
          this.isPointAlarm = true
          this.modal = false
        } else {
          this.modal = true
          this.isPointAlarm = false
        }
        if (this.msgInfo.photo) {
          this.videoUrl = this.msgInfo.photo
          this.showType = 'image'
        } else if (this.msgInfo.video) {
          this.videoUrl = this.msgInfo.video
          this.showType = 'video'
        }
        if (this.msgInfo.planId) {
          this.warnPlanListOpt.map(item => {
            if (item.value === this.msgInfo.planId) {
              this.selectedPlan.content = item.content
            }
          })
        }
      },
      deep: true
    }
  },
  created() {
    // 获取报警管理处预案
    this.getPrearranged({ page: 1, limit: 50 })
      .then(suc => {
        let warnPlanList = JSON.parse(JSON.stringify(suc.data))
        this.warnPlanListOpt = []
        for (let i = 0; i < warnPlanList.length; i++) {
          this.msgInfo.planContent = warnPlanList[0].content
          this.warnPlanListOpt.push({
            value: warnPlanList[i]._id,
            label: warnPlanList[i].name,
            content: warnPlanList[i].content
          })
        }
      })
      .catch(err => {
        console.log('getPrearranged error: ' + err)
      })
  },
  methods: {
    ...mapActions(['getPrearranged', 'updateTaskMessage']),
    pointAlarmClose() {
      this.isPointAlarm = false
    },
    modalClose() {
      this.$emit('update:modalInfoIsShow', false)
    },
    selectWarnPlan(data) {
      this.selectedPlan.label = data.label
      this.selectedPlan.value = data.value
      this.selectedPlan.content = data.content
    },
    confirmAlarm() {
      if (this.msgInfo.planId) {
        this.$Modal.confirm({
          title: '提示',
          content: `<p>确定执行报警预案:<span style="color:#E7505A;font-size:20px">${
            this.selectedPlan.label
          }</span>吗？</p>`,
          onOk: () => {
            const param = {
              id: this.msgInfo._id,
              planId: this.selectedPlan.value,
              planName: this.selectedPlan.label
            }
            this.updateTaskMessage(param)
              .then(res => {
                if (this.msgInfo.senderId._id) {
                  this.$emit('confirmAlarm', this.msgInfo.senderId._id)
                }
                if (this.msgInfo.devId) {
                  // 巡更报警处理
                  this.$emit('confirmAlarm', this.msgInfo.devId)
                }
                this.$emit('update:modalInfoIsShow', false)
                this.successMsg('报警确认成功')
                this.$emit('notarizeClick', this.msgInfo._id)
              })
              .catch(err => this.errorMsg(err.response.data.message))
          }
        })
      } else {
        this.errorMsg('请选择预案')
      }
    },
    replyClick() {
      this.$emit('replyClick', this.msgInfo)
      this.$emit('update:modalInfoIsShow', false)
      this.isPointAlarm = false
    }
  }
}
</script>
<style lang="less" scoped>
.patrol-video {
  float: left;
  width: 63%;
}
.msg-form {
  display: flex;
  .msg-info {
    flex: 1;
    height: 396px;
  }
}
.msg-content {
  display: flex;
  height: 280px;
  .msg-content-left {
    width: 440px;
    padding: 5px;
  }
  .msg-content-right {
    width: 440px;
    span {
      margin-right: 120px;
    }
  }
}
.msgInfo-content {
  height: 240px;
  width: 100%;
  overflow-y: auto;
  background: #535f77;
  color: #ccc;
  border-radius: 4px;
  padding: 5px;
  line-height: 20px;
  margin-top: 10px;
  border: 1px solid #5676a9;
}
.patrol-btn {
  display: flex;
  justify-content: space-around;
}
</style>
