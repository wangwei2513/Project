import {
  mapMutations,
  mapActions
} from 'vuex'
let TTStimer
let plugin = null
export default {
  components: {},
  data() {
    return {
      debug: false,
      alarmAppFeatures: [], // 报警区域列表
      warnModal: false,
      warnInfoTabs: [{
        title: '报警源信息',
        value: 'orign',
        disabled: false,
        active: true
      }, {
        title: '智能信息',
        value: 'inteligent',
        disabled: false,
        active: false
      }],
      warningTabs: [{
        title: '分类未获取到',
        value: 'test',
        number: 0,
        disabled: false,
        active: true
      }],
      warnColumns: [{
        title: '计数',
        key: 'count',
        align: 'center',
        width: 80,
        render: (h, params) => {
          let text = params.row.count
          return h('span', {
            style: {
              color: params.row.level ? this.warnParametersList[params.row.level - 1].msgColour : ''
            }
          }, text)
        }
      }, {
        title: '时间',
        key: 'time',
        width: 100,
        align: 'center',
        render: (h, params) => {
          let text = params.row.time ? this.$moment(parseInt(params.row.time) * 1000).format('YYYY-MM-DD HH:mm:ss') : ''
          return h('span', {
            style: {
              color: params.row.level ? this.warnParametersList[params.row.level - 1].msgColour : ''
            }
          }, text)
        }
      }, {
        title: '机构',
        key: 'organization',
        align: 'center',
        width: 150,
        render: (h, params) => {
          let text = params.row.organization
          return h('span', {
            style: {
              color: params.row.level ? this.warnParametersList[params.row.level - 1].msgColour : '',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            },
            domProps: {
              title: text
            }
          }, text)
        }
      }, {
        title: '名称',
        key: 'name',
        align: 'center',
        render: (h, params) => {
          let text = params.row.name
          return h('span', {
            style: {
              color: params.row.level ? this.warnParametersList[params.row.level - 1].msgColour : '',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            },
            domProps: {
              title: text
            }
          }, text)
        }
      }, {
        title: '类型',
        key: 'eventType',
        align: 'center',
        width: 100,
        render: (h, params) => {
          let text = this.alarmTypeList[params.row.eventType]
          return h('span', {
            style: {
              color: params.row.level ? this.warnParametersList[params.row.level - 1].msgColour : ''
            }
          }, text)
        }
      }],
      warnPlanList: [{
        value: '误报',
        label: '误报'
      }, {
        value: '演练',
        label: '演练'
      }, {
        value: '测试',
        label: '测试'
      }, {
        value: '编译预案',
        label: '编译预案'
      }],
      warnPlanListOpt: [{
        value: 100,
        label: '预案加载中',
        content: ''
      }],
      confirmWarnList: [],
      warnPlanSelect: '',
      warnAffirmInfo: '',
      isWarnAccept: true,
      isWarnBatch: false,
      receiveWarnListView: {
        test: [{}]
      },
      warnParametersList: [],
      warnMusicList: [],
      alarmTypeList: {
        alarmInput: '报警输入',
        alarmOut: '报警输出',
        focusAttention: '重点关注',
        // 智能类
        perimeter: '周界保护',
        tripwire: '绊线',
        leftObject: '物品遗留',
        missingObject: '物品丢失',
        loitering: '非法停留',
        retrogradeDetection: '逆行检测',
        lingerDetection: '徘徊检测',
        doubleCordon: '双警戒线',
        blackList: '黑名单',
        whiteList: '白名单',
        dispatch: '布控',
        areaInvade: '区域入侵',
        fastMove: '快速移动',
        parkDetect: '停车检测',
        humanAssemble: '人员聚集',
        objectMove: '物品搬移',
        // 监控点类
        alarmMoveSense: '移动侦测',
        videoMask: '视频遮挡',
        sceneSwitch: '镜头移位',
        definitionAbnormal: '清晰度异常',
        brightnessAbnormal: '亮度异常',
        screenFreeze: '画面冻结',
        noise: '噪声检测',
        signalLoss: '信号缺失',
        colorCast: '偏色检测',
        // 消防类
        fireAlarm: '消防报警',
        fireFailure: '消防故障',
        // 违章报警
        vioRetrograde: '违章逆行',
        vioPark: '违章停车',
        vioTurnLeft: '违章左转',
        vioTurnRight: '违章右转',
        // 报警求助
        askHelp: '请求对讲',
        acceptHelp: '接受对讲',
        endHelp: '结束对讲',
        // 设备报警
        hardDiskFailure: 'sd卡故障',
        hardDiskFull: 'sd卡满',
        networkDown: '网络断开',
        ipConflict: 'IP冲突',
        timeAbnormal: '时间异常',
        illegalNetworkAccess: '非法网络访问',
        // 其他
        alarmVideoLost: '视频丢失',
        vehicleBlack: '车辆识别黑名单',
        vehicleWhite: '车辆白名单',
        vehicleDispatch: '车辆布控',
        faceBlack: '人脸识别',
        faceWhite: '人脸白名单',
        faceDispatch: '人脸布控',
        peopleCount: '人数统计',
        fight: '斗殴',
        approach: '人员贴近',
        armyGuard: '哨兵管控',
        atmCare: 'ATM看护',
        fanAbnormal: '风扇异常',
        mainBoardAbnormal: '主板异常',
        channelAbnormal: '通道异常',
        temperatureAbnormal: '温度异常',
        damagedDiskSectors: '硬盘坏道',
        ipcMacCheckException: 'MAC校验异常'
      },
      carTypeList: {
        '0': '未识别',
        '15': '轻便摩托车',
        '1': '小型汽车',
        '16': '机动车',
        '2': '大型汽车',
        '17': '公交车',
        '3': '使馆汽车',
        '18': '摩托车',
        '4': '领馆汽车',
        '19': '客车',
        '5': '境外汽车',
        '20': '大货车',
        '6': '外籍汽车',
        '21': '中货车',
        '7': '低速汽车',
        '22': '轿车',
        '8': '拖拉机',
        '23': '面包车',
        '9': '挂车',
        '24': '小货车',
        '10': '教练车',
        '256': '非机动车',
        '11': '临时行驶车',
        '257': '自行车',
        '12': '警用汽车',
        '258': '三轮车',
        '13': '警用摩托车',
        '512': '行人',
        '14': '普通摩托车',
        '513': '军用汽车'
      },
      carDirect: {
        '0': '东->西',
        '1': '西->东',
        '2': '南->北',
        '3': '北->南',
        '4': '东南->西北',
        '5': '西北->东南',
        '6': '东北->西南',
        '7': '西南->东北'
      },
      modalloading: false,
      ttsModal: false,
      true: true,
      playerList: [],
      tabsValue: '0',
      alarmlabel: (h) => {
        return h('div', [
          h('span', '报警求助信息'),
          h('Badge', {
            props: {
              count: this.alarmhelpAllData.length
            }
          })
        ])
      },
      alarmhelpAllData: [],
      alarmhelpData: {},
      alarmhelpcurrent: 1,
      old: {
        time: 0,
        name: '',
        askId: '',
        status: ''
      },
      alarmHost: true,
      // 警情误报
      warnDealSelect: '',
      warnDealListOpt: []
    }
  },
  created() {
    // 获取警情处理启用状态
    this.getAlarmDealStatusSet().then((res) => {
      this.isAlarmEnable = res.data.alarmOpen
    }).catch(err => {
      console.log('getFireDealStatus error: ', err)
      this.errorMsg('警情处理启用状态获取失败')
    })
    this.alarmhelpAllData = JSON.parse(JSON.stringify(this.alarmHelpsSocketValue))
    this.alarmhelpData = (this.alarmhelpAllData.length === 0 ? this.old : this.alarmhelpAllData[0])
  },
  methods: {
    ...mapMutations(['deleteAlarm']),
    ...mapActions(['recordLog', 'spliceAlarmHelpData', 'setIsAcceptWarn', 'getAlarmDealStatusSet', 'getAlarmDealSetList']),
    changeAlarmhelpPage(n) {
      this.alarmhelpcurrent = n
      this.alarmhelpData = this.alarmhelpAllData[n - 1]
    },
    // 1 设置接收报警列表的标签
    setWarningTabs(arr) {
      this.warningTabs = []
      for (let i = 0; i < arr.length; i++) {
        this.warningTabs.push({
          title: arr[i].label,
          value: arr[i].value,
          number: 0,
          disabled: false,
          active: false
        })
      }
      arr.length > 0 ? this.warningTabs[0].active = true : this.warningTabs = []
      this.setActiveWarnTab(this.warningTabs[0].value)
    },
    getReceiveWarnData() {
      if (this.isWarnAccept) {
        // this.openSetReceiveWarnList()
        this.receiveWarnListView = this.receiveWarnList
      }
    },
    // 播放器
    warnPlayerOpen(level) {
      this.playMusic(level)
      this.playTTS(level)
    },
    // 播放音乐
    playMusic(data) {
      let level = data.level
      this.playerList = this.$refs['audio']
      if (!this.playerList) { return }
      for (let i = 0; i < this.playerList.length; i++) {
        this.playerList[i].load()
        this.playerList[i].pause()
      }
      if (this.warnMusicList[level - 1].status === '1' || this.warnMusicList[level - 1].status === '2') {
        this.playerList[level - 1].play()
        let index = 1
        this.ttsEnvent = () => {
          setTimeout(() => {
            if (index < this.warnMusicList[level - 1].time) {
              this.playerList[level - 1].play()
              index++
            }
          }, 500)
        }
        this.playerList[level - 1].addEventListener('ended', this.ttsEnvent)
      }
    },
    // 播放TTS
    playTTS(data) {
      if (TTStimer) {
        clearInterval(TTStimer)
      }
      let level = data.level
      let ttscontent = data.organization + data.name + this.alarmTypeList[data.eventType]
      if (this.warnMusicList[level - 1].status === '0' || this.warnMusicList[level - 1].status === '2') {
        plugin = this.$refs['pluginTTS']
        if (plugin && plugin.TextToSpeech) {
          plugin.TextToSpeech(100, 0, 0, ttscontent)
          let repeat = this.warnMusicList[level - 1].time - 1
          TTStimer = setInterval(() => {
            if (repeat === 0) {
              clearInterval(TTStimer)
            } else {
              plugin.TextToSpeech(100, 0, 0, ttscontent)
              repeat--
            }
          }, 8000)
        }
      }
    },
    warnTabClick(data) {
      this.setActiveWarnTab(data.obj.value)
    },
    // 切换报警接收复选框
    acceptProcess() {},
    // 切换批量处理
    batchProcess() {
      const batchCheck = {
        type: 'selection',
        align: 'center',
        width: 60
      }
      if (this.isWarnBatch === true) {
        this.warnColumns.splice(0, 0, batchCheck)
      } else {
        this.warnColumns.splice(0, 1)
      }
    },
    clickWarnListRow(data) {
      if (!this.isWarnBatch) {
        this.confirmWarnList = [data]
      }
      if (data.type === 'alarmHost') {
        this.alarmHost = false
      } else {
        this.alarmHost = true
      }
      if (data.carImg1Base64 || data.carImg2Base64 || data.carImgBase64 || data.carNumPicBase64 || data.combinedPicBase64) {
        data.groupId = `${data.devIp}|${data.devPort}|${data.channel}|${data.eventType}|${data.alarmId}`
        this.setActiveWarnInfo(data)
      } else if (data.actionList && data.actionList.length !== 0) {
        this.setActiveWarnInfo(data)
      } else {
        this.setActiveWarnInfo(data)
        this.warningMsg('此报警无联动视频，或违章图片')
      }
    },
    // 表格复选框发生改变
    selectWarnListRow(sels) {
      let isNotAlarmHost = false
      this.confirmWarnList = sels
      for (let i = 0; i < this.confirmWarnList.length; i++) {
        if (this.confirmWarnList[i].type !== 'alarmHost') {
          isNotAlarmHost = true
          break
        }
      }
      if (!sels.length) {
        isNotAlarmHost = true
      }
      if (isNotAlarmHost) {
        this.alarmHost = true
      } else {
        this.alarmHost = false
      }
    },
    changeTabs(name) {
      this.confirmWarnList.length = 0
      this.tabsValue = name
      // 切换tabs若是报警求助，将求助信息值给confirmWarnList以便于确认
      // 一次仅可清除、确认一页（一个）的求助报警
      if (name === '2') {
        this.tableId = 3
        this.confirmWarnList = []
        this.confirmWarnList.push(this.alarmhelpAllData[this.alarmhelpcurrent - 1])
      } else {
        this.tableId = 1
      }
    },
    // 确认报警
    clickConfirmWarnMessages() {
      if (this.confirmWarnList.length === 0) {
        this.warningMsg('请先选择报警信息')
        return
      }
      const power = this.alarmPowerJudge(this.confirmWarnList, 'alarmConfirm')
      if (!power) { return }
      if (this.warnAffirmInfo === '') {
        this.warningMsg('警情信息不能为空')
        return
      }
      this.modalloading = true
      const alarmSureInfo = {
        alarmDeal: this.alarmDealName,
        situationType: this.warnPlanSelect,
        alarmContent: this.warnAffirmInfo
      }
      this.confirmWarnMessages({
        list: this.confirmWarnList,
        ackContent: JSON.stringify(alarmSureInfo)
      }).then(() => {
        let targets = []
        let deviceIps = []
        this.confirmWarnList.map(item => {
          targets.push(item.name)
          deviceIps.push(item.devIp)
        })
        const param = {
          logType: '操作日志',
          module: '报警处理',
          operateName: '报警确认',
          operateContent: '报警确认',
          target: targets.join(','),
          deviceIp: deviceIps.join(',')
        }
        this.modalloading = false
        this.successMsg('确认报警信息成功')
        this.recordLog(param)
        setTimeout(() => {
          if (this.tabsValue !== '2') {
            this.confirmWarnList.map((item, ind) => {
              const result = this.receiveWarnListView[this.activeWarnTab].some((Item) => {
                return item.alarmId === Item.alarmId
              })
              if (result) {
                this.receiveWarnListView[this.activeWarnTab].map((Item, index) => {
                  if (item.alarmId === Item.alarmId) {
                    if (item.eventType === 'vioRetrograde' || item.eventType === 'vioPark' || item.eventType === 'vioTurnLeft' || item.eventType === 'vioTurnRight') {
                      item['uid'] = item.devIp + '|' + item.devPort + '|' + item.channel + '|' + item.eventType + '|' + item.alarmId
                    } else {
                      item['uid'] = item.devIp + '|' + item.devPort + '|' + item.channel + '|' + item.eventType
                    }
                    this.$refs.alarmvideopreview.closeVideo(this.confirmWarnList[ind])
                    this.receiveWarnListView[this.activeWarnTab].splice(index, 1)
                    this.spliceReceiveWarnList({
                      activeWarnTab: this.activeWarnTab,
                      index: index
                    })
                  }
                })
              }
            })
            this.setActiveWarnInfo({})
            this.processFireAlarmingInfo(this.confirmWarnList)
            this.confirmWarnList.forEach(item => {
              if (item.point3D && item.point3D.building3ds) {
                let obj = {
                  pointIsouter: item.point3D.isouter,
                  id: item.channelId,
                  bcode: item.point3D.building3ds.code,
                  type: 'commonAlarm'
                }
                try {
                  this.confirmAlarmData(obj)
                } catch (err) {
                  console.log('地图清楚点位方法错误')
                }
              }
            })
          } else {
            this.confirmWarnList.map((item, ind) => {
              const result = this.alarmhelpAllData.some((Item) => {
                return item.alarmId === Item.alarmId
              })
              if (result) {
                this.alarmhelpAllData.map((Item, index) => {
                  if (item.alarmId === Item.alarmId) {
                    item['uid'] = item.devIp + '|' + item.devPort + '|' + item.channel + '|' + item.eventType
                    this.$refs.alarmvideopreview.closeVideo(this.confirmWarnList[ind])
                    this.alarmhelpAllData.splice(this.alarmhelpcurrent - 1, 1)
                    this.alarmhelpData = (this.alarmhelpAllData.length === 0 ? this.old : this.alarmhelpAllData[0])
                    this.spliceAlarmHelpData(this.alarmhelpcurrent - 1)
                  }
                })
              }
            })
          }
          this.confirmWarnList = []
          this.warnPlayerStop()
        }, 10)
      }).catch((err) => {
        this.modalloading = false
        console.log('confirmWarnMessages error: ' + err)
      })
      this.modalloading = false
    },
    // 清楚报警
    clearWarnOpen() {
      if (this.confirmWarnList.length !== 0) {
        this.warnModal = true
      } else {
        this.warningMsg('请先选择需清除的报警信息')
      }
    },
    clearWarnOk() {
      const isPower = this.alarmPowerJudge(this.confirmWarnList, 'alarmClean')
      if (!isPower) { return }
      let targets = []
      let deviceIps = []
      this.confirmWarnList.map(item => {
        targets.push(item.name)
        deviceIps.push(item.devIp)
      })
      const param = {
        logType: '操作日志',
        module: '报警处理',
        operateName: '报警清除',
        operateContent: '报警清除',
        target: targets.join(','),
        deviceIp: deviceIps.join(',')
      }
      this.recordLog(param)
      if (this.tabsValue === '2') {
        this.confirmWarnList.map((item, ind) => {
          const result = this.alarmhelpAllData.some((Item) => {
            return item.alarmId === Item.alarmId
          })
          if (result) {
            this.alarmhelpAllData.map((Item, index) => {
              if (item.alarmId === Item.alarmId) {
                item['uid'] = item.devIp + '|' + item.devPort + '|' + item.channel + '|' + item.eventType
                this.$refs.alarmvideopreview.closeVideo(this.confirmWarnList[ind])
                this.alarmhelpAllData.splice(this.alarmhelpcurrent - 1, 1)
                this.alarmhelpData = (this.alarmhelpAllData.length === 0 ? this.old : this.alarmhelpAllData[0])
              }
            })
          }
        })
      } else {
        this.setActiveWarnInfo({})
        this.confirmWarnList.map((item, ind) => {
          const result = this.receiveWarnListView[this.activeWarnTab].some((Item) => {
            return item.alarmId === Item.alarmId
          })
          if (result) {
            let arrData = JSON.parse(JSON.stringify(this.receiveWarnListView))
            this.receiveWarnListView[this.activeWarnTab].map((Item, index) => {
              if (item.alarmId === Item.alarmId) {
                if (item.eventType === 'vioRetrograde' || item.eventType === 'vioPark' || item.eventType === 'vioTurnLeft' || item.eventType === 'vioTurnRight') {
                  item['uid'] = item.devIp + '|' + item.devPort + '|' + item.channel + '|' + item.eventType + '|' + item.alarmId
                } else {
                  item['uid'] = item.devIp + '|' + item.devPort + '|' + item.channel + '|' + item.eventType
                }
                this.$refs.alarmvideopreview.closeVideo(this.confirmWarnList[ind])
                arrData[this.activeWarnTab].splice(index, 1)
                this.spliceReceiveWarnList({
                  activeWarnTab: this.activeWarnTab,
                  index: index
                })
              }
            })
            this.receiveWarnListView = arrData
          }
        })
        this.processFireAlarmingInfo(this.confirmWarnList)
        this.confirmWarnList.forEach(item => {
          if (item.point3D && item.point3D.building3ds) {
            let obj = {
              pointIsouter: item.point3D.isouter,
              id: item.channelId,
              bcode: item.point3D.building3ds.code,
              type: 'commonAlarm'
            }
            try {
              this.confirmAlarmData(obj)
            } catch (err) {
              console.log('地图清楚点位方法错误')
            }
          }
        })
      }
      this.warnModal = false
      this.warnPlayerStop()
    },
    /* 权限判断 */
    alarmPowerJudge(data, prop) {
      let hasPower = true
      if (data.length === 1 && !data[0].alarmPower[prop]) {
        hasPower = false
      } else if (data.length > 1) {
        for (let i = 0; i < data.length; i++) {
          if (!data[i].alarmPower[prop]) {
            hasPower = false
            break
          }
        }
      }
      if (!hasPower) {
        this.warningMsg('存在报警资源无相应权限')
      }
      return hasPower
    },
    warnPlayerStop() {
      let playerList = this.$refs['audio']
      if (playerList && playerList.length !== 0) {
        for (let i = 0; i < playerList.length; i++) {
          playerList[i].pause()
          playerList[i].removeEventListener('ended', this.ttsEnvent)
          this.ttsEnvent = null
        }
      }
      clearInterval(TTStimer)
      plugin = null
      plugin = this.$refs['pluginTTS']
    },
    selectWarnPlan() {
      let selectIndex
      this.$nextTick(() => {
        this.warnPlanList.forEach((item, index) => {
          if (item.name === this.warnPlanSelect) {
            selectIndex = index
          }
        })
        this.warnAffirmInfo = this.warnPlanList[selectIndex].content
      })
    },
    allMeth(methType) {
      if (this.confirmWarnList.length === 0) {
        this.warningMsg('请先选择报警信息')
        return
      }
      let power = true
      const ids = this.confirmWarnList.map(item => {
        return item.channelId
      })
      switch (methType) {
        case 'protection':
          power = this.alarmPowerJudge(this.confirmWarnList, 'deployment')
          if (!power) { return }
          this.protectionAction({
            ids: ids,
            type: 'res'
          }).then(() => {
            const param = {
              logType: '操作日志',
              module: '报警处理',
              operateName: '报警主机布防',
              operateContent: '报警主机布防',
              target: this.confirmWarnList.map(item => {
                return item.name
              }).join(','),
              deviceIp: this.confirmWarnList.map(item => {
                return item.devIp
              }).join(',')
            }
            this.recordLog(param)
            this.successMsg('布防成功！')
          }).catch(() => {
            this.errorMsg('布防失败！')
          })
          break
        case 'removal':
          power = this.alarmPowerJudge(this.confirmWarnList, 'disarming')
          if (!power) { return }
          this.removalAction({
            ids: ids,
            type: 'res'
          }).then(() => {
            const param = {
              logType: '操作日志',
              module: '报警处理',
              operateName: '报警主机撤防',
              operateContent: '报警主机撤防',
              target: this.confirmWarnList.map(item => {
                return item.name
              }).join(','),
              deviceIp: this.confirmWarnList.map(item => {
                return item.devIp
              }).join(',')
            }
            this.recordLog(param)
            this.successMsg('撤防成功！')
          }).catch(() => {
            this.errorMsg('撤防失败！')
          })
          break
        case 'remove':
          power = this.alarmPowerJudge(this.confirmWarnList, 'clean')
          if (!power) { return }
          this.removeAction({
            ids: ids,
            type: 'res'
          }).then(() => {
            const param = {
              logType: '操作日志',
              module: '报警处理',
              operateName: '报警主机清除',
              operateContent: '报警主机清除',
              target: this.confirmWarnList.map(item => {
                return item.name
              }).join(','),
              deviceIp: this.confirmWarnList.map(item => {
                return item.devIp
              }).join(',')
            }
            this.recordLog(param)
            this.successMsg('清除成功！')
          }).catch(() => {
            this.errorMsg('清除失败！')
          })
          break
      }
    }
  },
  mounted() {
    this.$refs['warningTab'].$on('on-tab-click', this.warnTabClick)
    plugin = this.$refs['pluginTTS']
    if (plugin.valid) {
      this.ttsModal = false
    } else {
      this.ttsModal = true
    }
    // 获取警情处理列表
    this.getAlarmDealSetList({ page: 1, limit: 100, type: 'alarm' }).then((res) => {
      res.data.forEach(item => {
        this.alarmDealSetList.push({ label: item.name, value: item.name })
        this.alarmDealName = this.alarmDealSetList[0].value
      })
    }).catch(err => {
      console.log('getFireAlarmDealList error: ', err)
      this.errorMsg('警情处理列表获取失败')
    })
  },
  watch: {
    receiveWarnListView: {
      deep: true,
      handler(newval, oldval) {
        if (this.receiveWarnListView !== {}) {
          for (let i = 0; i < this.warningTabs.length; i++) {
            let tab = this.warningTabs[i].value
            if (newval[tab]) {
              this.warningTabs[i].number = newval[tab].length
            }
          }
        }
      }
    },
    isWarnAccept(newval, oldval) {
      if (newval) {
        this.setIsAcceptWarn(true)
        this.getReceiveWarnData()
      } else {
        this.setIsAcceptWarn(false)
      }
    },
    warnCounts(newval) {
      this.ttsModal = false
      this.receiveWarnListView = this.$lodash.cloneDeep(this.receiveWarnList)
      this.warnPlayerOpen(this.warnNewData)
    },
    alarmHelpsSocketValue: {
      deep: true,
      handler(newval, oldval) {
        this.alarmhelpAllData = JSON.parse(JSON.stringify(newval))
        this.alarmhelpData = (this.alarmhelpAllData.length === 0 ? this.old : this.alarmhelpAllData[0])
        if (this.tabsValue === '2' && this.alarmhelpAllData.length !== 0) {
          this.confirmWarnList = []
          this.confirmWarnList.push(this.alarmhelpData)
        }
      }
    },
    confirmedData(newval) {
      if (newval && newval.length === 0) {
        return
      }
      newval.map((item, ind) => {
        if (item.eventType === 'endHelp' && this.alarmhelpAllData.length !== 0) {
          const result = this.alarmhelpAllData.some((Item) => {
            return (item.groupId1 === Item.groupId || item.groupId2 === Item.groupId)
          })
          if (result) {
            this.alarmhelpAllData.map((alarmItem, index) => {
              if (item.groupId1 === alarmItem.groupId || item.groupId2 === alarmItem.groupId) {
                item['uid'] = `${item.devIp}|${item.devPort}|${item.channel}|${alarmItem.eventType}`
                this.$refs.alarmvideopreview.closeVideo(newval[ind])
                this.spliceAlarmHelpData(index)
              }
            })
          }
        } else if (this.receiveWarnListView[this.activeWarnTab] && this.receiveWarnListView[this.activeWarnTab].length !== 0) {
          const result = this.receiveWarnListView[this.activeWarnTab].some((Item) => {
            return item.groupId === Item.groupId
          })
          if (result) {
            this.receiveWarnListView[this.activeWarnTab].map((Item, index) => {
              if (item.groupId === Item.groupId) {
                if (item.eventType === 'vioRetrograde' || item.eventType === 'vioPark' || item.eventType === 'vioTurnLeft' || item.eventType === 'vioTurnRight') {
                  item['uid'] = `${item.devIp}|${item.devPort}|${item.channel}|${item.eventType}|${item.alarmId}`
                } else {
                  item['uid'] = `${item.devIp}|${item.devPort}|${item.channel}|${item.eventType}`
                }
                this.$refs.alarmvideopreview.closeVideo(newval[ind])
                this.receiveWarnListView[this.activeWarnTab].splice(index, 1)
                this.spliceReceiveWarnList({
                  activeWarnTab: this.activeWarnTab,
                  index: index
                })
              }
            })
          }
          this.processFireAlarmingInfo(newval)
          if (item.point3D && item.point3D.building3ds) {
            let obj = {
              pointIsouter: item.point3D.isouter,
              id: item.channelId,
              bcode: item.point3D.building3ds.code,
              type: 'commonAlarm'
            }
            try {
              this.confirmAlarmData(obj)
            } catch (err) {
              console.log('地图清楚点位方法错误')
            }
          }
        }
        this.warnPlayerStop()
      })
    }
  }
}
