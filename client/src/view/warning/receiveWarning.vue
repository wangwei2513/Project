<template>
  <div class="alarm">
    <Row style="height:100%;">
      <Col span="16" style="height:100%;padding-right:16px;">
      <div class="alarm-left">
        <AlarmVideo ref="alarmvideopreview"></AlarmVideo>
      </div>
      </Col>
      <Col span="8" style="height:100%;">
      <div class="alarm-right" style="height:100%;">
        <div class="alarm-message">
          <Col span="12">
          <div class="alarm-location-left">
            <BSMap3D ref="BSMap3D" v-if="imensional === '3D'" :modeType="'alarmProcessing'"></BSMap3D>
            <BSMap v-if="imensional === '2D'" ref="fireMapContainer" @postcompose="alarmTwinkEvt" @click="selectFeatureEvt">
              <!-- 报警点位 -->
              <bs-layer :id="alarmLayer.id" :name="alarmLayer.name" :features="alarmAppFeatures" :zIndex="6"></bs-layer>
            </BSMap>
          </div>
          </Col>
          <Col span="12">
          <div class="alarm-location-right">
            <Tabs value="0" :animated="false" style="flex:1;" @on-click="changeTabs">
              <TabPane label="报警源信息" name="0">
                <ul>
                  <li>
                    <i>时间: </i>
                    <p :title='activeWarnInfo.time ? $moment(parseInt(activeWarnInfo.time) * 1000).format("YYYY-MM-DD HH:mm:ss") : ""'>{{ activeWarnInfo.time ? $moment(parseInt(activeWarnInfo.time) * 1000).format('YYYY-MM-DD HH:mm:ss') : ''}}</p>
                  </li>
                  <li>
                    <i>机构：</i>
                    <p :title='activeWarnInfo.organization'>{{ activeWarnInfo.organization }}</p>
                  </li>
                  <li>
                    <i>名称：</i>
                    <p :title='activeWarnInfo.name'>{{ activeWarnInfo.name }}</p>
                  </li>
                  <li>
                    <i>报警类型：</i>
                    <p :title='activeWarnInfo.classifyName'>{{ activeWarnInfo.classifyName }}</p>
                  </li>
                  <li>
                    <i>级别：</i>
                    <p :title='activeWarnInfo.level'>{{ activeWarnInfo.level }}</p>
                  </li>
                  <li>
                    <i>处理情况：</i>
                    <p>{{activeWarnInfo.name === undefined ? '' : '未确认'}}</p>
                  </li>
                  <li>
                    <i>其他信息：</i>
                    <p>{{activeWarnInfo.name === undefined ? '' : '暂无其他信息'}}</p>
                  </li>
                </ul>
              </TabPane>
              <TabPane label="智能信息" name="1">
                <ul>
                  <li>
                    <i>车牌号码:</i>
                    <p>{{ activeWarnInfo.carNum === undefined ? '' : activeWarnInfo.carNum}}</p>
                  </li>
                  <li>
                    <i>车辆类型:</i>
                    <p>{{ activeWarnInfo.carType=== undefined ? '' : this.carTypeList[activeWarnInfo.carType]}}</p>
                  </li>
                  <li>
                    <i>行车方向:</i>
                    <p>{{ activeWarnInfo.carDirect === undefined ? '' :this.carDirect[activeWarnInfo.carDirect] }}</p>
                  </li>
                </ul>
              </TabPane>
              <TabPane :label="alarmlabel" name="2">
                <ul>
                  <li>
                    <i>时间：</i>
                    <p :title='alarmhelpData.time ? $moment(parseInt(alarmhelpData.time) * 1000).format("YYYY-MM-DD HH:mm:ss") : ""'>{{ alarmhelpData.time ? $moment(parseInt(alarmhelpData.time) * 1000).format('YYYY-MM-DD HH:mm:ss') : ''}}</p>
                  </li>
                  <li>
                    <i>名称:</i>
                    <p>{{ alarmhelpData.name=== undefined ? '' : alarmhelpData.name}}</p>
                  </li>
                  <li>
                    <i>对讲ID:</i>
                    <p>{{ alarmhelpData.askId === undefined ? '' :alarmhelpData.askId }}</p>
                  </li>
                  <li>
                    <i>状态:</i>
                    <p>{{ alarmhelpData.status === undefined ? '' :alarmhelpData.status }}</p>
                  </li>
                </ul>
                <Page class="changepagestyle" style="position: absolute;bottom: 16px;left: 30%;" size="small" :page-size="1" :current="alarmhelpcurrent" :total="alarmhelpAllData.length" @on-change="changeAlarmhelpPage" show-total/>
              </TabPane>
            </Tabs>
          </div>
          </Col>
        </div>
        <div class="alarm-sort">
          <TableTab ref="warningTab" :tabs="warningTabs" :isTip="true"></TableTab>
          <div class="alarm-table">
            <Table width="100%" height="285" :columns="warnColumns" :data="receiveWarnListView[activeWarnTab]" @on-row-click="clickWarnListRow" :highlight-row="true" @on-selection-change="selectWarnListRow"></Table>
          </div>
          <div class="sure-message">
            <Col span="15">
            <p style="margin-bottom: 10px;" v-if="isAlarmEnable">
              <i>警情处理</i>
              <Select v-model="alarmDealName" style="width:300px">
                <Option v-for="item in alarmDealSetList" :value="item.value" :key="item.value">{{ item.label }}</Option>
              </Select>
            </p>
            <p>
              <i>警情类型</i>
              <Select v-model="warnPlanSelect" style="width:300px">
                <Option @click.native="selectWarnPlan" v-for="item in warnPlanListOpt" :value="item.value" :key="item.value">{{ item.label }}</Option>
              </Select>
            </p>
            <p class="alarm-word">
              <i>警情信息</i>
              <Input v-model="warnAffirmInfo" type="textarea" :rows="5" />
            </p>
            <div class="message-btn">
              <p>
                <Checkbox v-model="isWarnAccept" @on-change="acceptProcess">接收报警消息</Checkbox>
                <Checkbox v-model="isWarnBatch" @on-change="batchProcess">批量处理</Checkbox>
              </p>
              <Button type="primary" v-if="$BShasPower('BS-ALARM-RECEIVE-WARNING')" @click="clearWarnOpen">清除报警</Button>
              <Button type="primary" v-if="$BShasPower('BS-ALARM-RECEIVE-WARNING')" @click="clickConfirmWarnMessages" :loading="modalloading">确认报警</Button>
              <div class="audioBox">
                <audio ref="audio" v-for="(mic,index) in this.warnMusicList" :key="index" :src="mic.url" :id="'player' + mic.level" controls></audio>
              </div>
              <div>
                <object id="pluginTTS" ref="pluginTTS" type="application/x-bsrvoicecastcontrol" WIDTH="0" HEIGHT="0"></object>
              </div>
            </div>
            </Col>
            <Col span="9">
            <p>报警主机操作</p>
            <div style="width:240px;height:70px;border:1px solid #5676a9;">
              <Button type="primary" @click="allMeth('protection')" :disabled="alarmHost">布防</Button>
              <Button type="primary" @click="allMeth('removal')" :disabled="alarmHost">撤防</Button>
              <Button type="primary" @click="allMeth('remove')" :disabled="alarmHost">清除</Button>
            </div>
            <div class="emergency">
              <Button type="primary" @click="emergencyBtn">应急预案</Button>
            </div>
            </Col>
          </div>
        </div>
      </div>
      </Col>
    </Row>
    <div v-if="warnModal" class="warn-modal-clear">
      <iframe v-if="warnModal"></iframe>
      <div class="modal-mask-alert" @click='warnModal = false'></div>
      <div class="list-box">
        <div>
          <div style="position:absolute;top:30px;left:20px">
            <i class="ivu-icon ivu-icon-help-circled" style="fontSize:36px;color:#ff9900;"></i>
          </div>
          <span style="margin:40px 15px 40px 65px;display:inline-block">提示：确认清除报警吗?</span>
        </div>
        <div class="warn-modal-footer">
          <Button @click="clearWarnOk" type="primary" style="float: right;marginRight:40px">确认</Button>
          <Button @click="warnModal = false" type="ghost" style="float: right;marginRight:20px">取消</Button>
        </div>
      </div>
    </div>
    <div v-if="ttsModal">
      <iframe v-if="ttsModal"></iframe>
      <Modal v-model="ttsModal" :mask-closable="false" width="430">
        <div>
          <div style="position:absolute;top:30px;left:20px">
            <i class="ivu-icon ivu-icon-help-circled" style="fontSize:36px;color:#ff9900;"></i>
          </div>
          <a href="/static/plugin/ClientVoiceBroadcastSetup.exe" download="ClientVoiceBroadcastSetup.exe" style="margin:30px 0px 35px 70px;display:inline-block;font-size:14px;">提示:未发现TTS报警语音软件，请点击下载！</a>
        </div>
        <div slot="footer">
          <Button type="ghost" @click="ttsModal = false">取消</Button>
        </div>
      </Modal>
    </div>
      <dragBoxs :modal="isShowDrog" @close="closeDragBox" title="应急预案" :isIframe="true" :index="101">
        <div slot="context" class="emHome">
          <div class="emEditLeft">
            <div class="emtop">
              <div class="rmtopImg">
                <div class="buildEditImg">
                  <span>选择预案</span>
                  <Select style="width:158px" v-model="formName" placeholder="请选择" @on-change="changeTask">
                    <Option v-for="(item, index) in formDataList" :value="item.value" :key="index">{{item.lable}}</Option>
                  </Select>
                  <div class="buildImg">
                    <img v-if="emergencyData.planPhoto" @onerror="errorUrl" :src="emergencyData.planPhoto">
                  </div>
                </div>
              </div>
            </div>
            <div class="emtBottom">
              <div class="emtBottomText">
                <Input readonly v-model="emergencyData.remark" type="textarea" :rows="3" :autosize="{minRows: 3, maxRows: 5}" placeholder="请输入文本信息。。。" />
              </div>
            </div>
          </div>
          <div class="emEditRight">
            <span>管理人员</span>
            <Table height="600" width="450" size="small" :columns="emColumns" :data="emergencyData.group"></Table>
            <Button type="primary"  @click="onEmergencyBtn">确认</Button>
          </div>
        </div>
      </dragBoxs>
  </div>
</template>
<script>
import TableTab from '../settings/equipment/tableTab'
import AlarmVideo from './AlarmVideo'
import layerConfig from '../../assets/map/MapConfig'
import AlarmMapWarning from './AlarmMapWarning'
import { mapActions, mapGetters, mapState, mapMutations } from 'vuex'
import './style/warning.css'
import warningJs from './mixinsJs/warning.js'
import BSMap3D from '../../components/map3DBase/mapAlarmProcessing'
import confirmAlarmFun from '../map3D/alarmFun/confirmAlarmFun'
import dragBoxs from '../../components/DragBoxs'
export default {
  components: {
    TableTab,
    AlarmVideo,
    BSMap3D,
    dragBoxs
  },
  mixins: [AlarmMapWarning, warningJs, confirmAlarmFun],
  data() {
    return {
      isShowDrog: false,
      emergencyData: {
        planPhoto: '',
        remark: '',
        orgid: '',
        group: [],
        plan: '',
        planId: null
      },
      // 表单数据
      emColumns: [
        {
          title: '序号',
          key: 'name',
          minWidth: 20,
          align: 'center',
          ellipsis: true,
          type: 'index'
        },
        {
          title: '姓名',
          key: 'name',
          minWidth: 60,
          align: 'center',
          ellipsis: true,
          render: (h, params) => {
            return h('div', [h('strong', params.row.name)])
          }
        },
        {
          title: '职务',
          key: 'name',
          align: 'center',
          minWidth: 60,
          ellipsis: true,
          render: (h, params) => {
            return h('div', [h('strong', params.row.position)])
          }
        },
        {
          title: '电话',
          key: 'name',
          minWidth: 60,
          align: 'center',
          ellipsis: true,
          render: (h, params) => {
            return h('div', [h('strong', params.row.phone)])
          }
        }
      ],
      tableId: '',
      formName: '',
      formData: [],
      formDataList: [],
      isEmergencyModal: false, // 应急预案模态框
      alarmLayer: layerConfig.layers.alarmIpc,
      imensional: '',
      alarmDealName: '',
      alarmDealSetList: [],
      isAlarmEnable: false
    }
  },
  computed: {
    ...mapGetters(['enabledSort', 'isGetSortData']),
    ...mapState({
      receiveWarnList: ({ warningDispose }) => warningDispose.receiveWarnList,
      videoWarnList: ({ warningDispose }) => warningDispose.videoWarnList,
      activeWarnInfo: ({ warningDispose }) => warningDispose.activeWarnInfo,
      activeWarnTab: ({ warningDispose }) => warningDispose.activeWarnTab,
      textWarnData: ({ warningDispose }) => warningDispose.textWarnData,
      warnCounts: ({ warningDispose }) => warningDispose.warnCounts,
      warnNewData: ({ warningDispose }) => warningDispose.warnNewData,
      couldPlay: ({ warningDispose }) => warningDispose.couldPlay,
      confirmedData: ({ warningDispose }) => warningDispose.confirmedData,
      alarmHelpsSocketValue: ({ warningDispose }) => warningDispose.alarmHelpsSocketValue,
      alarmDealStatus: ({ paramsSetting }) => paramsSetting.alarmDealStatus
    })
  },
  watch: {
    isGetSortData: {
      handler(newval) {
        if (newval) {
          if (this.enabledSort.length === 0) {
            this.$Notice.error({
              title: '提示',
              desc: '暂未获取到已开启的报警类型，无法获取报警数据',
              duration: 1,
              top: 200
            })
            this.clearVideoWarnList([])
            return
          }
          // 2. 调用设置接收报警标签
          this.setWarningTabs(this.enabledSort)
          // 3.获取报警参数及音乐列表
          this.getAlarmLevel()
            .then(suc => {
              this.warnParametersList = JSON.parse(JSON.stringify(suc.data))
              // 4.获取并设置音频文件
              this.getPoliceFile({ page: 1, limit: 100 })
                .then(suc => {
                  let arr = suc.data.results
                  // 5-1 创建音乐播放器列表
                  for (let i = 0; i < this.warnParametersList.length; i++) {
                    if (this.warnParametersList[i].policeWhistleNameID) {
                      for (let r = 0; r < arr.length; r++) {
                        if (this.warnParametersList[i].policeWhistleNameID === arr[r]._id) {
                          this.warnMusicList.push({
                            status: this.warnParametersList[i].msgVoice,
                            url: '/api/upload?type=sys&id=' + arr[r].audioId,
                            time: this.warnParametersList[i].playTime,
                            level: this.warnParametersList[i].level
                          })
                        }
                      }
                    } else {
                      this.warnMusicList.push({
                        status: this.warnParametersList[i].msgVoice,
                        url: '',
                        time: this.warnParametersList[i].playTime,
                        level: this.warnParametersList[i].level
                      })
                    }
                  }
                  // 5-2 调用创建接收报警列表
                  this.creatReceiveWarnList(this.enabledSort).then(() => {
                    this.getReceiveWarnData()
                  })
                })
                .catch(err => {
                  console.log('getPoliceFile error: ' + err)
                })
            })
            .catch(err => {
              console.log('getAlarmLevel error: ' + err)
            })
            .catch(err => {
              console.log('getSortData error: ' + err)
            })
          // 预先获取预案列表
          this.getPrearranged({ page: 1, limit: 100 })
            .then(suc => {
              this.warnPlanList = JSON.parse(JSON.stringify(suc.data))
              this.warnPlanListOpt = []
              for (let i = 0; i < this.warnPlanList.length; i++) {
                this.warnPlanListOpt.push({
                  value: this.warnPlanList[i].name,
                  label: this.warnPlanList[i].name
                })
              }
              this.warnPlanSelect = this.warnPlanListOpt[0].value
              this.warnAffirmInfo = this.warnPlanList[0].content
            })
            .catch(err => {
              console.log('getPrearranged error: ' + err)
            })
        }
      },
      immediate: true
    }
  },
  created() {
    this.getTwoImensionalInfo()
      .then(suc => {
        if (suc.mapType) {
          this.imensional = '2D'
        } else {
          this.imensional = '3D'
        }
      })
      .catch(err => {
        console.log(err)
      })
  },
  methods: {
    ...mapActions([
      'getTwoImensionalInfo',
      'receiveWarnning',
      'getSortData',
      'confirmWarnMessages',
      'creatReceiveWarnList',
      'setActiveWarnInfo',
      'setActiveWarnTab',
      'getPrearranged',
      'getAlarmLevel',
      'getVoiceData',
      'getPoliceFile',
      'spliceReceiveWarnList',
      'protectionAction',
      'removalAction',
      'removeAction',
      'clearVideoWarnList',
      'emergencyAction',
      'clearNavWarningData'
    ]),
    ...mapMutations([
      'CLOSE_VIDEO_WARNLIAT',
      'SET_APPALARMING_LIST',
      'SET_APPALARM_LIST',
      'SET_APPCURRENTALARMING_LIST',
      'SET_APPFLOORALARMING_LIST',
      'CLEAR_ALARMHELP_DATA',
      'CLEAR_RECEIVE_WARN_LIST'
    ]),
    /**
     * 模态框是否显示
     * @method closeDragBox
     */
    closeDragBox() {
      this.isShowDrog = false
    },
    /**
     * 下拉框切换数据赋值
     * @method changeTabs
     * @param {String} val 预案ID
     */
    changeTask(val) {
      for (let i = 0; i < this.formData.length; i++) {
        if (this.formData[i]._id === val) {
          this.emergencyData.planPhoto = this.formData[i].planPhoto
          this.emergencyData.remark = this.formData[i].remark
          this.emergencyData.group = this.formData[i].group
          this.emergencyData.plan = this.formData[i].plan
        }
      }
    },
    errorUrl(event) {
      let img = event.srcElement
      img.src = '/api/upload?id=' + this.formData.planPhoto
      img.onerror = null
    },
    /**
     * 应急预案模态框判断 显示
     * @method emergencyBtn
     */
    emergencyBtn() {
      this.formDataList = []
      this.formData = []
      const status = this.tableId === 3 ? 3 : 1
      this.emergencyAction({planId: status}).then(res => {
        this.formData = JSON.parse(JSON.stringify(res))
        if (this.formData.length === 0) {
          this.errorMsg('请配置预案内容')
          return
        }
        res.forEach((item, index) => {
          this.formDataList.push({lable: item.name, value: item._id})
        })
        this.formName = this.formDataList[0].value
        this.emergencyData.planPhoto = this.formData[0].planPhoto
        this.emergencyData.remark = this.formData[0].remark
        this.emergencyData.group = this.formData[0].group
        this.emergencyData.plan = this.formData[0].plan
        this.isShowDrog = true
      })
    },
    /**
     * 应急预案模态框判断 关闭
     * @method onEmergencyBtn
     */
    onEmergencyBtn() {
      this.isShowDrog = false
    },
    // 关闭页面 调用所有清空操作
    closeAllMethods() {
      this.SET_APPALARMING_LIST([])
      this.SET_APPALARM_LIST([])
      this.SET_APPCURRENTALARMING_LIST([])
      this.SET_APPFLOORALARMING_LIST([])
      // warnPlayerStop方法里做了关于页面全局变量、监听、定时器等清除操作
      this.warnPlayerStop()
      this.receiveWarnListView = {
        test: [{}]
      }
      this.CLEAR_ALARMHELP_DATA([])
      this.setActiveWarnInfo({})
      this.CLOSE_VIDEO_WARNLIAT([])
      this.CLEAR_RECEIVE_WARN_LIST()
      this.setIsAcceptWarn(true)
      this.clearVideoWarnList([])
      if (this.warnNewData.eventType !== 'fireAlarm' && this.warnNewData.eventType !== 'fireFailure') {
        this.clearNavWarningData({})
      }
    }
  },
  beforeDestroy() {
    this.$refs['warningTab'].$off('on-tab-click')
    this.closeAllMethods()
  }
}
</script>
<style scoped>
.alarm {
  padding: 16px 0;
  font-size: 14px;
  width: 100%;
  height: 100%;
}

.alarm-left {
  width: 100%;
  height: calc(100% - 60px);
  background: #171717;
}

.alarm-right {
  display: flex;
  flex-direction: column;
}

h3 {
  font-size: 14px;
  height: 40px;
  line-height: 40px;
  background: #434343;
  padding-left: 10px;
  font-weight: normal;
  margin-bottom: 5px;
}

.alarm-message {
  float: left;
  width: 100%;
  background: #1c3054;
}

.alarm-location-left {
  float: left;
  width: 100%;
  height: 300px;
  padding: 5px;
  /*border: 1px solid #ddddde;*/
}

.alarm-location-right {
  height: 300px;
  margin-left: 10px;
}

.alarm-location-right ul {
  padding-left: 10px;
}

.ivu-tabs {
  height: 300px;
}

.alarm-location-right li {
  display: block;
  overflow: hidden;
  padding-bottom: 10px;
}

.alarm-location-right i {
  font-style: normal;
  display: inline-block;
  width: 80px;
  vertical-align: top;
}

.alarm-location-right li p {
  display: inline-block;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: calc(100% - 85px);
  overflow: hidden;
  vertical-align: top;
}

.alarm-location-right li button {
  height: 30px;
  margin-left: 20px;
}

.alarm-sort {
  margin-top: 10px;
  min-width: 528px;
  flex: 1;
  background: #1c3054;
  overflow: auto;
}

.alarm-table {
  margin-top: 0;
}

.sure-message {
  margin-top: 10px;
  padding: 10px;
  float: left;
  width: 100%;
  background: #1c3054;
  border-top: 10px solid #0c1b32;
  /* padding-bottom: 20px; */
}
.emergency {
  margin-top: 35px;
}

.sure-message p {
  display: block;
}

.sure-message label {
  width: 90px;
  margin-bottom: 10px;
  margin-right: 10px;
  float: left;
}

.sure-message li button {
  width: 90px;
  margin: 0 10px 10px 0;
}

.sure-message p i {
  float: left;
  line-height: 32px;
  font-style: normal;
  margin-right: 10px;
}

.alarm-word {
  margin: 10px 0;
}

textarea.ivu-input {
  height: 115px;
}

.sure-btn button {
  margin-left: 65px;
  margin-top: 25px;
}

.ivu-input {
  height: 200px;
}

.message-btn {
  overflow: hidden;
  padding: 10px 0 0 70px;
}

.message-btn p {
  overflow: hidden;
}

#warnPlayer {
  opacity: 0;
}

.warn-modal-clear {
  width: 400px;
  height: 170px;
  position: absolute;
  z-index: 999999;
  position: absolute;
  left: calc(50% - 165px);
  top: 160px;
}

.warn-modal-clear iframe,
.warn-modal-clear .list-box {
  border-radius: 5px;
  background-color: #171717;
  position: absolute;
  z-index: 3;
  font-size: 14px;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  border: 1px solid #373737;
}

.modal-mask {
  position: fixed;
  min-width: 1200px;
  z-index: 1;
  top: 70px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: transparent;
}

.modal-mask-alert {
  position: fixed;
  min-width: 1200px;
  z-index: 1;
  top: 0px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #171717;
  filter: alpha(Opacity=60);
  -moz-opacity: 0.6;
  opacity: 0.6;
}

.audioBox {
  position: fixed;
  top: 2000px;
  left: 1000px;
}
.emHome {
  display: -ms-flexbox;
  display: flex;
  overflow: auto;
  -ms-flex: 1;
  flex: 1;
  font-size: 14px;
  background: #1c3053;
  height: 770px;
  width: 900px;
  padding: 24px 22px;
}
.emHome .emEditLeft {
  display: flex;
  background: #1c3053;
  margin-right: 15px;
  flex-direction: column;
  justify-content: space-between;
  width: 50%;
  max-width: 800px;
}
.emHome .emEditLeft .emtop {
  display: flex;
  flex-direction: column;
}
.emHome .emEditLeft .emtop .rmtopImg {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.emHome .emEditLeft .emtop .rmtopImg .buildEditImg {
  flex: 1;
}
.emHome .emEditLeft .emtop .rmtopImg .buildEditImg .buildImg {
  width: 100%;
  max-width: 800px;
  max-height: 580px;
  border: 1px solid #5676a9;
  border-radius: 5px;
  min-height: 600px;
  margin-top: 5px;
}
.buildImg img {
  width: 100%;
  height: 580px;
  border-radius: 5px;
}
.emHome .emEditRight {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1c3053;
  margin-right: 15px;
  width: 100%;
}
.emEditRight button {
  width: 55px;
  margin-top: 50px;
  margin-left: 320px;
}
.emEditRight > span {
  text-align: center;
  margin-bottom: 16px;
}
.emHome .emEditLeft .emtBottom {
  width: 100%;
}
.emtBottomText {
  flex: 1;
  color: #000;
  padding: 3px;
}
</style>
