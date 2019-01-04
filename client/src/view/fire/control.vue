<template>
  <div class="control">
    <!--左侧树-->
    <div class="con-left">
      <div class="sidebar">
        <ul class="fire-tab">
          <li style="list-style:none;" @click="clickMapTab" :class="{'active':menuTag==='map','noActive':menuTag!=='map'}">地图结构</li>
          <li style="list-style:none;" @click="clickEquipTab" :class="{'active':menuTag==='equip','noActive':menuTag!=='equip'}">设备结构</li>
        </ul>
        <div class="input" style="width:100%;padding:10px;">
          <Input v-model="searchVal" icon="ios-search-strong" placeholder="请输入..." />
        </div>
        <bs-scroll ref="bsScrollOrg" class="tree-org" style=" width: 100%;height: 100%;overflow: auto;">
          <v-tree @on-expand="expand" :searchVal="searchVal" v-if="this.menuTag==='map'" ref='tree' :treeData="mapTreeData" :options="options" @node-click="handleMapNode" :isSaveState="false" />
          <v-tree @on-expand="expand" :searchVal="searchVal" v-if="this.menuTag==='equip'" ref='tree' :treeData="fireOrgTreeData" :options="orgoptions" :activeId="activeId" :alarmIds="alarmIds" @node-click='orgHandleNode' :isSaveState="false" />
        </bs-scroll>
      </div>
    </div>
    <!--中间显示及列表-->
    <div class="con-main">
      <div class="mian-top">
      </div>
      <div class="main-botom">
        <div style="height: 32px;line-height: 32px;margin-left: 10px;font-size: 14px;">报警列表</div>
        <bs-scroll>
          <Table size="small" width="100%" height="calc(100% - 32px)" highlight-row :columns="alarmTitle" :data="alarmData" @on-row-click="clickRow"></Table>
        </bs-scroll>
      </div>
    </div>
    <!--右侧-->
    <div class="con-right">
      <div class="right-top">
        <div class="vidoOrMap">
        </div>
        <Button type="primary" size="small" icon="arrow-swap" @click="exchange"></Button>
      </div>
      <div class="right-main">
        <p style="height: 16px;line-height: 16px;padding-left: 10px;font-size:14px;">报警源信息</p>
        <div class="massage">时间：{{ massage.time === undefined ? '': $moment(parseInt(massage.time) * 1000).format('YYYY-MM-DD HH:mm:ss')}}</div>
        <div class="massage">位置：{{massage.organization}}</div>
        <div class="massage">名称：{{massage.name}}</div>
        <div class="massage">级别：{{massage.level}}</div>
        <div class="massage">处理情况：{{massage.status === undefined ? '' :(massage.status === true ? '已处理' : '未处理')}}</div>
      </div>
      <div class="right-bottom">
        <div class="bottom-alarm">
          <Form :model="planData" label-position="left" :label-width="100" style="padding:0 10px;font-size:12px !import;">
            <Form-item label="警情处理" v-if="isDisplay" style="margin-bottom: 14px;">
              <Select v-model="alarmDealName">
                <Option v-for="item in alarmDealSetList" :value="item.value" :key="item.value">{{ item.label }}</Option>
              </Select>
            </Form-item>
            <Form-item label="警情类型" style="margin-bottom: 14px;">
              <Select v-model="planData.plan">
                <Option @click.native="selectWarnPlan" v-for="item in this.planListOpt" :value="item.value" :key="item.value">{{ item.label }}</Option>
              </Select>
            </Form-item>
            <Form-item label="警情信息" style="margin-bottom: 14px;">
              <Input type="textarea" v-model="planData.content" :autosize="{minRows: 2,maxRows: 5}" />
            </Form-item>
          </Form>
          <div slot="footer" class="planButton">
            <Button type="primary" v-if="$BShasPower('BS-FIREALARM-SUREORDEL')" :disabled="showAlarmBtn" :loading="buttonloading" @click="sureAlarm">确认报警</Button>
            <Button type="primary" v-if="$BShasPower('BS-FIREALARM-SUREORDEL')" @click="delAlarm">清除报警</Button>
          </div>
        </div>
        <div class="bottom-right">
          <Button type="primary" @click="emergencyBtn">应急预案</Button>
        </div>
      </div>
    </div>
    <!-- 视频or地图 -->
    <div class="map" style="position: absolute;top:16px;" :style="isExchange?mainStyle:subStyle">
      <fireBSMap ref="frieBSMap" :modeType="'fireAlarm'" v-if="this.imensional === '3D'"></fireBSMap>
      <BSMap v-if="this.imensional === '2D'" ref="fireMapContainer" @postcompose="alarmTwinkEvt" @click="selectFeatureEvt" @initMap="initMapSource">
        <!-- 报警点位 -->
        <bs-layer :id="alarmLayer.id" :name="alarmLayer.name" :features="alarmAppFeatures" :zIndex="6"></bs-layer>
      </BSMap>
    </div>
    <div class="video" style="position: absolute;top:16px;" :style="!isExchange?mainStyle:subStyle">
      <VideoFrames ref="frameMain" :isMain="!isExchange" :palyArr="videoList" style="wigth:100%,height: 100%"></VideoFrames>
    </div>

    <!-- 使用以下弹框避免视频插件遮挡弹框 -->
    <bs-modal v-model="delFireAlarm" title="提示" :width="416" :mask-closable="false" @on-ok="sureDelAlarm" @on-cancel="cancelDelAlarm">
      <div>
        <i class="ivu-icon ivu-icon-help-circled bs-modal-sty"></i>
        <span>确定清除报警？</span>
      </div>
    </bs-modal>
      <dragBoxs :modal="isShowDrog" @close="closeDragBox" title="应急预案" :isIframe="true">
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
import { mapState, mapActions, mapMutations, mapGetters } from 'vuex'
import BSMap from '../../components/common/BSMap'
import layerConfig from '../../assets/map/MapConfig'
import VideoFrames from 'components/video/VideoFrames'
import fireMapAlarm from './fireMapAlarm'
import fireBSMap from '../../components/map3DBase/mapAlarmProcessing'
import confirmAlarmFun from '../map3D/alarmFun/confirmAlarmFun'
import './fire.css'
import dragBoxs from '../../components/DragBoxs'
export default {
  name: 'control',
  components: { BSMap, VideoFrames, fireBSMap, dragBoxs },
  mixins: [fireMapAlarm, confirmAlarmFun],
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
      delFireAlarm: false,
      imensional: '',
      alarmLayer: layerConfig.layers.alarmIpc,
      alarmAppFeatures: [], // 报警区域列表
      menuTag: 'map',
      gridLayer: layerConfig.layers.grid,
      gridAppFeatures: [],
      searchVal: '',
      buttonloading: false,
      options: {
        showInput: false
      },
      orgoptions: {
        showInput: false,
        search: { onlyLeaf: true },
        showSearch: false
      },
      isExchange: true,
      videoList: [],
      activeId: '11111111111111',
      alarmIds: [],
      alarmTitle: [
        {
          title: '序号',
          width: 120,
          type: 'index'
        },
        {
          title: '时间',
          key: 'time',
          render: (h, params) => {
            let time = ''
            time = this.$moment(parseInt(params.row.time) * 1000).format('YYYY-MM-DD HH:mm:ss')
            return h('div', time)
          }
        },
        {
          title: '位置',
          key: 'organization',
          render: (h, params) => {
            return h(
              'span',
              {
                style: {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                },
                domProps: {
                  title: params.row.organization
                }
              },
              params.row.organization
            )
          }
        },
        {
          title: '名称',
          key: 'name',
          render: (h, params) => {
            return h(
              'span',
              {
                style: {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                },
                domProps: {
                  title: params.row.name
                }
              },
              params.row.name
            )
          }
        },
        {
          title: '级别',
          key: 'level',
          width: 120
        }
      ],
      alarmData: [],
      Inselect: [],
      massage: {},
      planData: {
        plan: '',
        content: ''
      },
      planListOpt: [],
      showAlarmBtn: false,
      mapTreeData: [],
      mainStyle: {
        left: '288px',
        width: 'calc(100% - 272px - 600px - 32px)',
        height: '67%'
      },
      subStyle: {
        right: '0px',
        width: '600px',
        height: '44%',
        border: '1px solid #fff'
      },
      alarmDealName: '', // 警情处理
      alarmDealSetList: [],
      isDisplay: false
    }
  },
  computed: {
    ...mapGetters([]),
    ...mapState({
      fireOrgTreeData: ({ firecontrol }) => firecontrol.fireOrgTreeData,
      mapOrgTree: ({ mapGisData }) => mapGisData.mapOrgTree,
      fireConfData: ({ manageConfig }) => manageConfig.fireConfData, // 主显示初始值
      firePlanData: ({ manageConfig }) => manageConfig.firePlanData, // 预案
      receiveData: ({ firecontrol }) => firecontrol.receiveData, // 获取报警信息
      alarmIdsStore: ({ firecontrol }) => firecontrol.alarmIdsStore,
      confirmedFireData: ({ firecontrol }) => firecontrol.confirmedFireData,
      appAlarmingList: ({ mapAlarmData }) => mapAlarmData.appAlarmingList,
      warnNewData: ({ warningDispose }) => warningDispose.warnNewData,
      fireAlarmList: ({ mapAlarmData }) => mapAlarmData.fireAlarmList // 报警消息列表列表
    })
  },
  watch: {
    receiveData(newVal) {
      this.alarmData = JSON.parse(JSON.stringify(newVal))
      if (this.alarmData.length !== 0 && this.videoList.length === 0) {
        this.clickRow(this.alarmData[0])
      }
    },
    alarmIdsStore(newVal) {
      this.alarmIds = JSON.parse(JSON.stringify(newVal))
    },
    confirmedFireData(newval) {
      if (newval.length === 0) { return }
      // 获取到已确认的报警消息，在页面清除该报警
      this.alarmData.forEach((item, index) => {
        if (newval[0].groupId === item.groupId) {
          newval[0].point3D = item.point3D || {}
          this.alarmData.splice(index, 1)
          this.spliceFireAlarm(index)
        }
      })
      this.alarmIds.forEach((Item, idIndex) => {
        if (newval[0].alarmId === Item) {
          this.alarmIds.splice(idIndex, 1)
        }
      })
      if (this.imensional === '2D') {
        let alarming = JSON.parse(JSON.stringify(this.appAlarmingList))
        let alarmingPoint = []
        // alarming.forEach()
        newval.forEach(item => {
          for (const key in alarming) {
            const element = alarming[key]
            if (item.channelId === element.attributes.param.channelId) {
              alarmingPoint.push(element.attributes.param)
              continue
            }
          }
        })
        this.processFireAlarmingInfo(alarmingPoint)
        this.setAppAlarmingList(alarming)
      } else {
        if (newval[0].point3D && newval[0].point3D.building3ds) {
          let obj = {
            pointIsouter: newval[0].point3D.isouter,
            id: newval[0].channelId,
            bcode: newval[0].point3D.building3ds.code,
            type: 'fireAlarm'
          }
          try {
            this.confirmAlarmData(obj)
          } catch (err) {
            console.log('地图清楚点位方法错误')
          }
        }
      }
      // 获取到的已确认的报警信息刚好是当前查看的报警信息，清除当前报警源信息显示
      if (newval[0].groupId === this.massage.groupId) {
        this.massage = {}
      }
      // 关闭视频
      this.videoList.length = 0
      this.$refs['frameMain'].stopAlls()
    },
    mapOrgTree(newVal) {
      if (this.imensional === '2D') {
        this.mapTreeData = newVal
      }
    }
  },
  methods: {
    expand() {
      this.$refs.bsScrollOrg.update()
    },
    ...mapMutations(['deleteAlarm']),
    ...mapActions([
      'getTwoImensionalInfo',
      'CloseFireWebscoket',
      'getOneMapArarlList',
      'getUseType',
      'getFirePlan',
      'getfireAlarmOrgTree',
      'getOneMapGrid',
      // 'receiveWarnning',
      'confirmFireWarnMessages',
      'getfireStreamData',
      'getAppMapOrgTree',
      'recordLog',
      'setAppAlarmingList',
      'spliceFireAlarm',
      'clearNavWarningData',
      'clearFireAlarm',
      'setAppCurrentAlarmingList',
      'setAppAlarmList',
      'getFireAlarmDealList',
      'getFireDealStatus',
      'emergencyAction',
      'clearNavWarningData'
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
      this.emergencyData = []
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
     * 应急预案模态框判断 关闭
     * @method onEmergencyBtn
     */
    onEmergencyBtn() {
      this.isShowDrog = false
    },
    /**
     * 应急预案模态框判断 显示
     * @method emergencyBtn
     */
    emergencyBtn() {
      this.formDataList = []
      this.formData = []
      this.emergencyAction({planId: 2}).then(res => {
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
    // 获取设备结构树
    mapOrgTreeData() {
      this.getfireAlarmOrgTree()
        .then(() => {
          this.activeId = this.fireOrgTreeData[0]._id
        })
        .catch(err => {
          console.log('getfireAlarmOrgTree error:' + err)
          this.errorMsg('设备机构树获取失败！')
        })
    },
    exchange() {
      if (!this.isExchange) {
        this.clickMapTab()
      } else {
        this.clickEquipTab()
      }
    },
    clickMapTab() {
      this.menuTag = 'map'
      this.isExchange = true
      this.searchVal = ''
      this.$refs.frameMain.pageSetting(this.videoList, false)
    },
    clickEquipTab() {
      this.menuTag = 'equip'
      this.isExchange = false
      this.searchVal = ''
      this.$refs.frameMain.pageSetting(this.videoList, true)
    },
    orgHandleNode(node) {
      // 点击防区设备节点 主显示区显示该输入防区联动的摄像机的实时视频。
      this.isExchange = false
      this.activeId = node._id
      // 视频 更新
      if (!node.isOrg && node.eid) {
        this.getfireStreamData(node._id)
          .then(suc => {
            let middData = JSON.parse(JSON.stringify(suc))
            if (middData.actionVideo && middData.actionVideo.length !== 0) {
              this.videoList = []
              middData.actionVideo.map(item => {
                let data = {
                  id: item.resource.eid._id,
                  type: 'video',
                  streamType: item.resource.stream,
                  ip: item.resource.eid.ip,
                  port: item.resource.eid.cport,
                  channel: item.resource.chan,
                  vendor: item.resource.eid.manufacturer
                }
                this.videoList.push(data)
              })
              this.$refs.frameMain.againPlay(this.videoList)
            } else {
              this.warningMsg('此资源未配置联动视频，无法播放')
            }
          })
          .catch(() => {
            this.errorMsg('获取联动视频数据失败')
          })
      }
    },
    // 地图报警点闪烁 点击开启视频
    selectFeatureEvt(data) {
      this.isExchange = true
      if (!data.attributes) { return }
      this.videoList.length = 0
      // 报警点位闪烁时点击
      if (data.attributes.param && data.attributes.param.actionList && data.attributes.param.actionList.length !== 0) {
        data.attributes.param.actionList.map(item => {
          let data = {
            id: item.devId,
            type: 'video',
            streamType: item.streamType,
            ip: item.devIp,
            port: item.devPort,
            channel: item.channel,
            vendor: item.manufacturer
          }
          this.videoList.push(data)
        })
        this.$refs.frameMain.againPlay(this.videoList)
      } else if (data.attributes.param && data.attributes.param.actionList && data.attributes.param.actionList.length === 0) {
        this.warningMsg('此资源未配置联动视频，无法播放')
      } else if (!data.attributes.param && data.attributes._id) {
        // 点击未闪烁的报警点位时
        this.getfireStreamData(data.attributes._id).then(suc => {
          let middData = JSON.parse(JSON.stringify(suc))
          if (middData.actionVideo && middData.actionVideo.length !== 0) {
            middData.actionVideo.map(item => {
              let data = {
                id: item.resource.eid._id,
                type: 'video',
                streamType: item.resource.stream,
                ip: item.resource.eid.ip,
                port: item.resource.eid.cport,
                channel: item.resource.chan,
                vendor: item.resource.eid.manufacturer
              }
              this.videoList.push(data)
            })
            this.$refs.frameMain.againPlay(this.videoList)
          } else {
            this.warningMsg('此资源未配置联动视频，无法播放')
          }
        }).catch(() => {
          this.errorMsg('获取联动视频数据失败')
        })
      }
    },
    clickRow(rowData) {
      this.Inselect = []
      // 点击表格行信息，主显示区显示发生该报警所在的地图，次显示区显示相关联的视频，显示源信息
      this.Inselect.push(rowData)
      // 源信息 更新
      this.massage = JSON.parse(JSON.stringify(rowData))
      // 视频 更新
      this.videoList.length = 0
      if (rowData.actionList && rowData.actionList.length !== 0) {
        rowData.actionList.map(item => {
          let data = {
            id: item.devId,
            type: 'video',
            streamType: item.streamType,
            ip: item.devIp,
            port: item.devPort,
            channel: item.channel,
            vendor: item.manufacturer
          }
          this.videoList.push(data)
        })
        this.$refs.frameMain.againPlay(this.videoList)
      } else {
        this.warningMsg('此资源未配置联动视频，无法播放')
      }
    },
    // 切换预案，获取相应content内容
    selectWarnPlan() {
      let selectIndex
      this.$nextTick(() => {
        this.warnPlanList.forEach((item, index) => {
          if (item.name === this.planData.plan) {
            selectIndex = index
          }
        })
        this.planData.content = this.firePlanData[selectIndex].content
      })
    },
    // 确认报警
    sureAlarm() {
      if (this.Inselect.length === 0) {
        this.warningMsg('请选择需要确认的报警信息')
      } else if (this.planData.content === '') {
        this.warningMsg('警情信息不能为空')
      } else {
        if (!this.Inselect[0].alarmPower.alarmConfirm) {
          this.warningMsg('该报警资源无报警确认权限')
          return
        }
        this.buttonloading = true
        const fireAlarmSureInfo = {
          alarmDeal: this.alarmDealName,
          situationType: this.planData.plan,
          alarmContent: this.planData.content
        }
        this.confirmFireWarnMessages({
          list: this.Inselect,
          ackContent: JSON.stringify(fireAlarmSureInfo)
        })
          .then(() => {
            const param = {
              logType: '操作日志',
              module: '消防报警',
              operateName: '报警确认',
              operateContent: '报警确认',
              target: this.Inselect[0].name,
              deviceIp: this.Inselect[0].devIp
            }
            this.recordLog(param)
            this.buttonloading = false
            this.alarmData.forEach((item, index) => {
              if (this.Inselect[0].alarmId === item.alarmId) {
                this.alarmData.splice(index, 1)
                this.spliceFireAlarm(index)
              }
            })
            this.alarmIds.forEach((Item, idIndex) => {
              if (this.Inselect[0].alarmId === Item) {
                this.alarmIds.splice(idIndex, 1)
              }
            })
            if (this.Inselect[0].point3D && this.Inselect[0].point3D.building3ds) {
              let obj = {
                pointIsouter: this.Inselect[0].point3D.isouter,
                id: this.Inselect[0].channelId,
                bcode: this.Inselect[0].point3D.building3ds.code,
                type: 'fireAlarm'
              }
              try {
                this.confirmAlarmData(obj)
              } catch (err) {
                console.log('地图清楚点位方法错误')
              }
            }
            this.processFireAlarmingInfo(this.Inselect)
            this.Inselect = []
            // 关闭视频
            this.videoList.length = 0
            this.$refs['frameMain'].stopAlls()
            this.massage = {}
          })
          .catch(err => {
            this.buttonloading = false
            console.log(err, 'err')
            this.errorMsg('确认报警失败')
          })
        this.buttonloading = false
      }
    },
    // 清除报警
    delAlarm() {
      if (this.Inselect.length === 0) {
        this.warningMsg('请选择需要清除的报警信息')
      } else {
        if (!this.Inselect[0].alarmPower.alarmClean) {
          this.warningMsg('该报警资源无报警清除权限')
          return
        }
        this.delFireAlarm = true
      }
    },
    cancelDelAlarm() {
      this.delFireAlarm = false
    },
    sureDelAlarm() {
      const param = {
        logType: '操作日志',
        module: '消防报警',
        operateName: '报警清除',
        operateContent: '报警清除',
        target: this.Inselect[0].name,
        deviceIp: this.Inselect[0].devIp
      }
      this.recordLog(param)
      this.alarmData.forEach((item, index) => {
        if (this.Inselect[0].alarmId === item.alarmId) {
          this.alarmData.splice(index, 1)
          this.spliceFireAlarm(index)
        }
      })
      this.alarmIds.forEach((Item, idIndex) => {
        if (this.Inselect[0].alarmId === Item) {
          this.alarmIds.splice(idIndex, 1)
        }
      })
      if (this.Inselect[0].point3D && this.Inselect[0].point3D.building3ds) {
        let obj = {
          pointIsouter: this.Inselect[0].point3D.isouter,
          id: this.Inselect[0].channelId,
          bcode: this.Inselect[0].point3D.building3ds.code,
          type: 'fireAlarm'
        }
        try {
          this.confirmAlarmData(obj)
        } catch (err) {
          console.log('地图清楚点位方法错误')
        }
      }
      this.processFireAlarmingInfo(this.Inselect)
      this.Inselect = []
      // 关闭视频
      this.videoList.length = 0
      this.$refs['frameMain'].stopAlls()
      this.massage = {}
      this.delFireAlarm = false
    }
  },
  created() {
    // 获取警情处理启用状态
    this.getFireDealStatus().then((res) => {
      console.log('获取警情处理启用状态', res.data)
      this.isDisplay = res.data.fireOpen
    }).catch(err => {
      console.log('getFireDealStatus error: ' + err)
      this.errorMsg('警情处理启用状态获取失败')
    })
    this.getTwoImensionalInfo()
      .then(suc => {
        if (suc.mapType) {
          this.imensional = '2D'
          this.mapTreeData = this.mapOrgTree
        } else {
          this.imensional = '3D'
          this.getAppMapOrgTree().then(res => {
            this.mapTreeData = [res]
          })
        }
      })
      .catch(err => {
        console.log(err)
      })
    this.alarmData = JSON.parse(JSON.stringify(this.receiveData))
    this.$nextTick(() => {
      if (this.alarmData.length !== 0 && this.videoList.length === 0) {
        this.clickRow(this.alarmData[0])
      }
    })
  },
  mounted() {
    // 获取地图视频主显示设置
    this.getUseType()
      .then(() => {
        if (this.fireConfData) {
          this.menuTag = 'map'
          this.isExchange = true
        } else {
          this.menuTag = 'equip'
          this.isExchange = false
        }
      })
      .catch(err => {
        console.log('getUseType error: ' + err)
        this.errorMsg('获取主显示参数失败')
      })
    this.mapOrgTreeData()
    // 预先获取预案列表(消防管理预案)
    this.getFirePlan({ page: 1, limit: 100, type: 2 }).then(() => {
      this.planListOpt = []
      for (let i = 0; i < this.firePlanData.length; i++) {
        this.planListOpt.push({
          value: this.firePlanData[i].name,
          label: this.firePlanData[i].name
        })
      }
      if (this.planListOpt[0] && this.firePlanData[0]) {
        this.planData.plan = this.planListOpt[0].value
        this.planData.content = this.firePlanData[0].content
      }
    }).catch(err => {
      console.log('getFirePlan error: ' + err)
      this.errorMsg('预先获取预案列表')
    })
    // 获取警情处理列表
    this.getFireAlarmDealList({ page: 1, limit: 100, type: 'fire' }).then((res) => {
      res.data.forEach(item => {
        this.alarmDealSetList.push({ label: item.name, value: item.name })
        this.alarmDealName = this.alarmDealSetList[0].value
      })
    }).catch(err => {
      console.log('getFireAlarmDealList error: ' + err)
      this.errorMsg('警情处理列表获取失败')
    })
  },
  beforeDestroy() {
    this.clearFireAlarm()
    this.CloseFireWebscoket()
    // 关闭视频
    this.videoList.length = 0
    this.$refs['frameMain'].stopAlls()
    this.setAppCurrentAlarmingList([])
    this.setAppAlarmList([])
    if (this.warnNewData.eventType === 'fireAlarm' || this.warnNewData.eventType === 'fireFailure') {
      this.clearNavWarningData()
    }
  }
}
</script>

<style scoped>
.control {
  overflow: hidden;
  display: flex;
  flex: 1;
  padding: 16px 0;
  font-size: 16px;
  position: relative;
}
.bs-modal-sty {
  color: #ff9900;
  font-size: 36px;
  vertical-align: middle;
  margin: 10px 20px 10px;
}
.fire-tab li:hover {
  color: #4699f9 !important;
}
.con-left {
  flex: 0 0 272px;
  min-height: 670px;
  background: #1c3053;
  margin-right: 16px;
  display: flex;
  flex-direction: row;
}

.con-right {
  flex: 0 0 600px;
  width: 600px;
  min-height: 670px;
  background: #1c3053;
}

.con-main {
  flex: 1;
  min-height: 670px;
  background: #1c3053;
  margin-right: 16px;
}

.con-left .sidebar {
  background: #1c3053;
  display: flex;
  flex-direction: column;
  width: 272px;
}

.sidebar > ul {
  width: 100%;
  height: 36px;
  display: block;
  line-height: 36px;
  font-size: 14px;
  text-align: center;
  background: #1b3153;
}

.sidebar > ul li {
  width: 50%;
  float: left;
  cursor: pointer;
  height: 36px;
  background: #0f2343;
  border-right: 1px solid rgb(16, 27, 49);
}

.sidebar > ul li.active {
  background: #1b3153;
  color: #fff;
}

.sidebar > ul li.noActive {
  background: #0f2343;
  color: #8597ad;
}

.mian-top {
  width: 100%;
  height: 70%;
}

.main-botom {
  width: 100%;
  height: 29%;
}

.right-top {
  width: 100%;
  height: 50%;
  padding: 0;
}

.vidoOrMap {
  width: 100%;
  height: 92%;
  /* border: 1px solid #fff; */
  /* margin-bottom: 0px; */
}

.right-main {
  width: 100%;
  height: 24%;
  border-top: 2px solid rgba(255, 255, 255, 0.4);
  border-bottom: 2px solid rgba(255, 255, 255, 0.4);
  padding-top: 6px;
}

.right-main .massage {
  width: 100%;
  height: 16px;
  margin: 9px 0;
  font-size: 12px;
  padding-left: 13px;
}

.right-bottom {
  width: 100%;
  height: 24%;
  padding-top: 10px;
  /* display: flex; */
  justify-content: space-around
}

.bottom-alarm {
  width: 60%;
  float: left;
  margin-left: 15px;
}

.bottom-alarm .planButton {
  margin-top: 15px;
}
.bottom-alarm .planButton > button {
  margin-left: 80px;
}

.mCustomScrollbar .vtree {
  width: 100% !important;
}
.planButton {
  margin-top: -10px;
}
.bottom-right {
  float: right;
  margin: 80px 50px 0 0;
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
