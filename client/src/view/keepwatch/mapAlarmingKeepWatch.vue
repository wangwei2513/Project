
<script>
import { mapState, mapMutations, mapActions } from 'vuex'
import appAlarm from '../../assets/map/app/appAlarm'
import ALARMTYPE from '../../assets/map/app/alarmType'
import appPatrolIpc from '../../assets/map/app/appPatrolIpc.js'
import appMoveSingle from '../../assets/map/app/appMoveSingle'
import STATE from '../../assets/map/edit/state.js'
export default {
  data() {
    return {
      index: 1
    }
  },
  computed: {
    ...mapState({
      appAlarmList: ({ mapAlarmData }) => mapAlarmData.appAlarmList,
      appPatrolList: ({ patrolData }) => patrolData.appPatrolList,
      isAppOuter: ({ mapAreaData }) => mapAreaData.isAppOuter,
      activeMap: ({ mapGisData }) => mapGisData.activeMap, // 当前地图id
      currentMapExtent: ({ mapGisData }) => mapGisData.currentMapExtent,
      appAlarmingList: ({ mapAlarmData }) => mapAlarmData.appAlarmingList,
      watchReceiveAlarm: ({ patrol }) => patrol.watchReceiveAlarm, // 接收消防报警信息
      appCurrentAlarmingList: ({ mapAlarmData }) => mapAlarmData.appCurrentAlarmingList,
      appMoveSingleList: ({ mobilePatrol }) => mobilePatrol.appMoveSingleList
    })
  },
  watch: {
    // 正在报警的所有点位
    appCurrentAlarmingList(alarminglist) {
      if (this.isAppOuter) {
        this.aralmingAppFeatures = JSON.parse(JSON.stringify(alarminglist))
      }
    },
    // 接收消防报警信息
    watchReceiveAlarm(val) {
      var param = JSON.parse(JSON.stringify(val))
      if (val.type === 'patrolAlarm') {
        if (param.map2D.geo) {
          // 巡更报警
          var lonlat = param.map2D.geo.split(',')
          this.mapCenter = [parseFloat(lonlat[0]), parseFloat(lonlat[1])]
        }
      } else if (val.type === 'singleAlarm') {
        this.mapCenter = [param.point.loc, param.point.lat]
      } else {
        // 消防报警，普通报警
        var loc = param.point.loc.split(',')
        this.mapCenter = [parseFloat(loc[0]), parseFloat(loc[1])]
      }
      this.receiveFireAlarmData(param)
    }
  },
  methods: {
    ...mapActions(['getOneMapAllPatrolList', 'getMobilePatrol']),
    ...mapMutations([
      'SET_APPDETAIL_STATE',
      'SET_APPCOMMONALARM_LIST',
      'SET_APPALARM_LIST',
      'SET_MAPACTIVE_STATE',
      'SET_ISAPPOUTER_STATE',
      'SET_APPCURRENTALARMING_LIST',
      'SET_APPPATROL_LIST',
      'SET_APPFLOORALARMING_LIST'
    ]),
    // 接收socket推送的消防报警信息
    receiveFireAlarmData(param) {
      if (param.type === 'patrolAlarm') {
        // 巡更报警
        this.dealPatrolAlarm(param)
      } else {
        this.dealSingleAlarm(param)
      }
    },
    // 单兵报警
    dealSingleAlarm(param) {
      if (!param.point) {
        return
      }
      this.addSingleAlarmingFeature(param)
    },
    // 巡更报警
    dealPatrolAlarm(param) {
      if (!param.map2D.geo) {
        return
      }
      // 当楼层中的点位报警时，当前如果在地图上，则楼宇闪烁，
      // 如果在该点位的楼层中，则点位闪烁，如果不在该点位的楼层中，则跳到地图上
      if (this.activeMap !== param.map2D.mapId) {
        // 报警点位不在当前地图上时，跳转地图
        this.$store.commit('SET_MAPACTIVE_STATE', param.map2D.mapId)
      }
      if (!param.map2D.isouter) {
        if (this.isAppOuter) {
          this.patrolConverTwink(param)
        }
      } else {
        if (this.isAppOuter) {
          this.addPatrolAlarmingFeature(param)
        }
      }
    },
    // 判断当前地图/楼层的报警数组中是否包含当前推送过来的报警对象
    currentAlarmingsIsContainer(alarmObj, param) {
      var currentAlarmings = JSON.parse(JSON.stringify(this.appCurrentAlarmingList))
      var id = null
      if (!param.point) {
        id = param._id
      } else {
        id = param.point._id
      }
      var isCuurentContain = appAlarm.isContainerAlarmingFeature(currentAlarmings, id)
      if (!isCuurentContain) {
        // 不包含
        if (alarmObj.alarming) {
          currentAlarmings.push(alarmObj.alarming)
        }
        this.$store.commit('SET_APPCURRENTALARMING_LIST', currentAlarmings)
      }
    },
    // 巡更汇聚闪烁
    patrolConverTwink(param) {
      var alarmObj = appAlarm.addPatrolConverTwink(this.appPatrolList, this.appAlarmingList, param)
      this.$store.commit('SET_APPPATROL_LIST', alarmObj.patrolList) // 巡更点位
      this.$store.commit('SET_APPALARMING_LIST', alarmObj.alarminglist)
      this.currentAlarmingsIsContainer(alarmObj, param)
    },
    // 添加正在报警的巡更点位到地图上
    addPatrolAlarmingFeature(param) {
      var alarmObj = appAlarm.addPatrolAlarming(this.appPatrolList, this.appAlarmingList, param)
      this.$store.commit('SET_APPPATROL_LIST', alarmObj.patrolList) // 巡更点位
      this.$store.commit('SET_APPALARMING_LIST', alarmObj.alarminglist)
      this.currentAlarmingsIsContainer(alarmObj, param)
      return alarmObj
    },
    // 添加移动单兵的报警点位到地图上，只存在在地图上
    addSingleAlarmingFeature(param) {
      var singleObj = appAlarm.addSingleAlarming(this.appMoveSingleList, this.appAlarmingList, param)
      this.$store.commit('SET_APPMOVESINGLE_LIST', singleObj.singleList) // 单兵点位
      this.$store.commit('SET_APPALARMING_LIST', singleObj.alarminglist)
      this.currentAlarmingsIsContainer(singleObj, param)
      return singleObj
    },
    // 报警点位闪烁事件
    alarmTwinkEvt(event) {
      if (this.appAlarmingList.length > 0) {
        var alarmingList = JSON.parse(JSON.stringify(this.appAlarmingList))
        var currentAlarmings = null
        currentAlarmings = JSON.parse(JSON.stringify(this.appCurrentAlarmingList))
        this.index = this.index >= 120 ? 0 : this.index
        var num = this.index % 30
        if (num < 5) {
          alarmingList = appAlarm.controlAlarmingShowOrHide(alarmingList, currentAlarmings, false)
        } else {
          alarmingList = appAlarm.controlAlarmingShowOrHide(alarmingList, currentAlarmings, true)
        }
        this.$store.commit('SET_APPCURRENTALARMING_LIST', alarmingList)
        this.index++
        if (this.isAppOuter) {
          this.$refs.mapWatch.$refs.mapAppContainer[0].render()
        } else {
          this.$refs.mapWatch.$refs.mapFloorContainer.render()
        }
      }
    },
    // 处理巡更报警后，如果巡更点位勾选着，需要添加地图/楼层中的巡更点位
    cancelAlarmAddPatrolIpc(patrollist, res, id) {
      var patrolAll = appPatrolIpc.addStrogePatrolIpc(patrollist, res, true) // 楼层外
      var patrolCol = appPatrolIpc.deleteOrChangeStateById(patrollist, patrolAll, id, STATE.ARMIMG)
      patrollist = patrolCol.patrolList
      this.$store.commit('SET_APPPATROL_LIST', patrollist)
    },
    // 处理巡更报警
    processPatrolAlarmingInfo(alarming, id) {
      var patrollist = JSON.parse(JSON.stringify(this.appPatrolList))
      if (id) {
        // 巡更（地图包括楼层中的，楼层中以数组形式展示）
        this.getOneMapAllPatrolList({ mapid: this.activeMap })
          .then(res => {
            this.cancelAlarmAddPatrolIpc(patrollist, res, id)
          })
          .catch(err => {
            console.log(err)
          })
      }
    },
    // 处理单兵报警
    processSingleAlarmimngInfo(alarming, id) {
      var singlelist = JSON.parse(JSON.stringify(this.appMoveSingleList))
      if (id) {
        this.getMobilePatrol({ name: '', orgId: '' })
          .then(res => {
            var patrolAll = appMoveSingle.addMoveSingleIpc(singlelist, res, this.currentMapExtent)
            var patrolCol = appMoveSingle.deleteOrChangeStateById(singlelist, patrolAll, id, STATE.ARMIMG)
            singlelist = patrolCol.singleList
            this.$store.commit('SET_APPMOVESINGLE_LIST', singlelist)
          })
          .catch(err => {
            console.log(err)
          })
      }
    },
    // 处理报警信息
    processAlarmingInfo(id) {
      var alarminglist = JSON.parse(JSON.stringify(this.appAlarmingList))
      var currentAlarmings = JSON.parse(JSON.stringify(this.appCurrentAlarmingList))
      var alarming = appAlarm.getFeatureById(alarminglist, id)
      if (alarming) {
        var type = alarming.attributes.alarmType
        if (type === ALARMTYPE.PATROL) {
          this.processPatrolAlarmingInfo(alarming, id) // 处理巡更报警
        }
        if (type === ALARMTYPE.SINGLE) {
          this.processSingleAlarmimngInfo(alarming, id) // 处理单兵报警
        }
      }
      alarminglist = appAlarm.deleteAlarmById(alarminglist, id)
      currentAlarmings = appAlarm.deleteAlarmById(currentAlarmings, id)
      this.$store.commit('SET_APPALARMING_LIST', alarminglist)
      this.$store.commit('SET_APPCURRENTALARMING_LIST', currentAlarmings)
    }
  },
  beforeDestroy() {
    this.$store.commit('SET_APPCURRENTALARMING_LIST', [])
    this.$store.commit('SET_APPALARMINMAP_LIST', [])
  }
}
</script>
