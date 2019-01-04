<template>
  <div class="bs-content manage">
    <div class="bs-left">
      <div class="sidebar">
        <a @click="orgClick">选择机构</a>
        <div style="padding: 10px;">
          <Input v-model="orgTreeSearch" icon="ios-search-strong" placeholder="请输入..." />
        </div>
        <bs-scroll ref="orgFireScroll" style="height: 460px;width:100%;overflow: auto;">
          <v-tree @on-expand="expand" ref='tree' :searchVal="orgTreeSearch" :treeData="treeData" :options="sideTreeOptions" :activeId="activeOrgId" @node-click='handleNode' />
        </bs-scroll>
      </div>
      <div class="sidebar" v-if="$BShasPower('BS-FIRE-ALARMCONFIG-PAGE')">
        <ul class="config-list">
          <li style="list-style:none;" @click="isNowPathActive" :class="{active: show}">参数配置</li>
        </ul>
      </div>
    </div>
    <div class="bs-mains">
      <div class="tabStyle" v-if="!show" style="text-align:center;width:100%;font-size:12px;height:100%;">
        <Tabs value="2" :animated="false" v-if="$BShasPower('BS-FIRE-ALARMIN-PAGE')" style="width:100%; height:100%;">
          <TabPane label="输入防区" name="2" style="width:100%; height: 100%;">
            <div class="tab-content-alarm">
              <div class="feature-btn">
                <Button type="ghost" icon="plus" @click="openAddMod" v-if="$BShasPower('BS-FIRE-ALARMIN-ACTION')" :loading="addLoading">添加</Button>
                <Button type="ghost" icon="trash-a" @click="delAlarm" :disabled="canClick" v-if="$BShasPower('BS-FIRE-ALARMIN-ACTION')">删除</Button>
                <Button type="ghost" icon="edit" @click="openEditMod('修改输入防区')" :disabled="canClick" v-if="$BShasPower('BS-FIRE-ALARMIN-ACTION')">修改</Button>
                <Button type="ghost" icon="edit" @click="openMoreEditMod('批量修改输入防区')" :disabled="canClick" v-if="$BShasPower('BS-FIRE-ALARMIN-ACTION')">批量修改</Button>
                <Input v-model="inSearchName" placeholder="按名称模糊查询" style="width: 250px;" class="rt">
                <Button slot="append" @click="search">搜索</Button>
                </Input>
                <Checkbox v-model="singleIn" class="lf" @on-change="childData">显示子机构资源</Checkbox>
              </div>
              <div class="car-list flex-1" style="padding-top:10px;">
                <div class="table-box" style="height: 100%;" ref="tableBox">
                  <Table size="small" :columns="importTitle" :data="importData" :height="tableHeight" @on-selection-change="alarmInSel"></Table>
                  <div class="table-footer">
                    <div class="rt">
                      <Page show-sizer show-elevator show-total :page-size-opts="$PageInfo.size" :total="pageInfo.count" :page-size="pageInfo.limit" :current="pageInfo.cur" @on-change="pageChange" @on-page-size-change="pageSizeChange"></Page>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </div>
      <div v-if="show" style="width: 100%; height: 100%;">
        <config></config>
      </div>
    </div>
    <!--输入防区 添加 模态框-->
    <div v-if="importAdd">
      <Modal v-model="importAdd" title="添加报警输入" :mask-closable="false">
        <bs-scroll ref="addFireScroll" style=" width: 100%;height: 400px;overflow: auto;">
          <bsr-tree :treeData="addModelTree[0]||{}" ref="inTree"  @on-expand="addFireExpand" showCheckbox>
            <template slot-scope="{ node }">
              <span :class="{'item': true, 'offline': (node.eid && node.status !== 1)}" :title="node.name">
                <i class="iconfont" :class="[getNodeIcon(node).class]" :title="getNodeIcon(node).title"></i>
                {{node.name}}
              </span>
            </template>
          </bsr-tree>
        </bs-scroll>
        <div slot="footer">
          <Button type="ghost" @click="cancel">取消</Button>
          <Button type="primary" :loading="modalLoading" @click="affirmAdd">确定</Button>
        </div>
      </Modal>
    </div>
    <!--修改及批量修改 模态框-->
    <div v-if="importEdit">
      <Modal v-model="importEdit" :title="editModTitle" width="480" :mask-closable="false">
        <Form :model="editForm" :label-width="85" :rules="formValidate" ref="editForm" label-position="left"  style="padding: 0 10px;">
          <div v-if="isEditMore">
            <Form-item label="防区名称" prop="name">
              <Input v-model="editForm.name" />
            </Form-item>
            <Form-item label="防区编号" prop="chan">
              <InputNumber :min="0" :max="99999" v-model="editForm.chan" style="width: 100%;" />
            </Form-item>
            <Form-item label="设备回路">
              <Input v-model="editForm.devloop" />
            </Form-item>
          </div>
          <Form-item label="级别" prop="level">
            <Select v-model="editForm.level">
              <Option v-for="item in enabledLevel" :value="item.value" :key="item.value">{{ item.label }}</Option>
            </Select>
          </Form-item>
          <Form-item label="布撤防时间" prop="alarmtemplate">
            <Select v-model="editForm.alarmtemplate">
              <Option v-for="item in enabledTemp" :value="item.value" :key="item.value">{{ item.label }}</Option>
            </Select>
          </Form-item>
          <Form-item label="最大延时" prop="maxdelaytime">
            <Input v-model="editForm.maxdelaytime" />
          </Form-item>
          <Form-item label="最小间隔" prop="minintervaltime">
            <Input v-model="editForm.minintervaltime " />
          </Form-item>
          <div class="confirm" v-if="isEditMore">
            <div class="alarm-confirm">
              <Checkbox v-model="editForm.mapsign.signflag">地图标识</Checkbox>
            </div>
            <div class="confirm-way">
              <Select style="width:120px" v-model="editForm.mapsign.signtype " :disabled="!editForm.mapsign.signflag">
                <Option v-for="item in mapSelect" :value="item.value" :key="item.value">{{ item.label }}</Option>
              </Select>
            </div>
          </div>
          <div class="confirm">
            <div class="alarm-confirm">
              报警确认
              <!-- <Checkbox v-model="editForm.alarmaffirm.affirmflag" @on-change="showChange">报警确认</Checkbox> -->
            </div>
            <div class="confirm-way">
              <Radio-group v-model="wayGroup" @on-change="showRadio">
                <Radio label="自动确认"></Radio>
                <Input-number class="confirm-time" prop="maxDelay" :disabled="inputIsShow" :min="0" :max="7200" v-model="editForm.alarmaffirm.autoaffirm.intervaltime"></Input-number>
                <br>
                <Radio label="手工确认"></Radio>
              </Radio-group>
            </div>
          </div>
        </Form>
        <div slot="footer">
          <Button type="ghost" @click="editCancel('editForm')">取消</Button>
          <Button type="primary" :loading="modalLoading" @click="editOk('editForm')">确定</Button>
        </div>
      </Modal>
    </div>
    <!--联动配置模态框-->
    <div v-if="alarmLink">
      <Modal v-model="alarmLink" title="输入防区联动配置" width="580" :mask-closable="false">
        <Form :model="linkData" label-position="left" :label-width="80" style="padding: 0 10px;">
          <Form-item label="报警名称：">
            <Input v-model="alarmLinkName" disabled/>
          </Form-item>
          <Form-item label="联动动作：">
            <Select @on-change="linkShow" v-model="linkData.actionType">
              <Option value="1">联动视频</Option>
              <Option value="2">联动门禁</Option>
            </Select>
          </Form-item>
        </Form>
        <!--联动视频-->
        <div v-show="linkIsShow" style="padding: 0 10px;">
          <div class="select-video">
            <div class="operation-btn">
              <div class="lf">选择视频源:</div>
              <div class="rt">
                <Checkbox v-model="autoComfirm" @on-change="otherTree">显示其他机构</Checkbox>
                <Button style="width: 70px;" type="ghost" @click="addVideoConfig">添加</Button>
              </div>
            </div>
            <!-- <div class="org-tree" style="height: 230px;"> -->
            <bs-scroll ref="linkFireScroll" style=" width: 100%;height:230px;overflow: auto;">
              <v-tree ref='videoTree' @on-expand="linkFireExpand" :treeData="videoTree" :options="options" :isSaveState='false' />
            </bs-scroll>
            <!-- </div> -->
          </div>
          <div class="infor-list">
            <div class="infor-del">
              <Button style="width: 70px;" type="ghost" @click="delVideoConfig">删除</Button>
            </div>
            <div class="model-table">
              <Table border height="235" :columns="inforTitle" :data="linkData.actionVideo" size="small" @on-selection-change="alarmInSel"></Table>
            </div>
          </div>
        </div>
        <!--联动门禁-->
        <div v-show="!linkIsShow" style="padding: 0 10px;">
          <div class="select-video">
            <div class="org-tree" style="height: 350px;">
              <!--<div class="lf">选择联动门禁:</div>-->
              <div class="transf">
                <div style="margin-bottom:20px;">
                  选择门禁服务器:
                  <Select style="width:158px" v-model="linkData.doorServer" @on-change="selDoorMeth" placeholder="请选择">
                    <Option v-for="item in doorList" :value="item.value" :key="item.value">{{ item.label }}</Option>
                  </Select>
                </div>
                <Transfer :titles="titles" :data="transfData" :target-keys="targetKeys" :render-format="renderFormat" @on-change="handleChange" :list-style="{width: '225px', height: '310px'}"></Transfer>
              </div>
            </div>
          </div>
        </div>
        <div slot="footer">
          <Button type="ghost" @click="cancelLink">取消</Button>
          <Button type="primary" :loading="modalLoading" @click="affirmLink">确定</Button>
        </div>
      </Modal>
    </div>
  </div>
</template>
<script>
import {getNodeIcon} from 'components/BStree/commonMethods.js'
import config from './manageConfig'
import manage from './manage.js'
import { mapState, mapActions, mapGetters } from 'vuex'
export default {
  components: { config },
  mixins: [manage],
  data() {
    return {
      show: false,
      orgTreeSearch: '',
      modalLoading: false,
      canClick: true,
      sideTreeOptions: {
        showCheckbox: true,
        showInput: false
      },
      options: {
        showCheckbox: true,
        showInput: true
      },
      treeData: [],
      activeOrgId: '',
      tableHeight: 420,
      pageInfo: {
        cur: 1,
        count: 0,
        limit: this.$PageInfo.limit
      }
    }
  },
  computed: {
    ...mapState({
      orgTreeData: ({ orgConfig }) => orgConfig.orgTreeData,
      deviceTreeData: ({ orgConfig }) => orgConfig.deviceTreeData,
      addXFTreeData: ({ fireManage }) => fireManage.addXFTreeData,
      importDataStore: ({ fireManage }) => fireManage.importData,
      affirmsStore: ({ fireManage }) => fireManage.affirms,
      fireDeviceTreeData: ({ fireManage }) => fireManage.fireDeviceTreeData
    }),
    ...mapGetters(['enabledTemp', 'enabledSort', 'doorList'])
  },
  mounted() {
    this.tableHeight = this.$refs['tableBox'].offsetHeight - 42
  },
  methods: {
    ...mapActions([
      'getAlarmOrgTree',
      'doorSelData',
      'getDoorList',
      'getSortData',
      'getFirePlan',
      'getXFAddTree',
      'setOrgIdList',
      'getFireDeviceTree',
      'getImportData',
      'addImportData',
      'delImportData',
      'editImportData',
      'editMoreImportData',
      'getAffirmsData',
      'setAffirmsData',
      'getAlarmTemp',
      'recordLog'
    ]),
    getNodeIcon(item) {
      return getNodeIcon(item)
    },
    expand() {
      this.$refs.orgFireScroll.update()
    },
    addFireExpand() {
      this.$refs.addFireScroll.update()
    },
    linkFireExpand() {
      this.$refs.linkFireScroll.update()
    },
    // 点击机构树
    orgClick() {
      this.$router.replace('/fire/manage')
      this.show = false
    },
    // 点击侧边栏
    isNowPathActive() {
      this.show = true
    },
    // 点击机构树某节点
    handleNode(node) {
      this.activeOrgId = node._id
      this.isroot = node.isroot
      this.orgClick()
      // 点击机构节点，获取该节点下输入防区
      this.getTableData()
      this.Inselect = []
      this.canClick = true
    },
    // 获取机构树数据
    getTreeData() {
      this.getAlarmOrgTree()
        .then(() => {
          this.treeData = JSON.parse(JSON.stringify(this.orgTreeData))
          this.rootOrgId = this.treeData[0]._id
          this.activeOrgId = this.treeData[0]._id
          this.getTableData()
        })
        .catch(err => {
          console.log('this.getAlarmOrgTree :' + err)
          this.errorMsg('机构树获取失败！')
        })
    },
    // 点击分页
    pageChange(n) {
      this.pageInfo.cur = n
      this.getTableData()
    },
    pageSizeChange(n) {
      this.pageInfo.limit = n
      this.getTableData()
    },
    // 获取表格数据
    getTableData() {
      let data = {
        page: this.pageInfo.cur,
        limit: this.pageInfo.limit,
        name: this.inSearchName,
        id: this.activeOrgId,
        never: this.singleIn ? -1 : 0
      }
      this.getImportData(data)
        .then(res => {
          this.importData = this.importDataStore
          this.pageInfo.count = Number(res.headers['x-bsc-count'])
          this.Inselect = []
          this.canClick = true
        })
        .catch(err => {
          console.log('this.getImportData :' + err)
          this.errorMsg('输入防区数据获取失败')
        })
    }
  },
  created() {
    this.getTreeData()
    // 获取布撤防时间
    this.getAlarmTemp()
      .then()
      .catch(err => {
        console.log('this.getAlarmTemp :' + err)
        this.errorMsg('布撤防时间获取失败')
      })
    // 获取联动视频树
    // this.getVideoTree()
    // 获取门禁服务器列表
    this.doorSelData()
      .then()
      .catch(err => {
        console.log('this.doorSelData :' + err)
        this.errorMsg('门禁服务器列表获取失败')
      })
    this.Inselect = []
    this.canClick = true
  },
  watch: {
    Inselect: {
      deep: true,
      handler: function(data) {
        return data
      }
    },
    singleIn(newV, old) {
      return newV
    },
    isEditMore(newV, old) {
      return newV
    },
    deviceTreeData: {
      handler(newValue, oldValue) {
        return newValue
      },
      deep: true
    }
  }
}
</script>

<style  scoped>
.sidebar {
  width: 100%;
  height: auto;
}

.sidebar > a {
  display: block;
  text-align: center;
  font-size: 14px;
  color: #fff;
  background-color: #0f2243;
  height: 40px;
  line-height: 40px;
}

.tree-org {
  height: 600px;
  max-width: 300px;
  overflow: hidden;
}

.config-list li {
  position: relative;
  cursor: pointer;
  height: 40px;
  line-height: 40px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  border-right: 2px solid transparent;
  background: #1c3053;
  border-top: 1px solid rgba(58, 90, 139, 0.4);
  border-bottom: 1px solid rgba(58, 90, 139, 0.4);
  padding: 0 0 0 40px;
}

.config-list li:hover {
  background: #2b426b;
  color: #ffffff;
}

.sidebar > .config-list > .active {
  color: #4699f9;
  border-right: 2px solid #4699f9;
  background-color: #2f497a;
  z-index: 2;
}

.bs-content {
  width: 100%;
  position: relative;
  display: flex;
  padding: 16px 0;
  overflow: inherit;
}

.pictureStyle {
  display: inline-flex;
  width: auto;
  height: 100%;
  margin-left: 20px;
  padding: 0;
}

.bs-mains {
  width: 100%;
  background: #1c3053;
  min-height: 670px;
  overflow-x: hidden;
}

.lf {
  float: left;
}

.rt {
  float: right;
}

.tab-content-alarm {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1c3053;
  height: 100%;
}

.feature-btn {
  width: 100%;
  flex: 0 0 32px;
  padding: 0 24px;
  height: 32px;
  line-height: 32px;
}

.feature-btn > button {
  margin-right: 8px;
  float: left;
  width: 100px;
  height: 32px;
}

.ivu-table-column-center .ivu-btn span {
  color: #57a3f3;
  font-size: 14px;
}

.page-style {
  width: 100%;
  height: 42px;
  line-height: 42px;
  border-top: none;
  padding: 2px 12px;
  background: #244575;
}

.form-rule {
  margin-top: 15px;
}

.form-select {
  display: inline-block;
}

.left-select {
  margin-right: 18px;
}

.alarm-confirm {
  width: 80px;
  display: inline-block;
  vertical-align: top;
}

.confirm-way {
  display: inline-block;
}

.confirm {
  position: relative;
  height: 50px;
}

.confirm-time {
  width: 200px;
  margin-left: 20px;
}

.operation-btn {
  height: 38px;
  border-bottom: 2px solid #909090;
}

.operation-btn > div:first-child {
  font-size: 14px;
  height: 32px;
  line-height: 32px;
}

.infor-del {
  height: 40px;
  width: 100%;
  margin-top: 10px;
}

.model-table {
  width: 100%;
  overflow: auto;
  border: 1px solid #5d5d5d;
}

.transf {
  width: 100%;
  overflow: auto;
  margin-top: 0px;
  text-align: left;
}

.infor-list .ivu-table {
  width: 100%;
}

.org-tree .transf .ivu-transfer .ivu-transfer-list .ivu-transfer-list-header {
  background: #1c3053 !important;
}
</style>
