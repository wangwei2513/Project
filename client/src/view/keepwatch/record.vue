<template>
  <div class="bs-content">
    <div class="bs-left">
      <VTree @node-click="nodeClick" :activeId="orgInfo.id" :treeData="orgTreeData"></VTree>
    </div>
    <div class="bs-main flex-column">
      <div class="main-handle flex-between topBar">
        <div class="handle-left">
          <Button v-if="$BShasPower('BS-PATROL-TASK-RECORD')" type="ghost" :disabled="selectRecord.length>0?false:true" @click="removeRecord" icon="trash-a">删除</Button>
          <Button type="ghost" @click="refresh" icon="android-refresh">刷新</Button>
        </div>
        <div class="handle-right">
          <Input v-model="searchData.taskTitle" placeholder="任务名" style="width: 150px"></Input>
          <Input v-model="searchData.realName" placeholder="巡更人" style="width: 150px"></Input>
          <div>
            <DatePicker type="date" @on-change="searchStartTimeChange" :value="searchData.startTime" placeholder="开始日期" :editable="false"></DatePicker>
            <span>至</span>
            <DatePicker type="date" @on-change="searchEndTimeChange" :value="searchData.endTime" placeholder="结束日期" :editable="false"></DatePicker>
          </div>
          <Button @click="searchRecord" icon="ios-search">搜索</Button>
          <Button @click="restorationRecord" icon="ios-loop-strong">复位</Button>
        </div>
      </div>
      <div ref="tableBox" class="flex-1">
        <div class="bs-table-box">
          <Table @on-selection-change="selectRow" size="small" highlight-row ref="currentRowTable" :columns="tableColumns" :data="recordList" :height="tableHeight"></Table>
          <div class="table-footer">
            <div style="float: right;">
              <Page show-sizer :page-size-opts="$PageInfo.size" @on-page-size-change="pageSizeChange" :show-total="true" :page-size="pageLimit" :show-elevator="true" :total="pageInfo.count" :current="pageInfo.cur" @on-change="changePage"></Page>
            </div>
          </div>
          <div class="record-detail" ref="isShow">
            <div class="arrow-down">
              <span @click="isArrowShow()">
                <Icon type="ios-arrow-down" size="40" />
              </span>
            </div>
            <div class="record-title">
              <div class="record-task-info">
                <div class="task-user">
                  <img v-show="recordInfo._id" @error="imgErr" width="100px" height="100px" ref="photoSrc" :alt="recordInfo.realName">
                  <div class="task-user-name">{{recordInfo.realName}}</div>
                </div>
                <div class="task-title">{{recordInfo.taskTitle}}</div>
                <div class="task-status" v-text="recordInfo.precentage>=0?recordInfo.precentage+'%':''"></div>
              </div>
              <div class="sign-list">
                <div class="item">
                  <Icon size="24" type="android-notifications" color="#ff784e"></Icon>
                  <label>报警</label>
                </div>
                <div class="item">
                  <Icon size="24" type="settings" color="#ff0000"></Icon>
                  <label>报修</label>
                </div>
                <div class="item">
                  <Icon size="24" type="checkmark-circled" color="green"></Icon>
                  <label>已巡更</label>
                </div>
                <div class="item">
                  <Icon size="24" type="information-circled" color="#ff0000"></Icon>
                  <label>超时</label>
                </div>
                <div class="item">
                  <Icon size="24" type="help-circled" color="#999999"></Icon>
                  <label>待巡更</label>
                </div>
              </div>
            </div>
            <div class="record-info">
              <div class="point-item" v-for="(item,index) in recordInfo.points" :key="item.index">
                <div class="point-name">{{item.pointName}}</div>
                <div class="point-time" v-if="index===0&&recordInfo.precentage===0">{{recordInfo.startTime}}
                  <span v-if="recordInfo.points.length===1&&recordInfo.taskType===2">
                    --- {{recordInfo.endTime}}
                  </span>
                </div>
                <div class="point-time" v-if="index!==0&& index===recordInfo.points.length-1&&recordInfo.precentage===0">{{recordInfo.endTime}}</div>
                <div class="point-time">{{item.arrivalTime?item.arrivalTime:item.patrolTime}}</div>
                <div class="ivu-icon" :class="{'ivu-icon-checkmark-circled':item.status==3, // 已巡更
                'ivu-icon-information-circled':item.status===4 || item.status===6 || item.status===7,// 超时
                'ivu-icon-settings':item.status===9 || item.status===2,// 报修
                'ivu-icon-android-notifications':item.status===8 || item.status===1, // 报警
                'ivu-icon-help-circled':item.status===5 || item.status===10 // 待巡更
                }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapState, mapActions, mapMutations } from 'vuex'
import defaultImg from '../../../static/noSolider.jpg'
import moment from 'moment'
export default {
  components: {},
  data() {
    return {
      deleList: [],
      defaultImg: defaultImg,
      modal: false,
      isEnable: false,
      getType: 1,
      dataList: [],
      tableHeight: 435,
      tableColumns: [
        {
          type: 'selection',
          width: 60,
          align: 'center'
        },
        {
          type: 'index',
          title: '序号',
          width: 70,
          align: 'center'
        },
        {
          title: '任务名称',
          key: 'taskTitle',
          ellipsis: true,
          render: (h, param) => {
            return h(
              'span',
              {
                attrs: {
                  title: param.row.taskTitle
                }
              },
              param.row.taskTitle
            )
          }
        },
        {
          title: '巡更人',
          key: 'realName',
          width: 120
        },
        {
          title: '任务模式',
          key: 'taskType',
          width: 120,
          render: (h, param) => {
            return h('span', param.row.taskType === 2 ? '自由模式' : '固定模式')
          }
        },
        {
          title: '日期',
          width: 120,
          render: (h, param) => {
            return h('span', this.$moment.unix(param.row.date).format('YYYY-MM-DD'))
          }
        },
        {
          title: '开始时间',
          key: 'startTime',
          width: 200
        },
        {
          title: '结束时间',
          key: 'endTime',
          width: 200
        },
        {
          title: '浮动时间',
          key: 'rangTime',
          width: 100
        },
        {
          title: '状态(%)',
          key: 'precentage',
          width: 100,
          render: (h, param) => {
            return h('span', param.row.precentage + '%')
          }
        },
        {
          title: '操作',
          key: 'action',
          width: 150,
          align: 'center',
          render: (h, params) => {
            return h('div', [
              h(
                'Button',
                {
                  props: {
                    type: 'primary',
                    size: 'small'
                  },
                  style: {
                    marginRight: '5px'
                  },
                  on: {
                    click: () => {
                      this.showDetail(params.row)
                      this.$refs['isShow'].style.bottom = 0 + 'px'
                    }
                  }
                },
                '详情'
              )
            ])
          }
        }
      ],
      searchData: {
        taskTitle: '',
        realName: '',
        startTime: moment().format('YYYY-MM-DD'),
        endTime: moment().format('YYYY-MM-DD'),
        org: ''
      },
      orgInfo: {
        id: '',
        name: ''
      },
      activeId: '',
      selectRecord: [],
      pageLimit: this.$PageInfo.limit

    }
  },
  computed: {
    ...mapState({
      recordList: state => state.patrol.recordList,
      recordInfo: state => state.patrol.recordInfo,
      orgTreeData: ({ orgSetting }) => {
        return orgSetting.orgTreeData
      },
      pageInfo: state => {
        return state.patrol.pageInfo
      }
    }),
    paramData: function() {
      const param = JSON.parse(JSON.stringify(this.searchData))
      param.startTime = param.startTime ? this.$moment(param.startTime).format('X') : ''
      param.endTime = param.endTime ? this.$moment(param.endTime).format('X') : ''
      param.limit = this.pageLimit

      return param
    }
  },
  created() {
    this.UPDATE_RECORD_INFO({})
    this.UPDATE_PAGEINFO()
    this.getOrgTree(3)
    this.getRecordList({ limit: this.pageLimit })
  },
  mounted() {
    this.tableHeight = this.$refs['tableBox'].offsetHeight - 40
  },
  methods: {
    ...mapMutations(['UPDATE_RECORD_INFO', 'UPDATE_PAGEINFO']),
    ...mapActions([
      'getRecordList',
      'searchRecordList',
      'getRecordInfo',
      'getOrgTree',
      'deleteRecord',
      'recordLog'
    ]),
    // 点击隐藏记录
    isArrowShow() {
      this.$refs['isShow'].style.bottom = -700 + 'px'
    },
    // 点击机构树，并根据机构ID 获取巡更记录
    nodeClick(item) {
      this.getType = 1
      this.orgInfo.id = item._id
      this.searchData.org = item._id
      this.paramData.page = 1
      this.getRecordList({ org: item._id, limit: this.pageLimit })
    },
    refresh() {
      this.selectRecord = []
      this.orgInfo.id = ''
      this.paramData.org = ''
      this.getType = 1
      this.getRecordList({ limit: this.pageLimit })
    },
    // 复位清空
    restorationRecord() {
      this.searchData.taskTitle = ''
      this.searchData.realName = ''
      this.getRecordList({ limit: this.pageLimit })
    },
    // 查看巡更继续详情
    showDetail(data) {
      this.getRecordInfo({ id: data._id }).then(res => {
        this.$refs.photoSrc.src = '/api/upload?id=' + this.recordInfo.photo
      })
    },
    // 根据页码获取巡更记录详情
    changePage(n) {
      this.selectRecord = []
      let param = Object.assign(this.paramData, { page: n })
      if (this.getType === 1) {
        this.getRecordList(param)
      } else {
        this.searchRecordList(param)
      }
    },
    pageSizeChange(n) {
      this.selectRecord = []
      this.pageLimit = n
      let param = Object.assign(this.paramData, { page: 1 })
      if (this.getType === 1) {
        this.getRecordList(param)
      } else {
        this.searchRecordList(param)
      }
    },
    // 根据条件获取巡更记录
    searchRecord() {
      if (this.paramData.startTime > this.paramData.endTime) {
        this.$Notice.warning({
          title: '开始时间不能大于结束时间'
        })
      }
      if ((this.paramData.endTime - this.paramData.startTime) / 86400 > 30) {
        this.$Notice.warning({
          title: '日期范围不能大于一个月'
        })
      } else {
        this.getType = 2
        this.orgInfo.id = ''
        this.paramData.page = 1
        this.selectRecord = []
        this.searchRecordList(this.paramData)
      }
    },
    // 修改查询条件的开始时间和结束时间
    searchStartTimeChange(time) {
      this.searchData.startTime = time
    },
    searchEndTimeChange(time) {
      this.searchData.endTime = time
    },
    // 批量删除巡更记录
    removeRecord() {
      this.$Modal.confirm({
        title: '删除确认',
        content: '确认删除巡更记录吗?',
        loading: true,
        onOk: () => {
          this.deleteRecord(this.selectRecord)
            .then(res => {
              this.$Notice.success({
                title: '删除成功'
              })
              this.$Modal.remove()
              if (this.getType === 1) {
                this.getRecordList(this.paramData)
              } else {
                this.searchRecordList(this.paramData)
              }
            })
          this.selectRecord.forEach(element => {
            this.deleList.push(element.taskTitle)
          })
          this.recordLog({logType: '操作日志', module: '电子巡查', operateName: '删除巡更记录', operateContent: '删除巡更记录', target: this.deleList.join()})
            .catch(err => console.log(err))
        }
      })
    },
    selectRow(rows) {
      this.selectRecord = rows
    },
    imgErr(img) {
      img.target.src = defaultImg
    }
  }
}
</script>

<style lang="less"  scoped>
.flex-1 {
  position: relative;
  overflow: hidden;
}
.bs-table-box {
  position: absolute;
  left: 0;
  right: 0;
  height: 100%;
  background: #1c3053;
    display: flex;
  flex-direction: column;
}
.flex-1 .bs-table-box .ivu-table-wrapper .ivu-table .ivu-table-small .ivu-table-overflowX{
  overflow-x: hidden!important;
}
.handle-left {
  flex: 0 0 300px;
  padding: 12px 24px;
}
.handle-left > Button {
  margin-right: 8px;
}
.handle-right {
  display: flex;
  flex: 1;
  justify-content: flex-end;
  padding: 12px 24px;
}
.handle-right > div {
  display: inline-block;
  margin: 0 10px;
}
.handle-right > Button {
  margin-left: 8px;
}
.record-detail {
  width: 100%;
  position: absolute;
  height: 58%;
  bottom: -700px;
  border: 1px solid #bbb;
  border-radius: 4px;
  transition: all 1s;
  background: #1c3053
}
.record-title {
  display: flex;
  height: 45%;
  padding: 10px;
}
.record-task-info {
  flex: 1;
  display: flex;
  .task-user {
    flex: 0 0 100px;
  }
  .task-title {
    padding: 0 10px;
    font-size: 16px;
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
.arrow-down {
  display: flex;
  justify-content: center;
  margin-top: -10px;
}
.arrow-down :hover{
  cursor:pointer;
}
.sign-list {
  flex: 0 0 500px;
  display: flex;
  justify-content: space-around;
}
.sign-list .item {
  display: inline-block;
  margin: 0 20px;
  line-height: 40px;
}
.record-info {
  padding: 10px;
  height: 55%;
  overflow: auto;
  .task-user {
    img {
      width: 100px;
      height: 100px;
    }
  }
}
.task-user-name {
  text-align: center;
}
.point-item {
  position: relative;
  margin-top: 70px;
  height: 5px;
  width: 100px;
  float: left;
  background: #ccc;
}
.point-item {
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
    top: -45px;
    text-align: center;
  }
  .point-time {
    width: 100%;
    position: absolute;
    top: -30px;
    text-align: center;
  }
}
.topBar{
  background: #1b3153;
}
.ivu-table-wrapper .ivu-table .ivu-table-tip{
  overflow-x: hidden!important;
}
.main-handle-top {
  flex: 0 0 55px;
  display: flex;
  button {
    height: 32px;
  }
}
</style>
