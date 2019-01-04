
<script>
import { mapState, mapMutations, mapActions } from 'vuex'
import appAlarm from '../../assets/map/app/appAlarm'
import appPatrolIpc from '../../assets/map/app/appPatrolIpc'
import appMoveSingle from '../../assets/map/app/appMoveSingle'
export default {
  computed: {
    ...mapState({
      oneAllMapPartrolList: ({ patrolData }) => patrolData.oneAllMapPartrolList, // 单个地图的所有巡更点位
      appPatrolLineList: ({ patrolData }) => patrolData.appPatrolLineList,
      mobilePatrolList: ({ mobilePatrol }) => mobilePatrol.mobilePatrolList, // 当前巡更人员
      activeMap: ({ mapGisData }) => mapGisData.activeMap,
      appMoveSingleList: ({ mobilePatrol }) => mobilePatrol.appMoveSingleList,
      currentMapExtent: ({ mapGisData }) => mapGisData.currentMapExtent,
      watchMoveSinglePosition: ({ patrol }) => patrol.watchMoveSinglePosition,
      appCurrentAlarmingList: ({ mapAlarmData }) => mapAlarmData.appCurrentAlarmingList
    })
  },
  watch: {
    oneAllMapPartrolList(patrollist) {
      var features = JSON.parse(JSON.stringify(patrollist))
      var patrols = appPatrolIpc.addStrogePatrolIpc(this.appPatrolList, features, this.isAppOuter)
      // 解决切换地图时，巡更图层仍然存在正在报警的巡更点位的问题
      if (this.appCurrentAlarmingList.length > 0) {
        patrols = appAlarm.controlAlarmingShowOrHide(patrols, this.appCurrentAlarmingList, false)
      }
      this.$store.commit('SET_APPPATROL_LIST', patrols)
    },
    // 巡更点为数组
    appPatrolList(patrollist) {
      this.patrolFeatures = JSON.parse(JSON.stringify(patrollist))
    },
    // 巡更连线数组
    appPatrolLineList(patrollinelist) {
      this.patrollineFeatures = JSON.parse(JSON.stringify(patrollinelist))
    },
    mobilePatrolList(moveSinglelist) {
      var array = JSON.parse(JSON.stringify(moveSinglelist))
      var singlelist = appMoveSingle.addMoveSingleIpc(this.appMoveSingleList, array, this.currentMapExtent)
      this.$store.commit('SET_APPMOVESINGLE_LIST', singlelist)
    },
    appMoveSingleList(val) {
      this.singleAppFeatures = JSON.parse(JSON.stringify(val))
    },
    // 移动单兵的位置信息推送
    watchMoveSinglePosition(val) {
      var singlelist = appMoveSingle.changeSinglePositionById(this.appMoveSingleList, val)
      this.$store.commit('SET_APPMOVESINGLE_LIST', singlelist)
    }
  },
  methods: {
    ...mapActions(['getOneSingle', 'getMobilePatrolTask']),
    ...mapMutations(['SET_APPMOVESINGLE_LIST']),
    // 添加巡更任务
    addPatrolPath(id) {
      this.getMobilePatrolTask(id).then(res => {
        var patrollines = appPatrolIpc.connectPatrolIpc(this.appPatrolLineList, res)
        this.$store.commit('SET_APPPATROLLINE_LIST', patrollines)
      }).catch(err => {
        console.log(err)
      })
    }
  },
  mounted() {
  }
}
</script>
