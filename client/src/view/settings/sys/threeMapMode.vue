<template>
    <div class="three-map-model">
          <div class="model-organiza">
            <h4>模型机构</h4>
            <bsr-tree :treeData="modelTreeData" ref="bstree" @node-click="treeClick">
              <template slot-scope="{ node }">
                <span :title="node.name">
                {{node.name}}
                </span>
              </template>
            </bsr-tree>
          </div>
          <div class="model-main">
            <h3 class="title">三维地图模型库</h3>
            <div class="model-main-header">
              <Button type='ghost' class='commonStyle ivu-btn ivu-btn-ghost' icon="ivu-icon ivu-icon-plus" @click="mapModelAdd" :disabled="isModelBtnAdd">添加</Button>
              <Button type='ghost' class='commonStyle ivu-btn ivu-btn-ghost' icon="ios-trash-outline" @click="mapModeldelete" :disabled="isModelChecked">删除</Button>
              <div class="search-model">
                  <Input :maxlength='64' v-model="inSearchName" @on-change='searchChange' placeholder="请输入模型名称" style="width: 250px;">
                  <Button slot="append" @click="searchModel" :icon="isIcon ? 'search' : 'close'"></Button>
                  </Input>
              </div>
            </div>
            <div class="model-content">
              <div class="model-box">
                  <div class="model-list" ref='height'>
                      <Table :height="tableHeight" highlight-row :columns="modelColumns" :data="modelListData" @on-current-change="selelctRow" @on-selection-change="selectModelRow"></Table>
                  </div>
              </div>
              <div class="model-content-image" ref='content'>
                  <h5>{{isModalAdjustShow?'模型预览':'模型图片'}}</h5>
                  <div class="model-image" ref='image'>
                    <img :src='imageSrc' alt="" v-if="!isModalAdjustShow">
                    <ModelPreview ref="modelPreview" v-else @mapReady="load3DMapReady"/>
                  </div>
                  <div class="model-status">
                    <div v-if="isModalAdjustShow">
                      <h5>模型调节</h5>
                      <div class="model-status-slider" style="padding-right:12px;margin-top:10px;">
                        <span>模型亮度</span>
                        <div class="model-status-slider-box">
                          <Slider v-model="brightnessValue" :max="1" :min="-1" :step="0.1" show-tip="never" @on-change="chengeBrightness"></Slider>
                        </div>
                        <div>
                          <input v-model="brightnessValue" readonly>
                        </div>
                      </div>
                      <div class="model-status-slider">
                        <span>离地高度</span>
                        <div class="model-status-slider-box">
                          <Slider v-model="surfaceHeightValue" :max="20" :min="surfaceHeightMinValue" :step="0.1" show-tip="never" @on-change="chengeSurfaceHeight"></Slider>
                        </div>
                        <div>
                          <input v-model="surfaceHeightValue" readonly>米
                        </div>
                      </div>
                      <div style="text-align:center;margin-top:16px">
                        <Button type="ghost" @click='modelDataCancel' style="margin-right:8px">取消</Button>
                        <Button type="primary" @click="modelDataSubmit">保存</Button>
                      </div>
                    </div>
                    <div v-else>
                      <Table :columns="statusColumns" :data="statusListData"></Table>
                    </div>
                  </div>
              </div>
            </div>
            <div class="model-page">
              <Page class="rt" show-sizer :page-size-opts="$PageInfo.size" @on-page-size-change="pageSizeChange" :current='Number(startNum)' :total="Number(inPageNum)" :page-size="Number(pageLimit)" @on-change="pageChange" show-elevator show-total></Page>
            </div>
          </div>
        <AddModal :isModal='isModal' :isModelAdd='isModelAdd' :nodeData='modelTreeObj' :updateData="updateData" @cancel="cancelModal"></AddModal>
    </div>
</template>

<script>
import AddModal from './threeMapMode/addModal'
import ModelPreview from './map/ModelPreview'
import { mapActions } from 'vuex'
export default {
  components: {
    AddModal,
    ModelPreview
  },
  data() {
    return {
      modelUrl: '', // 模型路径
      isModalAdjustShow: false, // 是否显示模型调节滑块
      brightnessValue: 0, // 模型亮度值
      surfaceHeightValue: 10, // 离地高度值
      surfaceHeightMinValue: 0.5, // 离地最小高度值
      // 模型机构树数据
      modelTreeData: {
      },
      // 模型表头
      modelColumns: [
        {
          type: 'selection',
          width: 100,
          align: 'center'
        },
        {
          type: 'index',
          width: 100,
          title: '序号',
          align: 'center'
        },
        {
          title: '模型名称',
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
                  title: params.row['name']
                }
              },
              params.row['name']
            )
          }
        },
        {
          title: '操作',
          key: 'operate',
          width: 80,
          render: (h, params) => {
            return h('div', [
              h('Button', {
                props: {
                  type: 'primary',
                  size: 'small'
                },
                style: {
                  marginRight: '30px'
                },
                on: {
                  click: () => {
                    this.updateModel(params.row)
                  }
                }
              }, '修改')
            ])
          }
        },
        {
          title: '  ',
          key: 'switch',
          render: (h, params) => {
            return h('div', [
              h('span', {
                style: {
                  marginRight: '20px'
                }
              }, '默认'),
              h('i-switch', {
                props: {
                  type: 'primary',
                  value: params.row.default
                },
                style: {
                  marginRight: '5px'
                },
                on: {
                  'on-change': (value) => {
                    this.isDefault(value, params.row._id) // 开关的状态
                  }
                }
              }, [
                h('span', {
                  slot: 'open'
                }),
                h('span', {
                  slot: 'close'
                })
              ])
            ])
          }
        }
      ],
      // 模型列表数据
      modelListData: [
      ],
      // 状态表头
      statusColumns: [
        {
          title: '状态',
          width: 70,
          key: 'status',
          render: (h, params) => {
            let status = params.row.status === 'online' ? '在线' : params.row.status === 'alarm' ? '报警' : '离线'
            return h('span', status)
          }
        },
        {
          title: '文件名',
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
                  title: params.row['name']
                }
              },
              params.row['name']
            )
          }
        }
      ],
      // 状态列表数据
      statusListData: [
      ],
      isIcon: true, // 搜索图标
      inSearchName: '', // 搜索内容
      startNum: 1, // 页码
      pageLimit: 100, // 每页条数
      inPageNum: 0, // 总共条数
      isUploadImg: true,
      isModelChecked: true, // 删除灰显
      isModal: false, // 弹出框显示
      isModelAdd: true, // 弹出框标题
      imageSrc: '', // 图片路径
      selectedIndex: [], // 选中项ID数组
      tableHeight: '',
      isModelBtnAdd: true, // 是否添加灰显
      modelTreeId: '', // 选中机构ID
      modelTreeObj: {}, // 机构树选中项
      updateData: {} // 修改条数据
    }
  },
  methods: {
    ...mapActions(['getModelOrganiza', 'getModelList', 'removeModelDelete', 'putModelDefault', 'getModelBrightnessHeight', 'putModelBrightnessHeight']),
    /**
     * 点击机构树选中项
     */
    treeClick(val) {
      // console.log(val, '机构树选中对象')
      if (!val.children) {
        this.isModelBtnAdd = false
      } else {
        this.isModelBtnAdd = true
      }
      this.imageSrc = ''
      this.modelTreeId = val._id
      this.modelTreeObj = val
      if (val.pid === 'root') {
        this.isModalAdjustShow = true
        this.$refs['content'].style.width = '400px'
        this.$refs['image'].style.height = '400px'
        if ((val.name === '辅助') || (val.name === '单兵') || (val.name === '报警求助')) {
          this.surfaceHeightMinValue = 0
          // this.surfaceHeightValue = 10
        } else {
          this.surfaceHeightMinValue = 0.5
          // this.surfaceHeightValue = 4
        }
      } else {
        this.isModalAdjustShow = false
        this.$refs['content'].style.width = '280px'
        this.$refs['image'].style.height = '280px'
      }
      this.getModelListData()
    },
    /**
     * 3D地图加载完成
     */
    load3DMapReady(param) {
      // console.log('3D地图加载完成')
      let modelPreview = this.$refs.modelPreview
      if (modelPreview.isMapReady) {
        modelPreview.addEntityModel(this.modelUrl, this.surfaceHeightValue, this.brightnessValue)
      }
    },
    /**
     * 搜索框内容改变
     */
    searchChange() {
      this.isIcon = true
    },
    /**
     * 搜索
     */
    searchModel() {
      if (!this.isIcon) {
        this.inSearchName = ''
      }
      this.startNum = 1
      this.isIcon = !this.isIcon
      this.getModelListData()
    },
    /**
     * 获取三维地图模型库列表
     */
    getModelListData() {
      const query = {
        page: this.startNum,
        limit: this.pageLimit,
        seek: this.inSearchName,
        oid: this.modelTreeId
      }
      this.getModelList(query).then(res => {
        this.statusListData = []
        this.modelListData = []
        if (res.data[0]) {
          this.modelListData = res.data
          this.modelListData[0]._highlight = true
          this.inPageNum = res.headers['x-bsc-count'] || 0
          this.statusListData = res.data[0].files
          if (res.data[0].picture) {
            this.imageSrc = res.data[0].picture.path
          }
        } else {
          this.isModelChecked = true
        }
        if (this.isModalAdjustShow) {
          if (res.data[0]) {
            // this.getModelBrightnessHeightData()
            this.modelUrl = res.data[0].files[0].path
            let modelPreview = this.$refs.modelPreview
            if (modelPreview.isMapReady) {
              modelPreview.clearEntityModel()
            }
            this.getModelBrightnessHeightData()
          } else {
            this.modelUrl = ''
            let modelPreview = this.$refs.modelPreview
            if (modelPreview.isMapReady) {
              modelPreview.clearEntityModel()
            }
          }
        }
        // console.log(res, '获取到的列表')
      }).catch((err) => {
        // this.errorMsg('三维地图模型库列表获取失败')
        console.log(err, '三维地图模型库列表获取失败')
      })
    },
    /**
     * 获取三维地图亮度和高度数据
     */
    getModelBrightnessHeightData() {
      this.getModelBrightnessHeight(this.modelTreeId).then(res => {
        this.brightnessValue = res.data.brightness
        this.surfaceHeightValue = res.data.height
        let modelPreview = this.$refs.modelPreview
        if (modelPreview.isMapReady) {
          modelPreview.addEntityModel(this.modelUrl, this.surfaceHeightValue, this.brightnessValue)
        }
      }).catch(err => {
        console.log(err, '获取的亮度和高度数据错误')
        let modelPreview = this.$refs.modelPreview
        if (modelPreview.isMapReady) {
          modelPreview.clearEntityModel()
        }
      })
      // console.log(this.$refs.modelPreview, '修改滑块时')
      // this.$refs.modelPreview.addEntityModel(this.modelUrl, this.surfaceHeightValue, this.brightnessValue)
    },
    /**
     * 修改三维地图亮度滑块
     */
    chengeBrightness(val) {
      // console.log(val)
      if (this.modelUrl) {
        this.$refs.modelPreview.changeModelBrightness(this.modelUrl, this.surfaceHeightValue, val)
      } else {
        this.errorMsg('请添加三维地图')
      }
    },
    /**
     * 修改三维地图高度滑块
     */
    chengeSurfaceHeight(val) {
      if (this.modelUrl) {
        this.$refs.modelPreview.changeModelHeight(this.modelUrl, val, this.brightnessValue)
      } else {
        this.errorMsg('请添加三维地图')
      }
    },
    /**
     * 提交服务器三维地图高度和亮度数据
     */
    modelDataSubmit() {
      if (this.modelUrl) {
        const query = {
          id: this.modelTreeId,
          content: {
            brightness: this.brightnessValue,
            height: this.surfaceHeightValue
          }
        }
        this.putModelBrightnessHeight(query).then(res => {
          // console.log(res,"提交服务器三维地图高度和亮度数据")
          this.successMsg('保存成功')
        }).catch(err => {
          console.log(err, '提交服务器三维地图高度和亮度数据错误')
        })
        this.getModelBrightnessHeightData()
      } else {
        this.errorMsg('请添加三维地图')
      }
    },
    /**
     * 取消提交服务器三维地图高度和亮度数据
     */
    modelDataCancel() {
      this.getModelBrightnessHeightData()
      // this.chengeBrightness(this.brightnessValue)
      // this.chengeSurfaceHeight(this.surfaceHeightValue)
    },
    /**
     * 点击修改按钮
     */
    updateModel(row) {
      this.isModal = true
      this.isModelAdd = false
      // console.log(row, '点击修改按钮本行数据')
      this.updateData = row
      this.modelTreeData.children.forEach((item, index) => {
        if (item._id === row.oid) { // 判断修改项为单兵、辅助
          this.modelTreeObj = {
            pid: item.pid,
            _id: item._id
          }
        }
        if (item.children) {
          item.children.forEach((val, index) => {
            if (val._id === row.oid) {
              this.modelTreeObj = {
                pid: val.pid,
                _id: val._id
              }
            }
          })
        }
      })
    },
    /**
     * 点击添加按钮
     */
    mapModelAdd() {
      this.isModal = true
      this.isModelAdd = true
    },
    /**
     * 点击删除按钮
     */
    mapModeldelete() {
      if (this.selectedIndex.length === 0) {
        this.warningMsg('请选择需要删除的服务器')
        return
      }
      this.$Modal.confirm({
        title: '提示',
        content: '<p>确认删除所选维修单位吗？</p>',
        onOk: () => {
          this.deleteSelectModel()
        },
        onCancel: () => { }
      })
    },
    /**
     * 点击删除弹框确认
     */
    deleteSelectModel() {
      // console.log(this.selectedIndex, '删除数据的ID组')
      this.removeModelDelete(this.selectedIndex).then(res => {
        this.successMsg('模型删除成功')
        this.getModelListData()
        this.isModelChecked = true
      }).catch((err) => {
        if (err.response.data.code === 500) {
          this.errorMsg(err.response.data.message)
        } else {
          this.errorMsg('模型删除失败')
        }
      })
    },
    /**
     * 每页条数改变
     */
    pageSizeChange(n) {
      this.pageLimit = n
      this.getModelListData()
    },
    /**
     * 页码改变
     */
    pageChange(n) {
      this.startNum = n
      this.getModelListData()
    },
    /**
     * 点击默认开关
     */
    isDefault(value, id) {
      this.putModelDefault({ id: id, content: JSON.stringify({ default: value }) }).then(res => {
        if (value) {
          this.successMsg('设置默认成功')
        } else {
          this.successMsg('关闭默认成功')
        }
        this.getModelListData()
      }).catch(() => {
        this.errorMsg('设置默认失败')
      })
    },
    /**
     * 点击列表行执行
     */
    selelctRow(row) {
      // console.log(row, '点击行数据')
      if (row) {
        this.statusListData = row.files
        // console.log(this.statusListData, '右侧状态列表数据')
        if (row.picture) {
          this.imageSrc = row.picture.path
        } else {
          this.imageSrc = ''
        }
        if (this.isModalAdjustShow) {
          let modelPreview = this.$refs.modelPreview
          if (row.files[0]) {
            this.modelUrl = row.files[0].path
            modelPreview.addEntityModel(this.modelUrl, this.surfaceHeightValue, this.brightnessValue)
          } else {
            this.modelUrl = ''
            modelPreview.clearEntityModel()
          }
        }

        // console.log(this.imageSrc, '点击行图片路径')
      }
    },
    /**
     * 子组件模态框回调
     */
    cancelModal() {
      this.isModal = false
      this.isModelAdd = true
      this.getModelListData()
    },
    /**
     * 列表选中项改变时调用
     */
    selectModelRow(sel) {
      // console.log(sel,"选择")
      this.selectedIndex = []
      if (sel.length === 0) {
        this.isModelChecked = true
      } else {
        this.isModelChecked = false
      }
      sel.forEach((value, index) => {
        this.selectedIndex.push(value._id)
      })
    },
    resizefun() {
      this.tableHeight = this.$refs['height'].offsetHeight - 39
    }
  },
  created() {
    this.getModelListData()
    this.getModelOrganiza().then(res => {
      // console.log(res, '机构树数据')
      this.modelTreeData = res.data
    }).catch(() => {
      this.errorMsg('机构树获取失败')
    })
  },
  mounted() {
    this.tableHeight = this.$refs['height'].offsetHeight - 39
    window.addEventListener('resize', this.resizefun)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizefun)
    this.resizefun = null
  }
  /* watch: {
    modelUrl: function(val) {
      if (this.isModalAdjustShow) {
        let modelPreview = this.$refs.modelPreview
        if (modelPreview.isMapReady) {
          modelPreview.addEntityModel(val, this.surfaceHeightValue, this.brightnessValue)
        }
      }
    }
  } */
}
</script>

<style scoped>
.three-map-model {
  width: 100%;
  height: 100%;
  background: #0C1B32;
  display: flex;
  overflow: hidden;
}
h3 {
  font-size: 14px;
  height: 38px;
  line-height: 38px;
  background: #0f2243;
  padding-left: 24px;
  font-weight: normal;
  margin-bottom: 15px;
}
.model-organiza{
  width: 250px;
  height: 100%;
  margin-right: 15px;
  background: #1B3153;
}
h4 {
  text-align: center;
  line-height: 38px;
  height: 38px;
  background: #0f2243;
}
h5 {
  text-align: center;
  line-height: 38px;
  height: 38px;
  background: #244575;
}
.model-main{
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1B3153;
  position: relative;
}
.model-main-header {
  padding: 0 24px;
}
.model-content{
  width: 100%;
  margin-top: 15px;
  flex: 1;
  display: flex;
}
.commonStyle {
  margin-right: 8px;
  height: 32px;
}
.search-model {
  float: right;
  margin-right: 312px;
}
.select-itme {
  float: right;
  margin-right: 8px;
}
.model-box {
  width: calc(100% - 314px);
  height: 100%;
  flex: 1;
  position: relative;
  overflow: hidden;
}
.model-list {
  width: 100%;
  position: absolute;
  height: 100%;
}
.model-content-image {
  width: 280px;
  margin: 0 16px;
}
.model-image {
  width: 100%;
  height: 280px;
  margin-top: 16px;
}
.model-image img{
  width: 100%;
  height: 100%;
}
.model-name-status{
  padding-left: 50px;
  margin-top: 20px;
}
.model-status{
  width: 100%;
  margin-top: 15px;
}
.model-status-slider-box {
  margin: 0 15px;
  flex: 1;
}
.model-status-slider {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: flex-start;

}
.model-status-slider input {
  width: 36px;
  height: 20px;
  background: #727D8F;
  color: #fff;
  text-align: center;
  border: 1px solid #1B3153;
  border-radius: 4px;
  margin-right: 3px;
}
.model-page {
  width: 100%;
  padding: 3px 24px;
  position: absolute;
  bottom: 0;
  left: 0;
  background: #244575;
}
.rt {
  float: right;
}
.ivu-modal-body .form-content{
  width: 100%;
  max-height: 348px;
  overflow-y: auto;
}
</style>
