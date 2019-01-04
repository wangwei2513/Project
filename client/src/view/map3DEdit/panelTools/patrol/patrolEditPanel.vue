<!-- 巡更点位编辑面板 -->
<template>
  <div class="panel">
    <div class="panel_top">
      <span class="top_title">巡更点位</span>
      <div class="btn_group">
        <span title="删除" @click="deletePatrolPoint()" class="top_button iconfont icon-delete"></span>
      </div>
    </div>
    <div class="panel_content">
      <ul v-show="is3DMapOuter">
        <li @click="changTab('resource')" :class="{'active':selectedTab==='resource'}">资源</li>
        <li @click="changTab( 'model')" :class="{'active':selectedTab==='model'}">模型</li>
      </ul>
      <div v-show="is3DMapOuter && selectedTab==='model'" class="subPanel">
        <Carousel v-if="selectedTab==='model' && modelList.length > 0" v-model="selectedModelIndex" :height="210" :dots="null" arrow="always" loop @on-change="changeModelURI">
          <CarouselItem v-for="(item, index) in modelList" :key="index">
              <div class="carouselItem"><img :src="item.picture.path"></div>
          </CarouselItem>
        </Carousel>
        <div class="modelEdit">
          <p>模型编辑<Button size="small" style="float: right;" title="点击标注点位位置" @click="active3DDraw()">位置</Button></p>
          <Row type="flex" justify="center" align="middle">
            <Col span="6">大小</Col>
            <Col span="18"><Slider v-model="pointInfo.scale" :title="pointInfo.scale" :step="0.01" :min="0" :max="10" show-input @on-change="changeModelSacle" @on-input="changeModelSacle"></Slider></Col>
          </Row>
          <Row type="flex" justify="center" align="middle">
            <Col span="6">高度</Col>
            <Col span="18"><Slider v-model="pointInfo.height" :title="pointInfo.height" :step="0.1" :min="0" :max="50" show-input @on-change="changeModelHeight" @on-input="changeModelHeight"></Slider></Col>
          </Row>
          <Row type="flex" justify="center" align="middle">
            <Col span="6">X偏移</Col>
            <Col span="18"><Slider v-model="xDelta" :step="0.1" :min="-15" :max="15" show-input @on-change="changeModelMoveXDelta"></Slider></Col>
          </Row>
          <Row type="flex" justify="center" align="middle">
            <Col span="6">Y偏移</Col>
            <Col span="18"><Slider v-model="yDelta" :step="0.1" :min="-15" :max="15" show-input @on-change="changeModelMoveYDelta"></Slider></Col>
          </Row>
          <Row type="flex" justify="center" align="middle">
            <Col span="6">朝向角</Col>
            <Col span="18"><Slider v-model="pointInfo.heading" :title="pointInfo.heading" :step="1" :min="0" :max="360" show-input @on-change="changeModelHeadingPitchRoll" @on-input="changeModelHeadingPitchRoll"></Slider></Col>
          </Row>
          <Row type="flex" justify="center" align="middle">
            <Col span="6">俯仰角</Col>
            <Col span="18"><Slider v-model="pointInfo.pitch" :title="pointInfo.pitch" :step="1" :min="0" :max="360" show-input @on-change="changeModelHeadingPitchRoll" @on-input="changeModelHeadingPitchRoll"></Slider></Col>
          </Row>
          <Row type="flex" justify="center" align="middle">
            <Col span="6">滚动角</Col>
            <Col span="18"><Slider v-model="pointInfo.roll" :title="pointInfo.roll" :step="1" :min="0" :max="360" show-input @on-change="changeModelHeadingPitchRoll" @on-input="changeModelHeadingPitchRoll"></Slider></Col>
          </Row>
        </div>
      </div>
      <div v-show="!is3DMapOuter || selectedTab==='resource'" class="subPanel">
        <div class="videoForm">
          <p>基本信息</p>
          <Form ref="patrolData" :rules="validateRule" :model="patrolData" :label-width="75" label-position="left">
            <FormItem label="点位名称" prop="devName">
              <Input v-model="patrolData.devName" :title="patrolData.devName" :maxlength="16" placeholder="" style="width:175px;"/>
            </FormItem>
            <FormItem label="设备ID" prop="devId">
              <Input v-model="patrolData.devId" :title="patrolData.devId" placeholder="" style="width:175px;" readonly disabled/>
            </FormItem>
            <FormItem label="设备编码" prop="devCode">
              <Input v-model="patrolData.devCode" :title="patrolData.devCode" placeholder="" style="width:175px;" readonly disabled/>
            </FormItem>
            <FormItem label="经纬度" prop="geo">
              <Input v-model="geoFormat" :title="geoFormat" placeholder="" style="width:175px;" readonly disabled/>
            </FormItem>
            <FormItem label="负责人" prop="charger">
              <Input v-model="patrolData.charger" :title="patrolData.charger" :maxlength="16" placeholder="请输入负责人" style="width:175px;"/>
            </FormItem>
            <FormItem label="电话" prop="phone">
              <Input v-model="patrolData.phone" :title="patrolData.phone" :maxlength="18" placeholder="请输入联系电话" style="width:175px;"/>
            </FormItem>
          </Form>
        </div>
      </div>
    </div>
    <div class="panel_foot">
      <Button type="ghost" @click="cancelSave('patrolData')" style="margin-right: -3px" title="点击取消保存点位信息">取消</Button>
      <Button type="primary" @click="savePatrolPoint('patrolData')" style="margin-left: 16px" title="点击保存点位信息">保存</Button>
    </div>
  </div>
</template>
<script>
import patrolEditBase from './patrolEditBase'
import pointEdit from '../pointEdit'

export default {
  name: 'patrolEditPanel',
  mixins: [ pointEdit, patrolEditBase ]
}
</script>
<style scoped>
  /* 面板容器样式 */
  .panel {
    width: 300px;
    background: #1b3153;
    height: 85%;
    position: relative;
  }
  /* 面板顶部ring器样式 */
  .panel_top {
    height: 38px;
    width: 100%;
    line-height: 38px;
    background-color: #0f2343;
    font-size: 14px;
  }
  /* 面板顶部标题样式 */
  .panel_top .top_title {
    margin-left: 24px;
  }
  /* 面板顶部按钮组容器样式 */
  .panel_top .btn_group {
    float: right;
    padding-right: 8px;
  }
  /* 面板顶部按钮组按钮样式 */
  .panel_top .btn_group .top_button {
    margin: 0 2px;
  }
  /* 面板顶部按钮组按钮悬浮样式 */
  .panel_top .btn_group .top_button:hover {
    color: #20adff;
  }
  /* 面板内容的样式 */
  .panel_content {
    font-size: 12px;
    width: 100%;
    height: calc(100% - 80px);
  }
  /* 选项组合样式 */
  .panel_content > ul {
    width: 100%;
    height: 38px;
    font-size: 14px;
    text-align: center;
    display: flex;
    justify-content: center;
    align-items: start;
  }
  /* 选项样式 */
  .panel_content > ul li {
    width: 56px;
    float: left;
    margin: 0 5px;
    cursor: pointer;
    height: 30px;
    line-height: 30px;
    list-style: none;
  }
  /* 选项选中样式 */
  .panel_content > ul li.active {
    border-bottom: 1px solid #4996f9;
  }
  /* 子面板样式 */
  .subPanel {
    width: 100%;
    height: 90%;
    overflow-y: auto;
  }
  /* 覆盖iview走马灯项的样式 */
  .ivu-carousel-item {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  /* 走马灯项的样式 */
  .carouselItem {
    width: 190px;
    height: 190px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #20adff;
  }
  /* 走马灯项下图片的样式 */
  .carouselItem img {
    width: 180px;
    height: 180px;
  }
  /* 模型编辑容器样式 */
  .modelEdit {
    margin: 16px 24px;
    text-align: left;
  }
  /* 模型编辑标签样式 */
  .modelEdit > p {
    margin-bottom: 15px;
    font-size: 14px;
    text-align: left;
  }
  /* 视频表单容器样式 */
  .videoForm {
    padding: 0 24px;
  }
  /* 视频表单标签样式 */
  .videoForm > p {
    margin: 0 0 15px 0;
    font-size: 14px;
    text-align: left;
  }
  /* 面板尾部样式 */
  .panel_foot {
    bottom: 24px;
    position: absolute;
    width: 100%;
    height: 32px;
    line-height: 32px;
    text-align: center;
  }
  /* 面板尾部按钮的样式 */
  .panel_foot button {
    margin: 8px;
    height: 32px;
  }
</style>
