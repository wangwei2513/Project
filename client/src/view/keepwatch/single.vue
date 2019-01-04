<template>
  <div class="single-content" >
    <div class="single-left">
      <VTree @node-click="nodeClick" :activeId="orgInfo.id" :treeData="orgTreeData"></VTree>
    </div>
    <div class="single-main">
      <div class="main-handle-top">
        <div class="handle-left">
          <Button type="ghost" @click="refresh" icon="android-refresh">刷新</Button>
        </div>
        <div class="handle-right">
          <DatePicker type="date" @on-change="searchStartTimeChange"  placeholder="开始日期" :editable="false"></DatePicker>
          <span>至</span>
          <DatePicker type="date" @on-change="searchEndTimeChange"  placeholder="结束日期" :editable="false"></DatePicker>
          <Input v-model="searchData.key" placeholder="接收人或者SN" style="width: 150px"></Input>
          <Button @click="searchSingle" icon="ios-search">搜索</Button>
        </div>
      </div>
      <div class="main-table" ref="tableBox" v-resize="resizeFun">
        <div class="main-table-content">
          <Table size="small" highlight-row :columns="tableColumns" :data="singleList" :height="tableHeight"></Table>
        </div>
      </div>
      <div class="main-footer">
        <div style="float: right;">
          <Page show-sizer :page-size-opts="$PageInfo.size" @on-page-size-change="pageSizeChange" :show-total="true" :page-size="pageLimit" :show-elevator="true" :total="pageInfo.count" :current="pageInfo.cur" @on-change="changePage"></Page>
        </div>
      </div>
    </div>
    <div v-if="isSingleVideo">
      <Modal v-model="isSingleVideo" width="640px" title="消息详情" :mask-closable="false">
        <div class="single-video" style="height:464px">
          <SinglePawn :videoParam="singleInfo"></SinglePawn>
        </div>
        <div slot="footer"></div>
      </Modal>
    </div>
  </div>
</template>
<script>
import { mapState, mapActions, mapMutations } from 'vuex'
import moment from 'moment'
import SinglePawn from 'components/video/PawnBack'
export default {
  components: {
    SinglePawn
  },
  data() {
    return {
      isSingleVideo: false,
      pageLimit: this.$PageInfo.limit,
      getType: 1,
      orgInfo: {
        id: '',
        name: ''
      },
      singleInfoData: {
        name: '',
        sn: '',
        startTime: null,
        dsId: ''
      },
      searchData: {
        key: '',
        startTime: '',
        endTime: '',
        org: '',
        recipient: ''
      },
      tableHeight: 0,
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
          align: 'center',
          ellipsis: true
        },
        {
          key: 'sender',
          title: '发起人',
          align: 'center',
          ellipsis: true
        },
        {
          key: 'recipient',
          title: '接收人',
          align: 'center',
          ellipsis: true
        },
        {
          title: '时间',
          align: 'center',
          ellipsis: true,
          render: (h, param) => {
            return h('span', moment(param.row.createdAt).format('YYYY-MM-DD HH:mm'))
          }
        },
        {
          key: 'sn',
          title: '设备SN码',
          align: 'center',
          ellipsis: true
        },
        {
          type: 'action',
          title: '操作',
          align: 'center',
          width: 150,
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
                      this.showVideo(params.row)
                    }
                  }
                },
                '查看'
              )
            ])
          }
        }
      ]
    }
  },
  computed: {
    ...mapState({
      singleList: state => state.patrol.singleList,
      orgTreeData: ({ orgSetting }) => {
        return orgSetting.orgTreeData
      },
      pageInfo: state => state.patrol.pageInfo
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
    this.getOrgTree(3)
    this.getSingleList({ limit: this.pageLimit })
  },
  mounted() {
    this.tableHeight = this.$refs['tableBox'].offsetHeight + 69
  },
  methods: {
    ...mapMutations(['UPDATE_PAGEINFO']),
    ...mapActions(['getSingleList', 'getSingleInfo', 'getOrgTree', 'recordLog']),
    /**
     * 获取机构树
     * @method nodeClick
     * @param {Object} item 机构信息
     */
    nodeClick(item) {
      this.getType = 1
      this.orgInfo.id = item._id
      this.searchData.org = item._id
      this.paramData.page = 1
      this.getSingleList({ org: item._id, limit: this.pageLimit })
    },
    /**
     * 刷新
     * @method refresh
     */
    refresh() {
      this.orgInfo.id = ''
      this.getType = 1
      this.paramData.org = ''
      this.getSingleList({ limit: this.pageLimit })
    },
    /**
     * 查看视频详情
     * @method showVideo
     * @param {Object} data 详情信息
     */
    showVideo(data) {
      this.getSingleInfo({ id: data._id }).then(res => {
        const singleInfoData = {
          name: res.data.userName,
          sn: res.data.sn,
          startTime: res.data.time,
          dsId: res.data.storage
        }
        this.singleInfo = singleInfoData
        this.isSingleVideo = true
        this.recordLog({logType: '操作日志', module: '电子巡查', operateName: '接收消息', operateContent: '接收消息+ 单兵账号', target: singleInfoData.name})
      })
    },
    /**
     * 根据页码获取详情
     * @method searchStartTimeChange
     * @param {Object} n 页码
     */
    changePage(n) {
      let param = Object.assign(this.paramData, { page: n })
      this.getSingleList(param)
    },
    pageSizeChange(n) {
      this.pageLimit = n
      let param = Object.assign(this.paramData, { page: 1 })
      this.getSingleList(param)
    },
    /**
     * 根据条件进行搜索
     * @method searchSingle
     */
    searchSingle() {
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
        this.getSingleList(this.paramData)
      }
    },
    /**
     * 根据开始结束时间进行查询
     * @method searchStartTimeChange
     * @param {Object} time 时间
     */
    searchStartTimeChange(time) {
      this.searchData.startTime = time
    },
    searchEndTimeChange(time) {
      this.searchData.endTime = time
    },
    /**
     * 表格高度调节
     * @method resizeFun
     */
    resizeFun() {
      this.tableHeight = this.$refs['tableBox'].offsetHeight
    }
  }
}
</script>

<style lang="less"  scoped>
.single-content{
  display: flex;
  flex: 1;
  padding: 16px 0;
  .single-left{
    flex: 0 0 272px;
    background: #1b3153;
    margin-right: 16px;
    overflow: hidden;
    min-height: 670px;
  }
  .single-main{
    flex: 1;
    display: flex;
    min-height: 670px;
    flex-direction:column;
    background: #1c3053;
    .handle-right{
      float: right;
      padding: 12px 24px;
      Button {
        margin-left: 8px;
      }
    }
    .handle-left{
      float: left;
      padding: 12px 24px;
    }
  }
  .main-table{
    flex: 1;
    .main-table-content{
      width: calc(~'100% - 288px');
      background: #1c3053;
      display: flex;
      // height: 100%;
      flex-direction: column;
      position: absolute;
    }
  }
  .main-footer{
      padding: 3px 10px;
      background-color: #244575;
      border: none;
      height: 40px;
  }
  .single-video{
    height: 600px;
  }
}

</style>
