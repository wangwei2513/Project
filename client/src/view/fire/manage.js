import toTreeData from 'assets/js/toTreeData.js'
export default {
  components: {},
  data() {
    const maxDelayRule = (rule, value, callback) => {
      let r = /^\+?[0-9][0-9]*$/
      if (value === '') {
        return callback(new Error('最大延时不能为空'))
      }
      if (r.test(value) || Number(value) === 0) {
        if (Number(value) > 7200) {
          return callback(new Error('最大延时范围0s-7200s'))
        } else {
          callback()
        }
      } else {
        return callback(new Error('请输入有效数字'))
      }
    }
    const minIntervalRule = (rule, value, callback) => {
      let r = /^\+?[0-9][0-9]*$/
      if (value === '') {
        return callback(new Error('最小间隔不能为空'))
      }
      if (r.test(value) || Number(value) === 0) {
        if (Number(value) > 7200) {
          return callback(new Error('最小间隔范围0s-7200s'))
        } else {
          callback()
        }
      } else {
        return callback(new Error('请输入有效数字'))
      }
    }
    const chanRule = (rule, value, callback) => {
      if (value === '') {
        return callback(new Error('不能为空'))
      } else {
        callback()
      }
    }
    const deviceidRule = (rule, value, callback) => {
      if (value === '') {
        return callback(new Error('设备回路不能为空'))
      } else {
        callback()
      }
    }
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
    return {
      inSearchName: '',
      singleIn: false,
      importTitle: [{
        type: 'selection',
        width: 60
      }, {
        title: '报警防区名称',
        key: 'name',
        render: (h, params) => {
          return h('span', {
            style: {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            },
            domProps: {
              title: params.row.name
            }
          }, params.row.name)
        }
      }, {
        title: '设备回路',
        key: 'devloop',
        ellipsis: true
      }, {
        title: '防区编号',
        key: 'chan'
      }, {
        title: '所属消防主机',
        key: 'mainname',
        ellipsis: true,
        render: (h, params) => {
          let time = ''
          if (params.row.eid !== undefined && params.row.eid.name !== undefined) {
            time = params.row.eid.name
          }
          return h('div', {
            style: {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            },
            domProps: {
              title: params.row.name
            }
          }, time)
        }
      }, {
        title: '级别',
        key: 'level'
      }, {
        title: '布防时间',
        key: 'alarmtemplate',
        render: (h, params) => {
          let time = ''
          if (this.enabledTemp.length !== 0) {
            this.enabledTemp.forEach((item) => {
              if (params.row.alarmtemplate !== undefined && item.value === params.row.alarmtemplate) {
                time = item.label
              }
            })
          }
          return h('div', time)
        }
      }, {
        title: '最大延时',
        key: 'maxdelaytime'
      }, {
        title: '最小间隔',
        key: 'minintervaltime'
      }, {
        title: '联动配置',
        key: 'linkConfig',
        width: 100,
        render: (h, params) => {
          return h('div', [
            h('Button', {
              props: {
                type: 'ghost',
                disabled: !this.$BShasPower('BS-FIRE-ALARMIN-ACTION')
              },
              // style: {
              //   display: this.$BShasPower('BS-FIRE-ALARMIN-ACTION') ? true : 'none'
              // },
              on: {
                click: () => {
                  this.importSet(params.row)
                }
              }
            }, '设置')
          ])
        }
      }],
      importData: [],
      // 添加
      importAdd: false,
      // addAlarmType: '',
      addModelTree: [],
      // 表格复选
      Inselect: [],
      // 修改 批量修改
      enabledLevel: [{
        label: 1,
        value: 1
      }, {
        label: 2,
        value: 2
      }, {
        label: 3,
        value: 3
      }, {
        label: 4,
        value: 4
      }, {
        label: 5,
        value: 5
      }, {
        label: 6,
        value: 6
      }, {
        label: 7,
        value: 7
      }, {
        label: 8,
        value: 8
      }, {
        label: 9,
        value: 9
      }],
      importEdit: false,
      editModTitle: '',
      editForm: {
        name: '',
        chan: '',
        devloop: '',
        level: 1,
        alarmtemplate: '5a94edb6e13823daf0f1c3d6',
        maxdelaytime: '',
        minintervaltime: '',
        mapsign: {
          signflag: false,
          signtype: 0
        },
        alarmaffirm: {
          affirmflag: false,
          autoaffirm: {
            status: false,
            intervaltime: 0
          },
          handaffirm: {
            status: false
          }
        }
      },
      editFormCopy: {
        name: '',
        chan: '',
        devloop: '',
        level: 1,
        alarmtemplate: '5a94edb6e13823daf0f1c3d6',
        maxdelaytime: '',
        minintervaltime: '',
        mapsign: {
          signflag: false,
          signtype: 0
        },
        alarmaffirm: {
          affirmflag: false,
          autoaffirm: {
            status: false,
            intervaltime: 0
          },
          handaffirm: {
            status: false
          }
        }
      },
      imageId: '',
      isroot: true,
      mapSelect: [{
        value: 0,
        label: '图标'
      }, {
        value: 1,
        label: '线'
      }, {
        value: 2,
        label: '区域'
      }],
      wayGroup: '',
      isEditMore: false,
      inputIsShow: true,
      // 联动设置
      autoComfirm: false,
      tableRowLineId: '',
      alarmLink: false,
      alarmLinkName: '',
      linkIsShow: true,
      videoTree: [],
      linkData: {
        resource: '',
        actionType: '1',
        actionVideo: [],
        doorServer: '',
        actionDoor: []
      },
      inforTitle: [{
        type: 'selection',
        width: 60,
        align: 'center'
      }, {
        title: '监控点名称',
        width: 150,
        ellipsis: true,
        key: 'channelName',
        render: (h, params) => {
          let text = ''
          if (this.linkData.actionVideo[params.index].channelName) {
            text = this.linkData.actionVideo[params.index].channelName
            return h('span', {
              style: {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              },
              domProps: {
                title: text
              }
            }, text)
          }
        },
        align: 'center'
      }, {
        title: '机构',
        width: 120,
        key: 'orgName',
        ellipsis: true,
        render: (h, params) => {
          let text = ''
          if (this.linkData.actionVideo[params.index].orgId) {
            text = this.searchOrg(this.linkData.actionVideo[params.index].orgId)
            return h('span', {
              style: {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              },
              domProps: {
                title: text
              }
            }, text)
          }
        },
        align: 'center'
      }, {
        title: '主摄像机',
        key: 'mainCamera',
        align: 'center',
        width: 90,
        render: (h, params) => {
          return h('div', [
            h('Radio', {
              props: {
                value: this.returnBlankIfNull(this.linkData.actionVideo[params.index], 'mainCamera')
              },
              nativeOn: {
                click: (v) => {
                  this.isCameras()
                  if (this.returnBlankIfNull(this.linkData.actionVideo[params.index], 'mainCamera') !== undefined) {
                    this.linkData.actionVideo[params.index].mainCamera = true
                  }
                }
              }
            })
          ])
        }
      }, {
        title: '客户端',
        align: 'center',
        width: 90,
        key: 'client',
        render: (h, params) => {
          const indexParams = params.index
          let _this = this
          return h('div', [
            h('Checkbox', {
              props: {
                value: this.returnBlankIfNull(this.linkData.actionVideo[indexParams], 'client')
              },
              on: {
                'on-change'(v, index = indexParams) {
                  if (_this.returnBlankIfNull(_this.linkData.actionVideo[indexParams], 'client') !== undefined) {
                    _this.linkData.actionVideo[indexParams].client = v
                  }
                }
              }
            })
          ])
        }
      }, {
        title: '电视墙',
        align: 'center',
        width: 90,
        key: 'videoWall',
        render: (h, params) => {
          const indexParams = params.index
          let _this = this
          return h('div', [
            h('Checkbox', {
              props: {
                value: this.returnBlankIfNull(this.linkData.actionVideo[indexParams], 'videoWall')
              },
              on: {
                'on-change'(v, index = indexParams) {
                  if (_this.returnBlankIfNull(_this.linkData.actionVideo[indexParams], 'videoWall') !== undefined) {
                    _this.linkData.actionVideo[indexParams].videoWall = v
                  }
                }
              }
            })
          ])
        }
      }, {
        title: '电子地图',
        align: 'center',
        width: 90,
        key: 'electronicMap',
        render: (h, params) => {
          const indexParams = params.index
          let _this = this
          return h('div', [
            h('Checkbox', {
              props: {
                value: this.returnBlankIfNull(this.linkData.actionVideo[indexParams], 'electronicMap')
              },
              on: {
                'on-change'(v, index = indexParams) {
                  if (_this.returnBlankIfNull(_this.linkData.actionVideo[indexParams], 'electronicMap') !== undefined) {
                    _this.linkData.actionVideo[indexParams].electronicMap = v
                  }
                }
              }
            })
          ])
        }
      }, {
        title: '录像',
        align: 'center',
        width: 90,
        key: 'record',
        render: (h, params) => {
          const indexParams = params.index
          let _this = this
          return h('div', [
            h('Checkbox', {
              props: {
                value: this.returnBlankIfNull(this.linkData.actionVideo[indexParams], 'record')
              },
              on: {
                'on-change'(v, index = indexParams) {
                  if (_this.returnBlankIfNull(_this.linkData.actionVideo[indexParams], 'record') !== undefined) {
                    _this.linkData.actionVideo[indexParams].record = v
                  }
                }
              }
            })
          ])
        }
      }],
      // 联动门禁
      titles: ['编码——位置', '编码——位置'],
      transfData: [],
      targetKeys: this.getTargetKeys(),
      doorData: [],
      rootOrgId: '',
      tableLists: [],
      // 验证规则
      formValidate: {
        name: [{
          required: true,
          validator: nameRule,
          trigger: 'change'
        }],
        chan: [{
          required: true,
          validator: chanRule,
          trigger: 'blur'
        }],
        devloop: [{
          required: true,
          validator: deviceidRule,
          trigger: 'blur'
        }],
        level: [{
          required: true,
          validator: chanRule,
          trigger: 'change'
        }],
        alarmtemplate: [{
          required: true,
          validator: chanRule,
          trigger: 'change'
        }],
        maxdelaytime: [{
          required: true,
          validator: maxDelayRule,
          trigger: 'blur'
        }],
        minintervaltime: [{
          required: true,
          validator: minIntervalRule,
          trigger: 'blur'
        }]
      },
      addLoading: false
    }
  },
  computed: {},
  methods: {
    // tabs2 功能部分
    // 添加 模态框
    openAddMod() {
      this.addLoading = true
      this.addModelTree = []
      this.getXFAddTree(this.rootOrgId).then((suc) => {
        let addOutTree = JSON.parse(JSON.stringify(this.addXFTreeData))
        let outFirTran = toTreeData(addOutTree)
        this.addModelTree = outFirTran
        this.importAdd = true
        this.addLoading = false
      }).catch((err) => {
        console.log('this.getXFAddTree :' + err)
        this.addLoading = false
        this.errorMsg('添加：设备树数据获取失败')
      })
    },
    // 添加 模态框 取消
    cancel(name) {
      this.importAdd = false
      this.addModelTree = []
    },
    // 添加 模态框 确定
    affirmAdd() {
      this.modalLoading = true
      let idInfoOrig = this.$refs.inTree.getSelectedNodes()
      let idInfo = []
      idInfo = idInfoOrig.filter(node => !node.isOrg).filter(node => !node.equip)
      if (idInfo.length !== 0) {
        let add = {
          oid: this.activeOrgId,
          rids: idInfo
        }
        this.addImportData(add).then((suc) => {
          this.recordMsg(idInfo, '消防报警添加', '消防报警添加')
          setTimeout(() => {
            this.getTableData(this.activeOrgId)
            this.successMsg('添加成功')
            this.modalLoading = false
            this.importAdd = false
          }, 2000)
        }).catch((err) => {
          this.modalLoading = false
          this.importAdd = false
          console.log('this.addImportData :' + err)
          this.errorMsg('添加失败')
        })
      } else {
        this.importAdd = true
        this.modalLoading = false
        this.errorMsg('请勾选资源')
        return
      }
      this.modalLoading = false
    },
    // 删除（支持多选） 按钮
    delAlarm() {
      if (this.Inselect.length >= 1) {
        this.$Modal.confirm({
          title: '警告',
          content: '<p>确认删除吗?</p>',
          loading: true,
          onOk: () => {
            this.sureDel()
            setTimeout(() => {
              this.$Modal.remove()
            }, 0)
          }
        })
      } else {
        this.warningMsg('请至少选择一项需删除的数据')
      }
    },
    // 删除 确定
    sureDel() {
      this.modalLoading = true
      let idList = []
      this.Inselect.map((v) => {
        idList.push(v._id)
      })
      idList = idList.join(',')
      this.delImportData(idList).then(() => {
        this.modalLoading = false
        this.recordMsg(this.Inselect, '消防报警删除', '消防报警删除')
        this.getTableData(this.activeOrgId)
      }).catch((err) => {
        console.log('this.delImportData :' + err)
        this.errorMsg('删除失败')
      })
      this.modalLoading = false
    },
    // 修改 模态框
    openEditMod(type) {
      if (this.Inselect.length === 1) {
        this.isEditMore = true
        this.editModTitle = type
        this.importEdit = true
        this.editForm = Object.assign({}, this.editForm, this.Inselect[0])
        if (this.editForm.alarmaffirm.autoaffirm.status) {
          this.wayGroup = '自动确认'
        } else if (this.editForm.alarmaffirm.handaffirm.status) {
          this.wayGroup = '手工确认'
        } else {
          this.wayGroup = ''
        }
      } else {
        this.warningMsg('请选择一项需修改的数据')
      }
    },
    // 批量修改 模态框
    openMoreEditMod(type) {
      if (this.Inselect.length === 0) {
        this.warningMsg('请至少选择一项需修改的数据')
      } else {
        this.isEditMore = false
        this.editModTitle = type
        this.importEdit = true
        this.editForm.alarmtemplate = this.enabledTemp[0].value
        this.editForm.maxdelaytime = '300'
        this.editForm.minintervaltime = '300'
      }
    },
    // 修改 模态框 报警确认复选框
    showChange(checkState) {
      if (checkState === false) {
        this.wayGroup = ''
        this.inputIsShow = true
        this.editForm.alarmaffirm.autoaffirm.status = false
        this.editForm.alarmaffirm.handaffirm.status = false
      } else {
        this.wayGroup = '自动确认'
        this.inputIsShow = false
      }
    },
    // 修改 模态框 手工确认\自动确认，audio勾选
    showRadio(select) {
      this.editForm.alarmaffirm.affirmflag = true
      if (select === '手工确认') {
        this.inputIsShow = true
        this.editForm.alarmaffirm.autoaffirm.status = false
        this.editForm.alarmaffirm.handaffirm.status = true
      } else {
        this.inputIsShow = false
        this.editForm.alarmaffirm.autoaffirm.status = true
        this.editForm.alarmaffirm.handaffirm.status = false
      }
    },
    // 修改 模态框 取消
    editCancel(name) {
      // this.$refs[name].resetFields()
      this.editForm = this.editFormCopy
      this.importEdit = false
    },
    // 修改 模态框 确定
    editOk(name) {
      this.$refs[name].validate((valid) => {
        if (valid) {
          this.modalLoading = true
          if (this.editModTitle === '修改输入防区') {
            this.editImportData(this.editForm).then(() => {
              this.recordMsg(this.editForm, '消防报警修改', '消防报警修改')
              this.getTableData()
              this.modalLoading = false
            }).catch((err) => {
              this.modalLoading = false
              console.log('editImportData err:', err)
            })
          } else {
            let idsData = []
            this.Inselect.map((item) => {
              idsData.push(item._id)
            })
            let formData = {
              level: this.editForm.level,
              alarmtemplate: this.editForm.alarmtemplate,
              maxdelaytime: this.editForm.maxdelaytime,
              minintervaltime: this.editForm.minintervaltime,
              alarmaffirm: {
                affirmflag: true, // this.editForm.alarmaffirm.affirmflag,
                autoaffirm: {
                  status: this.editForm.alarmaffirm.autoaffirm.status,
                  intervaltime: this.editForm.alarmaffirm.autoaffirm.intervaltime
                },
                handaffirm: {
                  status: this.editForm.alarmaffirm.handaffirm.status
                }
              }
            }
            let payData = {
              ids: idsData.join(','),
              data: formData
            }
            this.editMoreImportData(payData).then(() => {
              this.modalLoading = false
              this.getTableData()
            }).catch((err) => {
              this.modalLoading = false
              console.log('editMoreImportData err:', err)
            })
          }
          this.importEdit = false
          this.modalLoading = false
        }
      })
    },
    // 表格复选框
    alarmInSel(selection) {
      this.Inselect = selection
      if (this.Inselect.length === 0) {
        this.canClick = true
      } else {
        this.canClick = false
      }
    },
    // 搜索
    search() {
      this.pageInfo.cur = 1
      this.getTableData()
    },
    // 显示子机构
    childData(status) {
      this.singleIn = status
      this.getTableData()
    },
    // 表格 联动  相关实现 分割线 分割线 分割线 分割线 分割线 分割线 分割线 分割线 分割线 分割线 分割线
    returnBlankIfNull(item, key) { // 数据为undefined，则范围空字符串
      return item === undefined ? '' : item[key]
    },
    importSet(data) {
      this.alarmLink = true
      this.videoTree = []
      this.autoComfirm = false // 显示其他机构复选框状态初始化
      this.alarmLinkName = data.name
      this.tableRowLineId = data._id
      this.linkData.actionVideo = []
      this.linkData.actionDoor = []
      this.transfData = []
      this.targetKeys = []
      // 获取联动
      this.getAffirmsData(data._id).then(() => {
        this.linkData.actionType = '1'
        if (this.affirmsStore.length !== 0) {
          this.linkData.doorServer = this.affirmsStore.doorServer !== undefined ? this.affirmsStore.doorServer : ''
          this.linkData.actionVideo = this.affirmsStore.actionVideo !== undefined ? JSON.parse(JSON.stringify(this.affirmsStore.actionVideo)) : []
          this.linkData.actionDoor = this.affirmsStore.actionDoor !== undefined ? JSON.parse(JSON.stringify(this.affirmsStore.actionDoor)) : []
          // 获取联动视频树
          this.getVideoTree()
          // 获取联动门禁 左侧
          this.selDoorMeth(this.linkData.doorServer)
        } else {
          // 获取联动视频树
          this.getVideoTree()
          if (this.doorList.length && this.doorList[0].value) {
            this.selDoorMeth(this.doorList[0].value)
          }
        }
      }).catch((err) => {
        console.log('getAffirmsData err' + err)
        this.errorMsg('获取联动数据失败')
      })
    },
    otherTree(value) {
      this.autoComfirm = value
      this.getVideoTree()
    },
    // 获取联动视频树
    getVideoTree() {
      let videoTreeType = {
        orgtype: 0,
        channelTypes: '0',
        never: this.autoComfirm ? -1 : 0,
        pid: this.autoComfirm ? this.rootOrgId : this.activeOrgId, // 显示全部节点时，不传pid
        resId: this.tableRowLineId
      }
      this.getFireDeviceTree(videoTreeType).then(() => {
        let midd = JSON.parse(JSON.stringify(this.fireDeviceTreeData))
        this.videoTree = toTreeData([midd])
        if (this.linkData.actionVideo.length !== 0) {
          this.linkData.actionVideo.map((v) => {
            v.orgName = this.searchOrg(v.orgId)
          })
        }
      }).catch((err) => {
        console.log('this.getFireDeviceTree :' + err)
        this.errorMsg('联动视频树获取失败')
      })
    },
    // 主摄像机仅可选择一个
    isCameras() {
      let isCameras = this.linkData.actionVideo
      isCameras.map(v => {
        v.mainCamera = false
      })
    },
    // 查找父机构名称
    searchOrg(data) {
      let orgName
      let searchChild = (child) => {
        child.map((v) => {
          if (data === v._id) {
            orgName = v.name
          } else {
            if (v.children) {
              searchChild(v.children)
            }
          }
        })
      }
      searchChild(this.videoTree)
      return orgName
    },
    // 联动控制选项
    linkShow(data) {
      if (data === '1') {
        this.linkIsShow = true
      } else {
        this.linkIsShow = false
      }
    },
    // 1-6.联动——添加联动视频输出控制
    addVideoConfig() {
      let treeData = this.$refs.videoTree.getSelectedNodes()
      if (treeData.length !== 0) {
        let count = 0
        let idInfos = []
        let doubleName = []
        idInfos = treeData.filter(node => !node.isOrg).filter(node => !node.equip)
        if (idInfos.length === 0) {
          this.warningMsg('请勿勾选机构，应选择视频资源')
          count = 0
          return
        }
        count = idInfos.length
        let alllength = count + this.linkData.actionVideo.length
        if (alllength > 7) {
          this.warningMsg('最多添加7个联动视频')
          count = 0
        } else {
          idInfos.map((v) => {
            let orgName = this.searchOrg(v.pid)
            let videoSet = {
              resource: v._id, // channelId
              channelName: v.name,
              mainCamera: false,
              client: false,
              videoWall: false,
              electronicMap: false,
              record: false,
              orgId: v.pid,
              orgName: orgName // 接口不需要，单页面表单列需要显示
            }
            if (this.linkData.actionVideo.length === 0) {
              this.linkData.actionVideo.push(videoSet)
            } else {
              const result = this.linkData.actionVideo.some((item, index) => {
                return v._id === item.resource
              })
              if (!result && doubleName.length === 0) {
                this.linkData.actionVideo.push(videoSet)
              } else {
                doubleName.push(v.name)
              }
            }
          })
          if (doubleName.length !== 0) {
            this.$Notice.warning({
              title: '提示',
              desc: doubleName.join(',') + '  已添加，不能重复添加',
              top: 200
            })
          }
          count = 0
        }
      } else {
        this.warningMsg('请先选择视频资源')
      }
    },
    // 联动——删除联动视频输出控制
    delVideoConfig() {
      if (this.Inselect.length === 0) {
        this.warningMsg('请先选择要删除的联动视频源')
        return
      }
      this.Inselect.map(item => {
        this.linkData.actionVideo.map((Item, index) => {
          if (Item.resource === item.resource) {
            this.linkData.actionVideo.splice(index, 1)
          }
        })
      })
      this.Inselect = []
    },
    // 门禁服务器 选择 查找当前服务器下的门禁列表
    selDoorMeth(data) {
      const postData = {
        id: data,
        data: {
          page: 1,
          limit: 1000
        }
      }
      this.getDoorList(postData).then((res) => {
        this.tableLists = res
        this.linkData.doorServer = data
        // 门禁系统 左侧
        this.testMethod()
        // 获取联动门禁 右侧
        this.targetKeys = this.getTargetKeys()
      }).catch((err) => {
        this.errorMsg('获取该门禁系统列表失败！')
        console.log('this.getDoorList :' + err)
      })
    },
    testMethod() {
      this.transfData = []
      this.tableLists.map((item, index) => {
        this.transfData.push({
          key: item._id,
          label: item.chan.toString(),
          description: item.name
        })
      })
    },
    // 穿梭框右侧值
    getTargetKeys() {
      let rightKey = []
      if (this.linkData !== undefined && this.linkData.actionDoor !== undefined && this.linkData.actionDoor.length !== 0) {
        this.linkData.actionDoor.map((item) => {
          rightKey.push(item)
        })
      }
      return rightKey
    },
    handleChange(newKeys) {
      this.targetKeys = newKeys
    },
    renderFormat(item) {
      return item.label + ' —— ' + item.description
    },
    // 1-11.联动配置取消
    cancelLink() {
      this.alarmLink = false
      this.videoTree = []
      this.linkData.actionType = '1'
      this.linkData.actionVideo = []
      this.linkData.actionDoor = []
      this.transfData = []
      this.targetKeys = []
    },
    // 根据 穿梭框右侧 门禁的id,整理出门禁相关数据，方便存储至接口
    doorDataForSet() {
      let door = []
      if (this.tableLists.length !== 0 && this.targetKeys.length !== 0) {
        this.tableLists.map((item) => {
          this.targetKeys.map((keyItem) => {
            if (item._id === keyItem) {
              door.push(item._id)
            }
          })
        })
      }
      this.doorData = door
    },
    // 联动设置 模态框 确认功能
    affirmLink() {
      this.modalLoading = true
      this.doorDataForSet()
      let data = {
        body: {
          resource: this.tableRowLineId,
          actionVideo: this.linkData.actionVideo,
          doorServer: this.linkData.doorServer,
          actionDoor: this.doorData
        }
      }
      this.setAffirmsData(data).then((suc) => {
        this.modalLoading = false
        this.alarmLink = false
        this.getTableData()
        this.successMsg('联动配置成功')
      }).catch((err) => {
        this.alarmLink = false
        this.modalLoading = false
        console.log('this.setAffirmsData :' + err)
        this.errorMsg('联动配置失败')
      })
      this.modalLoading = false
      this.videoTree = []
    },
    recordMsg(selectList, operateName, operateContent) {
      if (selectList instanceof Array) {
        let targets = []
        let deviceIps = []
        selectList.forEach(item => {
          targets.push(item.name)
          deviceIps.push(item.ip)
        })
        const param = {
          logType: '管理日志',
          module: '消防管理',
          operateName: operateName,
          operateContent: operateContent,
          target: targets.join(','),
          deviceIp: deviceIps.join(',')
        }
        this.recordLog(param)
      } else {
        const param = {
          logType: '管理日志',
          module: '消防管理',
          operateName: operateName,
          operateContent: operateContent,
          target: selectList.name,
          deviceIp: selectList.ip
        }
        this.recordLog(param)
      }
    }
  }
}
