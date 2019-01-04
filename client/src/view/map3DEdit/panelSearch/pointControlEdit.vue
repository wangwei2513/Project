<template>
  <div class="mapPointHome">
    <div class="check-line">
      <p class="iconfont icon-video-gun"></p>
      <Checkbox v-model="pointControlCheckObj.videoCheck" @on-change="videoSelect">视频点位</Checkbox>
    </div>
    <div class="check-line">
      <p class="iconfont icon-alarm-admin"></p>
      <Checkbox v-model="pointControlCheckObj.alarmCheck" @on-change="alarmSelect">报警点位</Checkbox>
    </div>
    <div class="check-line">
      <p class="iconfont icon-baojingzhu"></p>
      <Checkbox v-model="pointControlCheckObj.alarmHelpCheck" @on-change="alarmHelpSelect">报警求助</Checkbox>
    </div>
    <div class="check-line">
      <p class="iconfont icon-dianzixuncha"></p>
      <Checkbox v-model="pointControlCheckObj.patrolCheck" @on-change="patrolSelect">巡更点位</Checkbox>
    </div>
    <div class="check-line" v-if="is3DMapOuter">
      <p class="iconfont icon-loufangdianwei"></p>
      <Checkbox v-model="pointControlCheckObj.tipCheck" @on-change="tipSelect">名称标签</Checkbox>
    </div>
    <div class="check-line" v-if="!is3DMapOuter">
      <p class="iconfont icon-grid"></p>
      <Checkbox v-model="pointControlCheckObj.girdCheck" @on-change="girdSelect">网格</Checkbox>
    </div>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import editResource from 'assets/3DMap/editResource.js'
import editPatrol from 'assets/3DMap/editPatrolIpc.js'
import mapUtil from 'assets/3DMap/mapUtil.js'
import utils from 'assets/3DMap/utils'
import gridUtil from 'assets/3DMap/gridUtil.js'
export default {
  data() {
    return {
      pointControlCheckObj: {
        videoCheck: true,
        alarmCheck: true,
        alarmHelpCheck: true,
        patrolCheck: true,
        tipCheck: true,
        girdCheck: true
      },
      deviceType: {
        alarmType: '1,9,11',
        vedioType: '0'
      },
      keyTypes: {}
    }
  },
  computed: {
    ...mapState({
      editResourcesTypeControl: ({ tdIndex }) => tdIndex.editResourcesTypeControl,
      is3DMapOuter: ({ tdIndex }) => tdIndex.is3DMapOuter, // 楼层平面图和三维地图切换的标识-----
      mapMode: ({ tdIndex }) => tdIndex.mapMode, // 地图模式区分2D和3D
      ready: ({ tdIndex }) => tdIndex.ready,
      floorData: ({ tdFloor }) => tdFloor.floorData
    })
  },
  watch: {
    pointControlCheckObj: {
      handler(newVal) {
        let {...newObj} = newVal // 深拷贝资源类型显示控制对象
        this.setEditResourceTypeControl(newObj)
        console.log(this.editResourcesTypeControl + 'this.editResourcesTypeControl')
      },
      deep: true
    }
  },
  methods: {
    ...mapActions(['setEditResourceTypeControl',
      'getResourcePointsByChannelType',
      'getAllPatrolPoint',
      'setPatrolList',
      'setVideoList',
      'setAlarmHelpList',
      'setAlarmList',
      'getOneFloorPatrols',
      'getGridList',
      'setGridList',
      'getAllBuild'
    ]),
    switch3DMapResourceShow(param, flag) {
      let { tab, channelTypes } = param
      let key = ''
      if (channelTypes === this.deviceType.vedioType) {
        if (tab === mapUtil.TABTYPE.video) {
          key = this.keyTypes.vedio
        }
        if (tab === mapUtil.TABTYPE.alarmHelp) {
          key = this.keyTypes.alarmHelp
        }
      }
      if (channelTypes === this.deviceType.alarmType) {
        key = this.keyTypes.alarm
      }
      if (flag) {
        this.getResourcePointsByChannelType(param).then(res => {
          console.log('查询到的三维地图上的点位数据:', res)
          utils.addEntitysToMap(key, res, this.mapMode, this.$context)
        })
      } else {
        mapUtil.entitys[key].forEach(entity => {
          this.$context.viewer.entities.remove(entity)
        })
        mapUtil.entitys[key] = []
      }
    },
    switch2DMapResourceShow(param, flag) {
      let { tab, channelTypes } = param
      if (flag) { // 显示
        this.getResourcePointsByChannelType(param).then(res => {
          console.log('查询到楼层内地图上的点位数据:', res)
          const features = editResource.convertPointDataToFeatures(res, this.mapMode)
          if (channelTypes === this.deviceType.vedioType) {
            if (tab === mapUtil.TABTYPE.video) { // 视频
              this.setVideoList(features)
            }
            if (tab === mapUtil.TABTYPE.alarmHelp) { // 报警求助
              this.setAlarmHelpList(features)
            }
          }
          if (channelTypes === this.deviceType.alarmType) {
            this.setAlarmList(features)
          }
        })
      } else { // 隐藏
        if (channelTypes === this.deviceType.vedioType) {
          if (tab === mapUtil.TABTYPE.video) {
            this.setVideoList([])
          }
          if (tab === mapUtil.TABTYPE.alarmHelp) {
            this.setAlarmHelpList([])
          }
        }
        if (channelTypes === this.deviceType.alarmType) { // 报警
          this.setAlarmList([])
        }
      }
    },
    videoSelect(flag) {
      let param = { tab: mapUtil.TABTYPE.video, channelTypes: this.deviceType.vedioType }
      if (this.is3DMapOuter) {
        this.switch3DMapResourceShow(param, flag)
      } else {
        param.sid = this.floorData._id
        /* 控制二维报警点位的显示隐藏 */
        this.switch2DMapResourceShow(param, flag)
      }
    },
    alarmSelect(flag) {
      console.log('报警点位显示的标识位：' + flag)
      let param = { channelTypes: this.deviceType.alarmType }
      if (this.is3DMapOuter) {
        this.switch3DMapResourceShow(param, flag)
      } else {
        param.sid = this.floorData._id
        /* 控制二维报警点位的显示隐藏 */
        this.switch2DMapResourceShow(param, flag)
      }
    },
    alarmHelpSelect(flag) {
      let param = { tab: mapUtil.TABTYPE.alarmHelp, channelTypes: this.deviceType.vedioType }
      if (this.is3DMapOuter) {
        this.switch3DMapResourceShow(param, flag)
      } else {
        param.sid = this.floorData._id
        /* 控制二维报警点位的显示隐藏 */
        this.switch2DMapResourceShow(param, flag)
      }
    },
    patrolSelect(flag) {
      if (this.is3DMapOuter) {
        /* 控制三维巡更点位的显示隐藏 */
        if (flag) {
          this.getAllPatrolPoint().then(res => {
            utils.addEntitysToMap(this.keyTypes.patrol, res, this.mapMode, this.$context)
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
            let patrols = editPatrol.convertPatrolPointsToFeatures(patrolDatas, this.mapMode)
            this.setPatrolList(patrols)
          }).catch(err => {
            console.log('加载楼层：', this.floorData._id, '巡更点失败：', err)
          })
        } else {
          this.setPatrolList([])
        }
      }
    },
    tipSelect(flag) {
      if (this.ready) {
        if (flag) { // 显示
          this.getAllBuild().then(res => {
            console.log('获取到所有楼宇列表', res)
            res.forEach(item => {
              if (item.center && item.height) {
                let coValues = item.center.split(',').map(item => Number(item)) // 二维经纬度坐标数组
                let position = { lon: coValues[0], lat: coValues[1], height: item.height }
                let labelEntity = utils.addLabel(this.$context, position, item.name)
                if (labelEntity) {
                  mapUtil.entitys.labels.push(labelEntity)
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
    girdSelect(flag) {
      if (flag) {
        this.getGridList({id: this.floorData._id}).then(res => {
          let features = gridUtil.convertGridDatasToFeatures(res)
          this.setGridList(features)
        })
      } else {
        this.setGridList([])
      }
    }
  },
  created() {
    this.keyTypes = mapUtil.getKeyType()
    this.pointControlCheckObj = this.$lodash.cloneDeep(this.editResourcesTypeControl)
    console.log(this.pointControlCheckObj + '：选中点位类型')
  },
  beforeDestroy() {

  }
}
</script>

<style scoped>
.mapPointHome {
  width: 100%;
  height: 100%;
  padding: 0 10px 10px 15px;
  display: flex;
  float: 1;
  flex-direction: column;
}
.check-line {
  display: flex;
  flex: 0 0 30px;
  line-height: 30px;
}
.iconCheckBox {
  width: 30px;
  height: 30px;
  text-align: center;
  line-height: 30px;
  display: inline-block;
  margin-right: 5px;
  font-size: 18px;
}
p {
  margin: 0 16px;
  width: 26px;
  text-align: center;
}
</style>
