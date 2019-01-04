<!--3D报警 点击报警列表中的查看按钮显示的页面-->
<template>
  <dragBoxs :modal="modalShow" @close="close" title="报警视频">
    <div slot="context" class="map-app-video-pre" style="width:815px;">
      <div class="mapAppInfoContent">
        <div class="infoleft">
          <alarmVideoMadel ref="alarmVideo" :videoParam="actionList" v-if="modalShow"></alarmVideoMadel>
        </div>
        <div class="infoRight">
          <div class="infoRightTittle">报警源信息</div>
          <div class="infoRightInfo">
            <div class="infoDetail">
              <div class="infoLabel">时间</div>
              <div class="infoValue">{{changeFormatTime(oneAlarmInData.time)}}</div>
            </div>
            <div class="infoDetail">
              <div class="infoLabel">机构</div>
              <div class="infoValue text-ellipsis" :title="oneAlarmInData.organization">{{oneAlarmInData.organization}}</div>
            </div>
            <div class="infoDetail">
              <div class="infoLabel">名称</div>
              <div class="infoValue text-ellipsis" :title="oneAlarmInData.name">{{oneAlarmInData.name}}</div>
            </div>
            <div class="infoDetail">
              <div class="infoLabel">级别</div>
              <div class="infoValue">{{oneAlarmInData.level}}级</div>
            </div>
            <div class="infoDetail">
              <div class="infoLabel">报警类型</div>
              <div class="infoValue">{{oneAlarmInData.eventTypeName}}</div>
            </div>
            <div class="infoDetail">
              <div class="infoLabel">处理状态</div>
              <div class="infoValue">未处理</div>
            </div>
            <!-- <div class="infoDetail">
              <div class="infoLabel">计数</div>
              <div class="infoValue">
                <div class="infoValueHeight">
                  <bs-scroll>
                    <div class="alarmIncountItem" v-for="(item, index) in alarmIncount" :key="index" @click="countclick(item)">{{changeFormatTime(item.time)}}</div>
                  </bs-scroll>
                </div>
              </div>
            </div> -->
            <div class="infoDetail">
              <p>报警主机操作</p>
              <div class="alarmHostBtn">
                <Button type="primary" @click="allMeth('protection')" :disabled="oneAlarmInData.type !== 'alarmHost'">布防</Button>
                <Button type="primary" @click="allMeth('removal')" :disabled="oneAlarmInData.type !== 'alarmHost'">撤防</Button>
                <Button type="primary" @click="allMeth('remove')" :disabled="oneAlarmInData.type !== 'alarmHost'">清除</Button>
              </div>
            </div>
            <div class="infoDetail" style="display: inline-block;" v-if="isDisplay">
              <div class="infoLabel">警情处理</div>
              <div class="infoValue">
                <Select v-model="planAlarmSelId" size="small" style="width:155px" @on-change="planAlarmChange">
                  <Option v-for="item in planAlarmList" :value="item.value" :key="item.value">{{item.label}}</Option>
                </Select>
              </div>
            </div>
            <div class="infoDetail" style="margin-top:12px;display: inline-block;">
              <div class="infoLabel">警情类型</div>
              <div class="infoValue">
                <Select v-model="planSelId" size="small" style="width:155px" @on-change="planChange">
                  <Option v-for="item in planList" :value="item.value" :key="item.value">{{item.label}}</Option>
                </Select>
              </div>
            </div>
            <div class="infoDetailother">
              <p style="margin-bottom: 12px;">警情信息</p>
              <Input v-model="planContent" type="textarea" :autosize="{minRows: 1,maxRows: 3}"/>
            </div>
            <div class="infoDetailother">
              <Button type="primary" @click="cleanAlarm">清除报警</Button>
              <Button type="primary" @click="confirmAlarm">确认报警</Button>
            </div>
          </div>
        </div>
      </div>
      <!-- 使用以下弹框避免视频插件遮挡弹框 -->
      <bs-modal v-model="cleanModel" title="提示" :width="416" :mask-closable="false" @on-ok="sureAlarm" @on-cancel="cancelAlarm">
        <div>
          <i class="ivu-icon ivu-icon-help-circled" style="color:#ff9900;font-size:36px;vertical-align:middle;margin:10px 20px 10px"></i>
          <span v-if="modelVal==='clean'">确定清除报警？</span>
          <span v-if="modelVal==='sure'">确认该报警？</span>
        </div>
      </bs-modal>
    </div>
  </dragBoxs>
</template>
<script>
import { mapState, mapMutations, mapActions, mapGetters } from 'vuex'
import alarmVideoMadel from 'components/video/map3Dvideo/alarmVideoMadel'
import dragBoxs from 'components/DragBoxs'

export default {
  components: {
    alarmVideoMadel,
    dragBoxs
  },
  props: {
    modalShow: {
      type: Boolean,
      default: true
    },
    alarmData: {
      type: Object,
      default: null
    },
    type: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      actionList: [],
      oneAlarmInData: {
        organization: '',
        name: '',
        level: '',
        channel: '',
        time: '',
        actionList: []
      },
      alarmIncount: [],
      planSelId: '',
      planList: [],
      planContent: '',
      cleanModel: false,
      modelVal: '',
      planAlarmList: [],
      planAlarmSelId: '',
      showSel: true,
      showInput: true,
      mapAlarmDeal: {},
      isDisplay: false
    }
  },
  watch: {
    alarmData: {
      handler(newVal, oldVal) {
        // 当点击查看的是同一条信息或者当前点击的报警求助信息状态发生变化
        if (oldVal && newVal.devIp === oldVal.devIp && newVal.devPort === oldVal.devPort && newVal.channel === oldVal.channel && (newVal.eventType === oldVal.eventType || newVal.eventType === 'askHelp' || newVal.eventType === 'acceptHelp')) {
          this.oneAlarmInData = this.alarmData.param[0]
          this.alarmIncount = this.alarmData.param
          return
        }
        this.showSel = true
        this.showInput = true
        if (this.alarmData.param && this.alarmData.param.length > 0) {
          this.oneAlarmInData = this.alarmData.param[0]
          this.actionList = this.alarmData.param[0].actionList
          this.alarmIncount = this.alarmData.param
        }
        if (this.$refs.alarmVideo) {
          this.$refs.alarmVideo.stopAll()
          this.$refs.alarmVideo.open()
        }
      },
      deep: true,
      immediate: true
    },
    toolsPanelActive: {
      handler(val) {
        if (val === this.type) {
          this.getalarmDealList(val)
          this.getAlarmTypeList(val)
        }
        if (val === this.type && this.$refs.alarmVideo) {
          this.$refs.alarmVideo.open()
        }
      },
      immediate: true
    }
  },
  computed: {
    ...mapState({}),
    ...mapGetters('map3DApplyIX', ['toolsPanelActive'])
  },
  methods: {
    ...mapMutations([]),
    ...mapActions(['getPrearranged', 'getFirePlan', 'alarmToBeSure', 'recordLog', 'getMapAlarmDealList', 'getMapAlarmDealStatus', 'protectionAction', 'removalAction', 'removeAction', 'getMapAlarmPower']),
    ...mapActions('map3DApplyIX', ['changeOpenAlarmPanel']),
    getalarmDealList(val) {
      // 获取警情处理列表
      // 获取警情处理启用状态
      this.getMapAlarmDealStatus().then((res) => {
        this.mapAlarmDeal = res.data
        let type
        if (val === 'FireAlarmList') {
          type = 'fire'
          this.isDisplay = this.mapAlarmDeal.fireOpen
        } else {
          type = 'alarm'
          this.isDisplay = this.mapAlarmDeal.alarmOpen
        }
        this.getMapAlarmDealList({ page: 1, limit: 1000, type }).then((res) => {
          res.data.forEach(item => {
            this.planAlarmList.push({ label: item.name, value: item.name })
            this.planAlarmSelId = this.planAlarmList[0].value
          })
        }).catch(err => {
          console.log('getMapAlarmDealList error: ' + err)
          this.errorMsg('警情处理列表获取失败')
        })
      }).catch(err => {
        console.log('getFireDealStatus error: ' + err)
        this.errorMsg('警情处理启用状态获取失败')
      })
    },
    getAlarmTypeList(val) {
      this.getAlarmOrFireDealList(val).then(suc => {
        for (let i = 0; i < suc.data.length; i++) {
          this.planList.push({
            value: suc.data[i].name,
            label: suc.data[i].name,
            content: suc.data[i].content
          })
        }
        this.planSelId = this.planList[0].value
        this.planContent = this.planList[0].content
      }).catch(err => {
        console.log('getPrearranged error: ' + err)
      })
    },
    getAlarmOrFireDealList(val) {
      if (val === 'FireAlarmList') {
        return this.getFirePlan({ page: 1, limit: 100, type: 2 })
      } else {
        return this.getPrearranged({ page: 1, limit: 1000 })
      }
    },
    close() {
      this.$emit('close')
      // this.planAlarmSelId = ''
      // this.planSelId = ''
      // this.planContent = ''
      this.showSel = true
      this.showInput = true
    },
    changeFormatTime(time) {
      let date = new Date(parseInt(time) * 1000).toLocaleString()
      let s = date
        .replace('年', '/')
        .replace('月', '/')
        .replace('日', '')
      return s
    },
    // 计数选择(播放录像回放)
    countclick(val) {
      let data = JSON.parse(JSON.stringify(val))
      this.actionList = []
      this.oneAlarmInData = data
      if (data.actionList) {
        data.actionList.forEach(v => {
          this.actionList.push({
            ...v,
            time: data.time
          })
        })
      } else {
        this.actionList = []
      }
    },
    planChange(val) {
      if (val !== '') {
        this.showInput = false
        this.planContent = this.planList[val].content
      } else {
        this.showInput = true
        this.planContent = ''
      }
    },
    planAlarmChange(val) {
      if (val) {
        this.showSel = false
      } else {
        this.showSel = true
      }
    },
    cleanAlarm() {
      this.modelVal = 'clean'
      this.cleanModel = true
    },
    confirmAlarm() {
      if (!this.planContent) {
        this.warningMsg('警情信息不能为空')
        return
      }
      this.modelVal = 'sure'
      this.cleanModel = true
    },
    sureAlarm() {
      if (this.alarmData.alarmPermission.alarmConfirm) {
        if (this.modelVal === 'sure') {
          let alarmArr = []
          const alarmSureInfo = {
            alarmDeal: this.planAlarmSelId,
            situationType: this.planSelId,
            alarmContent: this.planContent
          }
          this.alarmIncount.forEach(item => {
            alarmArr.push({
              _id: item.alarmId,
              ackContent: JSON.stringify(alarmSureInfo),
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
              const param = {
                logType: '操作日志',
                module: '报警处理',
                operateName: '报警确认',
                operateContent: '报警确认',
                target: this.oneAlarmInData.name,
                deviceIp: this.oneAlarmInData.devIp
              }
              this.recordLog(param)
              // 确认报警成功，需做报警列表该项的清除
              this.$emit('modalCleanAlarm', true)
              this.close()
              this.changeOpenAlarmPanel(false)
            })
            .catch(err => {
              console.log('alarmToBeSure', err)
              this.errorMsg('确认报警失败')
            })
        } else if (this.modelVal === 'clean') {
          this.$emit('modalCleanAlarm', true)
          this.close()
          this.changeOpenAlarmPanel(false)
        }
        this.cleanModel = false
      } else {
        this.warningMsg('该报警资源没有权限')
      }
    },
    cancelAlarm() {
      this.cleanModel = false
      this.modelVal = ''
    },
    // 清除报警
    allMeth(methType) {
      let ids = []
      ids.push(this.oneAlarmInData.channelId)
      switch (methType) {
        case 'protection':
          if (this.alarmData.alarmPermission.deployment) {
            this.protectionAction({
              ids: ids,
              type: 'res'
            }).then(() => {
              const param = {
                logType: '操作日志',
                module: '报警处理',
                operateName: '报警主机布防',
                operateContent: '报警主机布防',
                target: this.alarmData.name,
                deviceIp: this.alarmData.devIp
              }
              this.recordLog(param)
              this.successMsg('布防成功！')
            }).catch(() => {
              this.errorMsg('布防失败！')
            })
          } else {
            this.warningMsg('该报警资源没有权限')
          }
          break
        case 'removal':
          if (this.alarmData.alarmPermission.disarming) {
            this.removalAction({
              ids: ids,
              type: 'res'
            }).then(() => {
              const param = {
                logType: '操作日志',
                module: '报警处理',
                operateName: '报警主机撤防',
                operateContent: '报警主机撤防',
                target: this.alarmData.name,
                deviceIp: this.alarmData.devIp
              }
              this.recordLog(param)
              this.successMsg('撤防成功！')
            }).catch(() => {
              this.errorMsg('撤防失败！')
            })
          } else {
            this.warningMsg('该报警资源没有权限')
          }
          break
        case 'remove':
          if (this.alarmData.alarmPermission.clean) {
            this.removeAction({ ids: ids, type: 'res' }).then(() => {
              const param = {
                logType: '操作日志',
                module: '报警处理',
                operateName: '报警主机清除',
                operateContent: '报警主机清除',
                target: this.alarmData.name,
                deviceIp: this.alarmData.devIp
              }
              this.recordLog(param)
              this.successMsg('清除成功！')
            }).catch(() => {
              this.errorMsg('清除失败！')
            })
          } else {
            this.warningMsg('该报警资源没有权限')
          }
          break
      }
    }
  },
  created() {
    this.planAlarmSelId = ''
    this.planSelId = ''
    this.showSel = true
    this.showInput = true
  }
}
</script>
<style lang="less" scoped>
.map-app-video-pre {
  width: 795px;
}
.mapAppInfoContent {
  width: 100%;
  // height: 470px;
  display: flex;
  flex: 1;
  flex-direction: row;
  .infoleft {
    width: 550px;
  }
  .infoRight {
    width: 215px;
    .infoRightTittle {
      height: 26px;
      line-height: 26px;
    }
    .infoRightInfo {
      .infoDetail {
        width: 100%;
        height: 26px;
        line-height: 26px;
        clear: both;
        .infoLabel {
          width: 55px;
          float: left;
        }
        .alarmHostBtn {
          width: 100%;
          float: left;
          margin: 12px 0;
        }
        .infoValue {
          width: 140px;
          float: left;
          .infoValueHeight {
            width: 100%;
            height: 100px;
            border: 1px solid #444;
            padding-left: 5px;
            .alarmIncountItem {
              cursor: pointer;
              height: 22px;
              line-height: 22px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              &:hover {
                color: #20adff;
              }
            }
          }
        }
      }
      .infoDetailother {
        margin: 12px 0px;
      }
    }
  }
}
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
