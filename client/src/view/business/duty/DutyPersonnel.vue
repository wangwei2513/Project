<template src="./DutyPersonnel.html"></template>

<script>
import _ from 'lodash'
import { mapActions } from 'vuex'
import { renderWithTitle } from 'src/common/render.js'
import teamApi from 'src/modal/api/business/duty/team.js'
import personnelApi from 'src/modal/api/business/duty/personnel.js'
import TeamClass from 'src/modal/factory/business/duty/team.js'
import PersonnelClass from 'src/modal/factory/business/duty/personnel.js'

const validateNumber = (rule, value, callback) => {
  const reg = /^[\d]+$/
  if (reg.test(value)) {
    callback()
  } else {
    callback(new Error())
  }
}

export default {
  data() {
    return {
      isMovingPerson: false,
      modalVisableEditePerson: false,
      newPersonRules: {
        number: [
          { required: true, message: '请输入员工编号！' },
          { max: 6, message: '人员编号最多 6 位！' },
          { validator: validateNumber, message: '人员编号必须是大于 0 的数字！' }
        ],
        name: [{ required: true, message: '请输入员工名！' }, { max: 20, message: '员工名最多 20 字符！' }],
        sex: [{ required: true, message: '请输入性别！' }],
        contact: [
          { required: true, message: '请输联系方式！' },
          { max: 11, message: '联系方式最多 11 位！' },
          { validator: validateNumber, message: '联系方式必须是大于 0 的数字！' }
        ],
        department: [{ max: 20, message: '员工部门最多 20 字符！' }],
        position: [{ max: 20, message: '员工职务最多 20 字符！' }],
        address: [{ max: 100, message: '员工通讯地址最多 100 字符！' }]
      },
      editedPerson: {
        number: '',
        name: '',
        sex: '',
        contact: '',
        department: '',
        position: '',
        address: ''
      },
      newPerson: {
        number: '',
        name: '',
        sex: 'man',
        contact: '',
        department: '',
        position: '',
        address: ''
      },
      modalVisableAddPerson: false,
      editedTeamList: {
        number: null,
        name: ''
      },
      modalVisibleEditeTeamList: false,
      newTeamListRules: {
        number: [
          { required: true, message: '请输入班组编号！' },
          { max: 5, message: '班组编号最多 5 位！' },
          { validator: validateNumber, message: '班组编号必须是大于 0 的数字！' }
        ],
        name: [{ required: true, message: '请输入班组名！' }, { max: 64, message: '班组名最多 64字符！' }]
      },
      newTeamList: {
        number: '',
        name: ''
      },
      modalVisibleAddTeamList: false,
      // 被选中的班组
      selectedTeam: null,
      // 将所有的班组以 key 为班组 ID 的形式保存
      treeDataObj: {},
      treeData: [],
      searchData: '',
      // 分页信息
      page: {
        total: 0,
        current: 1,
        pageSize: this.$PageInfo.limit
      },
      selectedPerson: null,
      // 人员列表配置
      columns: [
        {
          type: 'selection',
          width: 60,
          align: 'center'
        },
        {
          title: '员工号',
          minWidth: 100,
          key: 'number'
        },
        {
          title: '姓名',
          minWidth: 100,
          key: 'name'
        },
        {
          title: '性别',
          minWidth: 100,
          key: 'sex'
        },
        {
          title: '联系方式',
          minWidth: 100,
          key: 'contact'
        },
        {
          title: '所属班组',
          minWidth: 100,
          key: 'teamName'
        },
        {
          title: '部门',
          minWidth: 100,
          ellipsis: true,
          key: 'department',
          render: (h, params) => {
            return renderWithTitle(h, params.row.department)
          }
        },
        {
          title: '职务',
          minWidth: 100,
          ellipsis: true,
          key: 'position',
          render: (h, params) => {
            return renderWithTitle(h, params.row.position)
          }
        },
        {
          title: '通讯地址',
          minWidth: 100,
          ellipsis: true,
          key: 'address',
          render: (h, params) => {
            return renderWithTitle(h, params.row.address)
          }
        }
      ],
      // 人员列表数据
      data: [],
      tableWidth: null,
      tableHeight: null
    }
  },
  created() {
    // TODO 提出去 ployfill
    // ployfill CustomEvent
    ;(function() {
      if (typeof window.CustomEvent === 'function') {
        return false
      }

      function CustomEvent(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined }
        var evt = document.createEvent('CustomEvent')
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail)
        return evt
      }

      CustomEvent.prototype = window.Event.prototype

      window.CustomEvent = CustomEvent
    })()

    // 进入页面时加载全部人员
    this.getPersonnelListAll()
    // 初始化班组列表
    this.initTreeData()
  },
  mounted() {
    this.tableWidth = this.$refs['tableContainer'].offsetWidth
    this.tableHeight = this.$refs['tableContainer'].offsetHeight
  },
  methods: {
    ...mapActions(['recordLog']),
    disableRulePerson(obj) {
      return (
        !obj.number ||
        !/^[\d]+$/.test(obj.number) ||
        obj.number.length > 6 ||
        !obj.name ||
        obj.name.length > 20 ||
        !obj.sex ||
        !obj.contact ||
        !/^[\d]+$/.test(obj.contact) ||
        obj.contact.length > 11 ||
        obj.department.length > 20 ||
        obj.position.length > 20 ||
        obj.address.length > 100
      )
    },
    disableRuleTeamList(obj) {
      return !obj.number || !/^[\d]+$/.test(obj.number) || obj.number.length > 5 || !obj.name || !obj.name.length > 64
    },
    getPersonnelListAll(opt) {
      const isRefresh = opt && opt.isRefresh

      let params = {
        limit: this.page.pageSize,
        page: this.page.current,
        name: this.searchData
      }

      personnelApi
        .listAll(params)
        .then(res => {
          const data = res.data
          const headers = res.headers

          this.page = {
            total: parseInt(headers['x-bsc-count']),
            current: parseInt(headers['x-bsc-cur']),
            pageSize: parseInt(headers['x-bsc-limit'])
          }

          this.data = data.map(personnel => {
            let obj = new PersonnelClass(personnel)
            if (this.selectedPerson) {
              this.selectedPerson.forEach((selectedPerson, index) => {
                if (selectedPerson.id === obj.id) {
                  obj._checked = true
                  this.selectedPerson[index] = obj
                }
              })
            }
            return obj
          })
          if (isRefresh) {
            this.successMsg('刷新成功！')
          }
        })
        .catch(error => {
          this.$Notice.error({
            title: '错误提示！',
            desc: error.message
          })
        })
    },
    initTreeData(opt) {
      const isRefresh = opt && opt.isRefresh

      teamApi
        .list()
        .then(data => {
          // iView tree 组建根级为数组
          this.treeData = [iteration.call(this, data)]
          if (isRefresh) {
            this.successMsg('刷新成功！')
          }
        })
        .catch(error => {
          this.$Notice.error({
            title: '错误提示！',
            desc: error.message
          })
        })
      // 递归班组结构
      function iteration(data) {
        let obj = new TeamClass(data)
        this.treeDataObj[obj.id] = obj
        if (this.selectedTeam && this.selectedTeam.id === obj.id) {
          // 树形结构刷新后，selected 状态不丢失
          obj.selected = true
          this.selectedTeam = obj
        }
        if (_.isArray(data.children)) {
          obj.children = data.children.map(team => iteration.call(this, team))
        }
        return obj
      }
    },
    confirmEditePerson() {
      let params = {
        code: this.editedPerson.number,
        name: this.editedPerson.name,
        gender: null,
        phone: this.editedPerson.contact,
        department: this.editedPerson.department,
        title: this.editedPerson.position,
        address: this.editedPerson.address,
        // team id 取值的对象和其它不一样
        group: this.editedPerson.teamId,
        _id: this.selectedPerson[0].id
      }

      if (this.editedPerson.sex === 'man') {
        params.gender = 1
      } else if (this.editedPerson.sex === 'woman') {
        params.gender = 0
      }

      const paramsLog = {
        logType: '操作日志',
        module: '业务管理',
        operateName: '修改人员',
        operateContent: '修改人员',
        target: params.name
      }

      this.recordLog(paramsLog)

      personnelApi
        .modify(params)
        .then(data => {
          // TODO 取值以后需要处理
          this.getPersonnelListOfTeam()
          this.closeEditePersonModal()
        })
        .catch(error => {
          this.closeEditePersonModal()
          this.$Notice.error({
            title: '错误提示！',
            desc: error.message
          })
        })
    },
    closeEditePersonModal() {
      this.modalVisableEditePerson = false
      this.$refs['editePerson'].resetFields()
    },
    confirmAddPerson() {
      let params = {
        code: this.newPerson.number,
        name: this.newPerson.name,
        gender: null,
        phone: this.newPerson.contact,
        department: this.newPerson.department,
        title: this.newPerson.position,
        address: this.newPerson.address,
        // team id 取值的对象和其它不一样
        group: this.selectedTeam.id
      }

      if (this.newPerson.sex === 'man') {
        params.gender = 1
      } else if (this.newPerson.sex === 'woman') {
        params.gender = 0
      }

      const paramsLog = {
        logType: '操作日志',
        module: '业务管理',
        operateName: '添加人员',
        operateContent: '添加人员',
        target: params.name
      }

      this.recordLog(paramsLog)

      personnelApi
        .create(params)
        .then(data => {
          // TODO 这里需要做判断
          this.getPersonnelListOfTeam()
          this.closeAddPersonModal()
        })
        .catch(error => {
          this.closeAddPersonModal()
          this.$Notice.error({
            title: '错误提示！',
            desc: error.message
          })
        })
    },
    closeAddPersonModal() {
      this.modalVisableAddPerson = false
      this.$refs['addPerson'].resetFields()
      this.newPerson = {
        number: null,
        name: '',
        sex: 'man',
        contact: null,
        department: '',
        position: '',
        address: ''
      }
    },
    editeTeamList() {
      let params = {
        id: this.selectedTeam.id,
        name: this.editedTeamList.name,
        code: this.editedTeamList.number
      }

      const paramsLog = {
        logType: '操作日志',
        module: '业务管理',
        operateName: '修改班组',
        operateContent: '修改班组',
        target: this.editedTeamList.name
      }

      this.recordLog(paramsLog)
      teamApi
        .modify(params)
        .then(data => {
          this.initTreeData()
          this.closeEditTeamList()
        })
        .catch(error => {
          this.closeEditTeamList()
          this.$Notice.error({
            title: '错误提示！',
            desc: error.message
          })
        })
    },
    closeEditTeamList() {
      this.modalVisibleEditeTeamList = false
      this.$refs['editeTeamList'].resetFields()
    },
    closeAddTeamList() {
      this.modalVisibleAddTeamList = false
      this.$refs['newTeamList'].resetFields()
      this.newTeamList = {
        number: null,
        name: ''
      }
    },
    addTeamList() {
      let params = {
        name: this.newTeamList.name,
        code: this.newTeamList.number,
        pid: this.selectedTeam.id
      }
      teamApi
        .create(params)
        .then(data => {
          const paramsLog = {
            logType: '操作日志',
            module: '业务管理',
            operateName: '添加班组',
            operateContent: '添加班组',
            target: this.newTeamList.name
          }

          this.recordLog(paramsLog)

          this.initTreeData()
          this.closeAddTeamList()
        })
        .catch(error => {
          this.closeAddTeamList()
          this.$Notice.error({
            title: '错误提示！',
            desc: error.message
          })
        })
    },
    getPersonnelListOfTeam(opt) {
      const isRefresh = opt && opt.isRefresh

      let params = {
        limit: this.page.pageSize,
        page: this.page.current,
        name: this.searchData
      }

      if (this.selectedTeam) {
        params.id = this.selectedTeam.id
      } else {
        this.getPersonnelListAll(opt)
        return
      }

      personnelApi
        .listOfTeam(params)
        .then(res => {
          const data = res.data
          const headers = res.headers

          this.page = {
            total: parseInt(headers['x-bsc-count']),
            current: parseInt(headers['x-bsc-cur']),
            pageSize: parseInt(headers['x-bsc-limit'])
          }

          this.data = data.map(personnel => {
            let obj = new PersonnelClass(personnel)
            if (this.selectedPerson) {
              this.selectedPerson.forEach((selectedPerson, index) => {
                if (selectedPerson.id === obj.id) {
                  obj._checked = true
                  this.selectedPerson[index] = obj
                }
              })
            }
            return obj
          })

          if (isRefresh) {
            this.successMsg('刷新成功！')
          }
        })
        .catch(error => {
          this.$Notice.error({
            title: '错误提示！',
            desc: error.message
          })
        })
    },
    teamSelectChange(selectArr) {
      this.page.current = 1
      this.page.pageNum = 0

      this.selectedTeam = selectArr[0]

      this.getPersonnelListOfTeam()

      if (this.isMovingPerson) {
        let param = {
          selectedTeam: selectArr[0]
        }
        let event = new window.CustomEvent('movingPerson', {
          detail: param
        })
        window.dispatchEvent(event)
        this.isMovingPerson = false
      } else {
        // 切换班组后，人员列表取消勾选
        this.selectedPerson = null
      }
    },
    refreshTeam() {
      // TODO 加一个 loading 状态
      this.initTreeData({ isRefresh: true })
    },
    editTeam() {
      this.modalVisibleEditeTeamList = true

      this.editedTeamList = {
        parent: '-',
        number: this.selectedTeam.number,
        name: this.selectedTeam.title
      }

      if (this.treeDataObj && this.selectedTeam.pid) {
        this.editedTeamList.parent = this.treeDataObj[this.selectedTeam.pid].title
      } else {
        this.editedTeamList.parent = '-'
      }
    },
    removeTeam() {
      let params = {
        id: this.selectedTeam.id
      }
      this.$Modal.confirm({
        title: '确认删除班组',
        content: `是否删除班组 ${this.selectedTeam.title} ？`,
        onOk: () => {
          teamApi
            .remove(params)
            .then(data => {
              const paramsLog = {
                logType: '操作日志',
                module: '业务管理',
                operateName: '删除班组',
                operateContent: '删除班组',
                target: this.selectedTeam.title
              }

              this.recordLog(paramsLog)

              this.selectedTeam = null
              this.getPersonnelListAll()
              this.initTreeData()
            })
            .catch(error => {
              this.$Notice.error({
                title: '错误提示！',
                desc: error.message
              })
            })
        },
        onCancel: () => {}
      })
    },
    addTeam() {
      this.modalVisibleAddTeamList = true

      if (this.treeDataObj && this.selectedTeam.id) {
        this.addTeamList.parent = this.treeDataObj[this.selectedTeam.id].title
      } else {
        this.addTeamList.parent = '-'
      }
    },
    handleTableSelectionChange(selection) {
      if (selection && selection.length) {
        this.selectedPerson = selection
      } else {
        this.selectedPerson = null
      }
    },
    confirmSearch() {
      this.getPersonnelListOfTeam()
    },
    refreshList() {
      this.getPersonnelListOfTeam({ isRefresh: true })
    },
    movePerson() {
      this.isMovingPerson = true

      const msg = this.$Message.loading({
        content: '请在班组列表选择目标班组...',
        duration: 5
      })

      let handleMovingPersonBind = handleMovingPerson.bind(this)

      window.addEventListener('movingPerson', handleMovingPersonBind)

      // 目标班组的名字
      let afterGroupName

      function handleMovingPerson(event) {
        afterGroupName = event.detail.selectedTeam.title
        window.removeEventListener('movingPerson', handleMovingPersonBind)
        let params = this.selectedPerson.map(person => {
          let obj = {
            code: person.number,
            name: person.name,
            gender: null,
            phone: person.contact,
            department: person.department,
            title: person.position,
            address: person.address,
            // team id 取值的对象和其它不一样
            group: event.detail.selectedTeam.id,
            _id: person.id
          }
          if (person.sex === '男') {
            obj.gender = 1
          }
          if (person.sex === '女') {
            obj.gender = 0
          }
          return obj
        })

        const logParams = {
          logType: '操作日志',
          module: '业务管理',
          operateName: '移动人员',
          operateContent: `${this.selectedPerson[0].teamName} 至 ${afterGroupName}`,
          target: params.map(item => item.name).join(' '),
          deviceIp: params.map(item => item.code).join(' ')
        }

        this.recordLog(logParams)

        personnelApi
          .modifyTeam(params)
          .then(() => {
            msg()
            this.getPersonnelListOfTeam()
          })
          .catch(error => {
            msg()
            this.$Notice.error({
              title: '错误提示！',
              desc: error.message
            })
          })
      }
    },
    removePerson() {
      this.$Modal.confirm({
        title: '确认删除',
        content:
          this.selectedPerson.length > 1
            ? `是否删除 ${this.selectedPerson.length} 名班组人员？`
            : `是否删除班组人员 ${this.selectedPerson[0].name} ？`,
        onOk: () => {
          let ids = this.selectedPerson.map(person => person.id)
          personnelApi
            .remove(ids)
            .then(data => {
              const logParams = {
                logType: '操作日志',
                module: '业务管理',
                operateName: '删除人员',
                operateContent: `删除人员`,
                target: this.selectedPerson.map(item => item.name).join(' ')
              }

              this.recordLog(logParams)
              this.selectedPerson = null
              this.getPersonnelListOfTeam()
            })
            .catch(error => {
              this.$Notice.error({
                title: '错误提示！',
                desc: error.message
              })
            })
        },
        onCancel: () => {}
      })
    },
    modifyPerson() {
      this.modalVisableEditePerson = true

      let selectedPerson = this.selectedPerson[0]
      this.editedPerson = {
        teamName: selectedPerson.teamName,
        number: selectedPerson.number,
        name: selectedPerson.name,
        sex: null,
        contact: selectedPerson.contact,
        department: selectedPerson.department,
        position: selectedPerson.position,
        address: selectedPerson.address
      }

      if (selectedPerson.sex === '女') {
        this.editedPerson.sex = 'woman'
      }
      if (selectedPerson.sex === '男') {
        this.editedPerson.sex = 'man'
      }
    },
    addPerson() {
      this.modalVisableAddPerson = true
    },
    handlePageSizeChange(pageSize) {
      this.page.pageSize = pageSize
      this.getPersonnelListOfTeam()
    },
    handlePageChange(pageNum) {
      this.page.current = pageNum
      this.getPersonnelListOfTeam()
    }
  }
}
</script>

<style lang="less">
#duty-personnel {
  height: 100%;
  display: flex;
  flex-direction: row;
  .team-list {
    background-color: #1b3153;
    width: 272px;
    margin-right: 16px;
    .title {
      background-color: #0f2343;
      color: #fff;
      font-size: 14px;
      height: 38px;
      line-height: 38px;
      text-align: center;
    }
    .toolbar {
      padding: 10px 10px;
      .ivu-btn-group {
        display: flex;
        button {
          flex-grow: 1;
        }
      }
    }
    .team-tree {
      user-select: none;
      padding: 0 10px;
      // iview 样式修改
      .ivu-tree {
        ul {
          li {
            margin: 12px 0;
          }
        }
        > ul.ivu-tree-children {
          > li {
            margin-top: 7px;
          }
        }
      }
    }
  }
  .main-content {
    background-color: #1b3153;
    flex-grow: 1;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    .toolbar {
      display: flex;
      padding: 12px 24px;
      min-height: 54px;
      justify-content: space-between;
      button {
        margin-right: 8px;
      }
      .right-bar {
        display: flex;
        input {
          width: 240px;
        }
      }
    }
    .table-container {
      width: 100%;
      flex-grow: 1;
      overflow-y: auto;
    }
    .paging-container {
      display: flex;
      min-height: 38px;
      padding: 0 16px;
      align-items: center;
      justify-content: flex-end;
      background-color: #244575;
      user-select: none;
    }
  }
  // iveiw 样式修改
  .ivu-tree-title {
    max-width: 87.5%;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    &:hover {
      background: #2f497a;
    }
    &.ivu-tree-title-selected {
      color: #4699f9;
      background: #2f497a;
      white-space: normal;
      word-break: break-all;
    }
  }
}
</style>
