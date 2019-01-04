import { mapActions } from 'vuex'
export default {
  computed: {
  },
  methods: {
    ...mapActions(['gbQueryRecordList', 'getPlatformID', 'setResource', 'concatResource']),
    /**
     * 国标设备异步查询
     */
    async gbRecordQuery(param) {
      try {
        const preRes = await this.gbQuerySingle({ ...param, startTime: param.startTime, endTime: param.endTime })
        // const nestRes = await this.gbQuerySingle({...param, startTime: param.time, endTime: param.endTime})
        if (!preRes.data || preRes.data.result === 'error') {
          return
        } else if (preRes.data.result !== 'error') {
          return preRes.data
        }
      } catch (error) {
        console.log(error)
        return ''
      }
    },
    /**
    * 单个录像查询
    */
    async gbQuerySingle(param) {
      const serverId = await this.getPlatformID(param.shareServer)
      let queryParam = {
        recordType: param.eventType.length > 1 ? 'event' : param.eventType[0],
        gbPlaDevIp: serverId.ip, // 设备ip,
        gbPlaDevPort: serverId.port, // 设备端口,
        parentId: serverId.serverId, // 国标平台id,
        childId: param.childId, // 国标设备id,
        streamType: 'main',
        channel: param.channel,
        startTime: param.startTime,
        endTime: param.endTime
      }
      return this.gbQueryRecordList(queryParam)
    },
    /**
     * 下联设备播放
     */
    async gbOpen(param, { startTime, endTime }, index) {
      param = param.queryParam
      const serverId = await this.getPlatformID(param.shareServer)
      const openParam = {
        gbPlaDevIp: serverId.ip,
        gbPlaDevPort: serverId.port,
        parentId: serverId.serverId,
        childId: param.childId,
        channel: param.channel,
        startTime,
        endTime,
        streamType: 'main'
      }
      try {
        const state = await this.plugins[index].gbOpen(openParam)
        if (state === 0) {
          if (!this.isSync) {
            this.avtiveChange(index)
            this.changeTimeline()
          }
          return true
        } else {
          this.errorMsg('播放失败, 错误码' + state)
          return false
        }
      } catch (e) {
        this.errorMsg(e)
        return false
      }
    }
  },
  beforeDestroy() { }
}
