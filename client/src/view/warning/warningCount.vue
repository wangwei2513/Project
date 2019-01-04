<template>
  <div class="warning" style="flex:1;display:flex;height:100%;">
    <div class="bs-content warning-content">
      <div style="background: #1C3053;flex:1">
        <Row style="height: 100%;">
          <Col span="24" class="colStyle">
          <Form :model="formItem" :label-width="80" label-position="left">
            <div style="padding: 10px 0 0 10px">
              <Row>
                <Col span="6">
                <Form-item label="机构：">
                  <p style="position:absolute;z-index:999;padding-left:8px;">{{formItem.agency}}</p>
                  <Select v-model="formItem.agency" style="width:200px">
                    <v-tree ref='tree' :treeData="treeData" :options="options" @node-click="handleNode" :activeId="agencyId" />
                  </Select>
                </Form-item>
                </Col>
                <Col span="6">
                <Form-item label="源名称：">
                  <Input v-model="formItem.dispositionvalue" placeholder="请输入..." style="width: 200px" />
                </Form-item>
                </Col>
                <Col span="6">
                <Form-item label="级别：">
                  <Select v-model="formItem.level" style="width:200px">
                    <Option v-for="item in levelList" :value="item.value" :key="item.value">{{ item.label }}</Option>
                  </Select>
                </Form-item>
                </Col>
                <Col span="6">
                <Form-item label="报警类型：">
                  <template>
                    <Cascader :data="alarmTypeList" :render-format="format" style="width:200px" v-model="alarmTypeValue"></Cascader>
                  </template>
                </Form-item>
                </Col>
              </Row>
            </div>
          </Form>
          </Col>
          <Col span="24" class="colStyle">
          <Form :model="formItem" :label-width="80" label-position="left">
            <div style="padding: 0 0 0 10px; margin: -6px 0 -6px 0;">
              <Row>
                <Col span="6">
                <Form-item label="报警分类：">
                  <Select v-model="formItem.alarmCategory" style="width:200px" placeholder="请选择">
                    <Option v-for="item in alarmCategoryList" :value="item.value" :key="item.value">{{ item.label }}</Option>
                  </Select>
                </Form-item>
                </Col>
                <Col span="6">
                <Form-item label="报警确认：">
                  <Select v-model="formItem.alarmSure" style="width:200px">
                    <Option v-for="item in alarmSureList" :value="item.value" :key="item.value">{{ item.label }}</Option>
                  </Select>
                </Form-item>
                </Col>
                <Col span="6">
                <Form-item label="开始时间：">
                  <Date-picker type='datetime' class="pointStyle" placeholder="选择开始日期和时间" style="width: 200px" :options="dateLimit" :editable="false" :clearable="false" v-model="formItem.startTime"></Date-picker>
                </Form-item>
                </Col>
                <Col span="6">
                <Form-item label="结束时间：">
                  <Date-picker type="datetime" class="pointStyle" placeholder="选择结束日期和时间" style="width: 200px" :options="dateLimit" v-model="formItem.endTime" :editable="false" :clearable="false"></Date-picker>
                </Form-item>
                </Col>
              </Row>
            </div>
          </Form>
          </Col>
          <Col span="24" class="colStyle">
            <Form :model="formItem" :label-width="80" label-position="left">
              <div style="padding: 0 0 0 10px">
                <Row>
                  <Col span="6">
                  <Form-item label="警情处理：">
                    <Select v-model="formItem.alarmDealName" style="width:200px" placeholder="请选择">
                      <Option v-for="item in alarmDealSetList" :value="item.value" :key="item.value">{{ item.label }}</Option>
                    </Select>
                  </Form-item>
                  </Col>
                  <Col span="6">
                  <Form-item label="警情类型：">
                    <Select v-model="formItem.warnType" style="width:200px">
                      <Option v-for="item in warnTypeList" :value="item.value" :key="item.value">{{ item.label }}</Option>
                    </Select>
                  </Form-item>
                  </Col>
                  <Col span="6">
                    <div class="inquire">
                      <Button type="ghost" @click="inquire" :loading="inquireLoading">查询</Button>
                    </div>
                  </Col>
                </Row>
              </div>
            </Form>
          </Col>
          <Col span="24" class="table-query-list">
          <div class="car-list flex-1" style="width: 100%; height:100%;" ref="tableBox">
            <div class="table-box">
              <Table :height="tableHeight" :columns="columnsTitle" :data="countList" size="small" :highlight-row="true"></Table>
              <div class="page-style">
                <div style="float: right;">
                  <Page show-sizer placement='top' :page-size-opts="$PageInfo.size" @on-page-size-change="pageSizeChange" :show-total="true" :show-elevator="true" :total="totalPage" :page-size="Number(limit)" :current="Number(currentPage)" @on-change="pageChange"></Page>
                </div>
              </div>
            </div>
          </div>
          </Col>
          <!--查看详情弹出框-->
          <div v-if="alarmmodal">
            <Modal v-model="alarmmodal" title="详细信息" width="450" :mask-closable="false" :closable="false">
              <div class="modalMessage" :class="{overFlowStyle: haveNoVideo == true}">
                <div style="display:inline-block;vertical-align:middle;width: 100%;" class="left">
                  <ul>
                    <li>
                      <i>源名称：</i>
                      <p>{{warningDetail.namevalue}}</p>
                    </li>
                    <li v-if="warningDetail.agencyvalue">
                      <i>机构：</i>
                      <p>{{warningDetail.agencyvalue}}</p>
                    </li>
                    <li>
                      <i>级别：</i>
                      <p>{{warningDetail.levelvalue}}</p>
                    </li>
                    <li>
                      <i>发生时间：</i>
                      <p v-for="(item,index) in showtimeList" :key="index" :class="{bgColor: activeName == item}">{{item}}</p>
                    </li>
                    <li>
                      <i>类型：</i>
                      <p>{{warningDetail.typevalue}}</p>
                    </li>
                    <li>
                      <i>处理状态：</i>
                      <p>{{warningDetail.statusvalue}}</p>
                    </li>
                  </ul>
                  <div>
                    <div class="yesmessage">
                      <b>警情处理：</b>
                      <Select v-model="warningDetail.warnDealName" style="width:200px" placeholder="请选择" :disabled="warningDetail.statusvalue==='已确认'">
                        <Option v-for="item in warnDealSetList" :value="item.value" :key="item.value">{{ item.label }}</Option>
                      </Select>
                    </div>
                    <div class="yesmessage">
                      <b>警情类型：</b>
                      <Select v-model="warningDetail.warnTypeName" style="width:200px" placeholder="请选择" :disabled="warningDetail.statusvalue==='已确认'">
                        <Option v-for="item in warnTypeSetList" :value="item.value" :key="item.value" @click.native="selectWarnType">{{ item.label }}</Option>
                      </Select>
                    </div>
                    <div class="yesmessage">
                      <b>警情信息：</b>
                      <Input :disabled="warningDetail.statusvalue==='已确认'" v-model="confirmInfo" type="textarea" :autosize="{minRows: 2,maxRows: 3}" style="width:75%;font-size:12px;" />
                    </div>
                  </div>
                </div>
                <div v-if="!haveNoVideo" style="margin-left:0px;display:inline-block;vertical-align:middle" class="right">
                  <Form :model="formItem" :label-width="80" label-position="left">
                    <Form-item label="选择通道：">
                      <Select type="text" style="width:250px" placement="top" :disabled="channelDisabled" v-model="formItem.defaultChannel" @on-change="channelChange">
                        <Option v-for="item in channelList" :value="item.value" :key="item.value">{{ item.label }}</Option>
                      </Select>
                    </Form-item>
                  </Form>
                  <div class="video" v-if="chooseChannelList.length!==0">
                    <CountVideo :open="alarmmodal" ref="video"></CountVideo>
                  </div>
                  <div class="novideo" v-if="chooseChannelList.length===0">
                    此报警未配置联动视频
                  </div>
                </div>
                <div v-if="haveNoVideo" style="margin-left:0px;display:inline;vertical-align:middle;height:500px;" class="right" @dblclick="showBigImg">
                  <div class="imgArea" v-if="carImgUrl"><img :src="carImgUrl" style="width:100%;height:100%" /></div>
                  <div class="imgArea" v-if="carImg1Url"><img :src="carImg1Url" style="width:100%;height:100%" /></div>
                  <div class="imgArea" v-if="carImg2Url"><img :src="carImg2Url" style="width:100%;height:100%" /></div>
                  <div class="imgArea" v-if="carNumPic"> <img :src="carNumPic" style="width:100%;height:100%" /></div>
                  <div class="imgArea" v-if="combinedPicUrl"><img :src="combinedPicUrl" style="width:100%;height:100%" /></div>
                  <!-- <div style="width:300px;height:300px;border:1px solid #5d5d5d;line-height:300px;text-align:center;" v-if="!carImgUrl && !carImg1Url && !carImg2Url && !carNumPic && !combinedPicUrl">无违章图片</div> -->
                </div>
              </div>
              <div slot="footer">
                <Button type="ghost" @click="alarmmodal = false">取消</Button>
                <Button type="primary" @click="alarmYes" v-if="warningDetail.statusvalue==='未确认'">确认</Button>
              </div>
              <div v-if="isShowBigImg" class="big-img-box">
                <div class="big-img-mask"></div>
                <img :src="carImgUrl || carImg1Url || carImg2Url || carNumPic || combinedPicUrl" class="bigImg"  @click="isShowBigImg=false" >
              </div>
            </Modal>
          </div>
          </Col>
        </Row>
      </div>
    </div>
  </div>
</template>
<script>
import './style/warning.css'
import VTree from '../../components/tree/VTree.vue'
import CountVideo from './CountVideo'
import { mapState, mapMutations, mapActions, mapGetters } from 'vuex'

export default {
  components: {
    VTree,
    CountVideo
  },
  data() {
    return {
      dateLimit: {
        disabledDate(date) {
          return date && date.valueOf() > Date.now()
        }
      },
      tableHeight: 460,
      formItem: {
        // 机构
        agency: '',
        // 源名称
        dispositionvalue: '',
        // 级别
        level: '',
        // 报警类型
        alarmType: '',
        // 报警分类
        alarmCategory: '',
        // 报警确认
        alarmSure: 'all',
        // 开始时间
        startTime: '', // new Date(new Date().toLocaleDateString()),
        // 结束时间
        endTime: '',
        // 通道默认值
        defaultChannel: '',
        // 警情处理
        alarmDealName: '',
        // 警情类型
        warnType: ''
      },
      activeName: '',
      confirmInfo: '',
      // 确认报警弹出框
      alarmmodal: false,
      // 查询筛选弹出框
      inquireModal: false,
      // 机构
      agencyList: [],
      // agency: '下拉机构树',
      // 级别
      levelList: [
        {
          value: '0',
          label: '全部'
        },
        {
          value: '1',
          label: '1'
        },
        {
          value: '2',
          label: '2'
        },
        {
          value: '3',
          label: '3'
        },
        {
          value: '4',
          label: '4'
        },
        {
          value: '5',
          label: '5'
        },
        {
          value: '6',
          label: '6'
        },
        {
          value: '7',
          label: '7'
        },
        {
          value: '8',
          label: '8'
        },
        {
          value: '9',
          label: '9'
        }
      ],
      // 报警分类
      alarmCategoryList: [],
      // 报警确认
      alarmSureList: [
        {
          value: 'all',
          label: '全部'
        },
        {
          value: 'false',
          label: '未确认'
        },
        {
          value: 'true',
          label: '已确认'
        }
      ],
      columnsTitle: [
        {
          type: 'index',
          title: '序号',
          width: 80
        },
        {
          title: '源名称',
          key: 'name',
          render: (h, params) => {
            let name = params.row.name
            return h(
              'div',
              {
                style: {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                },
                domProps: {
                  title: name
                }
              },
              name
            )
          }
        },
        {
          title: '机构',
          key: 'address',
          render: (h, params) => {
            let address = params.row.address || '无'
            return h(
              'div',
              {
                style: {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                },
                domProps: {
                  title: address
                }
              },
              address
            )
          }
        },
        {
          title: '发生时间',
          key: 'time',
          width: 250
        },
        {
          title: '计数',
          key: 'count',
          width: 100
        },
        {
          title: '级别',
          key: 'level',
          width: 100
        },
        {
          title: '类型',
          key: 'type',
          width: 200,
          render: (h, params) => {
            let alarmType = this.allAlarmType[params.row.type]
            this.warningDetail.typevalue = alarmType
            return h('span', {}, alarmType)
          }
        },
        {
          title: '处理情况',
          key: 'status',
          width: 200
        },
        {
          title: '警情处理',
          key: 'alarmDeal',
          width: 200
        },
        {
          title: '警情类型',
          key: 'situationType',
          width: 200
        },
        {
          title: '警情信息',
          key: 'alertInfo',
          width: 200
        },
        {
          title: '其他',
          key: 'other',
          width: 100
        },
        {
          title: '操作',
          key: 'operat',
          // width: 250,
          render: (h, params) => {
            return h('div', [
              h(
                'Button',
                {
                  props: {
                    type: 'ghost',
                    size: 'small'
                  },
                  style: {
                    marginRight: '5px'
                  },
                  on: {
                    click: e => {
                      this.show(params.row)
                    }
                  }
                },
                '查看详情'
              )
            ])
          }
        }
      ],
      countList: [],
      allAlarmType: {
        alarmInput: '报警输入',
        alarmOut: '报警输出',
        focusAttention: '重点关注',
        // 智能类
        perimeter: '周界保护',
        tripwire: '绊线',
        leftObject: '物品遗留',
        missingObject: '物品丢失',
        loitering: '非法停留',
        retrogradeDetection: '逆行检测',
        lingerDetection: '徘徊检测',
        doubleCordon: '双警戒线',
        blackList: '黑名单',
        whiteList: '白名单',
        dispatch: '布控',
        areaInvade: '区域入侵',
        fastMove: '快速移动',
        parkDetect: '停车检测',
        humanAssemble: '人员聚集',
        objectMove: '物品搬移',
        // 监控点类
        alarmMoveSense: '移动侦测',
        videoMask: '视频遮挡',
        sceneSwitch: '镜头移位',
        definitionAbnormal: '清晰度异常',
        brightnessAbnormal: '亮度异常',
        screenFreeze: '画面冻结',
        noise: '噪声检测',
        signalLoss: '信号缺失',
        colorCast: '偏色检测',
        // 消防类
        fireAlarm: '消防报警',
        fireFailure: '消防故障',
        // 违章报警
        vioRetrograde: '违章逆行',
        vioPark: '违章停车',
        vioTurnLeft: '违章左转',
        vioTurnRight: '违章右转',
        // 报警求助
        askHelp: '请求对讲',
        acceptHelp: '接受对讲',
        endHelp: '结束对讲',
        // 设备报警
        hardDiskFailure: 'sd卡故障',
        hardDiskFull: 'sd卡满',
        networkDown: '网络断开',
        ipConflict: 'IP冲突',
        timeAbnormal: '时间异常',
        illegalNetworkAccess: '非法网络访问',
        // 其他
        alarmVideoLost: '视频丢失',
        vehicleBlack: '车辆识别黑名单',
        vehicleWhite: '车辆白名单',
        vehicleDispatch: '车辆布控',
        faceBlack: '人脸识别',
        faceWhite: '人脸白名单',
        faceDispatch: '人脸布控',
        peopleCount: '人数统计',
        fight: '斗殴',
        approach: '人员贴近',
        armyGuard: '哨兵管控',
        atmCare: 'ATM看护',
        fanAbnormal: '风扇异常',
        mainBoardAbnormal: '主板异常',
        channelAbnormal: '通道异常',
        temperatureAbnormal: '温度异常',
        damagedDiskSectors: '硬盘坏道',
        ipcMacCheckException: 'MAC校验异常'
      },
      showtimeList: [],
      listLength: '',
      options: {
        showFolder: true
      },
      treeData: [], // 机构树
      agencyId: '',
      alarmTypeValue: [],
      alarmTypeList: [],
      confirmWarnList: [],
      // 分页
      totalPage: 0,
      currentPage: 1,
      limit: this.$PageInfo.limit,
      startTimestamp: '', // 开始时间时间戳
      endTimestamp: '', // 结束时间时间戳
      setLevel: '', // 等级
      // 详细信息
      warningDetail: {
        namevalue: '',
        agencyvalue: '',
        levelvalue: '',
        typevalue: '',
        statusvalue: '',
        warnDealName: '',
        warnTypeName: ''
      },
      alarmTime: '',
      channel: '',
      devIp: '',
      devPort: '',
      orgId: '',
      // 通道
      channelList: [],
      channelDisabled: false,
      inquireLoading: false,
      chooseChannelList: [],
      channelType: '',
      devId: '',
      channelId: '',
      haha: '1',
      haveNoVideo: false,
      carImg1Url: '',
      carImg2Url: '',
      carImgUrl: '',
      carNumPic: '',
      combinedPicUrl: '',
      alarmTypemeth: '',
      monitoryPointListValue: [],
      intelligentListValue: [],
      fireAlarmListValue: [],
      isShowBigImg: false,
      vioAlarmListValue: [],
      alarmDealSetList: [], // 警情处理列表
      warnTypeList: [], // 警情类型列表
      warnPlanList: [],
      warnDealSetList: [],
      warnTypeSetList: []
    }
  },
  methods: {
    ...mapMutations(['WARNING_LIST', 'SET_WARNINGORGTREE_DATA', 'GET_WARNIN_DATA', 'GET_TYPE_DATA']),
    ...mapActions(['getWarningOrgTree', 'getWarningNews', 'getSortData', 'getWarningTypeTree', 'confirmWarning', 'getAlarmHostPowers', 'getAlarmDealSetList', 'getPrearranged']),
    format(labels, selectedData) {
      const index = labels.length - 1
      const data = selectedData[index] || false
      if (data && data.code) {
        return labels[index] + ' - ' + data.code
      }
      return labels[index]
    },
    // 机构树
    handleNode(node, mark) {
      this.formItem.agency = node.name
      this.agencyId = node._id
    },
    // 查看详情按钮
    show(row) {
      this.showtimeList = []
      this.$store.commit('GET_WARNIN_CHANNEL', {})
      this.warningDetail.namevalue = row.name
      this.warningDetail.agencyvalue = row.address
      this.warningDetail.levelvalue = row.level
      this.warningDetail.statusvalue = row.status
      this.warningDetail.typevalue = this.allAlarmType[row.type]
      // 违章报警的话，会有图片，无联动视频
      if (
        row.type === 'vioRetrograde' ||
        row.type === 'vioPark' ||
        row.type === 'vioTurnLeft' ||
        row.type === 'vioTurnRight'
      ) {
        this.haveNoVideo = true
      } else {
        this.haveNoVideo = false
      }
      if (this.haveNoVideo) {
        this.carImg1Url = row.carImg1Url
        this.carImg2Url = row.carImg2Url
        this.carImgUrl = row.carImgUrl
        this.carNumPic = row.carNumPic
        this.combinedPicUrl = row.combinedPicUrl
      }
      this.channelType = row.type
      this.alarmTime = row.time
      this.showtimeList.push(row.time)
      this.alarmmodal = true
      this.devIp = row.devIp
      this.channel = row.channel
      this.devPort = row.devPort
      this.devId = row.id
      this.channelId = row.channelId
      this.orgId = row.id
      // 报警信息
      if (row.status === '已确认') {
        this.confirmInfo = row.alertInfo === '无' ? '自动确认，无警情信息' : row.alertInfo
        this.warningDetail.warnDealName = row.alarmDeal
        this.warningDetail.warnTypeName = row.situationType
      } else {
        this.confirmInfo = this.warnPlanList[0].content
        this.warningDetail.warnDealName = this.warnDealSetList[0].value
        this.warningDetail.warnTypeName = this.warnTypeSetList[0].value
      }
      this.channelList = []
      this.chooseChannelList = []
      this.formItem.defaultChannel = ''
      if (row.action && row.action.length === 0) {
        this.channelDisabled = true
      } else {
        this.channelDisabled = false
        this.chooseChannelList = row.action
        this.chooseChannelList.forEach((item, index) => {
          this.channelList.push({
            label: item.channelName,
            value: item.channelName
          })
        })
        this.formItem.defaultChannel = this.channelList[0] ? this.channelList[0].value : ''
        this.channelChange(this.formItem.defaultChannel)
      }
    },
    showBigImg() {
      this.isShowBigImg = true
    },
    pageChange(page) {
      this.currentPage = page
      this.haha = '0'
      this.getTableData()
    },
    pageSizeChange(n) {
      this.limit = n
      this.getTableData()
    },
    // 查询
    inquire() {
      this.haha = '1'
      this.inquireLoading = true
      this.getTableData()
    },
    getTableData() {
      // 时间转换
      this.startTimestamp = Date.parse(new Date(this.formItem.startTime)) / 1000
      this.endTimestamp = Date.parse(new Date(this.formItem.endTime)) / 1000
      if (this.formItem.endTime !== '' && this.formItem.startTime !== '') {
        if (this.startTimestamp === this.endTimestamp) {
          this.inquireLoading = false
          this.$Notice.warning({
            title: '警告',
            desc: '开始时间和结束时间不能相同！',
            duration: 2,
            top: 200
          })
        } else if (this.startTimestamp >= this.endTimestamp) {
          this.inquireLoading = false
          this.$Notice.warning({
            title: '警告',
            desc: '开始时间不能大于结束时间！',
            duration: 2,
            top: 200
          })
        } else {
          this.inquireModal = true
          if (this.formItem.level === '') {
            this.setLevel = 0
          } else {
            this.setLevel = this.formItem.level
          }
          if (this.formItem.alarmType[0] === 'alarmIn') {
            this.formItem.alarmType = ['alarmInput']
          }
          if (this.haha === '1') {
            this.currentPage = 1
          }
          this.getWarningNews({
            // 机构
            orgId: this.agencyId,
            // 源名称
            srcName: this.formItem.dispositionvalue,
            // 级别
            level: this.setLevel * 1,
            // 报警类型
            alarmType: this.alarmTypeMeth,
            // 报警分类
            alarmClassifyId: this.formItem.alarmCategory === 'all' ? '' : this.formItem.alarmCategory,
            // 报警确认
            deal: this.formItem.alarmSure,
            // 开始时间
            beginTime: this.startTimestamp * 1,
            // 结束时间
            endTime: this.endTimestamp * 1,
            // 一页多少条
            limit: this.limit,
            // 当前请求第几页
            page: this.currentPage,
            // 警情处理
            alarmDeal: this.formItem.alarmDealName === 'all' ? '' : this.formItem.alarmDealName,
            // 警情类型
            situationType: this.formItem.warnType === 'all' ? '' : this.formItem.warnType
          })
            .then(res => {
              this.inquireLoading = false
              this.countList = JSON.parse(JSON.stringify(this.historyList))
              this.countList.forEach((item, index) => {
                if (this.countList[index].status === true) {
                  this.countList[index].status = '已确认'
                  this.confirmInfo = this.countList[index].content
                } else {
                  this.countList[index].status = '未确认'
                }
                this.countList[index].time = this.$moment(this.countList[index].time * 1000).format(
                  'YYYY-MM-DD HH:mm:ss'
                )
              })
              this.haha = '1'
              // this.totalPage = this.waringPage.total
              this.totalPage = Number(res.headers['x-bsc-count'])
            })
            .catch(err => {
              this.inquireLoading = false
              console.log('inquire error: ' + err)
            })
        }
      } else {
        this.inquireLoading = false
        this.$Notice.warning({
          title: '失败',
          desc: '时间不能为空！',
          duration: 2,
          top: 200
        })
      }
    },
    // 通道切换
    channelChange(data) {
      if (data !== '') {
        this.chooseChannelList.forEach((item, index) => {
          if (data === item.channelName) {
            item.eventType = this.channelType
            this.$store.commit('GET_WARNIN_CHANNEL', item)
          }
        })
      }
    },
    // 报警确认
    alarmYes() {
      this.getAlarmHostPowers(this.channelId || this.devId).then(res => {
        let hasPower = false
        if (res.data.properties) {
          hasPower = res.data.properties.some(item => {
            return item === 'alarmConfirm'
          })
        }
        if (!hasPower) {
          this.warningMsg('该报警资源无报警确认权限')
          return
        }
        this.confirmWarnList = []
        if (this.confirmInfo === '') {
          this.warningMsg('警情确认信息不能为空')
          this.alarmmodal = true
        } else {
          const alarmSureInfo = {
            alarmDeal: this.warningDetail.warnDealName,
            situationType: this.warningDetail.warnTypeName,
            alarmContent: this.confirmInfo
          }
          const message = {
            _id: this.orgId,
            ackContent: JSON.stringify(alarmSureInfo),
            devIp: this.devIp,
            devPort: this.devPort,
            channel: this.channel,
            eventType: this.channelType,
            devId: this.devId,
            channelId: this.channelId
          }
          this.confirmWarnList.push(message)
          this.confirmWarning(this.confirmWarnList)
            .then(resp => {
              this.successMsg('确认报警成功')
              this.inquire()
            })
            .catch(err => {
              console.log('alarmYes error: ' + err)
            })
          this.alarmmodal = false
          this.isShowBigImg = false
        }
      }).catch(err => {
        console.log('getAlarmHostPowers' + err)
      })
    },
    selectWarnType() {
      let selectIndex
      this.$nextTick(() => {
        this.warnPlanList.forEach((item, index) => {
          if (item.name === this.warningDetail.warnTypeName) {
            selectIndex = index
          }
        })
        this.confirmInfo = this.warnPlanList[selectIndex].content
      })
    }
  },
  mounted() {
    this.tableHeight = this.$refs['tableBox'].offsetHeight - 40
  },
  computed: {
    ...mapState({
      historyList: ({ warningCount }) => warningCount.historyList,
      warningOrgTreeData: ({ warningCount }) => warningCount.warningOrgTreeData,
      warningTypeTreeData: ({ warningCount }) => warningCount.warningTypeTreeData
    }),
    ...mapGetters(['enabledSort', 'getInquireData'])
  },
  created() {
    if (this.$route.query.alarmSureFalse) {
      this.formItem.alarmSure = 'false'
    }
    if (this.$route.query.endTime) {
      this.formItem.endTime = new Date(decodeURIComponent(this.$route.query.endTime))
    } else {
      this.formItem.endTime = new Date()
    }
    if (this.$route.query.startTime) {
      this.formItem.startTime = new Date(decodeURIComponent(this.$route.query.startTime))
      setTimeout(() => {
        this.inquire()
      }, 0)
    } else {
      this.formItem.startTime = this.$moment(new Date().setHours(0, 0, 0, 0)).format('YYYY-MM-DD HH:mm:ss')
    }

    this.formItem.level = this.levelList[0].value
    this.getSortData()
      .then(resp => {
        let typeList = JSON.parse(JSON.stringify(this.enabledSort))
        typeList.unshift({ value: 'all', label: '全部' })
        this.alarmCategoryList = JSON.parse(JSON.stringify(typeList))
        this.formItem.alarmCategory = this.alarmCategoryList[0].value
      })
      .catch(err => {
        console.log('getSortData error: ' + err)
      })
    this.getWarningTypeTree()
      .then(resp => {
        this.alarmTypeList.push(this.warningTypeTreeData.all[0])
        this.alarmTypeList.push(this.warningTypeTreeData.alarmInput[0])
        this.alarmTypeList.push(this.warningTypeTreeData.alarmHelp[0])
        this.alarmTypeList.push(this.warningTypeTreeData.alarmOutput[0])
        this.alarmTypeList.push(this.warningTypeTreeData.focusAttention[0])
        const fireAlarm = {
          value: 'allFireAlarm',
          label: '消防报警',
          children: []
        }
        this.warningTypeTreeData.fireAlarm.forEach((item, index) => {
          fireAlarm.children.push(item)
          this.fireAlarmListValue.push(item.value)
        })
        fireAlarm.children.unshift({ label: '全部_消防报警', value: 'allFireAlarm' })
        this.alarmTypeList.push(fireAlarm)
        const intelligentList = {
          value: 'intelligentAlarm',
          label: '智能报警',
          children: []
        }
        this.warningTypeTreeData.intelligentAlarm.forEach((item, index) => {
          intelligentList.children.push(item)
          this.intelligentListValue.push(item.value)
        })
        intelligentList.children.unshift({ label: '全部_智能报警', value: 'allIntelligent' })
        this.alarmTypeList.push(intelligentList)
        const monitoryPointList = {
          value: 'monitoryPointAlarm',
          label: '监控点报警',
          children: []
        }
        this.warningTypeTreeData.monitoryPointAlarm.forEach((item, index) => {
          monitoryPointList.children.push(item)
          this.monitoryPointListValue.push(item.value)
        })
        monitoryPointList.children.unshift({ label: '全部_监控点报警', value: 'allMonitoryPoint' })
        this.alarmTypeList.push(monitoryPointList)
        const violationList = {
          value: 'violationAlarm',
          label: '违章报警',
          children: []
        }
        this.warningTypeTreeData.violation.forEach((item, index) => {
          violationList.children.push(item)
          this.vioAlarmListValue.push(item.value)
        })
        violationList.children.unshift({ label: '全部_违章报警', value: 'violation' })
        this.alarmTypeList.push(violationList)
      })
      .catch(err => {
        console.log('getWarningTypeTree error: ' + err)
      })
    this.alarmTypeValue.push('all')
    this.getWarningOrgTree(this.orgType).then(() => {
      this.treeData = JSON.parse(JSON.stringify(this.warningOrgTreeData))
    }).catch(err => {
      console.log('getWarningOrgTree error: ' + err)
    })
    // 获取警情处理列表
    this.getAlarmDealSetList({ page: 1, limit: 100, type: 'alarm' }).then((res) => {
      res.data.forEach(item => {
        this.alarmDealSetList.push({ label: item.name, value: item.name })
        this.warnDealSetList.push({ label: item.name, value: item.name })
      })
      this.alarmDealSetList.unshift({ value: 'all', label: '全部' })
      this.formItem.alarmDealName = this.alarmDealSetList[0].value
    }).catch(err => {
      console.log('getFireAlarmDealList error: ', err)
      this.errorMsg('警情处理列表获取失败')
    })
    // 获取警情确认列表
    this.getPrearranged({ page: 1, limit: 100 }).then((res) => {
      this.warnPlanList = JSON.parse(JSON.stringify(res.data))
      res.data.forEach(item => {
        this.warnTypeList.push({ label: item.name, value: item.name })
        this.warnTypeSetList.push({ label: item.name, value: item.name })
      })
      this.warnTypeList.unshift({ value: 'all', label: '全部' })
      this.formItem.warnType = this.warnTypeList[0].value
    }).catch(err => {
      console.log('getPrearranged error: ', err)
      this.errorMsg('警情确认列表获取失败')
    })
  },
  watch: {
    alarmTypeValue: {
      deep: true,
      handler(newValue) {
        if (newValue.length === 1 && newValue[0] !== 'alarmHelp') {
          if (newValue[0] === 'alarmIn') {
            this.alarmTypeMeth = 'alarmInput'
          } else {
            this.alarmTypeMeth = newValue[0]
          }
        } else if (newValue.length === 1 && newValue[0] === 'alarmHelp') {
          this.alarmTypeMeth = 'askHelp,acceptHelp,endHelp'
        } else {
          if (newValue[1] === 'allIntelligent') {
            this.alarmTypeMeth = this.intelligentListValue.join(',')
          } else if (newValue[1] === 'allMonitoryPoint') {
            this.alarmTypeMeth = this.monitoryPointListValue.join(',')
          } else if (newValue[1] === 'allFireAlarm') {
            this.alarmTypeMeth = this.fireAlarmListValue.join(',')
          } else if (newValue[1] === 'violation') {
            this.alarmTypeMeth = this.vioAlarmListValue.join(',')
          } else {
            this.alarmTypeMeth = newValue[1]
          }
        }
      }
    }
  }
}
</script>
<style scoped>
.bgColor {
  background-color: #ddd;
}

.warning .warning-content {
  padding: 16px 0;
  overflow: hidden;
}

i {
  font-style: normal;
}

b {
  font-weight: normal;
}

.top ul li,
.playback ul li {
  display: block;
  overflow: hidden;
  list-style-type: none;
  margin: 10px 0;
}

.top ul li p {
  float: left;
  margin-right: 70px;
  margin-bottom: 10px;
}

.page-style {
  width: 100%;
  height: 40px;
  border-top: none;
  overflow: hidden;
  padding: 5px 12px;
  background: #244575;
  overflow: inherit;
}

.top ul li p b {
  float: left;
  width: 120px;
  color: #fff;
}

.inquire {
  margin-bottom: 12px;
}

.inquire button {
  margin-left: 10px;
  height: 30px;
  padding: 0 40px !important;
}
.modalMessage {
  min-width: 100%;
  line-height: 100%;
  padding: 0 10px;
  height: 636px;
}
.overFlowStyle {
  overflow: auto;
}
.modalMessage .left>ul li {
  margin-bottom: 10px;
}

.modalMessage i {
  float: left;
  width: 60px;
  margin-right: 20px;
}

.left ul li p {
  width: 100%;
  padding-left: 60px;
}

.showtime {
  height: 100px;
  width: 260px;
  border: 1px solid #5d5d5d;
}

.showtime p {
  padding: 5px 10px;
}

.imageBox {
  width: 100%;
  height: 100%;
}

.imageBox > .images {
  width: 100%;
  height: calc(100% - 1px);
  overflow: auto;
}

.yesmessage {
  width: 340px;
  margin-top: 10px;
  margin-bottom: 10px;
}

.yesmessage b {
  float: left;
  width: 60px;
  margin-right: 20px;
}

.video {
  width: 400px;
  height: 300px;
  margin-bottom: 10px;
  border: 1px solid #5d5d5d;
  position: absolute;
  left: 24px;
}
.novideo {
  width: 400px;
  height: 300px;
  margin-bottom: 10px;
  border: 1px solid #5d5d5d;
  line-height: 300px;
  text-align: center;
  position: absolute;
  left: 24px;
}

.imgArea {
  width: 400px;
  height: 300px;
  border: 1px solid #5d5d5d;
  line-height: 300px;
  display: inline-block;
  margin: 30px -10px 0;
}
.btn {
  text-align: center;
  margin-top: 15px;
}

.btn button {
  margin-left: 30px;
}

.ivu-input-number {
  font-size: 12px;
  position: absolute;
  right: 55px !important;
  top: 50%;
  margin-top: -6px;
}

.ivu-cascader-menu:last-child {
  border-right-color: transparent;
  margin-right: -1px;
  width: 150px !important;
}

.colStyle {
  padding: 0 40px;
}
.table-query-list {
  position: absolute;
  top: 166px;
  height: calc(100% - 166px);
}
.bigImg {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.3, 0.3);
  opacity: 1;
  z-index: 1001;
}
.big-img-mask {
  background: #000813;
  opacity: 0.7;
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}
.big-img-box {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
