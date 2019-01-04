export default {
  name: 'paramsSetting',
  data() {
    return {
      // 警情处理
      modName: '',
      fireDealForm: {
        name: '',
        id: ''
      },
      fireDealModTitle: '',
      fireEnable: false, // 警情处理是否启用
      fireDealMod: false,
      fireDealData: [],
      fireDealTotal: 0,
      fireDealLimit: this.$PageInfo.limit,
      fireDealPageCur: 1,
      fireDealTitle: [{
        type: 'index',
        title: '序号'
      }, {
        title: '名称',
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
        title: '操作',
        key: 'action',
        width: 180,
        render: (h, params) => {
          return h('div', [
            h('Button', {
              props: {
                type: 'ghost',
                size: 'small',
                disabled: !this.$BShasPower('BS-ALARM-SETTING-ACTION')
              },
              style: {
                marginRight: '5px'
              },
              on: {
                click: () => {
                  this.editFireDeal(params.row)
                }
              }
            }, '修改'),
            h('Button', {
              props: {
                type: 'ghost',
                size: 'small',
                disabled: !this.$BShasPower('BS-ALARM-SETTING-ACTION')
              },
              on: {
                click: () => {
                  this.delFireDeal(params.row)
                }
              }
            }, '删除')
          ])
        }
      }]
    }
  },
  methods: {
    getFireDealData() {
      // 获取警情处理数据
      const payload = {
        type: 'fire',
        page: this.fireDealPageCur,
        limit: this.fireDealLimit
      }
      this.getFireAlarmDealList(payload).then((res) => {
        this.fireDealData = JSON.parse(JSON.stringify(this.fireDealList))
        this.fireDealTotal = Number(res.headers['x-bsc-count'])
      }).catch(err => {
        console.log('this.getUseType :' + err)
        this.errorMsg('获取主显示区失败')
      })
    },
    addFireDeal() {
      this.fireDealMod = true
      this.fireDealModTitle = '添加警情处理'
      this.$refs['fireDealForm'].resetFields()
      this.modName = 'add'
    },
    addFireDealOk(name) {
      if (this.buttonTimer) { return }
      this.$refs[name].validate((valid) => {
        if (valid) {
          if (this.modName === 'add') {
            const payload = {
              page: 'fire',
              name: this.fireDealForm.name
            }
            this.addFireAlarmDeal(payload).then(() => {
              this.fireDealMod = false
              this.getFireDealData()
              this.successMsg('警情处理添加成功')
            }).catch(err => {
              if (err.response.data.message) {
                this.errorMsg('警情处理名称已存在')
              }
            })
          } else {
            const payload = {
              page: 'fire',
              name: this.fireDealForm.name,
              id: this.fireDealForm.id
            }
            this.reviseFireAlarmDeal(payload).then(() => {
              this.fireDealMod = false
              this.getFireDealData()
              this.successMsg('警情处理修改成功')
            }).catch(err => {
              if (err.response.data.message) {
                this.errorMsg('警情处理名称已存在')
              }
            })
          }
        }
      })
      this.buttonTimer = setTimeout(() => {
        this.buttonTimer = null
      }, 300)
    },
    editFireDeal(params) {
      this.fireDealMod = true
      this.fireDealModTitle = '修改警情处理'
      this.$refs['fireDealForm'].resetFields()
      this.modName = 'revise'
      this.fireDealForm.name = params.name
      this.fireDealForm.id = params.id
    },
    // 添加/修改 弹框取消
    fireDealCancel(name) {
      this.$refs[name].resetFields()
      this.fireDealMod = false
    },
    // 删除
    delFireDeal(params) {
      this.fireDealForm.id = params.id
      this.$Modal.confirm({
        title: '警告',
        content: '<p>确认删除吗?</p>',
        onOk: () => {
          this.deleteOk()
        }
      })
    },
    // 删除 确认
    deleteOk() {
      this.deleteFireAlarmDeal(this.fireDealForm.id).then(suc => {
        this.successMsg('删除成功')
        this.getFireDealData()
      }).catch(err => {
        console.log('this.deleteFireAlarmDeal :' + err)
        this.errorMsg('删除失败')
      })
    },
    // 警情类型启用
    enableChange() {
      const payload = {
        id: this.fireDealStatus.id,
        fireOpen: this.fireEnable,
        type: 'fire'
      }
      this.reviseFireDealStatus(payload).catch(err => {
        this.fireEnable = false
        console.log('this.getFireAlarmDealStatus :', err)
        this.errorMsg('获取状态失败')
      })
    },
    // 切换页码
    fireDealPageChange(n) {
      this.fireDealPageCur = n
      this.getFireDealData()
    },
    // 分页
    fireDealPageSizeChange(size) {
      this.fireDealLimit = size
      this.getFireDealData()
    }
  }
}
