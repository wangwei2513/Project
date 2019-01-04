<template>
  <div class="emHomeEdit">
    <div class="emEditLeft">
      <div class="emtop">
        <div class="rmtopImg">
          <div class="rmtopBtn">
            <span>预案类型</span>
            <Select style="width:158px" v-model="formData.planId" @on-change="changeAddSel" placeholder="请选择">
              <Option v-for="item in alarmTypeList" :value="item.value" :key="item.value">{{ item.label }}</Option>
            </Select>
            <Button type="ghost" @click="removeRm" :disabled="!formData.planPhoto || isRootNode">删除</Button>
            <Button type="ghost" @click="saveEmPlan" :disabled='isRootNode'>保存</Button>
            <span class="buildEditImgText">800px*560px,支持JPEG、PNG格式</span>
            <div class="rmtopBtnUp">
              <Upload action="/api/upload/file?type=image" :show-upload-list="false" :on-success="uploadEditSuccess" :multiple="false" ref="upload" :format="['jpg','jpeg','png']" :on-error="uploadEditError" :on-format-error="mapFormatError">
                <Button type="ghost" icon="ios-cloud-upload-outline" :disabled='isRootNode'>点击上传应急预案</Button>
              </Upload>
            </div>
            <Button type="ghost" @click="systemImport" :disabled="!formData.planPhoto || isRootNode">导出</Button>
          </div>
          <div class="buildEditImg">
            <div class="buildImg">
              <div style="width:100%;" v-if="formData.planPhoto">
                <img style="vertical-align:bottom;width:100%;max-width:800px;max-height:580px;border-radius: 5px;" :src="formData.planPhoto">
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="emtBottom">
        <div class="emtBottomText">
          <Input v-model="formData.remark" type="textarea" :rows="3" :autosize="{minRows: 3, maxRows: 3}" placeholder="请输入文本信息。。。" />
        </div>
      </div>
    </div>
    <div class="emEditRight">
      <div class="emEditRightBtn">
        <Button type="primary" @click="addTelMan" :disabled='isRootNode'>添加</Button>
      </div>
      <div class="emTable">
        <Table height="560" size="small" :columns="emColumns" :data="formData.group"></Table>
      </div>
      <!-- 添加联络人 -->
      <Modal :mask-closable="false" v-model="peoManModal" title="人员管理" width="450">
        <div class="org-modal-form">
          <Form :model="formDataMantemp" label-position="left" :rules="ruleValidate" :label-width="100" ref="formDataMan">
            <Form-item label="姓名" prop="name">
              <Input :maxlength="8" v-model="formDataMantemp.name" />
            </Form-item>
            <Form-item label="电话" prop="phone">
              <Input v-model="formDataMantemp.phone" />
            </Form-item>
            <Form-item label="职务" prop="position">
              <Input :maxlength="8" v-model="formDataMantemp.position" />
            </Form-item>
          </Form>
        </div>
        <div slot="footer">
          <Button type="ghost" @click="orgCancel('formDataMan')">取消</Button>
          <Button type="primary" @click="orgSave('formDataMan')" :loading="modalloading">确认</Button>
        </div>
      </Modal>
    </div>
  </div>
</template>
<script>
import { mapState, mapActions, mapGetters } from 'vuex'
export default {
  data() {
    const verifyName = (rule, value, callback) => {
      if (value === '' || value === undefined || value === null) {
        callback()
      }
      const r = /^[\u4e00-\u9fa5]{1,8}$/
      if (!r.test(value)) {
        callback(new Error('请输入8位以内的汉字!'))
      } else {
        callback()
      }
    }
    const verifyposition = (rule, value, callback) => {
      if (value === '' || value === undefined || value === null) {
        callback()
      }
      const r = /^[\u4e00-\u9fa5]{1,8}$/
      if (!r.test(value)) {
        callback(new Error('请输入8位以内的汉字!'))
      } else {
        callback()
      }
    }
    return {
      alarmTypeList: [
        {
          value: 1,
          label: '普通报警'
        },
        {
          value: 2,
          label: '消防报警'
        },
        {
          value: 3,
          label: '报警求助'
        },
        {
          value: 4,
          label: '单兵报警'
        },
        {
          value: 5,
          label: '巡更报警'
        }
      ],
      activeOrgid: '',
      modalloading: false,
      peoManModal: false,
      isAdd: false,
      // 表单数据
      formData: {
        planPhoto: '',
        remark: '',
        orgid: '',
        group: [],
        planId: 1,
        plan: '普通报警'
      },
      formDataMan: { name: '', position: '', phone: '' },
      formDataMantemp: {},
      ruleValidate: {
        name: [{ required: true, validator: verifyName, trigger: 'change' }],
        phone: [
          { required: true, message: '电话不能为空', trigger: 'blur' },
          {
            validator: this.$bsValidate.validatePhone,
            trigger: 'blur'
          }
        ],
        position: [
          {
            validator: verifyposition,
            trigger: 'blur'
          }
        ]
      },
      emColumns: [
        {
          title: '序号',
          type: 'index',
          minWidth: 40,
          align: 'center'
        },
        {
          title: '姓名',
          key: 'name',
          minWidth: 100,
          align: 'center',
          ellipsis: true
        },
        {
          title: '职务',
          key: 'position',
          align: 'center',
          minWidth: 100,
          ellipsis: true
        },
        {
          title: '电话',
          key: 'phone',
          minWidth: 120,
          align: 'center',
          ellipsis: true
        },
        {
          title: '操作',
          key: 'action',
          minWidth: 100,
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
                  style: { marginRight: '5px' },
                  on: {
                    click: () => {
                      this.show(params.row)
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
                  on: {
                    click: () => {
                      this.remove(params.row)
                    }
                  }
                },
                '删除'
              )
            ])
          }
        }
      ]
    }
  },
  computed: {
    ...mapState({
      emNode: ({ emergencyMan }) => {
        return emergencyMan.emNode
      },
      oneEmInfo: ({ emergencyMan }) => emergencyMan.oneEmInfo
    }),
    ...mapGetters(['isRootNode'])
  },
  watch: {
    emNode(val) {
      if (val) {
        this.formData.orgid = val._id
        this.activeOrgid = val._id
      }
    },
    oneEmInfo(val) {
      this.formData = {
        planPhoto: '',
        remark: '',
        orgid: '',
        group: [],
        planId: 1
      }
      if (val) {
        this.formData = JSON.parse(JSON.stringify(val))
      }
    }
  },
  methods: {
    ...mapActions(['addOneEmPlan', 'deleteOneEm', 'getOneEmPlan']),
    changeAddSel(val) {
      this.formData.planId = val
      this.formData.plan = this.alarmTypeList[val - 1].label
    },
    systemImport() {
      if (this.formData.planPhoto) {
        const src = this.formData.planPhoto
        const emName = this.emNode.name
        var bowser = this.myBrowser()
        if (bowser === 'IE' || bowser === 'Edge') {
          // IE
          this.ieDownloadImage(src, emName)
        } else {
          //! IE
          this.downloadImage(src, emName)
        }
      }
    },
    // ie浏览器下载图片
    ieDownloadImage(src, emName) {
      var canvas = document.createElement('canvas')
      var img = document.createElement('img')
      img.onload = function(e) {
        canvas.width = img.width
        canvas.height = img.height
        var context = canvas.getContext('2d')
        context.drawImage(img, 0, 0, img.width, img.height)
        window.navigator.msSaveBlob(canvas.msToBlob(), 'image.jpg')
      }
      img.src = src
    },
    // 其他浏览器下载
    downloadImage(src, emName) {
      var a = $('<a></a>')
        .attr('href', src)
        .attr('download', emName)
        .appendTo('body')
      a[0].click()
      a.remove()
    },
    // 判断浏览器类型
    myBrowser() {
      var userAgent = navigator.userAgent // 取得浏览器的userAgent字符串
      var isOpera = userAgent.indexOf('Opera') > -1
      if (isOpera) {
        return 'Opera'
      } // 判断是否Opera浏览器
      if (userAgent.indexOf('Firefox') > -1) {
        return 'FF'
      } // 判断是否Firefox浏览器
      if (userAgent.indexOf('Chrome') > -1) {
        return 'Chrome'
      }
      if (userAgent.indexOf('Safari') > -1) {
        return 'Safari'
      } // 判断是否Safari浏览器
      if (userAgent.indexOf('compatible') > -1 && userAgent.indexOf('MSIE') > -1 && !isOpera) {
        return 'IE'
      } // 判断是否IE浏览器
      if (userAgent.indexOf('Trident') > -1) {
        return 'Edge'
      } // 判断是否Edge浏览器
    },
    // 图片上传成功
    uploadEditSuccess(val) {
      this.formData.planPhoto = JSON.parse(JSON.stringify(val.path))
      this.successMsg('预案信息上传成功')
    },
    // 图片上传失败
    uploadEditError() {
      this.errorMsg('图片上传失败')
    },
    mapFormatError(file) {
      this.$Notice.warning({
        title: '文件格式不正确',
        desc: '文件 ' + file.name + ' 格式不正确，请上传 jpg、jpeg 或 png 格式的图片。'
      })
    },
    // 保存应急预案图片
    saveEmPlan() {
      if (this.emNode) {
        if (this.activeOrgid && this.formData.planPhoto) {
          this.formData.orgid = this.activeOrgid
          this.addOneEmPlan(this.formData)
            .then(res => {
              this.successMsg('预案信息上传成功')
              this.getOneEmPlan(this.activeOrgid)
                .then(res => {})
                .catch(err => {
                  console.log(err)
                  this.errorMsg('预案信息获取失败')
                })
            })
            .catch(err => {
              console.log(err)
              this.errorMsg('预案信息上传失败')
            })
        } else {
          this.errorMsg('请选择预案(非根节点)或上传预案图片')
        }
      } else {
        this.errorMsg('请选择预案')
      }
    },
    removeRmContent() {
      let content = ''
      if (this.formData._id && this.formData.planPhoto) {
        content = '<p>确定删除预案吗？</p>'
      } else {
        content = '<p>确定删除图片吗？</p>'
      }
      return content
    },
    removeRm() {
      this.$Modal.confirm({
        title: '提示',
        content: this.removeRmContent(),
        onOk: () => {
          // 上传图片未保存，删除图片
          if (this.formData._id === undefined) {
            this.formData.planPhoto = ''
          } else {
            // 上传图片已保存过，删除全部应急预案信息
            this.deleteOneEm(this.formData._id)
              .then(res => {
                this.successMsg('预案信息删除成功')
                var formDataDef = {
                  planPhoto: '',
                  remark: '',
                  orgid: '',
                  group: []
                }
                this.formData = JSON.parse(JSON.stringify(formDataDef))
              })
              .catch(err => {
                console.log(err)
                this.errorMsg('预案信息删除失败')
              })
          }
        }
      })
    },
    // 添加
    addTelMan() {
      this.peoManModal = true
      this.isAdd = true
      this.formDataMantemp = { name: '', position: '', phone: '' }
      // this.formDataMan = JSON.parse(JSON.stringify(formDataManDef))
    },
    show(val) {
      this.formDataMantemp = JSON.parse(JSON.stringify(val))
      this.peoManModal = true
      this.isAdd = false
    },
    remove(val) {
      this.formData.group.splice(val._index, 1)
    },
    orgCancel(name) {
      this.isAdd = false
      this.peoManModal = false
      this.$nextTick(function() {
        this.$refs[name].resetFields()
      })
      this.formData.group = JSON.parse(JSON.stringify(this.formData.group))
    },
    orgSave(name) {
      var has = false
      if (this.isAdd) {
        this.$refs[name].validate(valid => {
          if (valid) {
            this.formData.group.map(item => {
              if (item.name === this.formDataMantemp.name && item.phone === this.formDataMantemp.phone) {
                has = true
              }
            })
            if (has) {
              this.errorMsg('应急联系人重复')
              return
            }
            if (this.formData.group.length >= 20) {
              this.errorMsg('应急联系人数量已达上限')
            } else {
              this.formData.group.push(JSON.parse(JSON.stringify(this.formDataMantemp)))
              this.isAdd = false
              this.peoManModal = false
            }
          } else {
          }
        })
      } else {
        this.$refs[name].validate(valid => {
          if (valid) {
            this.formData.group[this.formDataMantemp._index].name = this.formDataMantemp.name
            this.formData.group[this.formDataMantemp._index].phone = this.formDataMantemp.phone
            this.formData.group[this.formDataMantemp._index].position = this.formDataMantemp.position
            this.isAdd = false
            this.peoManModal = false
          }
        })
      }
    }
  }
}
</script>
<style scoped>
.emHomeEdit {
  overflow: auto;
  display: -ms-flexbox;
  display: flex;
  -ms-flex: 1;
  flex: 1;
  padding: 16px;
  font-size: 14px;
}

.emHomeEdit .emEditLeft {
  display: flex;
  background: #1c3053;
  margin-right: 15px;
  flex-direction: column;
  justify-content: space-between;
  width: 50%;
  max-width: 800px;
}
.emHomeEdit .emEditLeft .emtop {
  display: flex;
  flex-direction: column;
}
.emHomeEdit .emEditLeft .emtop .rmtopImg {
  flex: 1;
  display: flex;
  /* margin: 10px 0px 40px 0px; */
  flex-direction: column;
}
.emHomeEdit .emEditLeft .emtop .rmtopImg .rmtopBtn {
  width: 100%;
  padding: 0 8px 8px;
}
.rmtopBtnUp {
  display: inline-block;
}
.emHomeEdit .emEditRight {
  flex: 1;
  /* display: flex; */
  background: #1c3053;
  margin-right: 15px;
}
.emHomeEdit .emTable {
  width: 100%;
}
.emHomeEdit .emEditRight .emEditRightBtn {
  margin-bottom: 15px;
}
.emHomeEdit .emEditLeft .emtBottom {
  width: 100%;
  margin-top: 16px;
}
.emHomeEdit .emEditLeft .emtBottomText {
  width: 100%;
}
.emHomeEdit .emEditLeft .emtop .rmtopImg .buildEditImg {
  flex: 1;
}
.emHomeEdit .emEditLeft .emtop .rmtopImg .buildEditImg .buildImg {
  width: 100%;
  border: 1px solid #5676a9;
  border-radius: 5px;
  min-height: 600px;
}
.buildEditImgText {
  float: right;
  font-size: 12px;
  line-height: 32px;
  /* padding: 5px 0px; */
}
</style>
