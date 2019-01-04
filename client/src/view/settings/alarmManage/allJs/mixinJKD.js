export default {
  components: {
  },
  data() {
    return {
      monitorTitle: [
        {
          title: '通道号',
          key: 'chan'
        },
        {
          title: '所属设备',
          ellipsis: true,
          key: 'org',
          render: (h, params) => {
            let name = ''
            name = params.row.rid.eid.name
            return h('div', name)
          }
        },
        {
          title: '级别',
          key: 'level'
        },
        {
          title: '报警分类',
          key: 'name',
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
        },
        {
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
        },
        {
          title: '最大延时',
          key: 'maxdelaytime'
        },
        {
          title: '最小间隔',
          key: 'minintervaltime'
        },
        {
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
        },
        {
          title: '联动配置',
          key: 'linkConfig',
          width: 100,
          render: (h, params) => {
            return h('div', [
              h('Button', {
                props: {
                  type: 'ghost',
                  disabled: !this.$BShasPower('BS-ALARMJKD-TABS-ACTION')
                },
                on: {
                  click: () => {
                    this.importSet(params.row)
                  }
                }
              }, '设置')
            ])
          }
        }
      ],
      monitorData: [],
      jkdMod: false,
      smartOrJkd: '', // smart、jkd
      jkdForm: {
        orgname: '', // rid.eid.name
        chan: '',
        alarmtemplate: '', // 给的是id
        level: '',
        maxdelaytime: '',
        alarmtype: '', // 给的是id
        minintervaltime: '',
        alarmaffirm: {},
        mapsign: {},
        type: []
      },
      jkdModTitle: ''
    }
  },
  methods: {
    // 智能报警、监控点报警 详情
    monitorMessage(data, index) {
      this.jkdMod = true
      this.jkdForm = {}
      if (this.nowTabIndex === '2') {
        this.jkdModTitle = '智能报警详情'
        this.smartOrJkd = 'smart'
        this.getSmartMessageData(data._id).then((suc) => {
          this.jkdForm = JSON.parse(JSON.stringify(this.smartMessageData))
          this.disposeMethod()
        }).catch(() => {
          this.errorMsg('智能详情获取失败')
        })
      } else if (this.nowTabIndex === '3') {
        this.jkdModTitle = '监控点报警详情'
        this.smartOrJkd = 'jkd'
        this.getJkdMessageData(data._id).then((suc) => {
          this.jkdForm = JSON.parse(JSON.stringify(this.jdkMessageData))
          this.disposeMethod()
        }).catch(() => {
          this.errorMsg('监控点详情获取失败')
        })
      }
    },
    // 智能，监控点 获取详情数据处理
    disposeMethod() {
      this.jkdForm.orgname = this.jkdForm.rid.eid.name
      this.enabledSort.map((item) => {
        if (item.value === this.jkdForm.alarmtype) {
          this.jkdForm.alarmtypename = item.label
        }
      })
      this.enabledTemp.map((item) => {
        if (item.value === this.jkdForm.alarmtemplate) {
          this.jkdForm.alarmtemplatename = item.label
        }
      })
      this.jkdForm.mapflag = this.jkdForm.mapsign.signflag
      this.jkdForm.alarmflag = this.jkdForm.alarmaffirm.affirmflag
      this.jkdForm.alarmauto = this.jkdForm.alarmaffirm.autoaffirm.status ? '自动确认' : '手工确认'
      this.jkdForm.alarmintervaltime = this.jkdForm.alarmaffirm.autoaffirm.intervaltime
    },
    // 详情确定按钮
    jkdMessageSure() {
      this.jkdMod = false
    }
  }
}
