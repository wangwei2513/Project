<template>
  <div class="bs-content">
    <div class="bs-main flex-column">
      <div class="flex-1 flex">
        <div class="patrol-list flex-1 flex flex-column ">
          <div class="searchBar flex-around topBar">
            <div class="search-input">
              <Input placeholder="请输入用户名" v-model="searchKey" @on-change='searchChange'>
              <Button v-show="!isClose" @click="searchRuningTask" slot="append" icon="ios-search"></Button>
              <Button v-show="isClose" @click="clearSearch" slot="append" icon="close-round"></Button>
              </Input>
            </div>
          </div>
          <div class="user-list flex flex-1" style="minWidth:900px;minHeight:463px">
            <div v-if="!patrolUserList.length" class="nodata-tips">
              <span>暂无数据</span>
            </div>
            <div v-for="(item,index) in patrolUserList" :key="index" class="user-patrol ">
              <div  v-if="patrolUserList[index].isSingleAlarm" class="single-alarm" @click="showAlarmModal(item._id)">
                <Icon type="ios-bell" size="30"></Icon>
              </div>
              <div class="user-img" @click="showRecordDetail(item)">
                <img :src="item.photo?'/api/upload?id='+item.photo: soliderImg" alt="人员照片">
                <span>{{item.realname}}</span>
              </div>
              <div class="user-status ">
                <div class="user-status-top">
                  <div class="user-message" @click="showMessage(item._id)">
                   <Icon type="chatbubble-working" size="25"></Icon>
                  </div>
                  <div v-if="!patrolUserList[index].isSingleAlarm" class="user-video" @click="showAlarmModal(item._id)">
                    <Icon type="ios-videocam-outline" size="25"></Icon>
                  </div>
                </div>
                <div class="percentage">{{item.precentage!= ''? item.precentage+"%":'0'}}</div>
                <div style="height:20px; overflow:hidden;">当前点位: {{item.curPoint}}</div>
                <div style="height:20px; overflow:hidden;">下一点位: {{item.nextPoint}}</div>
                <div class="user-point">
                  <span>
                    <Icon type="android-notifications" color="#ff784e"></Icon>{{item.alarm}}
                  </span>
                  <span>
                    <Icon type="settings" color="#ff0000"></Icon>{{item.warranty}}
                  </span>
                  <span>
                    <Icon type="information-circled" color="#ff0000"></Icon>{{item.timout}}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div ref="isShow" class="patrol-info">
            <div class="task-header">
              <div class="title-info">
                <div class="task-user">
                  <img @error="imgErr" width="100px" height="100px" :src="recordInfo.photo?'/api/upload?id='+recordInfo.photo:soliderImg" :alt="recordInfo.realName">
                  <div class="task-user-name">{{recordInfo.realName}}</div>
                </div>
                <div class="task-title">{{recordInfo.taskType===1?'固定模式':'自由模式'}}：{{recordInfo.taskTitle}}</div>
                <div class="task-status" v-text="recordInfo.precentage>=0?recordInfo.precentage+'%':''"></div>
              </div>
              <div class="arrow-down">
                <span @click="isArrowShow()">
                  <Icon type="ios-arrow-down" size="40" />
                </span>
              </div>
              <div class="task-search">
                <DatePicker :clearable="false" :disabled="isEnable" style="width:120px" :options="dateOptions" :value="searchData.date" type="date" @on-change="searchDateChange" placeholder="开始时间" :editable="false"></DatePicker>
                <Select v-if="elementUpdate" v-show="userTasks.length>0" v-model="curTaskId" style="width:200px">
                  <Option v-for="(item,index) in userTasks" @click.native="changeTask(item._id)" :value="item._id" :key="index">{{ item.taskTitle}}</Option>
                </Select>
                <Button v-show="false" :disabled="isEnable" type="ghost" @click="showPatrolTrack"> 巡更轨迹</Button>
              </div>
            </div>
            <div class="record-info">
              <div class="point-item" v-for="item in recordInfo.points" :key="item.index">
                <div class="point-name">
                  <span :title="item.pointName"> {{item.pointName}}</span>
                </div>
                <div class="point-time">{{item.arrivalTime||item.patrolTime}}</div>
                <div class="ivu-icon" :class="{'ivu-icon-checkmark-circled':item.status==3, // 已巡更
                'ivu-icon-information-circled':item.status===4 || item.status===6 || item.status===7,// 超时
                'ivu-icon-settings':item.status===9 || item.status===2,// 报修
                'ivu-icon-android-notifications':item.status===8 || item.status===1, // 报警
                'ivu-icon-help-circled':item.status===5 || item.status===10 // 待巡更
                }"></div>
              </div>
              <div v-if="!recordInfo._id" style="text-align:center">
                暂无数据
              </div>
            </div>
          </div>
        </div>
        <div class="patrol-map ">
          <div class="map-box2" v-if="isShowMap">
            <bsMspThree :modeType="'patrol'">
            </bsMspThree>
          </div>
          <div class="map-box" v-if="!isShowMap">
            <bsMap ref="mapWatch" :activeMapCenter="mapCenter" @postcompose="alarmTwinkEvt">
              <!-- 巡更 -->
              <bs-layer :id="patrolLayer.id" :name="patrolLayer.name" :features="patrolFeatures" :zIndex="1"></bs-layer>
              <!--巡更连线(移动单兵连线)-->
              <bs-layer :id="patrollineLayer.id" :name="patrollineLayer.name" :features="patrollineFeatures" :zIndex="2"></bs-layer>
              <!-- 移动单兵 -->
              <bs-layer :id="singleLayer.id" :name="singleLayer.name" :features="singleAppFeatures" :zIndex="3"></bs-layer>
              <!-- 报警图层 -->
              <bs-layer :id="alarmingLayer.id" :name="alarmingLayer.name" :features="aralmingAppFeatures" :zIndex="4"></bs-layer>
            </bsMap>
          </div>
          <div class="msg-header">
            <TableTab :tabs="deviceTabs" @on-tab-click="deviceTabClick" :isTip="true"></TableTab>
          </div>
          <div class="msg-box" ref="msgBox">
            <Table @on-row-click="showDetail" :height="tableHeight" size="small" :highlight-row="true" ref="currentRowTable" :columns="deviceColumns"  :data="msgList"></Table>
          </div>
        </div>
      </div>
    </div>
    <div v-if="videoModal">
      <Modal width="900px" v-model="videoModal" title="单兵视频" :mask-closable="false" @on-cancel="closeSingleVideo(singlePawnId)">
          <div class="alarm-video">
            <SinglePawn :id="singlePawnId"></SinglePawn>
          </div>
          <div slot="footer"></div>
      </Modal>
    </div>
    <msgModal :modalType="modalType" :replyUser="replyUser" :modalIsShow.sync="modalShow"></msgModal>
    <msgInfoModal @notarizeClick="notarizeMsg" @replyClick="replyMsg" @confirmAlarm="confimAlarm" :data="msgInfo" :modalInfoIsShow.sync="msgInfoShow"></msgInfoModal>
  </div>
</template>
<script>
import { mapState, mapActions, mapMutations } from 'vuex'
import TableTab from './common/tableTab'
import bsMap from '../../components/common/BSMap'
import bsMspThree from '../../components/map3DBase/mapAlarmProcessing'
import layerConfig from '../../assets/map/MapConfig.js'
import msgInfoModal from '../keepwatch/common/msgInfo'
import msgModal from '../keepwatch/common/msgModal'
import noSoliderImg from '../../../static/noSolider.jpg'
import mapPatrolKeepWatch from './mapPatrolKeepWatch'
import mapAlarmingKeepWatch from './mapAlarmingKeepWatch'
import alarm from '../../socket/alarm.js'
import SinglePawn from '../../components/video/SinglePawn'
import mapApi from '../../assets/3DMap/utils'
export default {
  components: {
    TableTab,
    bsMap,
    msgInfoModal,
    msgModal,
    bsMspThree,
    SinglePawn
  },
  mixins: [mapPatrolKeepWatch, mapAlarmingKeepWatch],
  data() {
    return {
      isClose: false, // 搜索显示
      unSingleAlarmList: [], // 未报警列表
      singleAlarmList: [], // 报警列表
      singlePawnId: '', // 单兵id
      videoModal: false, // 单兵视频模态框
      patrolUserList: [], // 单兵人员
      tableValue: {},
      patrolAlarmList: [], // 巡更报警
      patrolServiceList: [], // 巡更保修
      alarmList: [], // 单兵报警
      serviceList: [], // 单兵保修
      conventionList: [], // 单兵常规
      msgList: [],
      deviceActiveTab: 0,
      deviceColumns: [],
      deviceTabs: [
        {
          title: '报警',
          value: 0,
          disabled: false,
          active: false,
          number: 0,
          isHide: false
        },
        {
          title: '报修',
          value: 1,
          disabled: false,
          active: false,
          number: 0,
          isHide: false
        },
        {
          title: '常规',
          value: 2,
          disabled: false,
          active: false,
          number: 0,
          isHide: false
        }
      ],
      isShowMap: false,
      mapCenter: null,
      patrolLayer: layerConfig.layers.patrolIpc, // 巡更点位图层
      patrolFeatures: [], // 巡更点位图层的所有对象
      patrollineLayer: layerConfig.layers.patrolline, // 巡更连线图层
      patrollineFeatures: [], // 巡更点位连线对象
      alarmingLayer: layerConfig.layers.alarming, // 报警闪烁图层
      aralmingAppFeatures: [], // 正在报警的点位列表
      singleLayer: layerConfig.layers.singleIpc,
      singleAppFeatures: [],
      elementUpdate: true,
      modalType: 1,
      replyUser: {
        realName: '',
        userId: ''
      },
      soliderImg: noSoliderImg,
      modalShow: false,
      msgInfoShow: false,
      alarmInfoShow: false,
      msgInfo: null,
      dateOptions: {
        disabledDate(date) {
          return date && date.valueOf() > Date.now()
        }
      },
      tableHeight: 300,
      isEnable: true,
      searchKey: '',
      searchData: {
        date: this.$moment().format('YYYY-MM-DD'),
        userId: ''
      },
      selectTask: {},
      curTaskId: '',
      orgInfo: {
        id: '',
        name: ''
      },
      conventionColumns: [
        {
          title: '巡更点',
          key: 'position',
          width: 100,
          ellipsis: true
        },
        {
          title: '巡更人',
          key: 'sender',
          width: 100,
          ellipsis: true
        },
        {
          title: '标题',
          key: 'title',
          minWidth: 100,
          ellipsis: true
        },
        {
          title: '时间',
          key: 'creatTime',
          align: 'center',
          width: 80,
          render: (h, param) => {
            return h('span', param.row.moment)
          }
        }
      ],
      alarmColumns: [
        {
          title: '巡更点',
          key: 'position',
          width: 100,
          ellipsis: true
        },
        {
          title: '巡更人',
          key: 'sender',
          width: 100,
          ellipsis: true
        },
        {
          title: '标题',
          key: 'title',
          minWidth: 100,
          ellipsis: true
        },
        {
          title: '时间',
          key: 'creatTime',
          align: 'center',
          width: 80,
          render: (h, param) => {
            return h('span', param.row.moment)
          }
        }
      ],
      serviceColumns: [
        {
          title: '巡更点',
          key: 'position',
          width: 100,
          ellipsis: true
        },
        {
          title: '巡更人',
          key: 'sender',
          width: 100,
          ellipsis: true
        },
        {
          title: '标题',
          key: 'title',
          minWidth: 100,
          ellipsis: true
        },
        {
          title: '时间',
          key: 'creatTime',
          align: 'center',
          width: 80,
          render: (h, param) => {
            return h('span', param.row.moment)
          }
        }
      ]
    }
  },
  computed: {
    ...mapState({
      recordInfo: ({ patrol }) => {
        return patrol.recordInfo
      },
      userTasks: ({ patrol }) => {
        return patrol.userTasks
      },
      activeMap: ({ mapGisData }) => mapGisData.activeMap // 当前地图id
    })
  },
  watch: {
    patrolAlarmList(val) {
      if (val.length === 0) {
        this.deviceTabs[0].number = 0
      } else {
        this.deviceTabs[0].number = 1
      }
    },
    patrolServiceList(val) {
      if (val.length === 0) {
        this.deviceTabs[1].number = 0
      } else {
        this.deviceTabs[1].number = 1
      }
    },
    conventionList(val) {
      if (val.length === 0) {
        this.deviceTabs[2].number = 0
      } else {
        this.deviceTabs[2].number = 1
      }
    },
    activeMap(val) {
      // 获取所有的巡更点位
      this.getOneMapAllPatrolList({ mapid: val })
        .then(res => {})
        .catch(err => {
          console.log(err)
        })
      // 获取所有的移动单兵
      this.getMobilePatrol({ name: '', orgId: '' })
        .then(res => {})
        .catch(err => {
          console.log(err)
        })
    },
    recordInfo(val) {
      // 地图上显示巡更任务
      if (val._id) {
        this.addPatrolPath(val._id)
      }
    }
  },
  created() {
    alarm.on('singleStatus', this.receiveSingleStatus) // 巡更App状态更新 离线 在线
    alarm.on('patrolStatus', this.receivePatrolStatus) // 巡更状态更新
    alarm.on('singlePawn', this.receiveSinglePawn) // 单兵报警
    alarm.on('patrolConfirm', this.receivePatrolConfirm) // 巡更采集消息确认
    alarm.on('singlePawnMsg', this.receiveSinglePawnMsg) // 单兵消息采集
    alarm.on('patrol', this.receivePatrolPawnMsg) // 巡更消息采集
    this.PatrolUsersList()
    // this.wacthAlarmMsg()
    this.getOrgTree(3)
    // this.getPatrolUsers()
    this.UPDATE_RECORD_INFO({})
    this.UPDATE_PAGEINFO()
    // this.watchSoliderStatus()
    this.watchReceiveAlarmEvt() // 监听地图的报警
    this.isMapShow()
    for (let item in this.deviceTabs) {
      if (this.deviceTabs[item].isHide === false) {
        this.deviceTabs[item].active = true
        this.deviceTabClick({
          index: this.deviceTabs[item].value,
          obj: this.deviceTabs[item]
        })
        return
      }
    }
  },
  mounted: function() {
    this.$nextTick(function() {
      this.tableHeight = this.$refs.msgBox.clientHeight - 10
    })
  },
  beforeDestroy() {
    this.UPDATE_USER_TASKS([])
    this.UPDATE_TASK_OF_MSG([])
  },
  destroyed() {
    alarm.remove('singleStatus', this.receiveSingleStatus)
    alarm.remove('patrolStatus', this.receivePatrolStatus)
    alarm.remove('singlePawn', this.receiveSinglePawn)
    alarm.remove('patrolConfirm', this.receivePatrolConfirm)
    alarm.remove('singlePawnMsg', this.receiveSinglePawnMsg)
    alarm.remove('patrol', this.receivePatrolPawnMsg)
  },
  methods: {
    ...mapMutations(['UPDATE_RECORD_INFO', 'UPDATE_PAGEINFO', 'UPDATE_USER_TASKS', 'UPDATE_TASK_OF_MSG']),
    ...mapActions([
      'getOrgTree',
      'getPatrolUsers',
      'getPatrolUserTasks',
      'getRecordInfo',
      'getMsgsForTask',
      'getSentryUserTree',
      'searchRecordRuning',
      'getMessageById',
      // 'wacthAlarmMsg',
      'deleteMessage',
      // 'watchSoliderStatus',
      'getOneMapAllPatrolList',
      'getMobilePatrol',
      'watchReceiveAlarmEvt',
      'getTwoImensionalInfo'
    ]),
    /**
     * 搜索框内容改变
     */
    searchChange() {
      this.isClose = false
    },
    /**
     * 消息回复
     * @method showMessage
     * @param {Object} val 单兵id
     */
    showMessage(val) {
      this.modalShow = true
    },
    /**
     * 巡更App状态判断
     * @method receiveSingleStatus
     * @param {Object} data 单兵APP状态
     */
    receiveSingleStatus(data) {
      if (data.status === 'online') {
        this.PatrolUsersList()
      } else {
        for (let i = 0; i < this.patrolUserList.length; i++) {
          if (this.patrolUserList[i]._id === data.userid) {
            if (data.status === 'offline') {
              this.patrolUserList.splice(i, 1)
            }
            return
          }
        }
      }
    },
    /**
     * 巡更状态更新
     * @method receivePatrolStatus
     * @param {Object} data 单兵信息
     */
    receivePatrolStatus(data) {
      for (let i = 0; i < this.patrolUserList.length; i++) {
        if (this.patrolUserList[i]._id === data._id) {
          this.patrolUserList[i].curPoint = data.currentPoint
          this.patrolUserList[i].nextPoint = data.nextPoint
          this.patrolUserList[i].warranty = data.warranty
          this.patrolUserList[i].alarm = data.alarm
          this.patrolUserList[i].timout = data.timout
          this.patrolUserList[i].precentage = data.precentage
          this.patrolUserList[i].recordId = data.recordId
          this.getRecordInfo({id: data.recordId})
        }
      }
    },
    /**
     * 单兵视频模态框判断
     * @method closeSingleVideo
     * @param {Object} singlePawnId 单兵id
     */
    closeSingleVideo(singlePawnId) {
      this.videoModal = false
      for (let i = 0; i < this.patrolUserList.length; i++) {
        if (this.patrolUserList[i]._id === singlePawnId) {
          this.patrolUserList[i].isSingleAlarm = false
        }
      }
    },
    showAlarmModal(val) {
      this.singlePawnId = val
      this.videoModal = true
    },
    /**
     * 获取单兵用户列表
     * @method PatrolUsersList
     */
    PatrolUsersList() {
      this.getPatrolUsers().then(res => {
        this.patrolUserList = res
        this.singlePawnId = res._id
      })
    },
    /**
     * 单兵报警闪烁
     * @method receiveSinglePawn
     * @param {Object} data 接收单兵报警
     */
    receiveSinglePawn(data) {
      this.singleAlarmList = []
      this.unSingleAlarmList = []
      for (let i = 0; i < this.patrolUserList.length; i++) {
        if (data._id === this.patrolUserList[i]._id) {
          this.singleAlarmList.unshift(this.patrolUserList[i])
          this.patrolUserList[i].isSingleAlarm = true
        } else {
          this.unSingleAlarmList.push(this.patrolUserList[i])
        }
      }
      this.patrolUserList = this.singleAlarmList.concat(this.unSingleAlarmList)
    },
    /**
     * 巡更采集消息 type=1报警 type=2保修
     * @method receivePatrolPawnMsg
     * @param {Object} data 接收巡更采集信息
     */
    receivePatrolPawnMsg(data) {
      const patrolData = JSON.parse(JSON.stringify(data.message))
      if (patrolData.type === 1) {
        this.patrolAlarmList.push(patrolData)
      } else {
        this.patrolServiceList.push(patrolData)
      }
      this.deviceTabClick(this.tableValue)
    },
    /**
     * 单兵采集消息 type=0保修 type=1报警 type=2保修
     * @method receiveSinglePawnMsg
     * @param {Object} data 接收单兵采集信息
     */
    receiveSinglePawnMsg(data) {
      const singleData = JSON.parse(JSON.stringify(data))
      if (singleData.type === 0) {
        this.conventionList.push(singleData)
      } else if (singleData.type === 1) {
        this.patrolAlarmList.push(singleData)
      } else {
        this.patrolServiceList.push(singleData)
      }
      this.deviceTabClick(this.tableValue)
    },
    /**
     * 报警、保修、常规消息处理
     * @method notarizeMsg
     * @param {Object} id 处理消息id
     */
    notarizeMsg(id) {
      for (let i = 0; i < this.msgList.length; i++) {
        if (id === this.msgList[i]._id) {
          this.msgList.splice(i, 1)
        }
      }
    },
    /**
     * 消息类型表单切换 0 报警 1 保修 2 常规
     * @method deviceTabClick
     * @param {Object}  data 消息类型表单切换下标
     */
    deviceTabClick(data) {
      this.tableValue = data
      this.deviceActiveTab = data.obj.value
      switch (this.deviceActiveTab) {
        case 0:
          this.deviceColumns = this.alarmColumns
          this.msgList = this.patrolAlarmList.reverse()
          break
        case 1:
          this.deviceColumns = this.serviceColumns
          this.msgList = this.patrolServiceList.reverse()
          break
        case 2:
          this.deviceColumns = this.conventionColumns
          this.msgList = this.conventionList.reverse()
          break
      }
    },
    // 地图切换
    isMapShow() {
      this.getTwoImensionalInfo().then(res => {
        this.isShowMap = !res.mapType
      })
    },
    // 是否显示下拉框
    isArrowShow() {
      this.$refs['isShow'].style.bottom = -360 + 'px'
    },
    // 确认报警
    confimAlarm(val) {
      this.processAlarmingInfo(val)
    },
    showRecordDetail(data) {
      if (data.recordId === '') {
        this.$Notice.error({
          title: '该用户没有巡更任务！'
        })
        this.isArrowShow()
        return
      }
      this.$refs['isShow'].style.bottom = 0 + 'px'
      this.elementUpdate = false
      this.isEnable = false
      this.curTaskId = ''
      this.searchData.userId = data._id
      let param = {
        userId: data._id,
        date: this.$moment(this.$moment().format('YYYY-MM-DD')).unix('X')
      }
      const getTasks = this.getPatrolUserTasks(param)
      const getInfo = this.getRecordInfo({ id: data.recordId }) // 单条巡更记录
      const getMsg = this.getMsgsForTask({ id: data.recordId })
      Promise.all([getTasks, getInfo, getMsg])
        .then(res => {
          this.curTaskId = res[0].data[0]._id
          this.elementUpdate = true
        })
        .catch(err => console.log(err))
    },
    searchRuningTask() {
      this.searchRecordRuning({ key: this.searchKey }).then(res => {
        this.patrolUserList = res
      })
      this.isClose = true
    },
    clearSearch() {
      this.isClose = false
      this.searchKey = ''
      this.PatrolUsersList()
    },
    searchDateChange(date) {
      this.searchData.date = date
      let param = {
        userId: this.searchData.userId,
        date: this.$moment(this.searchData.date).unix('X')
      }
      this.getPatrolUserTasks(param)
        .then(res => {
          console.log(res.data, 'res.data')
          if (res.data.length > 0) {
            this.getRecordInfo({ id: res.data[0]._id })
          } else {
            this.UPDATE_RECORD_INFO({})
            this.$successMsg('暂无数据')
          }
          this.curTaskId = res.data[0]._id
        })
        .catch(err => this.errorMsg('该用户没有巡更任务！'))
    },
    changeTask(value) {
      this.curTaskId = value
      this.getRecordInfo({ id: this.curTaskId })
      this.getMsgsForTask({ id: this.curTaskId })
    },
    showPatrolTrack() {},
    showDetail(data) {
      this.getMessageById({ id: data._id || data.uniqueId }).then(res => {
        this.msgInfo = res
        this.msgInfoShow = true
        const id = data.devId || data.senderId
        mapApi.focueOnALarm(id, this.$context)
      })
    },
    replyMsg(data) {
      this.modalType = 2
      this.replyUser.realName = data.sender
      this.replyUser.userId = data.senderId
      this.modalShow = true
      this.modalShow = true
    },
    imgErr(img) {
      img.target.src = noSoliderImg
    }
  }
}
</script>

<style lang="less" scoped>
.patrol-list {
  margin-right: 10px;
  position: relative;
  overflow: hidden;
  .patrol-info {
    // flex: 0 0 227px;
    background: #1c3053;
    overflow: hidden;
    border: 1px solid #ccc;
    position: absolute;
    bottom: -360px;
    height: 355px;
    width: 100%;
    border-radius: 4px;
    transition: all 1s;
  }
}
.user-list {
  display: flex;
  flex-wrap: wrap;
  font-size: 14px;
  background: #1c3053;
  // flex-direction: column;
  // overflow-y: auto;
  // position: relative;
  // justify-content: space-between;
  overflow: auto;
  .user-patrol {
    width: calc(~'24% - 10px');
    height: calc(~'20% - 10px');
    border-radius: 4px;
    border: 1px solid #ccc;
    display: flex;
    min-width: 280px;
    margin: 2px 11px;
    position: relative;
  }
}
.single-alarm {
  width: 28px;
  height: 28px;
  animation: change 1s linear infinite;
  color: #ff784e;
  background-color: #787b83;
  border-radius: 5px;
  position: absolute;
  z-index: 5;
}
.single-alarm :hover {
  cursor: pointer;
}
@keyframes change {
  0% {
    color: #ff784e;
  }
  25% {
    color: #ff784e;
  }
  75% {
    color: #787b83;
  }
  100% {
    color: #787b83;
  }
}
.user-list-page {
  height: 40px;
  padding: 3px 10px;
  background: #244575;
  // position: absolute;
}
.patrol-map {
  flex: 0 0 400px;
  background: #1c3053;
  display: flex;
  flex-direction: column;
  .map-box {
    flex: 1;
  }
  .map-box2 {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .msg-box {
    flex: 1;
    // margin-top: 10px;
    // padding: 2px;
    overflow: auto;
    // border: 1px solid #ccc;
  }
}
.user-img {
  width: 140px;
  height: 100%;
  position: relative;
  img {
    display: block;
    width: 105px;
    height: 80px;
    margin: 10px;
    border: 1px solid #ccc;
    border-radius: 50%;
  }
  .icon-alarm-admin {
    position: absolute;
    color: orange;
    font-size: 20px;
    top: 3px;
    left: 3px;
    cursor: pointer;
  }
  span {
    display: block;
    text-align: center;
  }
}
.user-status {
  margin: 10px;
  padding: 5px;
  flex: 1;
  border-radius: 6px;
  background: #787b83;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  .percentage {
    text-align: center;
    color: #33ff99;
    font-size: 20px;
  }
  .user-status-top {
    display: flex;
    justify-content: space-between;
  }
  .user-video {
    width: 22px;
    height: 30px;
  }
  .user-video :hover {
    cursor: pointer;
  }
  .user-message {
    width: 22px;
    height: 30px;
  }
  .user-message :hover {
    cursor: pointer;
  }
}
.user-point {
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
}
.task-header {
  padding: 10px;
  flex: 1;
  display: flex;
  .title-info {
    flex: 33.3%;
    display: flex;
  }
  .arrow-down {
    flex: 33.3%;
    display: flex;
    justify-content: center;
    margin-top: -20px;
  }
  .arrow-down :hover {
    cursor: pointer;
  }
  .task-search {
    display: flex;
    flex: 33.3%;
    height: 32px;
    justify-content: space-between;
  }
  .task-user {
    flex: 0 0 100px;
    img {
      border-radius: 50%;
    }
    .task-user-name {
      text-align: center;
      font-size: 16px;
    }
  }
  .task-title {
    padding: 30px 10px;
    font-size: 14px;
  }
  .task-status {
    flex: 0 0 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: green;
  }
}
.record-info {
  height: 180px;
  width: 100%;
  overflow: auto;
}
.point-item {
  position: relative;
  margin-top: 50px;
  height: 5px;
  width: 100px;
  float: left;
  background: #ccc;
  .ivu-icon {
    position: absolute;
    font-size: 20px;
    left: 60px;
    top: -8px;
  }
  .ivu-icon-android-notifications {
    color: #ff784e;
  }
  .ivu-icon-checkmark-circled {
    color: #008000;
  }
  .ivu-icon-settings {
    color: #ff0000;
  }
  .ivu-icon-information-circled {
    color: #ff0000;
  }
  .ivu-icon-help-circled {
    color: #999;
  }
  .point-name {
    width: 100%;
    position: absolute;
    top: -40px;
    text-align: center;
    overflow: hidden;
    height: 20px;
  }
  .point-time {
    width: 100%;
    position: absolute;
    top: -25px;
    text-align: center;
  }
}
.nodata-tips {
  flex: 1;
  margin-bottom: 20px;
  background: #1c3053;
  position: relative;
  text-align: center;
  span {
    position: absolute;
    top: 50%;
    left: 50%;
  }
}
.topBar {
  background: #1b3153;
}
.searchBar {
  flex: 0 0 66px;
  display: flex;
}
.search-input {
  width: 400px;
  padding: 16px;
}
.alarm-video {
  height: 450px;
}
</style>
