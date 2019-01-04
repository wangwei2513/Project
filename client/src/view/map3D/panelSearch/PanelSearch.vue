<template>
  <div class="panel-search">
    <div class="search">
      <input v-model="searchTree" @focus="isExpand = true" @input="activeTab = 'structure'" type="text" class="input" placeholder="请输入..." />
      <button class="btn" @click="isExpand = !isExpand">
        <Icon :type="isExpand ? 'arrow-up-b' : 'arrow-down-b'"></Icon>
      </button>
    </div>
    <div class="tab" :class="{'hidden': !isExpand}">
      <ul class="tab-list">
        <li :class="{'active': activeTab === 'structure'}" @click="activeTab = 'structure'">地图结构</li>
        <li :class="{'active': activeTab === 'point'}" @click="activeTab = 'point'">点位元素</li>
      </ul>
      <section class="content">
        <div v-show="activeTab === 'structure'" class="map-structure">
          <bs-scroll ref="mapTreeScroll" class="mapTree">
            <Tree-Search :treeData="mapOrgTree[0]||{}" ref="tree" :searchVal="searchTree"  @node-click='handleNode' isSearch @on-expand="$refs.mapTreeScroll.update()">
              <template slot-scope="{ node }">
                <span class="item" :title="node.name" :class="{iconIsOuter: (node.point3D || node.point3d)}">
                  <i class=" iconfont" :class="node.type ? iconList[node.type].icon:iconList.default.icon" :title="node.type ? iconList[node.type].title:iconList.default.title"></i>
                  {{node.name}}</span>
              </template>
            </Tree-Search>
          </bs-scroll>
        </div>
        <ul v-show="activeTab === 'point'" class="point-control">
          <li class="line">
            <div class="item title-icon">
              <i class="iconfont icon-baojing2"></i>
            </div>
            <div class="item">
              <i-switch :value="isRecAlarm" @on-change="switchAlarm"></i-switch>
            </div>
            <div class="item title-icon">
              <i class="iconfont icon-yingjizhihui"></i>
            </div>
            <div class="item">
              <i-switch :value="isEmergency" @on-change="switchEmergency"></i-switch>
            </div>
          </li>
          <li class="line">
            <div class="item title-icon">
              <i class="iconfont icon-video-gun1"></i>
            </div>
            <div class="item">
              <Checkbox :value="isCameraSpear" @on-change="cameraSpearSelect">枪机</Checkbox>
            </div>
            <div class="item">
              <Checkbox :value="isHalfBall" @on-change="halfBallSelect">半球</Checkbox>
            </div>
            <div class="item">
              <Checkbox :value="isFastBall" @on-change="fastBallSelect">快球</Checkbox>
            </div>
          </li>
          <li class="line">
            <div class="item title-icon">
            </div>
            <div class="item">
              <Checkbox :value="isFullShot" @on-change="fullShotSelect">全景</Checkbox>
            </div>
            <div class="item">
              <Checkbox :value="isInfrared" @on-change="infraredSelect">红外枪机</Checkbox>
            </div>
          </li>
          <li class="line">
            <div class="item title-icon">
              <i class="iconfont icon-baojing2"></i>
            </div>
            <div class="item">
              <Checkbox :value="isOnlyAlarm" @on-change="changeAlarmPointShowMode">仅报警时显示</Checkbox>
            </div>
          </li>
          <li class="line">
            <div class="item title-icon">
            </div>
            <div class="item">
              <Checkbox :value="isAlarm" :disabled="isOnlyAlarm" @on-change="commonAlarmSelect">普通报警</Checkbox>
            </div>
            <div class="item">
              <Checkbox :value="isFire" :disabled="isOnlyAlarm" @on-change="fireAlarmSelect">消防报警</Checkbox>
            </div>
          </li>
          <li class="line">
            <div class="item title-icon">
            </div>
            <div class="item">
              <Checkbox :value="isAlarmBox" :disabled="isOnlyAlarm" @on-change="alarmBoxSelect">报警箱</Checkbox>
            </div>
            <div class="item">
              <Checkbox :value="isAlarmPillar" :disabled="isOnlyAlarm" @on-change="alarmColumnSelect">报警柱</Checkbox>
            </div>
          </li>
          <li class="line">
            <div class="item title-icon">
              <i class="iconfont icon-danbinbaojing"></i>
            </div>
            <div class="item">
              <Checkbox :value="isKeepWatch" @on-change="patrolSelect">巡更点位</Checkbox>
            </div>
          </li>
          <li class="line" v-if="is3DMapOuter">
            <div class="item title-icon">
              <i class="iconfont icon-yidongdanbing"></i>
            </div>
            <div class="item">
              <Checkbox :value="isSinglePawn" @on-change="singleSelect">移动单兵</Checkbox>
            </div>
          </li>
          <li class="line" v-if="is3DMapOuter">
            <div class="item title-icon">
              <i class="iconfont icon-biaoqian"></i>
            </div>
            <div class="item">
              <Checkbox :value="isShowName" @on-change="labelSelect">名称标签</Checkbox>
            </div>
          </li>
          <li class="line" v-if="!is3DMapOuter">
            <div class="item title-icon">
              <i class="iconfont icon-grid"></i>
            </div>
            <div class="item">
              <Checkbox :value="isShowGrid" @on-change="gridSelect">网格</Checkbox>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
<script>
import appPatrol from 'assets/3DMap/appPatrolIpc.js'
import appResource from 'assets/3DMap/appResource.js'
import { mapState, mapGetters, mapActions } from 'vuex'
import utils from 'assets/3DMap/utils/index.js'
import gridUtil from 'assets/3DMap/gridUtil.js'
import mapUtil from 'assets/3DMap/mapUtil.js'
export default {
  data() {
    return {
      isExpand: false,
      activeTab: 'structure',
      // tree data
      searchTree: '',
      treeOptions: {
        showSearch: false,
        showOpenPreview: false,
        showOpenAllPreview: false,
        showCollection: false,
        showPoint: true
      },
      mapOrgTree: [],
      keyTypes: {},
      iconList: {
        grid: {icon: 'icon-grid', title: '网格'},
        building: {icon: 'icon-loufangdianwei', title: '楼宇'},
        storey: {icon: 'icon-tuceng', title: '楼层'},
        patrol: {icon: 'icon-dianzixungeng', title: '巡更点位'},
        default: {icon: 'icon-organise', title: '机构'}
      }
    }
  },
  computed: {
    ...mapGetters('map3DApplyIX', [
      'isEmergency', // 是否开启应急预案开关
      'isRecAlarm', // 是否接收报警
      'isCameraSpear', // 点位-枪机
      'isHalfBall', // 点位-半球
      'isFastBall', // 点位-快球
      'isFullShot', // 点位-全景
      'isInfrared', // 点位-红外枪机
      'isOnlyAlarm', // 报警点位-仅报警时显示
      'isAlarm', // 点位-普通报警
      'isFire', // 点位-消防报警
      'isAlarmBox', // 点位-报警箱
      'isAlarmPillar', // 点位-报警柱
      'isKeepWatch', // 点位-巡更
      'isSinglePawn', // 点位-单兵
      'isShowName', // 是否显示名称标签
      'isShowGrid',
      'videoCheckedList' // 是否显示网格
    ]),
    ...mapState({
      ready: ({ tdIndex }) => tdIndex.ready, // 三维地图是否加载完成的标识----
      map3DConfig: ({ tdIndex }) => tdIndex.map3DConfig, // 地图配置-----
      mapMode: ({ tdIndex }) => tdIndex.mapMode, // 地图模式----
      is3DMapOuter: ({ tdIndex }) => tdIndex.is3DMapOuter,
      floorData: ({ tdFloor }) => tdFloor.floorData,
      alarmingFeatureList: ({ tdPoint }) => tdPoint.alarmingFeatureList // 报警闪烁点位
    })
  },
  methods: {
    ...mapActions(['getAppMapOrgTree', 'getOneBuildById', 'getOneFloorPatrols', 'getAllPatrolPoint', 'setPatrolList',
      'setVideoList', 'setFirAlarmList',
      'setAlarmColumnList', 'setAppResourceTypeControl', 'setAlarmBoxList',
      'setAlarmList', 'getGridList', 'setGridList', 'getAllBuild',
      'getOneFloor', 'setIsOuter', 'getResourcePointsByChannelType']),
    ...mapActions('map3DApplyIX', ['switchAlarm', 'switchEmergency', 'changeShow']),
    // 单兵
    singleSelect(flag) {
      this.changeShow({type: 'isSinglePawn', val: flag})
    },
    // 标签
    labelSelect(flag) {
      this.changeShow({type: 'isShowName', val: flag})
      if (this.ready) {
        if (flag) { // 显示
          this.getAllBuild().then(res => {
            console.log('获取到所有楼宇列表', res)
            res.forEach(item => {
              if (item.center && item.height) {
                let coValues = item.center.split(',').map(item => Number(item)) // 二维经纬度坐标数组
                let position = { lon: coValues[0], lat: coValues[1], height: item.height }
                let labelEntity = this.$context.viewer.entities.getById(item.name)
                if (!labelEntity) {
                  labelEntity = utils.addLabel(this.$context, position, item.name)
                  if (labelEntity) {
                    mapUtil.entitys.labels.push(labelEntity)
                  }
                }
              }
            })
          })
        } else { // 隐藏
          let labels = mapUtil.entitys.labels
          for (const label of labels) { // 遍历楼宇名称标签
            this.$context.viewer.entities.remove(label) // 实体集合中移除名称标签
          }
        }
      }
    },
    // 网格----
    gridSelect(flag) {
      this.changeShow({type: 'isShowGrid', val: flag})
      if (flag) {
        this.getGridList({id: this.floorData._id}).then(res => {
          let features = gridUtil.convertGridDatasToFeatures(res)
          this.setGridList(features)
        })
      } else {
        this.setGridList([])
      }
    },
    // 改变报警点位的显示模式
    changeAlarmPointShowMode(flag) {
      this.changeShow({type: 'isOnlyAlarm', val: flag})
      if (flag) {
        this.commonAlarmSelect(false) // 不显示普通报警
        this.fireAlarmSelect(false) // 不显示消防报警
        this.alarmBoxSelect(false) // 不显示报警箱报警
        this.alarmColumnSelect(false) // 不显示报警柱报警
      }
    },
    // 枪机选择
    cameraSpearSelect(flag) {
      this.changeShow({type: 'isCameraSpear', val: flag})
      this.devSelect()
    },
    // 半球选择--
    halfBallSelect(flag) {
      this.changeShow({type: 'isHalfBall', val: flag})
      this.devSelect()
    },
    // 快球选择
    fastBallSelect(flag) {
      this.changeShow({type: 'isFastBall', val: flag})
      this.devSelect()
    },
    // 全景选择
    fullShotSelect(flag) {
      this.changeShow({type: 'isFullShot', val: flag})
      this.devSelect()
    },
    // 红外--
    infraredSelect(flag) {
      this.changeShow({type: 'isInfrared', val: flag})
      this.devSelect()
    },
    // 单击楼宇楼层树时地图的切换以及楼宇的定位---
    handleNode(node) {
      if (node.type === 'building') {
        if (!this.is3DMapOuter) {
          this.setIsOuter(true)
          // 切换地图
        }
        // 获取楼宇信息
        this.getOneBuildById(node.code)
          .then(res => {
            // 判断三维地图是否加载完毕
            if (this.ready) {
              let { dataSet, dataSource, layer } = this.map3DConfig
              let layerName = layer || (dataSet + '@' + dataSource)
              let scenelayer = this.$context.viewer.scene.layers.find(layerName)
              if (scenelayer) {
                scenelayer.setSelection(res.code)
              }
              let coValues = res.center.split(',').map(item => Number(item))
              let position = { lon: coValues[0], lat: coValues[1], height: res.height }
              let labelEntity = this.$context.viewer.entities.getById(res.name)
              if (!labelEntity) {
                labelEntity = labelEntity = utils.addLabel(this.$context, position, res.name)
                mapUtil.entitys.labels.push(labelEntity)
              }
              this.$context.viewer.zoomTo(labelEntity)
            }
          }).catch(err => {
            this.errorMsg('参数获取失败')
            console.log(err)
          })
      } else if (node.type === 'storey') {
        if (this.is3DMapOuter) {
          this.setIsOuter(false)
        }
        this.getOneFloor(node._id).then(res => {
        })
      }
    },
    async displayFloorPointByType(param, flag, key) {
      let { channelTypes } = param
      if (flag) {
        let result = await this.getResourcePointsByChannelType(param)
        if (key === this.keyTypes.alarmBox) {
          result = mapUtil.getAlarmBoxOrColumnByType(result, mapUtil.CHANNELTYPE.alarmBoxResource)
        }
        if (key === this.keyTypes.alarmColumn) {
          result = mapUtil.getAlarmBoxOrColumnByType(result, mapUtil.CHANNELTYPE.alarmColumnResource)
        }
        let pointArr = [...result] // 深拷贝数组
        for (const alarmingFeature of this.alarmingFeatureList) { // 遍历报警要素数组
          for (let index = 0; index < pointArr.length; index++) {
            const point = pointArr[index]
            if (alarmingFeature.attributes.id === point._id) {
              pointArr.splice(index, 1) // 移除巡更点位数据
            }
          }
        }
        let features = appResource.convertPointDataToFeatures(pointArr, this.mapMode)
        if (channelTypes === mapUtil.pointTypes.commonAlarm) {
          this.setAlarmList(features)
        }
        if (channelTypes === mapUtil.pointTypes.fireAlarm) {
          this.setFirAlarmList(features)
        }
        if (channelTypes === mapUtil.pointTypes.vedio) {
          if (key === this.keyTypes.alarmBox) {
            this.setAlarmBoxList(features)
          }
          if (key === this.keyTypes.alarmColumn) {
            this.setAlarmColumnList(features)
          }
        }
      } else {
        if (channelTypes === mapUtil.pointTypes.commonAlarm) {
          this.setAlarmList([])
        }
        if (channelTypes === mapUtil.pointTypes.fireAlarm) {
          this.setFirAlarmList([])
        }
        if (channelTypes === mapUtil.pointTypes.vedio) {
          if (key === this.keyTypes.alarmBox) {
            this.setAlarmBoxList([])
          }
          if (key === this.keyTypes.alarmColumn) {
            this.setAlarmColumnList([])
          }
        }
      }
    },
    displayPointByType(param, flag, key) {
      /* 控制二维视频点位的显示隐藏 胡红勋添加 */
      if (flag) {
        this.getResourcePointsByChannelType(param).then(
          res => {
            if (key === this.keyTypes.alarmBox) {
              res = mapUtil.getAlarmBoxOrColumnByType(res, mapUtil.CHANNELTYPE.alarmBoxResource)
            }
            if (key === this.keyTypes.alarmColumn) {
              res = mapUtil.getAlarmBoxOrColumnByType(res, mapUtil.CHANNELTYPE.alarmColumnResource)
            }
            utils.addEntitysToMap(key, res, this.mapMode, this.$context, false)
          })
      } else {
        mapUtil.entitys[key].forEach(entity => {
          this.$context.viewer.entities.remove(entity)
        })
        mapUtil.entitys[key] = []
      }
    },
    // 设备选择
    devSelect() {
      let param = { tab: mapUtil.TABTYPE.video, channelTypes: mapUtil.pointTypes.vedio }
      if (this.is3DMapOuter) {
        /* 控制三维视频点位的显示隐藏 */
        if (!this.ready) {
          return
        }
        this.getResourcePointsByChannelType(param).then(
          res => {
            mapUtil.entitys[this.keyTypes.vedio].forEach(entity => {
              this.$context.viewer.entities.remove(entity)
            })
            mapUtil.entitys[this.keyTypes.vedio] = []
            let result = appResource.fitlerArrByTypes(res, this.videoCheckedList)
            utils.addEntitysToMap(this.keyTypes.vedio, result, this.mapMode, this.$context, false)
          })
        // 结束-------
      } else {
        param.sid = this.floorData._id
        this.getResourcePointsByChannelType(param).then(res => {
          let features = appResource.convertPointDataToFeatures(res, this.mapMode)
          features = appResource.getVedioPointFeaturesByTypes(features, this.videoCheckedList)
          this.setVideoList(features)
        })
      }
    },
    // 巡更点位
    patrolSelect(flag) {
      this.changeShow({type: 'isKeepWatch', val: flag})
      if (this.is3DMapOuter) {
        /* 控制三维巡更点位的显示隐藏 */
        if (flag) {
          this.getAllPatrolPoint()
            .then(res => {
              utils.addEntitysToMap(this.keyTypes.patrol, res, this.mapMode, this.$context, false)
            })
            .catch(err => {
              console.log(err)
            })
        } else {
          mapUtil.entitys.patrol.forEach(entity => {
            this.$context.viewer.entities.remove(entity)
          })
          mapUtil.entitys.patrol = []
        }
      } else {
        /* 控制二维巡更点位的显示隐藏 */
        if (flag) {
          this.getOneFloorPatrols(this.floorData._id).then(patrolDatas => {
            let patrolArr = [...patrolDatas] // 深拷贝数组
            for (const alarmingFeature of this.alarmingFeatureList) { // 遍历报警要素数组
              for (let index = 0; index < patrolArr.length; index++) {
                const patrol = patrolArr[index]
                if (alarmingFeature.attributes.id === patrol._id) {
                  patrolArr.splice(index, 1) // 移除巡更点位数据
                }
              }
            }
            let patrols = appPatrol.convertPatrolPointToFeature(patrolArr, this.mapMode)
            this.setPatrolList(patrols)
          })
        } else {
          this.setPatrolList([])
        }
      }
    },
    // 消防报警
    fireAlarmSelect(flag) {
      this.changeShow({type: 'isFire', val: flag})
      let param = { channelTypes: mapUtil.pointTypes.fireAlarm }
      if (this.is3DMapOuter) {
        this.displayPointByType(param, flag, this.keyTypes.fireAlarm)
      } else {
        param.sid = this.floorData._id
        /* 控制二维视频点位的显示隐藏 */
        this.displayFloorPointByType(param, flag)
      }
    },
    // 普通报警
    commonAlarmSelect(flag) {
      this.changeShow({type: 'isAlarm', val: flag})
      let param = {channelTypes: mapUtil.pointTypes.commonAlarm}
      if (this.is3DMapOuter) {
        this.displayPointByType(param, flag, this.keyTypes.commonAlarm)
      } else {
        param.sid = this.floorData._id
        /* 控制二维视频点位的显示隐藏 */
        this.displayFloorPointByType(param, flag)
      }
    },
    // 报警箱-----
    alarmBoxSelect(flag) {
      this.changeShow({type: 'isAlarmBox', val: flag})
      let param = {tab: mapUtil.TABTYPE.alarmHelp, channelTypes: mapUtil.pointTypes.vedio}
      if (this.is3DMapOuter) {
        this.displayPointByType(param, flag, this.keyTypes.alarmBox)
      } else {
        param.sid = this.floorData._id
        /* 控制二维视频点位的显示隐藏 */
        this.displayFloorPointByType(param, flag, this.keyTypes.alarmBox)
      }
    },
    alarmColumnSelect(flag) {
      this.changeShow({type: 'isAlarmPillar', val: flag})
      let param = {tab: mapUtil.TABTYPE.alarmHelp, channelTypes: mapUtil.pointTypes.vedio}
      if (this.is3DMapOuter) {
        this.displayPointByType(param, flag, this.keyTypes.alarmColumn)
      } else {
        param.sid = this.floorData._id
        /* 控制二维视频点位的显示隐藏 */
        this.displayFloorPointByType(param, flag, this.keyTypes.alarmColumn)
      }
    }
  },
  created() {
    this.keyTypes = mapUtil.getKeyType()
    this.getAppMapOrgTree().then(res => {
      this.mapOrgTree = [res]
    })
  }
}
</script>
<style lang="less" scoped>
  .panel-search {
    width: 272px;
    position: absolute;
    top: 24px;
    left: 24px;
    z-index: 9;
    .search {
      width: 100%;
      height: 40px;
      line-height: 40px;
      display: flex;
      .input {
        flex: auto;
        border: none;
        background: rgba(15, 35, 67, .8);
        color: #fff;
        outline:none;
        font-size: 14px;
        text-indent: 14px;
      }
      .btn {
        flex: 0 0 40px;
        border: none;
        font-size: 20px;
        background: rgba(15, 35, 67, .8);
        color: #4699f9;
        outline:none;
        cursor: pointer;
      }
    }
    .tab {
      width: 100%;
      // transition: all .3s ease;
      display: flex;
      flex-direction: column;
      &.hidden {
        display: none;
      }
      .tab-list {
        display: flex;
        height: 32px;
        line-height: 32px;
        margin: 8px 0;
        flex-direction: row;
        background: rgba(15, 35, 67, .8);
        align-items: center;
        li {
          flex: auto;
          height: 26px;
          line-height: 26px;
          text-align: center;
          color: rbga(200, 200, 200, .8);
          cursor: pointer;
          &.active {
            color: #4699f9;
          }
          &:first-child {
            border-right: 1px solid rgba(58, 90, 139, 0.4);
          }
        }
      }
      .content {
        width: 100%;
        height: 500px;
        padding: 0 0 0 14px;
        color: #fff;
        background: rgba(15, 35, 67, .8);
        & > * {
          height: 100%;
        }
        .point-control {
          height: 100%;
          display: flex;
          flex-direction: column;
          .line {
            flex: 1 0 auto;
            display: flex;
            flex-direction: row;
            justify-content: center;
            .item {
              flex: 1;
              display: flex;
              align-items: center;
            }
            .title-icon {
              flex: 0 0 40px;
              .iconfont {
                font-size: 24px;
              }
            }
          }
        }
      }
    }
  }
.iconIsOuter i {
  color: #25790f;
}
</style>
