<template>
  <div class="orgConfig">
    <div class="bs-left">
      <div class="sidebar">
        <a @click="orgClick">选择机构</a>
        <bs-scroll ref="orgScroll" style=" width: 100%;height: 450px;overflow: auto;">
          <v-tree @on-expand="expand" ref='tree' :treeData="treeData" :options="orgOptions" :activeId="activeOrgId" @node-click='handleNode' />
        </bs-scroll>
      </div>
      <div class="sidebar">
        <a @click="isNowPathActive" :class="{active: show}">报警参数配置</a>
        <ul class="config-list">
          <li style="list-style:none;" v-show="$BShasPower(config.vIf)" :key="index" v-for="(config,index) in configList" :class="{active: config.isActive}" @click="isNowPathActive(config)">
            {{config.name}}
          </li>
        </ul>
      </div>
    </div>
    <div class="bs-mains">
      <div style="text-align:center;width:100%;font-size:12px;height: 100%;">
        <div class="tabStyle" style="width: 100%; height: 100%;" v-if="!show">
          <Tabs :animated="false" value="0" @on-click="tabChange" style="width:100%; height: 100%;">
            <Tab-pane label="报警输入" name="0" v-if="$BShasPower('BS-ALARMIN-TABS-PAGE')" style="width:100%; height: 100%;">
              <div class="tab-content-alarm">
                <div class="feature-btn">
                  <Button type="ghost" icon="plus" v-if="$BShasPower('BS-ALARMIN-TABS-ACTION')" :loading="addLoading" @click="openAddMod('添加报警输入', true, false)">添加</Button>
                  <Button type="ghost" icon="trash-a" v-if="$BShasPower('BS-ALARMIN-TABS-ACTION')" @click="delAlarm" :disabled="cantClick">删除</Button>
                  <Button type="ghost" icon="edit" v-if="$BShasPower('BS-ALARMIN-TABS-ACTION')" @click="openEditMod('修改报警输入属性')" :disabled="cantClick">修改</Button>
                  <Button type="ghost" icon="edit" v-if="$BShasPower('BS-ALARMIN-TABS-ACTION')" @click="openMoreEditMod('批量修改报警输入属性')" :disabled="cantClick">批量修改</Button>
                  <Input v-model="inSearchName" placeholder="按名称模糊查询" style="width: 250px;" class="rt">
                  <Button slot="append" @click="search">搜索</Button>
                  </Input>
                  <Checkbox v-model="singleIn" class="lf" @on-change="childData">显示子机构资源</Checkbox>
                </div>
                <div class="car-list flex-1" style="padding-top:10px;">
                  <div class="table-box" style="height: 100%;" ref="tableBox1">
                    <Table size="small" :columns="importTitle" :data="importData" :height="tableHeight" @on-selection-change="alarmInSel"></Table>
                    <div class="table-footer">
                      <div class="rt">
                        <Page show-sizer :page-size-opts="$PageInfo.size" @on-page-size-change="pageSizeChange" :show-total="true" :show-elevator="true" :total="inPageTotal" :page-size="inpageLimit" :current="inPageCur" @on-change="pageChange"></Page>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tab-pane>
            <Tab-pane label="报警输出" name="1" v-if="$BShasPower('BS-ALARMOUT-TABS-PAGE')" style="width:100%; height: 100%;">
              <div class="tab-content-alarm">
                <div class="feature-btn">
                  <Button type="ghost" icon="plus" v-if="$BShasPower('BS-ALARMOUT-TABS-ACTION')" :loading="addLoading" @click="openAddMod('添加报警输出', false, false)">添加</Button>
                  <Button type="ghost" icon="trash-a" v-if="$BShasPower('BS-ALARMOUT-TABS-ACTION')" @click="delAlarm" :disabled="outcantClick">删除</Button>
                  <Button type="ghost" icon="edit" v-if="$BShasPower('BS-ALARMOUT-TABS-ACTION')" @click="exportMod('修改报警输出')" :disabled="outcantClick">修改</Button>
                  <Button type="ghost" icon="edit" v-if="$BShasPower('BS-ALARMOUT-TABS-ACTION')" @click="exportMoreMod('批量修改报警输出')" :disabled="outcantClick">批量修改</Button>
                  <Input v-model="outSearchName" placeholder="按名称模糊查询" style="width: 250px;" class="rt">
                  <Button slot="append" @click="search">搜索</Button>
                  </Input>
                  <Checkbox v-model="singleIn" class="lf" @on-change="childData">显示子机构资源</Checkbox>
                </div>
                <div class="car-list flex-1" style="padding-top:10px;">
                  <div class="table-box" style="height: 100%;" ref="tableBox2">
                    <Table size="small" :columns="exportTitle" :data="exportData" :height="tableHeight" @on-selection-change="alarmInSel"></Table>
                    <div class="table-footer">
                      <div class="rt">
                        <Page show-sizer :page-size-opts="$PageInfo.size" @on-page-size-change="pageSizeChange" :show-total="true" :show-elevator="true" :total="outPageTotal" :page-size="outpageLimit" :current="outPageCur" @on-change="pageChange"></Page>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tab-pane>
            <Tab-pane label="智能报警" name="2" v-if="$BShasPower('BS-ALARMSMART-TABS-PAGE')" style="width:100%; height: 100%;">
              <div class="tab-content-alarm">
                <div class="feature-btn">
                  <Input v-model="smartSearchName" placeholder="按所属设备查询" style="width: 250px;" class="rt">
                  <Button slot="append" @click="search">搜索</Button>
                  </Input>
                  <Checkbox v-model="singleIn" class="lf" @on-change="childData">显示子机构资源</Checkbox>
                </div>
                <div class="car-list flex-1" style="padding-top:10px;">
                  <div class="table-box" style="height: 100%;" ref="tableBox3">
                    <Table size="small" :columns="smartTitle" :data="smartData" :height="tableHeight"></Table>
                    <div class="table-footer">
                      <div class="rt">
                        <Page show-sizer :page-size-opts="$PageInfo.size" @on-page-size-change="pageSizeChange" :show-total="true" :show-elevator="true" :total="smartPageTotal" :page-size="smartpageLimit" :current="smartPageCur" @on-change="pageChange"></Page>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tab-pane>
            <Tab-pane label="监控点报警" name="3" v-if="$BShasPower('BS-ALARMJKD-TABS-PAGE')" style="width:100%; height: 100%;">
              <div class="tab-content-alarm">
                <div class="feature-btn">
                  <Input v-model="jkdSearchName" placeholder="按所属设备查询" style="width: 250px;" class="rt">
                  <Button slot="append" @click="search">搜索</Button>
                  </Input>
                  <Checkbox v-model="singleIn" class="lf" @on-change="childData">显示子机构资源</Checkbox>
                </div>
                <div class="car-list flex-1" style="padding-top:10px;">
                  <div class="table-box" style="height: 100%;" ref="tableBox4">
                    <Table size="small" :columns="monitorTitle" :data="monitorData" :height="tableHeight"></Table>
                    <div class="page-style">
                      <div class="rt">
                        <Page show-sizer :page-size-opts="$PageInfo.size" @on-page-size-change="pageSizeChange" :show-total="true" :show-elevator="true" :total="jdkPageTotal" :page-size="inpageLimit" :current="inPageCur" @on-change="pageChange"></Page>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tab-pane>
          </Tabs>
        </div>
        <div v-if="show">
          <!--<router-view></router-view>-->
          <timeTemplate v-if="configList[0].isActive"></timeTemplate>
          <paramsSetting v-if="configList[1].isActive"></paramsSetting>
          <sortShow v-if="configList[2].isActive"></sortShow>
        </div>
      </div>
      <!--报警输入\输出\智能添加模态框-->
      <div v-if="importAdd">
        <Modal v-model="importAdd" :title="addModTitle" :mask-closable="false">
          <!-- <div style="width:100%;height:400px;overflow:auto;"> -->
          <bs-scroll ref="inTreeScroll" style="width:100%;height:400px;overflow:auto;">
            <v-tree ref='inTree' @on-expand="inTreeExpand" :options="options" :treeData="deviceTree" :isSaveState='false' />
          </bs-scroll>
          <!-- </div> -->
          <div slot="footer">
            <Button type="ghost" @click="cancel">取消</Button>
            <Button type="primary" :loading="modalLoading" @click="affirmAdd">确定</Button>
          </div>
        </Modal>
      </div>
      <div v-if="importEdit">
        <!--报警输入 修改/批量修改 模态框-->
        <Modal v-model="importEdit" :title="editModTitle" width="480" :mask-closable="false">
          <Form :model="editForm" :label-width="85" :rules="formValidate" ref="editForm" label-position="left" style="padding: 0 10px;">
            <div v-if=" editModTitle === '修改报警输入属性' ">
              <Form-item label="所属设备">
                <Input v-model="editForm.orgName" disabled/>
              </Form-item>
              <Form-item label="防区编号">
                <Input v-model="editForm.chan" disabled/>
              </Form-item>
              <Form-item label="报警名称" prop="name">
                <Input v-model="editForm.name" />
              </Form-item>
            </div>
            <Form-item label="级别">
              <Select v-model="editForm.level">
                <Option v-for="item in this.enabledLevel" :value="item.value" :key="item.value">{{ item.label }}</Option>
              </Select>
            </Form-item>
            <Form-item label="报警分类">
              <Select v-model="editForm.alarmtype" @on-change="classifyChange">
                <Option v-for="item in enabledSort" :value="item.value" :key="item.value">{{ item.label }}</Option>
              </Select>
            </Form-item>
            <Form-item label="布撤防时间">
              <Select v-model="editForm.alarmtemplate" @on-change="timeChange">
                <Option v-for="(item, index) in this.enabledTemp" :value="item.value" :key="index">{{ item.label }}</Option>
              </Select>
            </Form-item>
            <Form-item label="最大延时" prop="maxdelaytime">
              <Input v-model="editForm.maxdelaytime" />
            </Form-item>
            <Form-item label="最小间隔" prop="minintervaltime">
              <Input v-model="editForm.minintervaltime" />
            </Form-item>
            <div v-if=" editModTitle === '修改报警输入属性' ">
              <div class="confirm">
                <div class="alarm-confirm">
                  <Checkbox v-model="editForm.mapsign.signflag">地图标识</Checkbox>
                </div>
                <div class="confirm-way">
                  <Select style="width:120px" v-model="editForm.mapsign.signtype " :disabled="!editForm.mapsign.signflag">
                    <Option v-for="item in mapSelect" :value="item.value" :key="item.value">{{ item.label }}</Option>
                  </Select>
                </div>
              </div>
            </div>
            <div class="confirm" style="margin-bottom: 0;">
              <div class="alarm-confirm">
                报警确认
                <!-- <Checkbox v-model="editForm.alarmaffirm.affirmflag" @on-change="showChange">报警确认</Checkbox> -->
              </div>
              <div class="confirm-way">
                <Radio-group v-model="wayGroup" @on-change="showRadio">
                  <Radio label="自动确认"></Radio>
                  <Input-number class="confirm-time" :disabled="inputIsShow" :min="0" :max="7200" v-model="editForm.alarmaffirm.autoaffirm.intervaltime"></Input-number>
                  <br>
                  <Radio label="手工确认"></Radio>
                </Radio-group>
              </div>
            </div>
          </Form>
          <div slot="footer">
            <Button type="ghost" @click="editCancel('editForm')">取消</Button>
            <Button type="primary" @click="editOk('editForm')">确定</Button>
          </div>
        </Modal>
      </div>
      <!--报警联动配置模态框-->
      <div v-if="alarmLink">
        <Modal v-model="alarmLink" title="报警联动配置" width="600" :mask-closable="false">
          <Tabs type="card" :value="itemIndex" @on-click="tabIndex">
            <Tab-pane label="联动动作" name="0"></Tab-pane>
            <Tab-pane label="联动规则1" name="1"></Tab-pane>
            <Tab-pane label="联动规则2" name="2"></Tab-pane>
            <Tab-pane label="联动规则3" name="3"></Tab-pane>
            <Tab-pane label="联动规则4" name="4"></Tab-pane>
          </Tabs>
          <div class="detail-info" v-show="itemIndex==='0'">
            <Form :model="linkData" label-position="left" :label-width="80" style="padding: 0 10px;">
              <div v-if="nowTabIndex === '0' || nowTabIndex === '1'">
                <Form-item label="报警名称：">
                  <p>{{alarmLinkName}}</p>
                </Form-item>
              </div>
              <Form-item label="联动动作：">
                <Select @on-change="linkShow" v-model="linkOption">
                  <Option value="0">联动视频</Option>
                  <Option value="1">联动报警输出</Option>
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
                <div class="org-tree" v-if="linkIsShow" style="height: 230px;">
                  <bs-scroll ref="videoTreeScroll" style="width:100%;height:100%;overflow:auto;">
                    <v-tree ref='videoTree' @on-expand="videoTreeExpand" :treeData="videoTree" :options="options" :isSaveState='false' />
                  </bs-scroll>
                </div>
              </div>
              <div class="infor-list">
                <div class="infor-del">
                  <Button style="width: 70px;" type="ghost" :disabled="showLinkdelBtn" @click="delVideoConfig">删除</Button>
                </div>
                <div class="model-table">
                  <Table border height="235" :columns="inforTitle" :data="linkData.actionVideo" size="small" @on-selection-change="alarmInSel"></Table>
                </div>
              </div>
            </div>
            <!--联动报警输出-->
            <div v-show="!linkIsShow" style="padding: 0 10px;">
              <div class="select-video">
                <div class="operation-btn">
                  <div class="lf">选择报警输出:</div>
                  <div class="rt">
                    <Button style="width: 70px;" type="ghost" @click="addExportConfig">添加</Button>
                  </div>
                </div>
                <div v-if="!linkIsShow">
                  <bs-scroll ref="linkOutScroll" style="width:100%;height: 230px;overflow: auto;">
                    <v-tree ref='exportTree' @on-expand="exportTreeExpand" :treeData="exportTree" :options="options" :isSaveState='false' />
                  </bs-scroll>
                </div>
              </div>
              <div class="infor-list">
                <div class="infor-del">
                  <Button style="width: 70px;" type="ghost" :disabled="showLinkdelBtn" @click="delExportConfig">删除</Button>
                </div>
                <div class="model-table">
                  <Table border height="280" :columns="linkTitle" :data="linkData.actionOutCtl" size="small" @on-selection-change="alarmInSel"></Table>
                </div>
              </div>
            </div>
          </div>
          <div v-for="(actionForList,index) in linkData.actionRule" :key="index">
            <div class="detail-info" v-show="itemIndex===(index+1).toString()">
              <div class="pane-style">
                <Checkbox v-model="actionForList.status">启用</Checkbox>
                <Form label-position="left" :label-width="80" :rules="formValidate" class="form-rule">
                  <Form-item label="时间段">
                    <Time-picker type="timerange" placement="bottom-end" placeholder="选择时间" :clearable="false" :editable="false" @on-change="editTime" :value="actionForList.timeRange" style="width: 350px"></Time-picker>
                  </Form-item>
                  <Form-item label="执行动作" prop="doAction">
                    <div class="do-action">
                      <Checkbox v-model="actionForList.actionVideo">联动视频</Checkbox>
                      <Checkbox v-model="actionForList.actionOutPut">联动报警输出</Checkbox>
                    </div>
                  </Form-item>
                </Form>
              </div>
            </div>
          </div>
          <div slot="footer">
            <Button type="ghost" @click="cancelLink">取消</Button>
            <Button type="primary" @click="affirmLink">确定</Button>
          </div>
        </Modal>
      </div>
      <!--报警输出修改模态框-->
      <div v-if="exportEditMod">
        <Modal v-model="exportEditMod" :title="exportModTitle" width="480" :mask-closable="false">
          <Form :model="exportForm" :label-width="80" :rules="formValidate" ref="exportForm" label-position="left"  style="padding: 0 10px;">
            <div v-if="exportModTitle === '修改报警输出'" class="nouse">
              <Form-item label="所属设备">
                <Input v-model="exportForm.orgName" disabled/>
              </Form-item>
              <Form-item label="防区编号">
                <Input v-model="exportForm.chan" disabled/>
              </Form-item>
              <Form-item label="输出名称" prop="name">
                <Input v-model="exportForm.name" />
              </Form-item>
            </div>
            <Form-item label="输出类型">
              <Select v-model="OutType">
                <Option value="1">常开</Option>
                <Option value="0">常闭</Option>
              </Select>
            </Form-item>
            <Form-item label="持续时间" prop="durationtime">
              <Input v-model="exportForm.durationtime" />
            </Form-item>
            <Form-item label="输出延时" prop="exportdelaytime">
              <Input v-model="exportForm.exportdelaytime" />
            </Form-item>
          </Form>
          <div slot="footer">
            <Button type="ghost" @click="cancel('exportForm')">取消</Button>
            <Button type="primary" @click="exportConfirm('exportForm')">确定</Button>
          </div>
        </Modal>
      </div>
      <!--智能、监控点详情 模态框-->
      <div v-if="jkdMod">
        <Modal v-model="jkdMod" :title="jkdModTitle" width="570" :mask-closable="false">
          <Form inline :model="jkdForm" :label-width="85" ref="jkdForm" label-position="left" style="padding: 0 10px;">
            <Form-item label="所属设备" style="display:block">{{ jkdForm.orgname }}</Form-item>
            <Form-item label="通道号">
              <Input v-model="jkdForm.chan" disabled/>
            </Form-item>
            <Form-item label="布撤防时间：">
              <Input v-model="jkdForm.alarmtemplatename" disabled/>
            </Form-item>
            <Form-item label="级别：">
              <Input v-model="jkdForm.level" disabled/>
            </Form-item>
            <Form-item label="最大延迟：">
              <Input v-model="jkdForm.maxdelaytime" disabled/>
            </Form-item>
            <Form-item label="报警分类：">
              <Input v-model="jkdForm.alarmtypename" disabled/>
            </Form-item>
            <Form-item label="最小间隔：">
              <Input v-model="jkdForm.minintervaltime" disabled/>
            </Form-item>
          </Form>
          <Row style="margin:5px 10px;">
            <Col span="10">
            <Checkbox v-model="jkdForm.mapflag" disabled>地图标识</Checkbox>
            </Col>
            <Col span="4">
            <Checkbox v-model="jkdForm.alarmflag" disabled>报警确认</Checkbox>
            </Col>
            <Col span="10">
            <Radio-group v-model="jkdForm.alarmauto">
              <Radio label="自动确认" disabled></Radio>
              <Input v-model="jkdForm.alarmintervaltime" style="margin:0;width:80px;" disabled/>
              <br>
              <Radio label="手工确认" disabled></Radio>
            </Radio-group>
            </Col>
          </Row>
          <!--监控点-->
          <div style="border:1px solid #aaa; margin: 0 10px;" v-if="smartOrJkd === 'jkd'">
            <CheckboxGroup v-model="jkdForm.type">
              <div class="rowStyle">
                <Checkbox label="alarmMoveSense" class="flexgrow" disabled>
                  <span>移动侦测</span>
                </Checkbox>
                <Checkbox label="brightnessAbnormal" class="flexgrow" disabled>
                  <span>亮度异常</span>
                </Checkbox>
                <Checkbox label="screenFreeze" class="flexgrow" disabled>
                  <span>画面冻结</span>
                </Checkbox>
              </div>
              <div class="rowStyle">
                <Checkbox label="videoMask" class="flexgrow" disabled>
                  <span>视频遮挡</span>
                </Checkbox>
                <Checkbox label="noise" class="flexgrow" disabled>
                  <span>噪声检测</span>
                </Checkbox>
                <Checkbox label="signalLoss" class="flexgrow" disabled>
                  <span>信号缺失</span>
                </Checkbox>
              </div>
              <div class="rowStyle">
                <Checkbox label="sceneSwitch" class="flexgrow" disabled>
                  <span>镜头位移</span>
                </Checkbox>
                <Checkbox label="colorCast" class="flexgrow" disabled>
                  <span>偏色检测</span>
                </Checkbox>
                <Checkbox label="definitionAbnormal" class="flexgrow" disabled>
                  <span>清晰度异常</span>
                </Checkbox>
              </div>
            </CheckboxGroup>
          </div>
          <!--智能报警-->
          <div style="border:1px solid #aaa;margin: 0 10px;" v-if="smartOrJkd === 'smart'">
            <CheckboxGroup v-model="jkdForm.type">
              <Row style="margin:20px 20px;">常规智能报警</Row>
              <div class="rowStyle">
                <Checkbox label="tripwire" class="flexgrow" disabled>
                  <span>绊线入侵</span>
                </Checkbox>
                <Checkbox label="perimeter" class="flexgrow" disabled>
                  <span>周界保护</span>
                </Checkbox>
                <Checkbox label="missingObject" class="flexgrow" disabled>
                  <span>物品丢失</span>
                </Checkbox>
              </div>
              <div class="rowStyle">
                <Checkbox label="leftObject" class="flexgrow" disabled>
                  <span>物品遗留</span>
                </Checkbox>
                <Checkbox label="loitering" class="flexgrow" disabled>
                  <span>非法停留</span>
                </Checkbox>
                <Checkbox label="retrogradeDetection" class="flexgrow" disabled>
                  <span>逆行检测</span>
                </Checkbox>
              </div>
              <div class="rowStyle">
                <Checkbox label="lingerDetection" class="flexgrow" disabled>
                  <span>徘徊检测</span>
                </Checkbox>
                <Checkbox label="doubleCordon" class="flexgrow" disabled>
                  <span>双警戒线</span>
                </Checkbox>
                <Checkbox label="areaInvade" class="flexgrow" disabled>
                  <span>区域入侵</span>
                </Checkbox>
              </div>
              <div class="rowStyle">
                <Checkbox label="fastMove" class="flexgrow" disabled>
                  <span>快速移动</span>
                </Checkbox>
                <Checkbox label="parkDetect" class="flexgrow" disabled>
                  <span>停车检测</span>
                </Checkbox>
                <Checkbox label="humanAssemble" class="flexgrow" disabled>
                  <span>人员聚众</span>
                </Checkbox>
              </div>
              <div class="rowStyle">
                <Checkbox label="objectMove" class="flexgrow" disabled>
                  <span>物品搬移</span>
                </Checkbox>
              </div>
              <Row style="margin:20px 20px;">人脸分析</Row>
              <div class="rowStyle">
                <Checkbox label="dispatchHuman" class="flexgrow" disabled>
                  <span>布控人员</span>
                </Checkbox>
              </div>
              <Row style="margin:20px 20px;">车辆分析</Row>
              <div class="rowStyle">
                <Checkbox label="dispatchVehicle" class="flexgrow" disabled>
                  <span>布控车辆</span>
                </Checkbox>
              </div>
            </CheckboxGroup>
          </div>
          <div slot="footer">
            <Button type="primary" @click="jkdMessageSure">关闭</Button>
          </div>
        </Modal>
      </div>
    </div>
  </div>
</template>
<script>
import timeTemplate from './timeTemplate'
import sortShow from './sortShow'
import paramsSetting from './paramsSetting'
import VTree from '../../../components/tree/VTree.vue'
import mixinLink from './allJs/mixinLink'
import mixinAddEdit from './allJs/mixinAddEdit'
import mixinJKD from './allJs/mixinJKD'
import './alarmStyle.css'
import { mapState, mapActions, mapGetters } from 'vuex'
export default {
  name: 'orgConfig',
  components: {
    VTree,
    timeTemplate,
    sortShow,
    paramsSetting
  },
  mixins: [mixinLink, mixinAddEdit, mixinJKD],
  data() {
    return {
      rootOrgId: '',
      show: false,
      configList: [
        {
          name: '时间模板',
          path: '/settings/alarm/time',
          isActive: false,
          roleTabs: 'timeModel',
          vIf: 'BS-ALARM-TIMEPLATE-PAGE'
        },
        {
          name: '参数设置',
          path: '/settings/alarm/params',
          isActive: false,
          roleTabs: 'parmModel',
          vIf: 'BS-ALARM-SETTING-PAGE'
        },
        {
          name: '报警分类',
          path: '/settings/alarm/sort',
          isActive: false,
          roleTabs: 'alarmClassify',
          vIf: 'BS-ALARM-SORT-PAGE'
        }
      ],
      orgOptions: {
        showCheckbox: true,
        showInput: false
      },
      options: {
        showCheckbox: true,
        showInput: true
      },
      treeData: [],
      tableHeight: 420,
      // 分页
      outPageTotal: 0,
      outpageLimit: this.$PageInfo.limit,
      outPageCur: 1,
      inPageTotal: 0,
      inPageCur: 1,
      inpageLimit: this.$PageInfo.limit,
      smartPageTotal: 0,
      smartpageLimit: this.$PageInfo.limit,
      smartPageCur: 1,
      jdkPageTotal: 0,
      jkdpageLimit: this.$PageInfo.limit,
      jkdPageCur: 1
    }
  },
  computed: {
    ...mapState({
      orgTreeData: ({ orgConfig }) => orgConfig.orgTreeData,
      deviceTreeData: ({ orgConfig }) => orgConfig.deviceTreeData,
      linkOutTreeData: ({ orgConfig }) => orgConfig.linkOutTreeData,
      orgIdList: ({ orgConfig }) => orgConfig.orgIdList,
      importOrigData: ({ orgConfig }) => orgConfig.alarmInData,
      exportOrigData: ({ orgConfig }) => orgConfig.alarmOutData,
      smartOrigData: ({ orgConfig }) => orgConfig.alarmSmartData,
      JkdOrigData: ({ orgConfig }) => orgConfig.alarmJkdData,
      levelData: ({ paramsSetting }) => paramsSetting.levelData,
      addTreeData: ({ orgConfig }) => orgConfig.addTreeData,
      sortData: ({ sortShow }) => sortShow.sortData,
      // 报警输入分页
      inPageNum: ({ orgConfig }) => orgConfig.inPageNum,
      outPageNum: ({ orgConfig }) => orgConfig.outPageNum,
      smartPageNum: ({ orgConfig }) => orgConfig.smartPageNum,
      jkdPageNum: ({ orgConfig }) => orgConfig.jkdPageNum,
      // 获取 报警输入 联动
      affirms: ({ orgConfig }) => orgConfig.affirms,
      jdkMessageData: ({ orgConfig }) => orgConfig.jdkMessageData,
      smartMessageData: ({ orgConfig }) => orgConfig.smartMessageData,
      initLinkData: ({ orgConfig }) => orgConfig.initLinkData
    }),
    ...mapGetters(['enabledSort', 'enabledLevel', 'enabledTemp', 'tipWarningConfig', 'tipErrorConfig'])
  },
  mounted() {
    this.tableHeight = this.$refs['tableBox1'].offsetHeight - 35
  },
  methods: {
    ...mapActions([
      'getAlarmOrgTree',
      'setOrgIdList',
      'getDeviceTree',
      'getAlarmInData',
      'getAlarmOutData',
      'getSmartData',
      'getJkdData',
      'addAlarmInData',
      'addAlarmOutData',
      'delAlarmInData',
      'delAlarmOutData',
      'editAlarmInData',
      'editMoreAlarmInData',
      'editAlarmOutData',
      'editMoreAlarmOutData',
      'getSortData',
      'getAlarmTemp',
      'getAlarmLevel',
      'getAddTree',
      'filterData',
      'delInData',
      'delOutData',
      'getAlarmLink',
      'setAlarmLink',
      'getJkdMessageData',
      'getSmartMessageData',
      'recordLog'
    ]),
    expand() {
      this.$refs.orgScroll.update()
    },
    inTreeExpand() {
      this.$refs.inTreeScroll.update()
    },
    videoTreeExpand() {
      this.$refs.videoTreeScroll.update()
    },
    exportTreeExpand() {
      this.$refs.linkOutScroll.update()
    },
    // 获取机构树数据
    getTreeData() {
      this.getAlarmOrgTree()
        .then(() => {
          this.treeData = JSON.parse(JSON.stringify(this.orgTreeData))
          this.rootOrgId = this.treeData[0]._id
          this.activeOrgId = this.treeData[0]._id
          this.searchChildId(this.treeData[0])
        })
        .catch(err => {
          console.log('logout error:' + err)
          this.errorMsg('机构数据获取失败')
        })
    },
    orgClick() {
      const orgRouter = '/settings/alarm/org'
      for (let item of this.configList) {
        item.isActive = false
      }
      this.$router.replace(orgRouter)
      this.show = false
    },
    isNowPathActive(config) {
      this.show = true
      if (config.roleTabs === 'timeModel') {
        this.configList[0].isActive = true
        this.configList[1].isActive = false
        this.configList[2].isActive = false
        this.$router.replace(config.path)
      } else if (config.roleTabs === 'parmModel') {
        this.configList[0].isActive = false
        this.configList[1].isActive = true
        this.configList[2].isActive = false
        this.$router.replace(config.path)
      } else if (config.roleTabs === 'alarmClassify') {
        this.configList[0].isActive = false
        this.configList[1].isActive = false
        this.configList[2].isActive = true
        this.$router.replace(config.path)
      }
    },
    handleNode(node) {
      this.show = false
      this.activeOrgId = node._id
      this.orgClick()
      this.searchChildId(node)
      this.Inselect = []
      this.cantClick = true
      this.outcantClick = true
    },
    // 向下搜索子类ID
    searchChildId(data) {
      let childId = []
      childId.push(data._id)
      let searchChild = a => {
        if (a.children) {
          for (let i = 0; i < a.children.length; i++) {
            childId.push(a.children[i]._id)
            searchChild(a.children[i])
          }
        }
      }
      searchChild(data)
      this.setOrgIdList(childId)
      this.getAllAlarm()
    },
    getAllAlarm() {
      if (this.nowTabIndex === '0') {
        this.getImportData()
      } else if (this.nowTabIndex === '1') {
        // 获取报警输出数据
        this.getExportData()
      } else if (this.nowTabIndex === '2') {
        // 获取智能报警数据
        this.getIntelligentData()
      } else if (this.nowTabIndex === '3') {
        this.getMonitorData()
      }
    },
    // 获取报警输入数据
    getImportData() {
      let data = {
        id: this.activeOrgId,
        never: this.singleIn ? -1 : 0,
        name: this.inSearchName,
        page: this.inPageCur,
        limit: this.inpageLimit,
        channelTypes: '1,9'
      }
      this.getAlarmInData(data)
        .then(() => {
          this.importData = JSON.parse(JSON.stringify(this.importOrigData))
          this.inPageTotal = this.inPageNum
        })
        .catch(err => {
          console.log('logout error:' + err)
          this.errorMsg('报警输入获取失败')
        })
    },
    // 获取报警输出数据
    getExportData() {
      let data = {
        id: this.activeOrgId,
        never: this.singleIn ? -1 : 0,
        name: this.outSearchName,
        page: this.outPageCur,
        limit: this.outpageLimit,
        channelTypes: '2,10'
      }
      this.getAlarmOutData(data)
        .then(() => {
          this.exportData = JSON.parse(JSON.stringify(this.exportOrigData))
          this.outPageTotal = this.outPageNum
        })
        .catch(err => {
          console.log('logout error:' + err)
          this.errorMsg('报警输出获取失败')
        })
    },
    // 获取智能报警数据
    getIntelligentData() {
      let data = {
        id: this.activeOrgId,
        never: this.singleIn ? -1 : 0,
        name: this.smartSearchName,
        page: this.smartPageCur,
        limit: this.smartpageLimit
      }
      this.getSmartData(data)
        .then(() => {
          this.smartData = JSON.parse(JSON.stringify(this.smartOrigData))
          this.smartPageTotal = this.smartPageNum
        })
        .catch(err => {
          console.log('logout error:' + err)
          this.errorMsg('智能报警获取失败')
        })
    },
    // 获取监控点报警数据
    getMonitorData() {
      let data = {
        id: this.activeOrgId,
        never: this.singleIn ? -1 : 0,
        name: this.jkdSearchName,
        page: this.jkdPageCur,
        limit: this.jkdpageLimit
      }
      this.getJkdData(data)
        .then(() => {
          this.monitorData = JSON.parse(JSON.stringify(this.JkdOrigData))
          this.jdkPageTotal = this.jkdPageNum
        })
        .catch(err => {
          console.log('logout error:' + err)
          this.errorMsg('智能报警获取失败')
        })
    },
    // 报警输入\报警输出\智能报警-切换
    tabChange(data) {
      this.nowTabIndex = data
      this.singleIn = false
      this.inSearchName = ''
      this.outSearchName = ''
      this.smartSearchName = ''
      this.jkdSearchName = ''
      this.Inselect = []
      this.cantClick = true
      this.outcantClick = true
      this.getAllAlarm()
    },
    // 分页功能
    pageChange(page) {
      if (this.nowTabIndex === '0') {
        this.inPageCur = page
        this.getImportData()
      } else if (this.nowTabIndex === '1') {
        this.outPageCur = page
        this.getExportData()
      } else if (this.nowTabIndex === '2') {
        this.smartPageCur = page
        this.getIntelligentData()
      } else if (this.nowTabIndex === '3') {
        this.jkdPageCur = page
        this.getMonitorData()
      }
    },
    pageSizeChange(n) {
      if (this.nowTabIndex === '0') {
        this.inpageLimit = n
        this.getImportData()
      } else if (this.nowTabIndex === '1') {
        this.outpageLimit = n
        this.getExportData()
      } else if (this.nowTabIndex === '2') {
        this.smartpageLimit = n
        this.getIntelligentData()
      } else if (this.nowTabIndex === '3') {
        this.jkdpageLimit = n
        this.getMonitorData()
      }
    }
  },
  created() {
    // hasSure=this.$BShasPower('BS-USER-MANAGE-ROLE-ADD')
    this.show = false
    for (let i = 0; i < this.configList.length; i++) {
      if (this.$route.path === this.configList[i].path) {
        this.configList[i].isActive = false
      }
    }
    this.getTreeData()
    // 获取分类数据
    this.getSortData()
      .then()
      .catch(() => {
        this.errorMsg('分类数据获取失败')
      })
    // 获取时间模板
    this.getAlarmTemp()
      .then()
      .catch(() => {
        this.errorMsg('时间模板获取失败')
      })
    // 获取报警级别
    this.getAlarmLevel()
      .then()
      .catch(() => {
        this.errorMsg('报警级别获取失败')
      })
  }
}
</script>
<style scoped>
.orgConfig {
  width: 100%;
  position: relative;
  display: flex;
  padding: 16px 0;
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
  width: 100%;
}

.org-tree {
  width: 100%;
  height: 400px;
  overflow: auto;
}

.tree-org {
  height: 600px;
  max-width: 300px;
  overflow: auto;
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
  border-bottom: 1px solid rgba(58, 90, 139, 0.4);
  padding: 0 0 0 24px;
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

li > div {
  padding: 14px 40px;
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
  margin-bottom: 24px;
}

.confirm-time {
  width: 244px;
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

.infor-list .ivu-table {
  width: 100%;
}

.do-action {
  min-height: 300px;
  padding-left: 20px;
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

.page-style {
  width: 100%;
  height: 40px;
  border-top: none;
  overflow: hidden;
  padding: 5px 12px;
  background: #244575;
}

.table-relative {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.pane-style {
  padding: 0 10px;
}

.rowStyle {
  margin: 20px 0px 20px 40px;
  display: flex;
}

.rowStyle .flexgrow {
  flex: 1;
}
</style>
