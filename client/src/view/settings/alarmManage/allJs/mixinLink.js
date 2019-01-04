import {
  toSecond,
  toHour
} from '../allJs/alarmFun.js'
export default {
  components: {},
  data() {
    const maxDelayRule = (rule, value, callback) => {
      let r = /^\+?[0-9][0-9]*$/
      if (value === '') {
        return callback(new Error('不能为空'))
      }
      if (r.test(value) || Number(value) === 0) {
        if (Number(value) > 7200) {
          return callback(new Error('范围0s-7200s'))
        } else {
          callback()
        }
      } else {
        return callback(new Error('请输入有效数字'))
      }
    }
    const continueTimeRule = (rule, value, callback) => {
      let r = /^\+?[0-9][0-9]*$/
      if (value === '') {
        return callback(new Error('时间不能为空'))
      }
      if (r.test(value) || Number(value) === 0) {
        if (Number(value) > 7200) {
          return callback(new Error('超出最大范围7200s'))
        } else {
          callback()
        }
      } else {
        return callback(new Error('请输入有效数字'))
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
      // 验证规则
      formValidate: {
        name: [{
          required: true,
          message: '名称不能为空',
          trigger: 'change'
        }, {
          validator: nameRule,
          trigger: 'change'
        }],
        maxdelaytime: [{
          required: true,
          validator: maxDelayRule,
          trigger: 'blur'
        }],
        minintervaltime: [{
          required: true,
          validator: maxDelayRule,
          trigger: 'blur'
        }],
        durationtime: [{
          required: true,
          validator: continueTimeRule,
          trigger: 'blur'
        }],
        exportdelaytime: [{
          required: true,
          validator: continueTimeRule,
          trigger: 'blur'
        }]
      },
      autoComfirm: false,
      linkData: {
        resource: '',
        actionVideo: [{
          channelName: '',
          mainCamera: '',
          client: '',
          videoWall: '',
          electronicMap: '',
          record: '',
          resource: '',
          orgId: ''
        }],
        actionOutCtl: [{
          resource: '',
          outPutName: '',
          outPutOrg: '',
          runMode: '',
          runAction: '',
          overlayIcon: ''
        }],
        actionRule: [{
          status: false,
          beginTime: null,
          endTime: null,
          actionVideo: false,
          actionOutPut: false
        }, {
          status: false,
          beginTime: null,
          endTime: null,
          actionVideo: false,
          actionOutPut: false
        }, {
          status: false,
          beginTime: null,
          endTime: null,
          actionVideo: false,
          actionOutPut: false
        }, {
          status: false,
          beginTime: null,
          endTime: null,
          actionVideo: false,
          actionOutPut: false
        }]
      },
      inforTitle: [{
        type: 'selection',
        width: 60,
        align: 'center'
      }, {
        title: '监控点名称',
        width: 150,
        key: 'channelName',
        render: (h, params) => {
          return h('span', {
            style: {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            },
            domProps: {
              title: params.row.channelName
            }
          }, params.row.channelName)
        }
      }, {
        title: '机构',
        width: 120,
        key: 'orgName',
        align: 'center',
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
        }
      }, {
        title: '主摄像机',
        key: 'Cameras',
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
        key: 'tvWall',
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
        key: 'map',
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
        key: 'video',
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
      linkTitle: [{
        type: 'selection',
        width: 60,
        align: 'center'
      }, {
        title: '输出端子名称',
        key: 'outPutName',
        width: 139,
        align: 'center',
        ellipsis: true
      }, {
        title: '执行方式',
        key: 'runMode',
        align: 'center',
        width: 139,
        render: (h, params) => {
          const indexParams = params.index
          let _this = this
          return h('Select', {
            props: {
              value: this.returnBlankIfNullCopy(this.linkData.actionOutCtl[indexParams], 'runMode')
              // value: this.linkData.actionOutCtl[indexParams].runMode === '0' ? '手动' : '自动'
            },
            on: {
              'on-change'(v, index = indexParams) {
                if (_this.returnBlankIfNull(_this.linkData.actionOutCtl[indexParams], 'runMode') !== undefined) {
                  if (v !== '') {
                    _this.linkData.actionOutCtl[index].runMode = (v === '手动' ? 0 : 1)
                  }
                }
              }
            }
          }, this.wayOptions.map(v => {
            return h('Option', {
              props: {
                value: v.label,
                key: v.value
              }
            })
          }))
        }
      }, {
        title: '执行动作',
        align: 'center',
        width: 139,
        key: 'runAction',
        render: (h, params) => {
          const indexParams = params.index
          let self = this
          return h('Select', {
            props: {
              value: this.returnBlankIfNullCopy(this.linkData.actionOutCtl[indexParams], 'runAction')
              // value: this.linkData.actionOutCtl[indexParams].runAction === '0' ? '打开' : '关闭'  // 读取数据中的值
            },
            on: {
              'on-change'(v, index = indexParams) {
                if (self.returnBlankIfNull(self.linkData.actionOutCtl[indexParams], 'runAction') !== undefined) {
                  if (v !== '') {
                    self.linkData.actionOutCtl[index].runAction = (v === '打开' ? 0 : 1)
                  }
                }
              }
            }
          }, this.actionOptions.map(v => {
            return h('Option', {
              props: {
                value: v.label,
                key: v
              }
            })
          }))
        }
      }, {
        title: '叠加图标',
        align: 'center',
        width: 90,
        key: 'tvWall',
        render: (h, params) => {
          const indexParams = params.index
          let _this = this
          return h('div', [
            h('Checkbox', {
              props: {
                value: this.returnBlankIfNull(this.linkData.actionOutCtl[indexParams], 'overlayIcon')
              },
              on: {
                'on-change'(v, index = indexParams) {
                  if (_this.returnBlankIfNull(_this.linkData.actionOutCtl[indexParams], 'overlayIcon') !== undefined) {
                    if (v !== '') {
                      _this.linkData.actionOutCtl[indexParams].overlayIcon = v
                    }
                  }
                }
              }
            })
          ])
        }
      }],
      actionOptions: [{
        value: 0,
        label: '打开'
      }, {
        value: 1,
        label: '关闭'
      }],
      wayOptions: [{
        value: 0,
        label: '手动'
      }, {
        value: 1,
        label: '自动'
      }]
    }
  },
  computed: {},
  watch: {
    'linkData.actionRule': {
      deep: true,
      handler(newval) {
        this.linkData.actionRule = newval
      }
    }
  },
  methods: {
    // 1-1.报警输入\智能报警\监控点 联动设置
    importSet(data) {
      this.alarmLinkName = data.name
      this.linkData.resource = data._id
      this.linkOption = '0'
      this.linkIsShow = true
      this.linkData.actionVideo = []
      if (this.nowTabIndex === '0') {
        let indata = {
          body: {
            type: 1
          },
          id: data._id
        }
        this.alarmLinkData(indata, '报警输入联动获取失败', this.linkData.resource)
      } else if (this.nowTabIndex === '2') {
        let smartdata = {
          body: {
            type: 2
          },
          id: data._id
        }
        this.alarmLinkData(smartdata, '智能报警联动获取失败', this.linkData.resource)
      } else if (this.nowTabIndex === '3') {
        let jkddata = {
          body: {
            type: 3
          },
          id: data._id
        }
        this.alarmLinkData(jkddata, '监控点报警联动获取失败', this.linkData.resource)
      }
      this.itemIndex = '0'
      this.showLinkdelBtn = true
      this.getVideoTree()
      setTimeout(() => {
        this.alarmLink = true
      }, 0)
    },
    // 联动获取 整合复用度高的代码
    alarmLinkData(value, message, resources) {
      this.getAlarmLink(value).then(() => {
        if (this.affirms !== undefined) {
          this.linkData.actionVideo = this.affirms.actionVideo !== undefined ? JSON.parse(JSON.stringify(this.affirms.actionVideo)) : []
          this.linkData.actionOutCtl = this.affirms.actionOutCtl !== undefined ? JSON.parse(JSON.stringify(this.affirms.actionOutCtl)) : []
          this.linkData.actionRule = this.affirms.actionRule !== undefined ? JSON.parse(JSON.stringify(this.affirms.actionRule)) : JSON.parse(JSON.stringify(this.initLinkData)).actionRule
          if (this.linkData.actionRule !== undefined && this.linkData.actionRule.length !== 0) {
            for (let i = 0; i < 4; i++) {
              let beginTime = this.linkData.actionRule[i].beginTime
              let endTime = this.linkData.actionRule[i].endTime
              this.linkData.actionRule[i].timeRange = toHour(beginTime, endTime)
            }
          }
        } else {
          this.linkData = JSON.parse(JSON.stringify(this.initLinkData))
        }
        this.linkData.resource = resources
      }).catch(() => {
        this.errorMsg(message)
      })
    },
    otherTree(value) {
      this.autoComfirm = value
      this.getVideoTree()
    },
    // 1-1-1.联动视频树
    getVideoTree() {
      let channelTypes = ''
      if (this.linkOption === '0') {
        channelTypes = '0'
      } else {
        channelTypes = '2,10'
      }
      let videoTreeType = {
        orgtype: 0,
        channelTypes: channelTypes, // 0视频资源  10输出
        resId: this.linkData.resource,
        // never: -1
        never: this.autoComfirm ? -1 : 0,
        oid: this.autoComfirm ? this.rootOrgId : this.activeOrgId // 显示全部节点时，不传oid
      }
      this.getDeviceTree(videoTreeType).then(() => {
        if (this.linkOption === '0') {
          this.videoTree = JSON.parse(JSON.stringify(this.deviceTreeData))
          this.linkData.actionVideo.map((v) => {
            v.orgName = this.searchOrg(v.orgId)
          })
        } else if (this.linkOption === '1') {
          this.exportTree = JSON.parse(JSON.stringify(this.deviceTreeData))
        }
      }).catch((err) => {
        console.log('logout error:' + err)
        this.errorMsg('联动树获取失败')
      })
    },
    // 1-2.联动规则序号
    tabIndex(item) {
      this.itemIndex = item
      this.nowModTabIndex = Number(item) - 1
    },
    // 1-3.时间改变时
    editTime(time) {
      let beginTime = time[0]
      let endTime = time[1]
      let timeSec = toSecond(beginTime, endTime)
      this.linkData.actionRule[this.nowModTabIndex].beginTime = timeSec[0]
      this.linkData.actionRule[this.nowModTabIndex].endTime = timeSec[1]
    },
    // 1-4.主摄像机仅可选择一个
    isCameras() {
      let isCameras = this.linkData.actionVideo
      isCameras.map(v => {
        v.mainCamera = false
      })
    },
    // 1-5.联动控制选项
    linkShow(data) {
      if (data === '0') {
        this.getVideoTree()
        this.linkIsShow = true
      } else {
        this.getVideoTree()
        this.linkIsShow = false
      }
    },
    // 1-6.联动——添加联动视频控制
    addVideoConfig() {
      if (this.linkOption === '0') {
        let treeData = this.$refs.videoTree.getSelectedNodes()
        if (treeData.length !== 0) {
          let idInfo = []
          let count = 0
          let doubleName = []
          idInfo = treeData.filter(node => !node.isOrg).filter(node => !node.equip)
          if (idInfo.length === 0) {
            this.warningMsg('请勿勾选机构，应选择视频资源')
            count = 0
            return
          }
          count = idInfo.length
          let alllength = count + this.linkData.actionVideo.length
          if (alllength > 7) {
            this.warningMsg('最多仅可添加7个联动视频')
            count = 0
          } else {
            idInfo.map((v) => {
              let orgName = this.searchOrg(v.pid)
              let Vid = v._id
              let videoSet = {
                channelName: v.name,
                mainCamera: false,
                client: false,
                videoWall: false,
                electronicMap: false,
                record: false,
                resource: Vid,
                orgId: v.pid,
                orgName: orgName
              }
              if (this.linkData.actionVideo.length === 0) {
                this.linkData.actionVideo.push(videoSet)
              } else {
                const result = this.linkData.actionVideo.some((item, index) => {
                  return Vid === item.resource
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
      }
    },
    // 数据为undefined，则范围空字符串
    returnBlankIfNull(item, key) {
      return item === undefined ? '' : item[key]
    },
    // 1-7.联动——删除联动视频控制
    delVideoConfig() {
      this.Inselect.forEach((item, index, arr) => {
        const tempObj = {}
        for (let key in item) {
          tempObj[key] = item[key]
        }
        item = tempObj
      })
      this.Inselect.map(item => {
        const result = this.linkData.actionVideo.some((Item) => {
          return item.resource === Item.resource
        })
        if (result) {
          this.linkData.actionVideo.map((Item, index) => {
            if (Item.resource === item.resource) {
              this.linkData.actionVideo.splice(index, 1)
            }
          })
        }
      })
      this.Inselect = []
      this.showLinkdelBtn = true
    },
    // 1-8.联动——添加报警输出控制
    addExportConfig() {
      if (this.linkOption === '1') {
        let treeData = this.$refs.exportTree.getSelectedNodes()
        if (treeData.length !== 0) {
          let count = 0
          let InvalidExport = []
          let doubleName = []
          InvalidExport = treeData.filter(node => !node.isOrg).filter(node => !node.equip)
          if (InvalidExport.length === 0) {
            this.warningMsg('请勿勾选机构，应选择视频资源')
            count = 0
            return
          }
          count = InvalidExport.length
          let alllength = count + this.linkData.actionOutCtl.length
          if (alllength > 7) {
            this.warningMsg('最多添加7个联动视频')
            count = 0
          } else {
            InvalidExport.map((v) => {
              let videoSet = {
                resource: v._id,
                outPutName: v.name,
                runMode: 0,
                runAction: 0,
                overlayIcon: false,
                outPutOrg: v.pid
              }
              if (this.linkData.actionOutCtl.length === 0) {
                this.linkData.actionOutCtl.push(videoSet)
              } else {
                const result = this.linkData.actionOutCtl.some((item, index) => {
                  return v._id === item.resource
                })
                if (!result && doubleName.length === 0) {
                  this.linkData.actionOutCtl.push(videoSet)
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
      }
    },
    // 数据为undefined，则范围空字符串
    returnBlankIfNullCopy(item, key) {
      if (key === 'runMode') {
        return item === undefined ? '' : (item[key] === 0 ? '手动' : '自动')
      }
      if (key === 'runAction') {
        return item === undefined ? '' : (item[key] === 0 ? '打开' : '关闭')
      }
    },
    // 1-9.联动——删除报警输出控制
    delExportConfig() {
      this.Inselect.forEach((item, index, arr) => {
        const tempObj = {}
        for (let key in item) {
          tempObj[key] = item[key]
        }
        item = tempObj
      })
      this.Inselect.map(item => {
        const result = this.linkData.actionOutCtl.some((Item) => {
          return item.resource === Item.resource
        })
        if (result) {
          this.linkData.actionOutCtl.map((Item, index) => {
            if (Item.resource === item.resource) {
              this.linkData.actionOutCtl.splice(index, 1)
            }
          })
        }
      })
      this.Inselect = []
      this.showLinkdelBtn = true
    },
    // 1-10.联动配置确认
    affirmLink() {
      let crossStatus = this.crossTime()
      if (crossStatus === true) {
        // 4个联动tabs中删除timeRange
        this.linkData.actionRule.map((v) => {
          delete v.timeRange
        })
        this.linkData.actionVideo.map((v) => {
          delete v.orgName
        })
        // 报警输入联动配置
        if (this.nowTabIndex === '0') {
          this.linkData.type = 1
          this.setAlarmLink(this.linkData).then((suc) => {
            this.returnData()
            this.alarmLink = false
          }).catch((err) => {
            console.log('logout error:' + err)
            this.errorMsg('联动配置失败')
          })
        }
        // 智能报警联动配置
        if (this.nowTabIndex === '2') {
          this.linkData.type = 2
          this.setAlarmLink(this.linkData).then((suc) => {
            this.returnData()
            this.alarmLink = false
          }).catch((err) => {
            console.log('logout error:' + err)
            this.errorMsg('联动配置失败')
          })
        }
        // 监控点联动配置保存
        if (this.nowTabIndex === '3') {
          this.linkData.type = 3
          this.setAlarmLink(this.linkData).then((suc) => {
            this.returnData()
            this.alarmLink = false
          }).catch((err) => {
            console.log('logout error:' + err)
            this.errorMsg('联动配置失败')
          })
        }
        this.linkOption = '0'
        this.alarmLink = false
      }
    },
    // 1-11.联动配置取消
    cancelLink() {
      this.alarmLink = false
    },
    // 1-12.时间交叉验证规则
    crossTime() {
      let timeArr = this.linkData.actionRule
      let timeTrue = []
      timeArr.map((item, index) => {
        if (item.status === true) {
          timeTrue.push({
            startTime: item.beginTime,
            endTime: item.endTime
          })
        }
      })
      const erArr = []
      const set = new Set()
      timeTrue.forEach(n => {
        if (n.startTime !== null && n.endTime !== null) {
          set.add(n.startTime)
          set.add(n.endTime)
          erArr.push([n.startTime, n.endTime])
        }
      })
      const sortArr = Array.from(set).sort((a, b) => a - b)
      let flag = true
      if (sortArr.length !== timeTrue.length * 2) {
        flag = false
      } else {
        for (let i = 0; i < erArr.length; i++) {
          if (sortArr.indexOf(erArr[i][1]) - sortArr.indexOf(erArr[i][0]) > 1) {
            flag = false
            break
          }
        }
      }
      if (!flag) {
        this.errorMsg('联动时间有交叉,请修改时间')
      }
      return flag
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
    }
  }
}
