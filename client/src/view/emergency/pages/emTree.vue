<template>
  <div class="org-actions-box" :class="{orgHeight: !isShowTitle}">
    <a class="box-title" v-if="isShowTitle">{{orgTitle}}</a>
    <div class="box-btn">
      <Button-group>
        <Button icon="plus" @click="openAddModal('add')" title="添加" v-if="isHandle"></Button>
        <Button icon="edit" @click="openAddModal('edit')" title="编辑" v-if="isHandle"></Button>
        <Button icon="trash-a" @click="createOrgDelModel" title="删除" v-if="isHandle" :disabled="isRootOrg"></Button>
        <Button icon="arrow-up-c" @click="openMoveModal('up')" title="上移" :disabled="isTopOrg || isRootOrg"></Button>
        <Button icon="arrow-down-c" @click="openMoveModal('down')" title="下移" :disabled="isBottomOrg || isRootOrg"></Button>
        <Button icon="refresh" @click="orgRefreshRoot" title="刷新"></Button>
      </Button-group>
    </div>
    <div class="input" style="width:100%;padding:10px;">
      <Input v-model="searchVal" icon="ios-search-strong" placeholder="请输入..." />
    </div>
    <div class="box-tree" style="padding:0px;height:calc(100% - 130px)">
      <bs-scroll ref="scroller">
        <v-tree @on-expand="$refs.scroller.update()" ref='tree' :treeData="treeData" :options="options" @node-click="handleNode" :activeId="activeId" :searchVal="searchVal"></v-tree>
      </bs-scroll>
    </div>
    <Modal :mask-closable="false" v-model="orgAddModal" :title="isNew ? '应急预案添加' : '应急预案修改' " width="450">
      <div class="org-modal-form">
        <Form :model="orgFormData" label-position="left" :label-width="100" ref="orgFormData" :rules="orgFormRole">
          <Form-item label="上级预案">
            {{ upOrgName }}
          </Form-item>
          <Form-item label="预案编号" v-if="isNew" prop="code">
            <Input v-model="orgFormData.code" />
          </Form-item>
          <Form-item label="预案名称" prop="name">
            <Input v-model="orgFormData.name" />
          </Form-item>
          <Form-item label="预案联系人" prop="contact">
            <Input v-model="orgFormData.contact" />
          </Form-item>
          <Form-item label="联系方式" prop="contactway">
            <Input v-model="orgFormData.contactway" />
          </Form-item>
          <Form-item label="备注信息" prop="remark">
            <Input v-model="orgFormData.remark" type="textarea" :autosize="{minRows: 3,maxRows: 5}" placeholder="请输入..." />
          </Form-item>
        </Form>
      </div>
      <div slot="footer">
        <Button type="ghost" @click="orgCancel">取消</Button>
        <Button type="primary" @click="orgSave" :loading="modalloading">确认</Button>
      </div>
    </Modal>
    <!-- 删除确认框 -->
    <!-- 移动确认框 -->
  </div>
</template>
<script>
import { mapState, mapActions, mapGetters, mapMutations } from 'vuex'
export default {
  name: 'BSorgTree',
  components: {},
  props: {
    orgType: {
      type: Number,
      default: 0
    },
    isRoot: {
      type: Boolean
    },
    orgTitle: {
      type: String
    },
    isHandle: {
      type: Boolean,
      default: true
    },
    isShowTitle: {
      type: Boolean,
      default: true
    }
  },
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
    const verifyCon = (rule, value, callback) => {
      if (value === '' || value === undefined || value === null) {
        callback()
      }
      const r = /^[\u4e00-\u9fa5]{1,16}$/
      if (!r.test(value)) {
        callback(new Error('请输入16位以内的汉字!'))
      } else {
        callback()
      }
    }
    const verifyRemark = (rule, value, callback) => {
      if (value === '' || value === undefined || value === null) {
        callback()
      }
      const r = /^[\da-zA-Z\u4e00-\u9fa5]{1,200}$/
      if (!r.test(value)) {
        callback(new Error('请输入200位以内的数字、字母或汉字!'))
      } else {
        callback()
      }
    }
    const waysMax = (rule, value, callback) => {
      if (value === '' || value === undefined || value === null) {
        callback()
      }
      var r = /^[0-9]*$/
      if (r.test(value)) {
        if (Number(value) > 65535) {
          return callback(new Error('超过最大值'))
        } else {
          callback()
        }
      } else {
        return callback(new Error('请输入有效数字'))
      }
    }
    const verifyNumber = (rule, value, callback) => {
      if (value === '' || value === undefined || value === null) {
        callback()
      }
      const r = /^[A-Za-z0-9]{1,16}$/
      if (!r.test(value)) {
        callback(new Error('请输入16位以内字母或数字!'))
      } else {
        callback()
      }
    }
    return {
      options: {
        showFolder: true
      },
      orgAddModal: false,
      modalLoading: false,
      activeId: '',
      previousId: '',
      nextId: '',
      parentId: '',
      grandpaId: '',
      direction: '',
      searchVal: '',
      treeData: [],
      upOrgName: '',
      isNew: false,
      orgFormData: {
        code: 0,
        name: '',
        previewmax: 24,
        playbackmax: 24,
        contact: '',
        contactway: '',
        remark: ''
      },
      isTopOrg: false,
      isBottomOrg: false,
      isHighOrg: false,
      isLowOrg: false,
      modalloading: false,
      orgFormRole: {
        name: [{ required: true, validator: verifyName, trigger: 'change' }],
        code: [
          { required: true, message: '应急预案编号不能为空', trigger: 'change' },
          { validator: verifyNumber, trigger: 'change' }
        ],
        previewmax: [{ validator: waysMax, trigger: 'change' }],
        playbackmax: [{ validator: waysMax, trigger: 'change' }],
        contact: [{ validator: verifyCon, trigger: 'change' }],
        contactway: [{ validator: this.$bsValidate.validatePhone, trigger: 'blur' }],
        remark: [{ validator: verifyRemark, trigger: 'change' }]
      },
      true: true
    }
  },
  computed: {
    ...mapState({
      emTree: ({ emergencyMan }) => emergencyMan.emTree,
      isRootOrg: ({ orgSetting }) => orgSetting.isRootOrg
    }),
    ...mapGetters(['sysConfrole'])
  },
  created() {
    this.getOrgAll()
  },
  methods: {
    ...mapActions([
      'getEmTree',
      'getEmInfo',
      'setOrgActiveId',
      'setOrgActiveName',
      'addOrg',
      'editOrg',
      'deleteEm',
      'getEmInfoById',
      'setIsRootOrg',
      'moveOrgUpDown'
    ]),
    ...mapMutations(['SET_EMNOSE_STATE']),
    getOrgAll() {
      this.getEmTree(this.orgType)
        .then(() => {
          this.treeData = JSON.parse(JSON.stringify(this.emTree))
          this.activeId = this.treeData[0]._id
          this.setOrgActiveId(this.treeData[0]._id)
          this.setOrgActiveName(this.treeData[0].name)
          this.SET_EMNOSE_STATE(this.treeData[0])
          this.$emit('call', this.treeData[0])
          this.setIsRootOrg(true)
        })
        .catch(err => {
          console.log('getEmTree error: ' + err)
        })
    },
    handleNode(node, mark) {
      this.activeId = node._id
      this.setOrgActiveId(node._id)
      this.setOrgActiveName(node.name)
      this.$emit('call', node)
      this.setIsRootOrg(node.isroot)
      // node.isroot && (this.isRoot = true)
      // this.previousId = mark.previousNode._id
      // this.nextId = mark.nextNode._id      console.log(mark)
      this.parentId = node.pid
      if (mark.previousNode) {
        this.previousId = mark.previousNode._id
        this.isTopOrg = false
      } else {
        this.previousId = ''
        this.isTopOrg = true
      }
      if (mark.nextNode && mark.nextNode._id) {
        this.nextId = mark.nextNode._id
        this.isBottomOrg = false
      } else {
        this.nextId = ''
        this.isBottomOrg = true
      }
      if (mark.parent) {
        this.grandpaId = mark.parent.pid
        this.isHighOrg = mark.parent.isroot
      } else {
        this.grandpaId = ''
        this.isHighOrg = true
      }
      if (node.children) {
        this.isLowOrg = false
      } else {
        this.isLowOrg = true
      }
    },
    openAddModal(way) {
      this.$refs.orgFormData.resetFields()
      this.getEmInfo({ type: this.orgType, Id: this.activeId })
        .then(suc => {
          var orgInfo = suc
          if (orgInfo.isroot) {
            if (way === 'add') {
              this.upOrgName = orgInfo.name
              // var codeRandom = parseInt(Math.random() * 655)
              this.isNew = true
              this.orgFormData = {
                code: '',
                pid: this.activeId,
                type: this.orgType,
                previewmax: 24,
                playbackmax: 24,
                contact: '',
                contactway: '',
                remark: ''
              }
            } else {
              this.upOrgName = '无'
              this.isNew = false
              this.orgFormData = orgInfo
            }
            this.orgAddModal = true
          } else {
            this.getEmInfoById({
              id: orgInfo.pid,
              type: this.orgType
            })
              .then(suc => {
                if (way === 'add') {
                  this.upOrgName = orgInfo.name
                  // var codeRandom = parseInt(Math.random() * 655)
                  this.isNew = true
                  this.orgFormData = {
                    code: '',
                    pid: this.activeId,
                    type: this.orgType,
                    previewmax: 24,
                    playbackmax: 24,
                    contact: '',
                    contactway: '',
                    remark: ''
                  }
                } else {
                  this.upOrgName = suc.name
                  this.isNew = false
                  this.orgFormData = orgInfo
                }
                this.orgAddModal = true
              })
              .catch(err => {
                console.log('getEmInfoById error: ' + err)
              })
          }
        })
        .catch(err => {
          console.log('getEmInfo error: ' + err)
        })
    },
    orgSave() {
      this.$refs.orgFormData.validate(valid => {
        if (valid) {
          this.modalloading = true
          if (this.isNew) {
            this.addOrg(this.orgFormData)
              .then(() => {
                this.$Notice.success({
                  title: '提示',
                  desc: '添加应急预案成功',
                  duration: 1
                })
                this.orgAddModal = false
                this.orgRefresh()
                this.modalloading = false
              })
              .catch(err => {
                this.modalloading = false
                console.log('addOrg error: ' + err)
                this.$Notice.error({
                  title: '提示',
                  desc: err,
                  duration: 1
                })
              })
          } else {
            this.editOrg(this.orgFormData)
              .then(() => {
                this.$Notice.success({
                  title: '提示',
                  desc: '修改成功',
                  duration: 1
                })
                this.orgRefresh()
                this.orgAddModal = false
                this.modalloading = false
              })
              .catch(err => {
                this.modalloading = false
                console.log('editOrg error: ' + err)
                this.$Notice.error({
                  title: '提示',
                  desc: err,
                  duration: 1
                })
              })
          }
          this.orgRefresh()
        } else {
        }
      })
    },
    orgCancel() {
      this.orgAddModal = false
      setTimeout(() => {
        this.$refs.orgFormData.resetFields()
      }, 500)
    },
    openMoveModal(dir) {
      // this.createOrgMoveModel()
      this.direction = dir
      this.orgMove()
    },
    orgMove() {
      if (this.direction === 'up') {
        this.moveOrgUpDown(this.previousId)
          .then(() => {
            this.$Notice.success({
              title: '提示',
              desc: '移动成功',
              duration: 1
            })
            this.orgRefreshRoot()
          })
          .catch(err => {
            console.log('moveOrgUpDown error: ' + err)
            this.$Notice.error({
              title: '提示',
              desc: err,
              duration: 1
            })
          })
      }
      if (this.direction === 'down') {
        this.moveOrgUpDown(this.nextId)
          .then(() => {
            this.$Notice.success({
              title: '提示',
              desc: '移动成功',
              duration: 1
            })
            this.orgRefreshRoot()
          })
          .catch(err => {
            console.log('moveOrgUpDown error: ' + err)
            this.$Notice.error({
              title: '提示',
              desc: err,
              duration: 1
            })
          })
      }
      if (this.direction === 'left') {
        this.moveOrgLeftRight({
          id: this.grandpaId,
          isLeft: true
        })
          .then(() => {
            this.$Notice.success({
              title: '提示',
              desc: '移动成功',
              duration: 1
            })
            this.orgRefreshRoot()
          })
          .catch(err => {
            console.log('moveOrgLeftRight error: ' + err)
            this.$Notice.error({
              title: '提示',
              desc: err,
              duration: 1
            })
          })
      }
      if (this.direction === 'right') {
        this.moveOrgLeftRight({
          id: this.previousId,
          isLeft: false
        })
          .then(() => {
            this.$Notice.success({
              title: '提示',
              desc: '移动成功',
              duration: 1
            })
            this.orgRefreshRoot()
          })
          .catch(err => {
            console.log('moveOrgLeftRight error: ' + err)
            this.$Notice.error({
              title: '提示',
              desc: err,
              duration: 1
            })
          })
      }
    },
    createOrgDelModel() {
      this.$Modal.confirm({
        title: '提示',
        content:
          '<p>确认删除所选应急预案吗？</p><p style="color: red">删除所选应急预案会同时删除此应急预案下所有设备</p>',
        onOk: () => {
          this.orgDelete()
        },
        onCancel: () => {}
      })
    },
    orgDelete() {
      // this.modalLoading = true
      this.deleteEm(this.activeId)
        .then(res => {
          this.$Message.success('删除成功')
          this.$Notice.success({
            title: '提示',
            desc: '删除成功',
            duration: 1
          })
          this.orgRefresh()
          this.getOrgAll()
        })
        .catch(err => {
          console.log('deleteEm error: ' + err)
          this.$Notice.error({
            title: '提示',
            desc: err,
            duration: 1.5
          })
        })
    },
    orgRefresh() {
      this.getEmTree(this.orgType)
        .then(() => {
          this.treeData = JSON.parse(JSON.stringify(this.emTree))
        })
        .catch(err => {
          console.log('getEmTree error: ' + err)
        })
    },
    orgRefreshRoot() {
      this.getEmTree(this.orgType)
        .then(() => {
          this.treeData = JSON.parse(JSON.stringify(this.emTree))
          this.activeId = this.treeData[0]._id
          this.setOrgActiveId(this.treeData[0]._id)
          this.setOrgActiveName(this.treeData[0].name)
          this.setIsRootOrg(true)
          this.searchVal = ''
          // this.$emit('call')
        })
        .catch(err => {
          console.log('getEmTree error: ' + err)
        })
    }
  },
  beforeDestroy() {
    this.treeData = null
  }
}
</script>
<style scoped>
.org-actions-box {
  width: 100%;
  box-sizing: border-box;
  height: 100%;
}
.orgHeight {
  height: calc(100% - 30px);
}
.org-actions-box .box-title {
  display: inline-block;
  text-align: center;
  font-size: 14px;
  color: #fff;
  background-color: #0f2243;
  height: 40px;
  line-height: 40px;
  margin-bottom: 10px;
  width: 300px;
}
.org-actions-box .box-btn {
  padding-left: 10px;
  padding-right: 6px;
}
.org-actions-box .box-btn .ivu-btn-group {
  width: 100%;
}
.org-actions-box .box-btn .ivu-btn-group .ivu-btn {
  padding: 0;
  width: 16.6666666%;
  height: 26px;
}
.org-actions-box .box-tree {
  font-size: 12px;
  width: 300px;
}
.org-modal-form {
  padding: 0 10px;
}
/*.org-modal-form .ivu-form-item {
  margin-bottom: 12px;
}*/
.iconfont {
  font-size: 14px;
}
</style>
