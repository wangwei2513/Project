<!--编辑模式 楼宇的右边编辑框的页面-->
<template>
  <div class="areaHome">
    <div class="areaHeader">
      <div class="areaHeaderTittle">
        <p>楼层</p>
      </div>
    </div>
    <div class="builddetail">
      <div v-if="!detail" class="buildTable">
        <div class="floors">
          <bs-scroll ref="scroller1">
            <Table border :columns="floors" :data="floorList"></Table>
          </bs-scroll>

          <!-- <div class="tableFooter">
            <div class="paging">
              <div>
                <Page simple size="small" :total="buildPage.count" :page-size="buildPage.limit" :current="buildPage.cur" @on-change="changePage"></Page>
              </div>
            </div>
          </div> -->
        </div>
        <div class="areaFooter">
          <Button type="primary" @click="addSingleFloor">添加</Button>
          <Button type="ghost" @click="backToBuilding">返回</Button>
        </div>
      </div>
      <div v-if="detail" class="areaContent">
        <Tabs value="floorInfo">
          <TabPane label="楼层信息" name="floorInfo">
            <bs-scroll ref="scroller2">
              <div class="buildingInfo">
                <Form ref="floorData" :model="floorData" :rules="floorRuleValidate" :label-width="70" label-position="left">
                  <Form-item label="楼层名称" prop="name">
                    <Input :maxlength="16" :disabled="!is3dMapOuter" v-model="floorData.name" placeholder="请输入" />
                  </Form-item>
                  <FormItem v-if="is3dMapOuter" label="楼层文件" prop="picture.id">
                    <Row>
                      <Col span="15">
                      <Input v-model="floorData.picture.id" disabled placeholder="请选择地图文件" style="float:left" />
                      </Col>
                      <Col span="4">
                      <Upload :show-upload-list="false" action="/api/upload" :on-success="uploadEditSuccess" :multiple="false" ref="upload" :format="['jpg','jpeg','png']" :on-format-error="mapFormatError">
                        <Button type="ghost" icon="ios-cloud-upload-outline">浏览</Button>
                      </Upload>
                      </Col>
                    </Row>
                  </FormItem>
                  <Form-item label='联系人'>
                    <Input :maxlength='8' :disabled="!is3dMapOuter" v-model="floorData.pid.name" placeholder="请输入联系人" />
                  </Form-item>
                  <Form-item label='联系电话'>
                    <Input :maxlength='18' :disabled="!is3dMapOuter" v-model="floorData.pid.mobile" placeholder="请输入联系人电话" />
                  </Form-item>
                  <Form-item label="简介">
                    <Input :maxlength='150' :disabled="!is3dMapOuter" v-model="floorData.desc" type="textarea" :autosize="{minRows: 2,maxRows: 5}" />
                  </Form-item>
                  <Form-item class="floors">
                    <Button type="primary" v-if="is3dMapOuter" @click="addFloor" class="addBtn">{{addBtnMsg}}</Button>
                    <Button type="ghost" @click="cancel">取消</Button>
                  </Form-item>
                </Form>
              </div>
            </bs-scroll>
          </TabPane>
        </Tabs>
      </div>
    </div>
  </div>
</template>
<script>
import { mapState, mapMutations, mapActions } from 'vuex'
import contentWay from '../contentWay'
import { telNumCheck, peopleNameLengthCheck } from '../../formCheck'
export default {
  components: {
    contentWay
  },

  data() {
    // 楼层信息校验
    const floorName = (rule, value, callback) => {
      if (value === '') {
        return callback(new Error('楼层名称不能为空'))
      }
      let strlength = value.replace(/[\u0391-\uFFE5]/g, 'aa').length
      if (strlength > 16) {
        return callback(new Error('楼层名称长度超过16个字符'))
      } else {
        callback()
      }
    }
    // 电话号码
    const validateTelephone = (rule, value, callback) => {
      let reg = /^1[34578]\d{9}$/
      if (!value || reg.test(value)) {
        callback()
      } else {
        return callback(new Error('请输入正确的电话号码'))
      }
    }
    return {
      detail: false,
      searchVal: '', // 搜索字段
      // 楼层表格
      floors: [
        {
          title: '楼层',
          key: 'name',
          width: 80,
          render: (h, params) => {
            return h('div', [
              // h("Icon", {
              //   props: {
              //     type: "person"
              //   }
              // }),
              h('strong', params.row.name)
            ])
          }
        },
        {
          title: '操作',
          key: 'action',
          width: 179,
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
                      this.floorEdit(params.index)
                    }
                  }
                },
                '编辑'
              ),
              h(
                'Button',
                {
                  props: {
                    type: 'error',
                    size: 'small'
                  },
                  style: { marginRight: '5px' },
                  on: {
                    click: () => {
                      this.levelRemove(params.row._id)
                    }
                  }
                },
                '删除'
              ),
              h(
                'Button',
                {
                  props: {
                    type: 'primary',
                    size: 'small'
                  },
                  on: {
                    click: () => {
                      this.changemMap(params)
                    }
                  }
                },
                '查看楼层'
              )
            ])
          }
        }
      ],
      buildPage: {},
      floorData: {
        // 楼层表单
        bid: '',
        name: '', // 楼层名称
        class: '',
        // 地图文件
        picture: {
          id: '',
          name: ''
        },
        desc: '', // 楼层简介
        // 联系人
        pid: {
          name: '',
          mobile: ''
        }
      },
      floorRuleValidate: {
        name: [{ required: true, validator: floorName, trigger: 'change' }],
        'picture.id': [{ required: true, message: '楼层文件不能为空', trigger: 'blur' }],
        'pid.mobile': [{ required: false, validator: validateTelephone, message: '电话格式不正确', trigger: 'blur' }]
      },
      addBtnMsg: '添加楼层',
      eidtFlag: false,
      floorIndex: 0,
      buildingListFlag: false,
      screenHeight: document.body.clientHeight, // 监听屏幕比例变化
      mapChangeFlag: false
    }
  },
  computed: {
    ...mapState({
      floorList: ({ TdMap }) => TdMap.floorList,
      is3dMapOuter: ({ TdMap }) => TdMap.is3dMapOuter,
      goBackToBildingList: ({ TdMap }) => TdMap.goBackToBildingList,
      showBuildingList: ({ TdMap }) => TdMap.showBuildingList,
      floorOneData: ({ TdMap }) => TdMap.floorOneData,
      // detail: ({ TdMap }) => TdMap.detail,
      floorDataBid: ({ TdMap }) => TdMap.floorDataBid
    })
  },
  watch: {
    screenHeight(val) {
      console.log(val)
      this.update()
    },
    goBackToBildingList(val) {
      if (val) {
        // this.$store.commit('SET_3D_DETAIL', 'showBuildIngList')
        this.detail = true
      }
    }
  },
  methods: {
    ...mapMutations([
      'SET_DEFAULTACTIVESTATE', // tab默认标签
      'SET_FLOORONEDATA', // 单个楼层数
      'SET_ISOUTER' // 切换地图
    ]),
    ...mapActions([
      'setBuildingInfo',
      'getSingleFloorInfo',
      'removeFloor',
      'editFloorInfo',
      'addFloors',
      'getAllFloors',
      'deleteBuildingInfo',
      'getAllBuildingInfo',
      'buildingInfoEdit',
      'getBuildingInfo',
      'get3DResourceOrg',
      'get3DBuildPaging',
      'getPatrolPointTree'
    ]),
    // 添加楼层
    addFloor() {
      let flag = telNumCheck([this.floorData.pid])
      if (flag) {
        this.errorMsg('联系方式输入有误，仅支持数字和(-)')
        return
      } else {
        let result = peopleNameLengthCheck([this.floorData.pid])
        if (result.flag) {
          this.errorMsg('第' + result.index + '个负责人长度超过16个字符')
          return
        }
      }
      if (this.addBtnMsg === '添加楼层') {
        console.log(this.floorData)
        this.$refs['floorData'].validate(valid => {
          if (valid) {
            // 添加楼层方法
            this.addFloors(this.floorData)
              .then(res => {
                this.$Notice.success({
                  title: '添加楼层成功！',
                  desc: ''
                })
                // 添加楼层成功后返回所有楼层，切换视图---
                this.getAllFloors(this.floorData.bid)
                  .then(res => {
                    this.cancel()
                  })
                  .catch(err => {
                    console.log(err)
                    this.cancel()
                  })
              })
              .catch(err => {
                console.log(err.response)
                this.$Notice.error({
                  title: '添加楼层失败！',
                  desc: err.response.data.message
                })
              })
          } else {
            this.errorMsg('表单验证失败!')
          }
        })
      } else {
        let playod = null
        if (this.floorData.name === this.floorOneData.name) {
          playod = {
            picture: this.floorData.picture,
            desc: this.floorData.desc,
            class: this.floorData.class,
            pid: this.floorData.pid,
            _id: this.floorData._id
          }
        } else {
          playod = this.floorData
        }
        this.$refs['floorData'].validate(valid => {
          if (valid) {
            // 修改楼层
            this.editFloorInfo([this.floorData._id, playod])
              .then(res => {
                this.$Notice.success({
                  title: '修改楼层成功！',
                  desc: ''
                })
                // 修改成功后，获取所有楼层，更新视图
                this.getAllFloors(this.floorData.bid._id)
                  .then(res => {
                    this.cancel()
                  })
                  .catch(err => {
                    console.log(err)
                    this.cancel()
                  })
              })
              .catch(err => {
                this.$Notice.error({
                  title: '修改楼层失败！',
                  desc: err.response.data.message
                })
              })
          } else {
            this.errorMsg('表单验证失败!')
          }
        })
      }
    },
    // 滚动条高度变化
    update() {
      if (this.detail) {
        this.$refs.scroller2.update()
      } else {
        this.$refs.scroller1.update()
      }
    },
    // 编辑楼层-----
    floorEdit(index) {
      this.getSingleFloorInfo(this.floorList[index]._id)
        .then(res => {
          this.floorData = JSON.parse(JSON.stringify(res))
          this.addBtnMsg = '保存修改'
          this.detail = true
        })
        .catch(err => {
          this.$Message.error(err.response.data.message)
          this.getAllFloors(this.floorList[index].bid)
            .then(res => {})
            .catch(err => {
              console.log(err)
            })
        })
    },
    // 删除楼层
    levelRemove(id) {
      this.$Modal.confirm({
        title: '警告',
        content: '<p>确认删除所选楼层吗？</p>',
        onOk: () => {
          this.removeFloor(id)
          this.getAllFloors(this.floorData.bid)
            .then(res => {
              this.cancel()
            })
            .catch(err => {
              console.log(err)
              this.cancel()
            })
        },
        onCancel: () => {}
      })
    },
    // 楼层图片上传成功后的回调------
    uploadEditSuccess(val) {
      this.floorData.picture.id = val.id
      this.floorData.picture.name = val.name
    },
    // 上传图片的各式验证-------
    mapFormatError(file) {
      this.$Notice.warning({
        title: '文件格式不正确',
        desc: '文件 ' + file.name + ' 格式不正确，请上传 jpg、jpeg 或 png 格式的图片。'
      })
    },
    cancel() {
      // this.eidtFlag = false
      this.addBtnMsg = '添加楼层'
      this.floorData.bid = this.floorDataBid
      this.floorData.name = ''
      this.floorData.class = ''
      this.floorData.picture.id = ''
      this.floorData.picture.name = ''
      this.floorData.desc = ''
      this.floorData.pid.name = ''
      this.floorData.pid.mobile = ''
      // this.$store.commit('SET_3D_DETAIL', 'showFloors')
      this.detail = false
      this.$store.commit('SET_ISOUTER', true)
      this.get3DResourceOrg({ maptype: '3d' })
        .then(res => {})
        .catch(err => {
          console.log(err)
        })
      this.$store.commit('SET_EDITHIGHTLIGHT_LIST', [])
    },
    buildSelectOne(selection, row) {
      console.log('buildSelectOne', selection, row)
    },
    buildSelectAll(selection) {
      console.log('buildSelectAll', selection)
    },
    changePage(val) {
      this.get3DBuildPaging({ page: val, name: this.searchVal })
    },
    // 按钮显示楼层列表
    addFloorBtn(code) {
      console.log(code)
      this.getAllFloors(code).then(res => {
        console.log('根据楼宇编码获取楼宇下的所有楼层列表：' + res)
        // this.$store.commit('SET_3D_DETAIL', 'showFloors')
        this.detail = false
        this.floorData.bid = code
        console.log('this.floorList', this.floorList)
      })
    },
    addSingleFloor() {
      // this.$store.commit('SET_3D_DETAIL', 'edit')
      this.detail = true
    },
    backToBuilding() {
      this.$store.commit('SET_ISOUTER', true)
      this.$store.commit('SET_3D_EDIT_RIGHT_CONTENT', 'buildingInfo')
    },
    // 切换图层
    changemMap(param) {
      this.getSingleFloorInfo(param.row._id).then(res => {
        if (res) {
          // 根据楼层id切换资源树
          this.$store.commit('SET_ISOUTER', false)
          this.floorData = JSON.parse(JSON.stringify(res))
          this.addBtnMsg = '保存修改'
          this.detail = true
        } else {
          this.getAllFloors(this.floorData.bid)
            .then(res => {
              this.cancel()
            })
            .catch(err => {
              console.log(err)
              this.cancel()
            })
        }
      })
    }
  },
  created() {},
  mounted() {
    this.floorData.bid = this.floorDataBid
    this.floorData = JSON.parse(JSON.stringify(this.floorOneData))
    if (!this.is3dMapOuter) {
      this.detail = true
    }
    this.resizeFn = () => {
      return (() => {
        window.screenHeight = document.body.clientHeight
        this.screenHeight = window.screenHeight
      })()
    }
    window.addEventListener('resize', this.resizeFn)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeFn)
    this.resizeFn = null
  }
}
</script>
<style scoped>
.areaHome,
.areaHome .builddetail,
.areaHome .builddetail .areaContent,
.areaHome .builddetail .areaContent .areaContentMain,
.areaHome .areaContent .areaContentMain .areaContentInfo,
.areaHome .areaContent .areaContentMainForm {
  width: 300px;
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
}
.areaHome .areaContent .buildEditMain {
  padding: 0px 20px;
}
.areaHome .areaHeader {
  height: 40px;
  width: 100%;
  line-height: 40px;
  text-align: center;
  clear: both;
  background-color: #0f2343;
  font-size: 14px;
  display: flex;
  flex-direction: row;
}
.areaHome .areaHeader .areaHeaderTittle {
  flex: 1;
}
.areaHome .areaHeader .areaHeaderContent {
  width: 40px;
  height: 40px;
  cursor: pointer;
}
.areaHome .areaHeader .areaHeaderContent:hover {
  color: #20adff;
}
.areaHome .areaHeader .areaHeaderContent p {
  display: inline;
  margin: 0px 10px;
}
.areaHome .buildTable {
  display: flex;
  flex: 1;
  flex-direction: column;
}
.areaHome .buildTable .buildTableSearch {
  margin-bottom: 10px;
}
.areaHome .buildTable .buildTableSearch + div {
  flex: 1;
}
.areaHome .buildTable .tableFooter {
  padding: 10px;
  clear: both;
  width: 100%;
  height: 26px;
  line-height: 26px;
}
.areaHome .buildTable .tableFooter .pagingButton {
  float: left;
}
.areaHome .buildTable .tableFooter .paging {
  float: right;
}
.areaHome .buildTable .tableFooter .paging .ivu-page-simple .ivu-page-simple-pager input {
  vertical-align: middle;
  line-height: 18px;
}
.areaHome .areaContent .areaContentHeader {
  width: 100%;
  height: 50px;
}
.areaHome .areaContent .areaContentTittle {
  height: 40px;
  line-height: 40px;
  display: inline-block;
  margin: 0 10px;
  padding: 0 10px;
  margin-bottom: 10px;
  cursor: pointer;
}
.areaHome .areaContent .active {
  border-bottom: 1px solid #fda54b;
}

.areaHome .areaContent .buildEditImg {
  clear: both;
  width: 100%;
}
.areaHome .areaContent .buildEditImg .buildImg {
  width: 265px;
  height: 168px;
  border: 1px solid #5676a9;
  border-radius: 5px;
  margin-bottom: 15px;
}
.areaHome .areaContent .buildEditImg .buildEditImgText {
  float: right;
  font-size: 13px;
  padding: 5px 0px;
  color: orangered;
}
.areaHome .areaContent .pointTittle {
  height: 40px;
  line-height: 40px;
}
.areaHome .areaContent .floorClass .floorItem {
  display: inline-block;
  height: 20px;
  line-height: 20px;
  font-size: 12px;
  padding: 0px 5px;
  border-radius: 10px;
  border: 1px solid #5676a9;
  margin-right: 2px;
  clear: both;
  cursor: default;
}
.areaHome .areaContent .floorClass .floorItem .floorIcon {
  float: left;
  height: 20px;
  line-height: 20px;
  font-size: 10px;
  padding: 0 2px;
  cursor: pointer;
}
.areaHome .areaContent .floorClass .floorItem .floorIcon:hover {
  color: #20adff;
}
.areaHome .areaContent .linkMan {
  text-align: center;
}
.areaHome .areaFooter {
  height: 40px;
  width: 100%;
  line-height: 40px;
  clear: both;
  background-color: #0f2343;
  text-align: center;
}
.areaHome .areaFooter button {
  margin: 0 4px;
}
.areaContent .ivu-tabs,
.areaContent .ivu-tabs-content,
.areaContent .ivu-tabs-content-animated {
  display: flex !important;
  flex: 1 !important;
  flex-direction: column !important;
}
.ivu-tabs-content-animated {
  flex: 1 !important;
}
.height100 {
  height: 100%;
}
.buildingInfo {
  padding: 0 10px;
}
.floors {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 9px;
}
.addBtn {
  margin-right: 8px;
}
</style>
<style>
.ivu-tabs .ivu-tabs-content-animated {
  flex: 1 !important;
}
</style>

