<template>
  <div class="bs-main manageConfig">
    <div class="set-flex">
      <div class="rank-config">
        设置应用模式主要显示区：
        <RadioGroup v-model="radios">
          <Radio label="地图"></Radio>
          <Radio label="视频"></Radio>
        </RadioGroup>
        <Button class="jdbutton" v-if="$BShasPower('BS-FIRE-ALARMCONFIG-ACTION')" :loading="modalLoading" type="ghost" @click="sure">保存</Button>
      </div>
      <div class="plan">
        <!--警情类型-->
        <div class="plan-manage" ref="tableBox">
          <div class="panel">警情类型
            <Button class="jdbutton" v-if="$BShasPower('BS-FIRE-ALARMCONFIG-ACTION')" type="ghost" @click="addPlan" icon="plus">添加</Button>
          </div>
          <div class="car-list flex-1">
            <div class="table-box">
              <Table size="small" :height="tableHeight" :columns="planTitle" :data="PlanData"></Table>
            </div>
          </div>
          <div class="table-footer">
            <div style="float: right;">
              <Page class="rt" show-sizer show-elevator show-total :page-size-opts="$PageInfo.size" :total="pageInfo.count" :page-size="pageInfo.limit" :current="pageInfo.cur" @on-change="planPageChange" @on-page-size-change="pageSizeChange"></Page>
            </div>
          </div>
          <!--添加-->
          <div>
            <Modal v-model="addPlanMod" :title="planModTitle" :mask-closable="false">
              <Form :model="planForm" ref="planForm" label-position="left" :label-width="80" :rules="ruleValidate" style="padding: 0 10px;">
                <Form-item label="名称" prop="name">
                  <Input type="text" v-model="planForm.name" />
                </Form-item>
                <Form-item label="警情信息" prop="content">
                  <Input type="textarea" v-model="planForm.content" :autosize="{minRows: 2,maxRows: 3}" />
                </Form-item>
              </Form>
              <div slot="footer">
                <Button type="ghost" @click="PlanCancel('planForm')">取消</Button>
                <Button type="primary" @click="addPlanOk('planForm')" :loading="yaloading">确定</Button>
              </div>
            </Modal>
          </div>
        </div>
        <!--警情处理-->
        <div class="plan-deal" ref="tableBox">
          <div class="panel">
            <p class="panel-title">警情处理</p>
            <Button class="jdbutton" v-if="$BShasPower('BS-FIRE-ALARMCONFIG-ACTION')" type="ghost" @click="addFireDeal" icon="plus">添加</Button>
            <Checkbox v-model="fireEnable" class="panel-enable" @on-change="enableChange">启用</Checkbox>
          </div>
          <div class="car-list flex-1">
            <div class="table-box">
              <Table size="small" :height="tableHeight" :columns="fireDealTitle" :data="fireDealData"></Table>
            </div>
          </div>
          <div class="table-footer">
            <div style="float: right;">
              <Page class="rt" show-sizer show-elevator show-total :page-size-opts="$PageInfo.size" :total="fireDealTotal" :page-size="fireDealLimit" :current="fireDealPageCur" @on-change="fireDealPageChange" @on-page-size-change="fireDealPageSizeChange"></Page>
            </div>
          </div>
          <!--添加-->
          <div>
            <Modal v-model="fireDealMod" :title="fireDealModTitle" :mask-closable="false">
              <Form :model="fireDealForm" ref="fireDealForm" label-position="left" :label-width="80" :rules="ruleName" style="padding: 0 10px;">
                <Form-item label="名称" prop="name">
                  <Input type="text" v-model="fireDealForm.name" />
                </Form-item>
              </Form>
              <div slot="footer">
                <Button type="ghost" @click="fireDealCancel('fireDealForm')">取消</Button>
                <Button type="primary" @click="addFireDealOk('fireDealForm')" :loading="yaloading">确定</Button>
              </div>
            </Modal>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import './fire.css'
import fireDeal from './fireDeal.js'
export default {
  name: 'manageConfig',
  mixins: [fireDeal],
  data() {
    // 64位字符
    const nameRule = (rule, value, callback) => {
      if (/\s+/g.test(value)) {
        return callback(new Error('请勿输入空格'))
      } else {
        let nativecode = value.split('')
        let len = 0
        for (let i = 0; i < nativecode.length; i++) {
          let code = Number(nativecode[i].charCodeAt(0))
          if (code > 127) {
            len += 2
          } else {
            len++
          }
        }
        if (len > 64) {
          return callback(new Error('不能超过64位字符'))
        } else {
          callback()
        }
      }
    }
    const contentRule = (rule, value, callback) => {
      if (/\s+/g.test(value)) {
        return callback(new Error('请勿输入空格'))
      } else {
        callback()
      }
    }
    return {
      ruleValidate: {
        name: [
          { required: true, message: '警情类型名称不能为空', trigger: 'change' },
          { validator: nameRule, trigger: 'change' }
        ],
        content: [
          { required: true, message: '警情信息不能为空', trigger: 'blur' },
          { validator: contentRule, trigger: 'change' }
        ]
      },
      ruleName: {
        name: [
          { required: true, message: '名称不能为空', trigger: 'blur' },
          { validator: nameRule, trigger: 'change' }
        ]
      },
      modalLoading: false,
      planTitle: [
        {
          type: 'index',
          title: '序号'
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
          title: '警情信息',
          key: 'content',
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
                  title: params.row.content
                }
              },
              params.row.content
            )
          }
        },
        {
          title: '操作',
          key: 'action',
          width: 200,
          render: (h, params) => {
            return h('div', [
              h(
                'Button',
                {
                  props: {
                    type: 'ghost',
                    size: 'small',
                    disabled: !this.$BShasPower('BS-FIRE-ALARMCONFIG-ACTION')
                  },
                  style: {
                    marginRight: '5px'
                  },
                  on: {
                    click: () => {
                      this.editPlan(params.index)
                    }
                  }
                },
                '修改'
              ),
              h(
                'Button',
                {
                  props: {
                    type: 'ghost',
                    size: 'small',
                    disabled: !this.$BShasPower('BS-FIRE-ALARMCONFIG-ACTION')
                  },
                  on: {
                    click: () => {
                      this.delPlan(params.index)
                    }
                  }
                },
                '删除'
              )
            ])
          }
        }
      ],
      PlanData: [],
      planForm: {
        _id: '',
        name: '',
        content: ''
      },
      addPlanMod: false,
      tableHeight: 726,
      pageInfo: {
        cur: 1,
        count: 0,
        limit: this.$PageInfo.limit
      },
      planModTitle: '',
      planIndex: '',
      addEdit: '', // 警情类型管理添加/修改确认识别码
      radios: '地图',
      yaloading: false,
      buttonTimer: null
    }
  },
  computed: {
    ...mapGetters(['tipErrorConfig']),
    ...mapState({
      firePlanData: ({ manageConfig }) => manageConfig.firePlanData,
      fireConfData: ({ manageConfig }) => manageConfig.fireConfData,
      planPageNum: ({ manageConfig }) => manageConfig.firesPlanPageNum,
      fireDealList: ({ manageConfig }) => manageConfig.fireDealList,
      fireDealStatus: ({ manageConfig }) => manageConfig.fireDealStatus
    })
  },
  mounted() {
    this.tableHeight = this.$refs['tableBox'].offsetHeight - 94
  },
  methods: {
    ...mapActions([
      'getFirePlan',
      'addFirePlan',
      'delFirePlan',
      'editFirePlan',
      'getUseType',
      'setUseType',
      'fireAlarmDealStatus',
      'getFireAlarmDealList',
      'addFireAlarmDeal',
      'reviseFireAlarmDeal',
      'deleteFireAlarmDeal',
      'getFireDealStatus',
      'reviseFireDealStatus'
    ]),
    getTypeData() {
      // 获取地图视频设置
      this.getUseType()
        .then(() => {
          if (this.fireConfData) {
            this.radios = '地图'
          } else {
            this.radios = '视频'
          }
        })
        .catch(err => {
          console.log('this.getUseType :' + err)
          this.errorMsg('获取主显示区失败')
        })
    },
    // 1-1 地图/视频 单选 保存
    sure() {
      this.modalLoading = true
      let ismap = true
      if (this.radios === '地图') {
        ismap = true
      } else {
        ismap = false
      }
      this.setUseType({ ismap })
        .then(() => {
          this.modalLoading = false
          this.successMsg('设置成功')
          this.getTypeData()
        })
        .catch(err => {
          this.modalLoading = false
          console.log('this.setUseType :' + err)
          this.errorMsg('保存失败')
        })
    },
    // 获取警情类型数据
    getPlanData() {
      this.getFirePlan({
        page: this.pageInfo.cur,
        limit: this.pageInfo.limit,
        type: 2
      })
        .then(res => {
          this.PlanData = JSON.parse(JSON.stringify(this.firePlanData))
          this.pageInfo.count = Number(res.headers['x-bsc-count'])
        })
        .catch(err => {
          console.log('this.getFirePlan :' + err)
          this.errorMsg('警情类型数据获取失败')
        })
    },
    // 2-1.警情类型 添加
    addPlan() {
      this.$refs['planForm'].resetFields()
      this.planModTitle = '添加警情类型'
      this.addPlanMod = true
      this.addEdit = 'add'
      this.planForm = {}
    },
    // 2-2.警情类型 修改
    editPlan(index) {
      this.$refs['planForm'].resetFields()
      this.planModTitle = '修改警情类型'
      this.addPlanMod = true
      this.addEdit = 'edit'
      this.planForm = JSON.parse(JSON.stringify(this.PlanData[index]))
    },
    // 2-1-1.警情类型 添加/修改 确认
    addPlanOk(name) {
      if (this.buttonTimer) { return }
      this.$refs[name].validate(valid => {
        if (valid) {
          this.yaloading = true
          if (this.addEdit === 'add') {
            let data = {
              name: this.planForm.name,
              content: this.planForm.content,
              type: '2'
            }
            this.addFirePlan(data)
              .then(suc => {
                this.getPlanData()
                this.yaloading = false
                this.addPlanMod = false
                this.successMsg('警情类型添加成功')
              })
              .catch(err => {
                const msg = {
                  name: '警情类型名称已存在'
                }
                if (err.response.data) {
                  Object.keys(err.response.data).forEach(n => {
                    msg[n] && this.errorMsg(msg[n])
                  })
                }
                this.yaloading = false
                this.addPlanMod = true
              })
          } else {
            let datas = {
              _id: this.planForm._id,
              plan: {
                name: this.planForm.name,
                content: this.planForm.content,
                type: 2
              }
            }
            this.editFirePlan(datas)
              .then(suc => {
                this.yaloading = false
                this.addPlanMod = false
                this.getPlanData()
                this.successMsg('警情类型修改成功')
              })
              .catch(err => {
                const msg = {
                  name: '警情类型名称已存在'
                }
                if (err.response.data) {
                  Object.keys(err.response.data).forEach(n => {
                    msg[n] && this.errorMsg(msg[n])
                  })
                }
                this.yaloading = false
                this.addPlanMod = true
                console.log('logout error:' + err)
              })
          }
        }
      })
      this.buttonTimer = setTimeout(() => {
        this.buttonTimer = null
      }, 300)
    },
    // 2-1-1.警情类型 添加/修改 取消
    PlanCancel(name) {
      this.$refs[name].resetFields()
      this.addPlanMod = false
    },
    // 2-3.警情类型 删除
    delPlan(index) {
      this.planIndex = index
      this.$Modal.confirm({
        title: '警告',
        content: '<p>确认删除吗?</p>',
        onOk: () => {
          this.delOk()
        }
      })
    },
    // 2.警情类型 删除 确认
    delOk() {
      let planId = this.PlanData[this.planIndex]._id
      this.delFirePlan(planId)
        .then(suc => {
          this.successMsg('删除成功')
          this.getPlanData()
        })
        .catch(err => {
          console.log('this.delFirePlan :' + err)
          this.errorMsg('删除失败')
        })
    },
    pageSizeChange(n) {
      this.pageInfo.limit = n
      this.getPlanData()
    },
    // 分页
    planPageChange(n) {
      this.pageInfo.cur = n
      this.getPlanData()
    }
  },
  created() {
    this.getFireDealData()
    this.getTypeData()
    this.getPlanData()
    this.getFireDealStatus().then(suc => {
      this.fireEnable = JSON.parse(JSON.stringify(this.fireDealStatus.isFireAlarmEnable))
    }).catch(err => {
      console.log('this.getFireDealStatus :' + err)
      this.errorMsg('获取状态失败')
    })
  }
}
</script>
<style scoped>
.bs-main {
  /*overflow: auto;*/
  display: flex;
  flex: 1;
  font-size: 14px;
  background-color: #0a111c;
  width: 100%;
  height: 100%;
}

.lf {
  float: left;
}

.rt {
  float: right;
}

.set-flex {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1c3053;
}

.panel {
  width: 100%;
  height: 38px;
  line-height: 44px;
  font-size: 14px;
  background-color: #1c3053;
  text-align: left;
  padding: 0 0 0 20px;
  margin-bottom: 16px;
}

table {
  border-collapse: collapse;
}

.rank-config .ivu-radio-wrapper {
  font-size: 14px;
}

.ivu-table-tbody .ivu-table-row .ivu-table-cell {
  font-size: 12px;
}

.rank-config {
  width: 100%;
  flex: 0 0 50px;
  line-height: 50px;
  text-align: left;
  padding: 0 0 0 20px;
  font-size: 14px;
  background: #1c3053;
}
.plan {
  width: 100%;
  display: block;
}
.plan-manage {
  float: left;
  background-color: #1c3053;
  width: 49.5%;
  height: 100%;
  margin-right: 10px;
}
.plan-deal {
  float: right;
  width: 49.5%;
  height: 100%;
}
.panel-title {
  float: left;
}
.panel-enable {
  margin-left: 30px;
}
.page-style {
  width: 100%;
  border-top: none;
  overflow: hidden;
  padding: 5px 12px 5px 0;
  background: #244575;
}

table {
  border-collapse: collapse;
}

.ivu-table tbody tr:hover td {
  background-color: #0a111c;
}
.edit-btn {
  color: #57a3f3;
  cursor: pointer;
}

.file-info {
  background: #1c3054;
}

.file-info > button {
  width: 90px;
  margin-top: 18px;
}

.file-table {
  margin-top: 12px;
}

.jdbutton {
  margin-left: 80px;
}
</style>
