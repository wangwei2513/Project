import toTreeData from 'assets/js/toTreeData.js'
// import equipment from '../../../../store/modules/equipment'

export default {
  components: {},
  data() {
    return {
      // 点击树 当前id
      activeOrgId: '',
      importData: [],
      exportData: [],
      smartData: [],
      singleIn: false,
      importAdd: false,
      importEdit: false,
      exportEditMod: false,
      inputIsShow: false,
      alarmLink: false,
      CameraState: false,
      showForm: true,
      rightSelect: true,
      linkIsShow: true, // 报警联动配置联动动作
      // 添加删除修改——按钮
      modalLoading: false,
      OutType: '',
      addModTitle: '',
      editModTitle: '',
      exportModTitle: '',
      wayGroup: '',
      inSearchName: '',
      outSearchName: '',
      smartSearchName: '',
      jkdSearchName: '',
      nowModTabIndex: '',
      alarmLinkName: '',
      linkOption: '0', // 默认联动动作
      nowTabIndex: '0',
      itemIndex: '0',
      editOrgiData: {},
      options: {
        showCheckbox: true,
        showInput: true
      },
      // 表格title
      importTitle: [{
        type: 'selection',
        width: 60
      }, {
        title: '报警名称',
        key: 'name',
        minWidth: 220,
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
        title: '所属设备',
        key: 'mainname',
        ellipsis: true,
        minWidth: 220,
        render: (h, params) => {
          let name = ''
          name = params.row.eid.name
          return h('div', name)
        }
      }, {
        title: '防区编号',
        key: 'chan',
        minWidth: 100
      }, {
        title: '级别',
        key: 'level',
        minWidth: 100
      }, {
        title: '报警分类',
        key: 'alarmTypeName',
        minWidth: 150,
        render: (h, params) => {
          let time = ''
          if (this.enabledSort.length !== 0) {
            this.enabledSort.forEach((item) => {
              if (params.row.alarmtype !== undefined && item.value === params.row.alarmtype) {
                time = item.label
              }
            })
          }
          return h('div', time)
        }
      }, {
        title: '布防时间',
        key: 'alarmtemplate',
        minWidth: 180,
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
        key: 'maxdelaytime',
        minWidth: 150
      }, {
        title: '最小间隔',
        minWidth: 150,
        key: 'minintervaltime'
      }, {
        title: '联动配置',
        key: 'linkConfig',
        minWidth: 150,
        render: (h, params) => {
          return h('div', [
            h('Button', {
              props: {
                type: 'ghost',
                disabled: !this.$BShasPower('BS-ALARMIN-TABS-ACTION')
              },
              on: {
                click: () => {
                  this.importSet(params.row)
                }
              }
            }, '设置')
          ])
        }
      }],
      exportTitle: [{
        type: 'selection',
        width: 60
      }, {
        title: '报警名称',
        key: 'name',
        minWidth: 200,
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
        title: '所属设备',
        key: 'orgName',
        ellipsis: true,
        minWidth: 200,
        render: (h, params) => {
          let name = ''
          name = params.row.eid.name
          return h('div', name)
        }
      }, {
        title: '防区编号',
        key: 'chan',
        minWidth: 100
      }, {
        title: '输出类型',
        minWidth: 150,
        key: 'alarmouttype',
        render: (h, params) => {
          if (this.exportData.length !== 0) {
            if (this.exportData[params.index]) {
              let status = this.exportData[params.index].alarmouttype === '1' ? '常开' : '常闭'
              return h('span', status)
            } else {
              return h('span', '')
            }
          }
        }
      }, {
        title: '持续时间',
        key: 'durationtime',
        minWidth: 150
      }, {
        title: '输出延时',
        key: 'exportdelaytime',
        minWidth: 150
      }],
      smartTitle: [{
        title: '通道号',
        key: 'chan'
      }, {
        title: '所属设备',
        key: 'orgName',
        ellipsis: true,
        render: (h, params) => {
          let name = ''
          name = params.row.rid.eid.name
          return h('div', name)
        }
      }, {
        title: '级别',
        key: 'level'
      }, {
        title: '报警分类',
        key: 'alarmSmartType',
        render: (h, params) => {
          let time = ''
          if (this.enabledSort.length !== 0) {
            this.enabledSort.forEach((item) => {
              if (params.row.alarmtype !== undefined && item.value === params.row.alarmtype) {
                time = item.label
              }
            })
          }
          return h('div', time)
        }
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
        title: '报警详情',
        key: 'alarmMessage',
        render: (h, params) => {
          return h('div', [
            h('Button', {
              props: {
                type: 'ghost'
              },
              on: {
                click: () => {
                  this.monitorMessage(params.row, params.index)
                }
              }
            }, '详情')
          ])
        }
      }, {
        title: '联动配置',
        key: 'linkConfig',
        width: 100,
        render: (h, params) => {
          return h('div', [
            h('Button', {
              props: {
                type: 'ghost',
                disabled: !this.$BShasPower('BS-ALARMSMART-TABS-ACTION')
              },
              on: {
                click: () => {
                  this.importSet(params.row)
                }
              }
            }, '设置')
          ])
        }
      }],
      showLinkdelBtn: true,
      Inselect: [],
      deviceTree: [], // 设备树数据
      videoTree: [], // 联动视频树数据
      exportTree: [], // 报警输出树数据
      enabledSortCopy: [],
      editForm: {
        _id: '',
        orgName: '所属设备',
        chan: '防区编号',
        name: '报警名称',
        level: 1,
        alarmtype: '',
        alarmtemplate: '',
        maxdelaytime: '',
        minintervaltime: '',
        mapsign: {
          signflag: false,
          signtype: 0
        },
        alarmaffirm: {
          affirmflag: '',
          autoaffirm: {
            status: '',
            intervaltime: 0
          },
          handaffirm: {
            status: ''
          }
        }
      },
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
      exportForm: {
        _id: '',
        name: '',
        orgName: '',
        chan: '',
        alarmouttype: '',
        durationtime: '',
        exportdelaytime: ''
      },
      // 删改按钮禁用(表格复选框勾选时启用)
      cantClick: true,
      outcantClick: true,
      addLoading: false
    }
  },
  computed: {},
  methods: {
    // 搜索
    search() {
      this.returnData()
    },
    // 显示子机构资源
    childData(status) {
      this.singleIn = status
      this.returnData()
    },
    // 2-1.报警输入\输出-添加
    openAddMod(title, isshow, rtshow) {
      this.addLoading = true
      this.addModTitle = title
      this.showForm = isshow
      this.rightSelect = rtshow
      this.deviceTree.length = 0
      if (this.nowTabIndex === '0') {
        let dataIn = {
          oid: this.rootOrgId,
          orgtype: 0,
          channelTypes: '1,9'
        }
        this.getAddTree(dataIn).then((suc) => {
          let addInTree = JSON.parse(JSON.stringify(this.addTreeData))
          this.deviceTree = toTreeData(addInTree)
          this.addLoading = false
          this.importAdd = true
        }).catch((err) => {
          this.addLoading = false
          console.log('logout error:' + err)
          this.errorMsg('设备树数据获取失败')
        })
      } else if (this.nowTabIndex === '1') {
        let dataOut = {
          oid: this.rootOrgId,
          orgtype: 0,
          channelTypes: '2,10'
        }
        this.getAddTree(dataOut).then((suc) => {
          let addOutTree = JSON.parse(JSON.stringify(this.addTreeData))
          this.deviceTree = toTreeData(addOutTree)
          this.addLoading = false
          this.importAdd = true
        }).catch((err) => {
          this.addLoading = false
          console.log('logout error:' + err)
          this.errorMsg('设备树数据获取失败')
        })
      }
    },
    // 2-2.报警输入\输出-添加确认
    affirmAdd(name) {
      if (this.nowTabIndex === '0') {
        this.modalLoading = true
        let idInfoOrig = this.$refs.inTree.getSelectedNodes()
        let idInfo = []
        idInfo = idInfoOrig.filter(node => !node.isOrg).filter(node => !node.equip)
        if (idInfo.length !== 0) {
          let addList = []
          idInfo.map((v) => {
            addList.push(v._id)
          })
          let add = {
            oid: this.activeOrgId,
            rids: addList
          }
          this.addAlarmInData(add).then((suc) => {
            this.returnData()
            this.recordMsg(idInfo, '报警添加', '报警输入添加')
          }).catch((err) => {
            console.log('logout error:' + err)
            this.errorMsg('添加失败')
          })
        } else {
          this.importAdd = true
          this.modalLoading = false
          this.errorMsg('请勾选资源')
          return
        }
      } else if (this.nowTabIndex === '1') {
        this.modalLoading = true
        let idOutInfoOrig = this.$refs.inTree.getSelectedNodes()
        let idOutInfo = []
        // 机构设备筛选
        idOutInfo = idOutInfoOrig.filter(node => !node.isOrg).filter(node => !node.equip)
        // 筛选出来的设备信息
        if (idOutInfo.length !== 0) {
          let addOutList = []
          idOutInfo.map((v) => {
            addOutList.push(v._id)
          })
          let addOut = {
            oid: this.activeOrgId,
            rids: addOutList
          }
          this.addAlarmOutData(addOut).then((suc) => {
            this.returnData()
            this.recordMsg(idOutInfo, '报警添加', '报警输出添加')
          }).catch((err) => {
            console.log('logout error:' + err)
            this.errorMsg('添加失败')
          })
        } else {
          this.importAdd = true
          this.modalLoading = false
          this.errorMsg('请勾选资源')
          return
        }
      }
      this.importAdd = false
      this.modalLoading = false
    },
    // 3-1.报警输入 修改
    openEditMod(title) {
      if (this.Inselect.length === 1 && title === '修改报警输入属性') {
        this.editModTitle = title
        this.importEdit = true
        this.editForm = Object.assign({}, this.editForm, this.Inselect[0])
        if (this.editForm.alarmaffirm.autoaffirm.status) {
          this.wayGroup = '自动确认'
        } else if (this.editForm.alarmaffirm.handaffirm.status) {
          this.wayGroup = '手工确认'
        }
      } else if (this.Inselect.length === 0) {
        this.warningMsg('请先选择一项')
      } else {
        this.warningMsg('不支持批量修改')
      }
    },
    timeChange(val) {
      this.editForm.alarmtemplate = val
    },
    // 3-1-1 批量修改
    openMoreEditMod(title) {
      if (this.Inselect.length === 0) {
        this.warningMsg('请至少选择一项需修改的数据')
      } else {
        this.isEditMore = false
        this.editModTitle = title
        this.importEdit = true
        this.editForm.alarmtype = this.enabledSort[0].value
        this.editForm.maxdelaytime = '300'
        this.editForm.minintervaltime = '300'
      }
    },
    // 3-3.手工确认\自动确认,复选框
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
    // 3-4.手工确认\自动确认，audio勾选
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
    // 3-5.报警输入 修改—确认按钮
    editOk(name) {
      this.$refs[name].validate((valid) => {
        if (valid) {
          if (this.editModTitle === '修改报警输入属性') {
            this.editForm.maxdelaytime = Number(this.editForm.maxdelaytime)
            this.editForm.minintervaltime = Number(this.editForm.minintervaltime)
            this.editAlarmInData(this.editForm).then((suc) => {
              this.recordMsg(this.editForm, '报警输入修改', '报警输入修改')
              this.returnData()
            }).catch(() => {
              this.errorMsg('修改失败')
            })
          } else if (this.editModTitle === '批量修改报警输入属性') {
            let idsData = []
            this.Inselect.map((item) => {
              idsData.push(item._id)
            })
            let formData = {
              alarmtype: this.editForm.alarmtype,
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
            this.editMoreAlarmInData(payData).then(() => {
              this.recordMsg(this.Inselect, '报警输入修改', '报警输入修改')
              this.returnData()
            }).catch(() => {
              this.errorMsg('批量修改失败')
            })
          }
          this.importEdit = false
        }
      })
    },
    // 3-6.修改取消
    editCancel(name) {
      this.$refs[name].resetFields()
      this.importEdit = false
    },
    // 3-7.输入 修改——报警分类动态显示相关参数
    classifyChange(data) {
      this.enabledSortCopy = JSON.parse(JSON.stringify(this.enabledSort))
      this.enabledSortCopy.map((v) => {
        if (v.value === data) {
          // 一旦报警分类改变，根据报警分类模板，显示分类初始参数
          this.editForm.maxdelaytime = v.maxdelaytime
          this.editForm.level = v.level
          this.editForm.minintervaltime = v.minintervaltime
          this.editForm.alarmtemplate = v.alarmtemplate
          this.editForm.alarmaffirm.autoaffirm = v.alarmaffirm.autoaffirm
          this.editForm.alarmaffirm.handaffirm.status = v.alarmaffirm.handaffirm.status
          this.editForm.alarmaffirm.affirmflag = true // v.alarmaffirm.affirmflag
          if (v.alarmaffirm.affirmflag) {
            if (v.alarmaffirm.autoaffirm.status === false) {
              this.wayGroup = '手工确认'
              this.inputIsShow = true
            } else {
              this.wayGroup = '自动确认'
              this.inputIsShow = false
            }
          } else {
            this.wayGroup = ''
            this.inputIsShow = true
          }
        }
      })
    },
    // 4-1.报警输出-修改
    exportMod(title) {
      if (this.Inselect.length === 1) {
        this.exportModTitle = title
        const _exportForm = this.exportForm
        const _nselect = this.Inselect[0]
        Object.keys(_exportForm).forEach(k => {
          _exportForm[k] = _nselect[k]
        })
        this.exportForm = _exportForm
        this.exportForm.orgName = this.Inselect[0].eid.name
        this.OutType = String(this.exportForm.alarmouttype)
        this.exportEditMod = true
      } else {
        this.warningMsg('不支持批量修改')
      }
    },
    // 4-2-1 批量修改 输出
    exportMoreMod(title) {
      this.exportModTitle = title
      this.exportForm.alarmouttype = '1'
      this.exportForm.durationtime = '10'
      this.exportForm.exportdelaytime = '0'
      this.OutType = String(this.exportForm.alarmouttype)
      this.exportEditMod = true
    },
    // 4-2.报警输出-修改确定
    exportConfirm(name) {
      this.$refs[name].validate((valid) => {
        if (valid) {
          if (this.exportModTitle === '修改报警输出') {
            this.exportForm.alarmouttype = this.OutType
            this.exportForm.durationtime = Number(this.exportForm.durationtime)
            this.exportForm.exportdelaytime = Number(this.exportForm.exportdelaytime)
            this.editAlarmOutData(this.exportForm).then((suc) => {
              this.recordMsg(this.exportForm, '报警输出修改', '报警输出修改')
              this.returnData()
            }).catch((err) => {
              console.log('logout error:' + err)
              this.errorMsg('修改失败')
            })
          } else if (this.exportModTitle === '批量修改报警输出') {
            let idsData = []
            this.Inselect.map((item) => {
              idsData.push(item._id)
            })
            let exportForm = {
              alarmouttype: this.OutType,
              durationtime: this.exportForm.durationtime,
              exportdelaytime: this.exportForm.exportdelaytime
            }
            let payData = {
              ids: idsData.join(','),
              data: exportForm
            }
            this.editMoreAlarmOutData(payData).then(() => {
              this.recordMsg(this.Inselect, '报警输出修改', '报警输出修改')
              this.returnData()
            }).catch(() => {
              this.errorMsg('批量修改失败')
            })
          }
          this.exportEditMod = false
        }
      })
    },
    // 5-1.批量删除-控制
    delAlarm() {
      if (this.Inselect.length !== 0) {
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
      }
    },
    // 5-2.批量删除-确认
    sureDel() {
      let idList = []
      this.Inselect.map((v) => {
        idList.push(v._id)
      })
      idList = idList.join(',')
      if (this.nowTabIndex === '0') {
        this.delAlarmInData(idList).then(() => {
          // this.delInData(idList)
          this.recordMsg(this.Inselect, '报警删除', '报警输入删除')
          this.returnData()
        }).catch((err) => {
          console.log('logout error:' + err)
          this.errorMsg('删除失败')
        })
      }
      if (this.nowTabIndex === '1') {
        this.delAlarmOutData(idList).then((suc) => {
          // this.delOutData(idList)
          this.recordMsg(this.Inselect, '报警删除', '报警输出删除')
          this.returnData()
        }).catch((err) => {
          console.log('logout error:' + err)
          this.errorMsg('删除失败')
        })
      }
    },
    // 5-3.报警输入\报警输出\智能报警\联动视频\联动报警输出-批量删除数据
    alarmInSel(selection) {
      this.Inselect = selection
      if (this.Inselect.length === 0) {
        if (this.nowTabIndex === '0') {
          this.cantClick = true
        } else if (this.nowTabIndex === '1') {
          this.outcantClick = true
        }
        this.showLinkdelBtn = true
      } else {
        if (this.nowTabIndex === '0') {
          this.cantClick = false
        } else if (this.nowTabIndex === '1') {
          this.outcantClick = false
        }
        this.showLinkdelBtn = false
      }
    },
    // 删除/添加/修改后 再次获取表格数据
    returnData() {
      this.Inselect = []
      if (this.nowTabIndex === '0') {
        this.cantClick = true
        this.getImportData()
        return
      }
      if (this.nowTabIndex === '1') {
        this.outcantClick = true
        this.getExportData()
        return
      }
      if (this.nowTabIndex === '2') {
        this.getIntelligentData()
        return
      }
      if (this.nowTabIndex === '3') {
        this.getMonitorData()
      }
    },
    // 模态框取消按钮
    cancel(name) {
      this.exportEditMod = false
      this.importAdd = false
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
          module: '报警管理',
          operateName: operateName,
          operateContent: operateContent,
          target: targets.join(','),
          deviceIp: deviceIps.join(',')
        }
        this.recordLog(param)
      } else {
        const param = {
          logType: '管理日志',
          module: '报警管理',
          operateName: operateName,
          operateContent: operateContent,
          target: selectList.name,
          deviceIp: selectList.ip
        }
        this.recordLog(param)
      }
    }
  },
  watch: {
    Inselect: {
      deep: true,
      handler: function(newdata, olddata) {
        return newdata
      }
    },
    enabledTemp: {
      deep: true,
      handler: function(newdata, olddata) {
        return newdata
      }
    },
    singleIn(newV, old) {
      return newV
    },
    activeOrgId(newV, old) {
      return newV
    }
  }
}
