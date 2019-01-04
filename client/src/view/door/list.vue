/*
 * @Author: 于泳君
 * @Date: 2018-06-04 15:36:03
 * @Last Modified by: hansen.liuhao
 * @Last Modified time: 2018-07-21 15:08:23
 */
<template>
  <!-- 门禁 -->
  <div class="main-interface" style="overflow: inherit;">
    <div class="bs-left">
      <SrvSideBar @tigger-door='queryDoor'></SrvSideBar>
    </div>
    <div class="bs-main">
      <div class="bsMainChild">
        <div class="tab-content-alarm">
          <div class="feature-btn">
            <Button class = 'btn' type="ghost" icon="refresh" @click="refresh">刷新</Button>
            <Input v-model="searchInfor" icon="ios-search" placeholder="请输入门禁编号、门禁名称" style="width: 250px;margin-right: 10px;" class="rt" @on-click="getSearchDoor">
            </Input>
          </div>
          <div class="table-relative" ref="tableBox">
            <Table v-if = 'tableHeight && tableWidth' :columns= 'importTitle' :data= 'dataSource' :height= 'tableHeight' :width = 'tableWidth'></Table>
          </div>
          <div class="page-style">
            <Page class="rt" show-sizer :page-size-opts="$PageInfo.size" @on-page-size-change="pageSizeChange" :current='Number(current)' :total="Number(total)" :page-size="Number(limit)" @on-change="pageChange" show-elevator show-total></Page>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import './common.css'
import { mapState, mapMutations, mapActions } from 'vuex'
import SrvSideBar from './srvSideBar'
export default {
  name: 'door',
  components: {
    SrvSideBar
  },
  data() {
    return {
      // 表格
      importTitle: [
        {
          title: '门禁编号',
          key: 'chan'
        },
        {
          title: '门禁名称',
          key: 'name'
        },
        {
          title: '门禁类型',
          key: 'type',
          render: (h, params) => {
            let sysType = ''
            switch (Number(params.row.type)) {
              case 0:
                sysType = '门禁'
                break
              case 1:
                sysType = '闸机'
                break
              default:
                return
            }
            return h('div', [h('p', {}, sysType)])
          }
        },
        {
          title: 'IP地址',
          key: 'ip'
        },
        {
          title: '开门进出控制',
          key: 'inAndout',
          width: 200,
          render: (h, params) => {
            return h('div', [
              h(
                'Button',
                {
                  props: {
                    type: 'primary',
                    disabled: !this.$BShasPower('BS-DOOR-LIST-MANAGE')
                  },
                  style: {
                    marginRight: '10px'
                  },
                  on: {
                    click: () => {
                      if (!this.$BShasPower('BS-DOOR-LIST-MANAGE')) { return }
                      const data = {
                        _id: this.serverId,
                        number: params.row.chan,
                        opera: 1
                      }
                      this.openOrCloseDoor(data)
                        .then(res => {
                          this.$set(this.DoorRowState, 'c' + params.index, 1)
                          const times = setTimeout(() => {
                            this.$delete(this.DoorRowState, 'c' + params.index)
                            clearTimeout(times)
                          }, 3000)
                        })
                        .catch(err => {
                          // if (err.code === 2001) {
                          this.$set(this.DoorRowState, 's' + params.index, 1)
                          const times = setTimeout(() => {
                            this.$delete(this.DoorRowState, 's' + params.index)
                            clearTimeout(times)
                          }, 3000)
                          // this.warningMsg('未找到门禁服务器配置资源')
                          this.warningMsg(err.response.data.message)
                          // }
                          console.log('this.openOrCloseDoor :' + err)
                        })
                    }
                  }
                },
                '进'
              ),
              h(
                'Button',
                {
                  props: {
                    type: 'primary',
                    disabled: !this.$BShasPower('BS-DOOR-LIST-MANAGE')
                  },
                  style: {
                    marginRight: '10px'
                  },
                  on: {
                    click: () => {
                      if (!this.$BShasPower('BS-DOOR-LIST-MANAGE')) {
                        return
                      }
                      const data = {
                        _id: this.serverId,
                        number: params.row.chan,
                        opera: 2
                      }
                      this.openOrCloseDoor(data)
                        .then(res => {
                          this.$set(this.DoorRowState, 'c' + params.index, 1)
                          const times = setTimeout(() => {
                            this.$delete(this.DoorRowState, 'c' + params.index)
                            clearTimeout(times)
                          }, 3000)
                        })
                        .catch(err => {
                          // if (err.code === 2001) {outDoor
                          this.$set(this.DoorRowState, 's' + params.index, 1)
                          const times = setTimeout(() => {
                            this.$delete(this.DoorRowState, 's' + params.index)
                            clearTimeout(times)
                          }, 3000)
                          // this.warningMsg('未找到门禁服务器配置资源')
                          this.warningMsg(err.response.data.message)
                          // }
                          console.log('this.openOrCloseDoor :' + err)
                        })
                    }
                  }
                },
                '出'
              ),
              h(
                'span',
                {
                  class: 'c' + params.index,
                  style: {
                    marginRight: '5px',
                    color: '#0f0',
                    display: this.DoorRowState['c' + params.index] ? 'inline-block' : 'none'
                    // display: 'none',
                  }
                },
                '成功'
              ),
              h(
                'span',
                {
                  class: 's' + params.index,
                  style: {
                    marginRight: '5px',
                    color: '#f00',
                    // display: 'none',
                    display: this.DoorRowState['s' + params.index] ? 'inline-block' : 'none'
                  }
                },
                '失败'
              )
            ])
          }
        }
      ],
      // 控制文字(进/出)在调接口后是否显示
      // inDoor: false,
      // outDoor: false,
      DoorRowState: {},
      // 搜索框内容
      searchInfor: '',
      // 分页
      total: '',
      limit: this.$PageInfo.limit,
      current: 1,
      mode: 0, // 0|设备列表接口1|关键字查询接口
      // 表格数组
      dataSource: [],
      // 列表高度
      tableHeight: '',
      tableWidth: '',
      tableWrrpHeight: '100%',
      serverId: ''
    }
  },
  created() {
    // this.serverId ? this.getDoor() : ''
  },
  mounted() {
    this.$nextTick(() => {
      this.tableHeight = this.$refs['tableBox'].offsetHeight
      this.tableWidth = this.$refs['tableBox'].offsetWidth
    })
  },
  computed: {
    ...mapState({
      // serverId: ({ funDoor }) => funDoor.serverId,
      tableList: ({ sysDoor }) => sysDoor.tableLists,
      getDoorHeader: ({ sysDoor }) => sysDoor.getDoorHead
    })
  },
  methods: {
    ...mapMutations(['ALLOW_ENTRANCE_GUARD']),
    ...mapActions(['queryDoors', 'getDoorList', 'openOrCloseDoor']),
    // 响应服务器列表组件点击触发的事件
    queryDoor(params) {
      this.serverId = params.id
      this.getDoor()
    },
    // 刷新
    refresh() {
      this.$store.commit('ALLOW_ENTRANCE_GUARD', true)
      this.current = 1
      if (this.serverId === '') {
        this.errorMsg('请先选择门禁机构再刷新')
      } else {
        this.getDoor()
      }
    },
    // 获取门禁系统设备列表
    getDoor(page) {
      this.current = page || 1
      const postData = {
        id: this.serverId,
        data: {
          page: this.current,
          limit: this.limit
        }
      }
      this.getDoorList(postData)
        .then(res => {
          this.dataSource = res
          this.mode = 0
          this.current = this.getDoorHeader.current
          this.total = this.getDoorHeader.counts
          this.limit = this.getDoorHeader.limits
        })
        .catch(err => {
          this.errorMsg('获取该门禁系统列表失败！')
          console.log('this.getDoorList :' + err)
        })
    },
    // 按关键字搜索门禁设备
    getSearchDoor() {
      this.getQueryDoor()
    },
    getQueryDoor(page) {
      this.current = page || 1
      const param = {
        _id: this.serverId,
        data: {
          key: encodeURIComponent(this.searchInfor),
          page: this.current,
          limit: this.limit
        }
      }
      this.queryDoors(param)
        .then(res => {
          this.dataSource = res
          this.mode = 1
          this.current = this.getDoorHeader.current
          this.total = this.getDoorHeader.counts
          this.limit = this.getDoorHeader.limits
        })
        .catch(err => {
          this.errorMsg('搜索门禁编号、门禁名称失败！')
          console.log('this.queryDoors :' + err)
        })
    },
    // 分页功能
    pageChange(page) {
      this.current = page
      this.mode ? this.getQueryDoor(page) : this.getDoor(page)
    },
    pageSizeChange(n) {
      this.limit = n
      this.current = 1
      this.getDoor()
    }
  }
}
</script>

<style lang="less" scoped>
.main-interface {
  width: 100%;
  height: 100%;
  padding: 16px 0;
  display: flex;
  flex-direction: row;
  .bs-left {
    height: 100%;
  }
  .bs-main {
    flex-grow: 1;
    .bsMainChild {
      width: 100%;
      height: 100%;
      .tab-content-alarm {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background-color: #1C3053;
        .feature-btn {
          height: 64px;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          height: 64px;
          align-items: center;
          .rt {
            margin-right: 12px;
          }
          .btn {
            margin-left: 24px;
          }
        }
        .table-relative {
          // flex-grow: 1;
          flex: 1;
          overflow-y: auto;
        }
        .page-style {
          height: 40px;
          line-height: 40px;
          padding-right: 16px;
          background-color: #244575;
          display: flex;
          flex-direction: row;
          justify-content: flex-end;
        }
      }
    }
  }
}
</style>
