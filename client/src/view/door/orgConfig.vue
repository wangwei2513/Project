<template>
  <div class="orgConfig">
    <div class="bsMainChild" v-if="$BShasPower('BS-SETTING-DOOR-LIST-PAGE')">
      <div class="tab-content-alarm">
        <div class="feature-btn">
          <div class="btn">
            <Button v-if="$BShasPower('BS-SETTING-DOOR-LIST')" @click="synDoor" type="ghost" icon="ios-copy" :disabled='menuStatus'>获取门禁</Button>
            <Button type="ghost" icon="refresh" @click="refresh" :disabled='menuStatus' style = 'margin-left: 15px;'>刷新</Button>
          </div>
          <Input v-model="inSearchName" icon="ios-search" placeholder="请输入门禁编号、门禁名称" style="width: 250px;margin-right: 10px;" class="rt" @on-click="getSearchDoor"></Input>
        </div>
        <div class="table-relative" ref="tableBox">
          <Table v-if = 'tableHeight && tableWidth' size="small" :columns = "importTitle" :data = "dataSource" :height = "tableHeight" :width = 'tableWidth'></Table>
        </div>
        <div class="page-style">
          <Page class="rt" show-sizer :page-size-opts="$PageInfo.size" @on-page-size-change="pageSizeChange" :current="Number(current)" :total="Number(total)" :page-size="Number(limit)" @on-change="pageChange" show-elevator show-total></Page>
        </div>
      </div>
      <!--绑定模态框-->
      <Modal v-model="modal" :title="modalTitle" width="500">
        <div style="margin-bottom:20px;">门禁名称：{{doorName}}</div>
        <span>选择视频源：</span>
        <bs-scroll class="org-tree" height="400" v-if='modal' ref="bsScrollOrg">
          <VTree @on-expand="expand" ref='inTree' :options="treeOptions" :treeData="treeSource" @handlecheckedChange="bindResource"></VTree>
        </bs-scroll>
        <div slot="footer">
          <Button type="ghost" @click="editCancel()">取消</Button>
          <Button type="primary" @click="editOk()">确定</Button>
        </div>
      </Modal>
    </div>
  </div>
</template>
<script>
import './common.css'
import VTree from '../../components/tree/VTree.vue'
import mixinLink from './mixinLink'
import { mapState, mapActions } from 'vuex'
import toTreeData from 'assets/js/toTreeData'
export default {
  name: 'orgConfig',
  components: {
    VTree
  },
  mixins: [mixinLink],
  data() {
    return {
      // 表格
      importTitle: [
        {
          title: '门禁编号',
          key: 'chan',
          width: 150
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
          title: '绑定摄像机',
          key: 'camera',
          width: 200,
          render: (h, params) => {
            const showStatus = params.row.status ? '已绑定' : '未绑定'
            return h('div', [
              h(
                'span',
                {
                  style: {
                    marginRight: '15px'
                  }
                },
                showStatus
              ),
              h(
                'Button',
                {
                  props: {
                    type: 'primary',
                    size: 'small',
                    disabled: !this.$BShasPower('BS-SETTING-DOOR-LIST')
                  },
                  on: {
                    click: () => {
                      this.openMod(params.row, params.column, params.index)
                    }
                  }
                },
                '绑定'
              )
            ])
          }
        }
      ],
      // 搜索框中的内容
      inSearchName: '',
      // 弹出
      modal: false,
      modalTitle: '绑定摄像机',
      // 模态框名称
      doorName: '',
      // 树默认
      treeOptions: {
        showCheckbox: true,
        showInput: true
      },
      deviceResTree: [], // 设备树数据快照
      treeSource: [], // 树数据数据源
      mode: 0, // 0|设备列表接口1|关键字查询接口
      // 分页
      total: 0,
      limit: this.$PageInfo.limit,
      current: 1,
      // 表格数据
      dataSource: [],
      // 树勾选的节点
      postTreeId: {
        res: []
      },
      // 选中行的id
      rowId: '',
      // 列表高度
      tableHeight: '',
      tableWidth: ''
    }
  },
  created() {
    // 获取机构资源树
    this.getDoorTree()
      .then(res => {
        this.deviceResTree = toTreeData([res])
      })
      .catch(err => {
        console.log('this.getVideoTree :' + err)
      })
  },
  mounted() {
    this.$nextTick(() => {
      this.tableHeight = this.$refs['tableBox'].offsetHeight
      this.tableWidth = this.$refs['tableBox'].offsetWidth
    })
  },
  computed: {
    ...mapState({
      treeNode: ({ sysDoor }) => sysDoor.treeNode,
      getDoorHeader: ({ sysDoor }) => sysDoor.getDoorHead
    }),
    menuStatus() {
      return this.treeNode === ''
    }
  },
  methods: {
    ...mapActions(['getDoorSyn', 'queryDoors', 'getDoorList', 'getSources', 'postSources', 'getDoorTree']),
    // 绑定按钮
    openMod(row, column, index) {
      this.treeSource = []
      this.getSources(row._id)
        .then(res => {
          this.rowId = row._id
          this.doorName = row.name
          this.treeSource = JSON.parse(JSON.stringify(this.deviceResTree))
          if (res[0] && res[0].res.length > 0) {
            this.matchFun(this.treeSource, res[0].res)
          }
          this.modal = true
        })
        .catch(err => {
          console.log('this.getSources :' + err)
        })
    },
    // 树的回显
    matchFun(tree, ids) {
      tree.forEach(item => {
        if (item.children && item.children.length > 0) {
          item.children.forEach(oneRes => {
            if (ids.includes(oneRes._id)) {
              oneRes.checked = true
            }
          })
        }
        if (item && item.children) {
          this.matchFun(item.children, ids)
        }
      })
    },
    // modal取消
    editCancel() {
      this.modal = false
    },
    // modal确定    绑定资源
    editOk() {
      const data = {
        id: this.rowId,
        arr: this.postTreeId
      }
      if (this.postTreeId.res.length < 5) {
        this.postSources(data)
          .then(res => {
            this.getDoor()
            this.modal = false
            this.successMsg('绑定资源成功')
          })
          .catch(err => {
            console.log('this.postSources :' + err)
            this.errorMsg('绑定资源失败！')
          })
      } else {
        this.warningMsg('绑定的资源不能超过4个！')
      }
    },
    // 点击树节点设置绑定的资源
    bindResource() {
      this.postTreeId.res = []
      var nodes = this.$refs.inTree.getStoreRoot()
      this.getIdArr(nodes)
    },
    getIdArr(nodeArr) {
      nodeArr.forEach(item => {
        if (!item.children && item.checked) {
          this.postTreeId.res.push(item._id)
          console.log(this.postTreeId.res)
        }
        if (item && item.children) {
          this.getIdArr(item.children)
        }
      })
    },
    // 点击获取门禁按钮
    synDoor() {
      this.$Spin.show({
        render: h => {
          return h('div', [
            h('Icon', {
              class: 'demo-spin-icon-load',
              props: {
                type: 'load-c',
                size: 50
              }
            }),
            h('div', '正在获取数据。。。')
          ])
        }
      })
      this.getDoorSyn({
        id: this.treeNode,
        data: {
          page: 1,
          limit: this.limit
        }
      })
        .then(res => {
          this.dataSource = res
          this.handlePage()
          this.mode = 0
          this.$Spin.hide()
        })
        .catch(err => {
          this.$Spin.hide()
          if (err.response.data.code === 3008) {
            this.errorMsg(err.response.data.message)
          } else if (err.response.data.code === 3011) {
            this.errorMsg(err.response.data.message)
          } else {
            this.errorMsg('同步该门禁系统列表失败！')
          }
        })
    },
    // 获取门禁列表
    getDoor(page) {
      this.current = page || 1
      const postData = {
        id: this.treeNode,
        data: {
          page: this.current,
          limit: this.limit
        }
      }
      // 获取该门禁系统列表
      this.getDoorList(postData)
        .then(res => {
          this.dataSource = res
          this.handlePage()
          this.mode = 0
        })
        .catch(err => {
          this.errorMsg('获取该门禁系统列表失败！')
          console.log('this.getDoorList :' + err)
        })
    },
    // 刷新按钮
    refresh() {
      this.current = 1
      this.getDoor()
    },
    // 搜索门禁
    getSearchDoor() {
      this.getQueryDoor(1)
    },
    getQueryDoor(page) {
      this.current = page || 1
      const param = {
        _id: this.treeNode,
        data: {
          key: encodeURIComponent(this.inSearchName),
          page: this.current,
          limit: this.limit
        }
      }
      this.queryDoors(param)
        .then(res => {
          this.dataSource = res
          this.handlePage()
          this.mode = 1
        })
        .catch(err => {
          this.errorMsg('搜索门禁失败！')
          console.log('this.queryDoors :' + err)
        })
    },
    // 公共方法  表格及分页数据
    handlePage() {
      this.current = this.getDoorHeader.current
      this.total = this.getDoorHeader.counts
      this.limit = this.getDoorHeader.limits
    },
    // 分页功能
    pageChange(page) {
      this.current = page
      this.mode ? this.getQueryDoor(page) : this.getDoor(page)
    },
    pageSizeChange(size) {
      this.limit = size
      this.mode ? this.getQueryDoor(1) : this.getDoor(1)
    },
    expand() {
      this.$refs.bsScrollOrg.update()
    }
  }
}
</script>
<style lang="less" scoped>
.orgConfig {
  width: 100%;
  height: 100%;
  .bsMainChild {
    height: 100%;
    background-color: #1C3053;
    .tab-content-alarm{
      height: 100%;
      display: flex;
      flex-direction: column;
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
    .org-tree {
      width: 100%;
      height: 400px;
      overflow: auto;
      margin-top: 10px;
    }
  }
}
</style>
<style>
.demo-spin-icon-load {
  animation: animate 1s linear infinite;
}
@keyframes animate {
  from {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(180deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
