<template>
  <div class="serverConfig">
    <div class="bsMainChild">
      <div class="tab-content-alarm">
        <div class="feature-btn">
          <Button v-if="$BShasPower('BS-SETTING-TRAFFIC-SERVER')" @click="openModAdd(modalTitles[0])" type="ghost" icon="plus">添加</Button>
          <Button v-if="$BShasPower('BS-SETTING-TRAFFIC-SERVER')" :disabled="operate" @click="openModMod(modalTitles[1])" type="ghost" icon="edit">修改</Button>
          <Button v-if="$BShasPower('BS-SETTING-TRAFFIC-SERVER')" :disabled="operate" @click="delAlarm" type="ghost" icon="trash-a">删除</Button>
          <Button type="ghost" icon="refresh" @click="refash">刷新</Button>
          <Button v-if="$BShasPower('BS-SETTING-TRAFFIC-SERVER')" @click="openUrlModal" type="ghost">配置URL</Button>
        </div>
        <div class="table-relative" :style="{height: tableWrrpHeight,overflow: 'auto'}" ref="tableBox">
          <div class="table-body">
            <Table style="margin-top: 20px;" ref='currentRowTable' size="small" :columns="importTitle" :data="serverData.list" :height="tableHeight" :highlight-row="true" @on-current-change="alarmInSel"></Table>
          </div>
        </div>
        <div class="page-style">
          <Page class="rt" show-sizer :page-size-opts="$PageInfo.size" @on-page-size-change="pageSizeChange" :current="serverData.curPage" :total="serverData.count" :page-size="serverData.limit" @on-change="pageChange" show-elevator :show-total="true"></Page>
        </div>
      </div>
      <!--添加/修改模态框-->
      <Modal v-model="modal" :title="modalTitle" :mask-closable="false" width="500" @on-cancel='editCancel' class='modelStyle'>
        <Form :model="modalData" :label-width="100" :rules="formValidate" ref="modalData" label-position="left" style="padding: 0 10px;">
          <Form-item :label='labels[0]' prop='name'>
            <Input v-model="modalData.name"></Input>
          </Form-item>
          <Form-item :label='labels[1]' prop='manufacturer'>
            <Select v-model="modalData.manufacturer">
              <Option v-for="item in this.factorys" :value="item.value" :key="item.value">{{ item.label }}</Option>
            </Select>
          </Form-item>
          <Form-item :label='labels[3]' prop='ip'>
            <IPV4 v-if="modal" v-model="modalData.ip" ref="ipv4"></IPV4>
          </Form-item>
          <Form-item :label='labels[4]' prop='deviceid'>
            <Input v-model="modalData.deviceid"></Input>
          </Form-item>
          <Form-item :label='labels[5]' prop='cport'>
            <Input v-model="modalData.cport"></Input>
          </Form-item>
          <Form-item :label='labels[6]' prop='username'>
            <Input v-model="modalData.username"></Input>
          </Form-item>
          <Form-item :label='labels[7]' prop='password'>
            <Input type="password" v-model="modalData.password"></Input>
          </Form-item>
        </Form>
        <div slot="footer">
          <Button type="ghost" @click='editCancel'>取消</Button>
          <Button type="primary" @click='editOk'>确定</Button>
        </div>
      </Modal>
      <!-- URL地址弹窗 -->
      <Modal v-model="urlModal" title="配置智能交通服务器URL地址" :mask-closable="false" width="500" @on-cancel='urlCancel' class='modelStyle'>
        <Form :model="urlData" :label-width="100" ref="urlModalData" label-position="left" style="padding: 0 20px;">
          <!-- <Form-item label='URL地址' prop='ip'>
            <Input v-model="urlData.ip"></Input>
          </Form-item>
          <br> -->
          <Form-item label='URL地址：'>
            <Input v-model="urlData.ip">
              <Select v-model="urlData.http" slot="prepend" style="width: 80px;">
                    <Option value="http://">http://</Option>
                    <Option value="https://">https://</Option>
                </Select>
            </Input>
          </Form-item>
        </Form>

        <div slot="footer">
          <Button type="ghost" @click='urlCancel'>取消</Button>
          <Button type="primary" @click='urlOk'>确定</Button>
        </div>
      </Modal>
    </div>
  </div>
</template>
<script>
import './server.css'
import IPV4 from 'components/BSIPV4'
import { mapState, mapActions } from 'vuex'
export default {
  name: 'serverConfig',
  components: {
    IPV4
  },
  data() {
    const checkIp = (rule, value, callback) => {
      if (!value) {
        callback(new Error('IP地址不能为空'))
      } else {
        callback()
      }
    }
    const checkNumber = (rule, value, callback) => {
      const postNumber = /^[1-9][0-9]{0,19}$|^[0-9]$/
      if (!value) {
        return callback(new Error('编号不能为空'))
      } else {
        if (!postNumber.test(value)) {
          return callback(new Error('编号是小于20位的数字'))
        } else {
          callback()
        }
      }
    }
    // 端口0-65535 非必输
    const dePort = (rule, value, callback) => {
      let r = /(^[1-9]([0-9]*)$|^[0-9]$)/
      if (value) {
        if (r.test(value)) {
          if (Number(value) > 65535) {
            return callback(new Error('超过最大值'))
          } else {
            callback()
          }
        } else {
          return callback(new Error('请输入有效数字'))
        }
      } else {
        callback()
      }
    }
    return {
      // 表格
      importTitle: [
        {
          title: '编号',
          key: 'deviceid',
          width: 200
        },
        {
          title: '名称',
          key: 'name',
          ellipsis: true
        },
        {
          title: '厂家',
          key: 'manufacturer',
          render: (h, params) => {
            let sys = ''
            switch (params.row.manufacturer) {
              case 'ytz':
                sys = '英泰智'
                break
              default:
                return
            }
            return h('div', [h('p', {}, sys)])
          }
        },
        {
          title: 'IP地址',
          key: 'ip',
          width: 200
        },
        {
          title: '端口',
          key: 'cport',
          width: 200
        }
      ],
      // 修改OR添加
      isEdit: false,
      // 弹出 添加或修改模态框
      modal: false,
      // 模态框title
      modalTitle: '',
      modalTitles: ['添加智能交通服务器', '修改智能交通服务器', '复制门禁设备'],
      // 模态框的内容
      labels: ['名称', '厂家', '门禁设备型号', 'IP地址', '编号', '端口号', '用户名', '密码'],
      // 模态框中的数据  接口直接用的
      modalData: {},
      // 保存初始模态框数据
      saveModalData: {
        name: '',
        manufacturer: 'ytz',
        ip: '0.0.0.0',
        deviceid: '',
        cport: 3721,
        username: 'admin',
        password: '123456'
      },
      operate: true,
      // 表格焦点行数据
      chooseData: {},
      // 模态框中的 设备厂商
      factorys: [{ value: 'ytz', label: '英泰智' }],
      // 表单验证
      formValidate: {
        name: [{ required: true, validator: this.$bsValidate.validateStr64, trigger: 'change' }],
        ip: [{ required: true, validator: checkIp, trigger: 'change' }],
        cport: [{ validator: dePort, trigger: 'change' }],
        deviceid: [{ required: true, validator: checkNumber, trigger: 'change' }]
      },
      // 分页
      limit: this.$PageInfo.limit,
      // 列表高度
      tableHeight: 434,
      tableWrrpHeight: '100%',
      // url配置
      urlModal: false,
      urlData: {
        ip: 'www.baidu.com',
        http: 'http://'
      }
    }
  },
  created() {
    this.getDatas(1)
    // 获取表格保存数据
    // this.getRowData()
  },
  mounted() {
    const bodyHeight = this.$root.$el.clientHeight
    this.tableWrrpHeight = (bodyHeight - 210 < 520 ? 520 : bodyHeight - 210) + 'px'
    this.tableHeight = this.tableWrrpHeight.split('px')[0] - 20
  },
  computed: {
    ...mapState({
      serverData: ({ traffic }) => traffic.serverData
    })
  },
  methods: {
    ...mapActions([
      'getTrafficSerList',
      'addTrafficSerData',
      'getTrafficSerOne',
      'editTrafficSerData',
      'deleteTrafficSerData',
      'getTrafficServerURL',
      'postTrafficServerURL',
      'getTrafficSerList'
    ]),
    // 点击添加 打开服务器模态框
    openModAdd(value) {
      this.isEdit = false
      this.modal = true
      this.modalTitle = value
      this.modalData = this.$lodash.cloneDeep(this.saveModalData)
    },
    // 点击修改按钮 打开服务器模态框
    openModMod(value) {
      this.isEdit = true
      this.modal = true
      this.modalTitle = value
      this.getRowData()
    },
    // 刷新
    refash() {
      this.getDatas(1, res => {
        if (res.status === 200) {
          this.successMsg('数据刷新成功')
        } else {
          this.errorMsg('数据刷新失败')
        }
      })
      this.operate = true
    },
    // 删除按钮
    delAlarm() {
      this.$Modal.confirm({
        title: '提示',
        content: '<p>删除服务器会删除服务器的资源，确定删除么？</p>',
        onOk: () => {
          this.deleteTrafficSerData(this.chooseData._id)
            .then(res => {
              this.getDatas(1)
              this.successMsg('删除服务器成功!')
              this.operate = true
            })
            .catch(err => {
              this.errorMsg('删除服务器失败!')
              console.log('deleteTrafficSerData err:' + err)
            })
        },
        onCancel: () => {
          this.$refs.currentRowTable.clearCurrentRow()
          this.operate = true
        }
      })
    },
    // 获取表格保存数据
    getRowData() {
      if (this.chooseData._id) {
        this.getTrafficSerOne(this.chooseData._id)
          .then(res => {
            this.modalData = res.data
          })
          .catch(err => {
            this.errorMsg('获取数据失败！')
            console.log('this.getTrafficSerOne :' + err)
          })
      }
    },
    // 服务器模态框 取消按钮
    editCancel() {
      this.modal = false
      this.$refs.currentRowTable.clearCurrentRow()
      this.$refs.modalData.resetFields()
      this.operate = true
    },
    // 获取服务器列表 报错当前页
    getDatas(current, cb) {
      const query = {
        page: current,
        limit: this.limit,
        struct: 'list'
      }
      this.getTrafficSerList(query)
        .then(res => {
          if (cb) { return cb(res) }
          // emit ? this.$emit('tigger-change', res) : ''
        })
        .catch(err => {
          console.log('this.getTrafficSerList :' + err)
        })
    },
    // 服务器模态框 确定
    editOk() {
      this.$refs.modalData.validate(valid => {
        if (valid) {
          let cport = Number(this.modalData.cport)
          this.modalData.cport = cport
          if (!this.isEdit) {
            this.addTrafficSerData(this.modalData)
              .then(res => {
                this.successMsg('添加服务器成功!')
                this.modal = false
                this.$refs.modalData.resetFields()
                this.getDatas(1)
                this.getTrafficSerList({ struct: 'tree' }).catch(err => {
                  console.log('getTrafficSerList tree ' + err)
                })
              })
              .catch(err => {
                this.errorMsg(err)
                console.log('addTrafficSerData err:' + err)
              })
          } else {
            this.editTrafficSerData(this.modalData)
              .then(res => {
                this.modal = false
                this.$refs.modalData.resetFields()
                this.$refs.currentRowTable.clearCurrentRow()
                this.operate = true
                this.successMsg('修改服务器成功!')
                this.getDatas(1)
                this.getTrafficSerList({ struct: 'tree' }).catch(err => {
                  console.log('getTrafficSerList tree ' + err)
                })
              })
              .catch(err => {
                this.errorMsg(err)
                console.log('editTrafficSerData err:' + err)
              })
          }
        }
      })
    },
    // 当前行
    alarmInSel(now, old) {
      this.operate = false
      this.chooseData = now
    },
    // 切换页码
    pageChange(page) {
      this.operate = true
      this.getDatas(page)
    },
    // 分页功能
    pageSizeChange(size) {
      this.limit = size
      this.getDatas(1)
    },
    // 打开url配置弹窗
    openUrlModal() {
      let http = /^http:\/\//
      let https = /^https:\/\//
      let ip
      let hd

      this.urlModal = true
      this.getTrafficServerURL()
        .then(res => {
          if (res.data) {
            let url = res.data.url
            if (http.test(url)) {
              ip = url.substr(7, url.length - 1)
              hd = 'http://'
            } else if (https.test(url)) {
              ip = url.substr(8, url.length - 1)
              hd = 'https://'
            } else {
              ip = 'www.baidu.com'
              hd = 'http://'
            }

            this.urlData.ip = ip
            this.urlData.http = hd
          }
        })
        .catch(err => console.log(err))
    },
    urlCancel() {
      this.urlModal = false
    },
    urlOk() {
      let url = this.urlData.http + this.urlData.ip
      this.postTrafficServerURL(url)
        .then(res => {
          this.urlModal = false
          this.successMsg('服务器URL地址配置成功!')
        })
        .catch(err => {
          this.errorMsg('服务器URL地址配置失败!')
          console.log('postTrafficServerURL err:' + err)
        })
    }
  },
  destroyed() {
    this.operate = true
  }
}
</script>
<style scoped>
.serverConfig {
  flex: 1;
  background: #1c3053;
  position: relative;
}
.bsMainChild {
  width: 100%;
}

.rt {
  float: right;
}

.tab-content-alarm {
  width: 100%;
  padding: 0px;
  background: #1c3053;
}

.feature-btn {
  margin: 16px 0px 0px 24px;
  height: 33px;
  line-height: 33px;
}

.feature-btn > button {
  margin-right: 8px;
  height: 32px;
}

.ivu-table-column-center .ivu-btn span {
  color: #57a3f3;
  font-size: 14px;
}

.page-style {
  width: 100%;
  border-top: none;
  /* overflow: hidden; */
  padding: 3px 12px;
  background: #244575;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
}

/* .table-relative {
  height: 454px;
  margin: 0px;
  width: 100%;
}

.table-body {
  width: 100%;
  height: 100%;
} */
.table-relative {
  position: relative;
  height: 454px;
  width: 100%;
}
.table-body {
  position: absolute;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.table-body table {
  width: 100% !important;
}
.bs-main {
  /* min-height: 900px; */
  background: #1c3053;
}

.bs-main > .ivu-tabs {
  background-color: #0a111c !important;
}

.pane-style {
  padding: 0 20px;
}
</style>
