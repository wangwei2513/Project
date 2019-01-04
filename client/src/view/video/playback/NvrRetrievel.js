import { mapState, mapGetters } from 'vuex'
export default {
  data() {
    return {
      queryNode: null,
      sTime: (() => {
        const date = new Date()
        date.setHours(0)
        date.setMinutes(0)
        date.setSeconds(0)
        return date
      })(),
      eTime: new Date(),
      channel: '',
      nvrFileTypeList: {
        all: '全部',
        timeVideo: '定时',
        eventVideo: '事件',
        signVideo: '标记',
        vehicleVideo: '车辆',
        faceVideo: '人脸'
      }
    }
  },
  watch: {
    curNode(val) {
      this.channel = this.curNode.chan
    },
    sTime(val) {
      if (typeof val === 'object') {
        this.sTime = val
      } else {
        const t = val.split(':')
        const date = new Date()
        date.setHours(t[0] || 0)
        date.setMinutes(t[1] || 0)
        date.setSeconds(t[2] || 0)
        this.sTime = date
      }
    },
    eTime(val) {
      if (typeof val === 'object') {
        this.eTime = val
      } else {
        const t = val.split(':')
        const date = new Date()
        date.setHours(t[0] || 0)
        date.setMinutes(t[1] || 0)
        date.setSeconds(t[2] || 0)
        this.eTime = date
      }
    }
  },
  computed: {
    ...mapState({
      curNode: ({ videoOrg }) => videoOrg.curNode,
      isSync: ({ playback }) => playback.isSync,
      total: ({ playback }) => playback.nvrCount,
      rowId: ({ playback }) => playback.rowId,
      isSyncCheck: ({ playback }) => playback.isSyncCheck
    }),
    ...mapGetters(['nvrTableData']),
    filteredTableData() {
      return this.tableData[this.rowId - 1]
    },
    tableData() {
      return this.nvrTableData
    }
  },
  methods: {
    querySync() {
      this.$emit('queryNVRSync', this.dateToTime(this.sTime))
    },
    nvrVideoFilter(rowId = 1) {
      if (this.tableData[rowId - 1]) {
        this.setRowid(rowId)
        return
      }
      if (!this.rangeTime) {
        this.$Notice.warning({ title: '警告', desc: '请选择正确的时间段！' })
        return
      }
      this.$refs.calender.startRange = false
      this.sTime.setFullYear(this.rangeTime.startDate.getFullYear())
      this.sTime.setMonth(this.rangeTime.startDate.getMonth())
      this.sTime.setDate(this.rangeTime.startDate.getDate())
      this.eTime.setFullYear(this.rangeTime.endDate.getFullYear())
      this.eTime.setMonth(this.rangeTime.endDate.getMonth())
      this.eTime.setDate(this.rangeTime.endDate.getDate())

      if (this.eTime.getTime() > new Date().getTime()) {
        this.$Notice.warning({ title: '警告', desc: '结束时间不能超过当前时间！' })
        return
      }
      const sTime = this.dateToTime(this.sTime)
      if (this.isSyncCheck) {
        return this.$emit('queryNVR', sTime / 1000)
      }
      const eTime = this.dateToTime(this.eTime)
      if (sTime > eTime) {
        this.$Notice.warning({ title: '警告', desc: '开始时间不能大于结束时间！' })
        return
      }
      const param = {
        recordType: 'all', // 录像请求类型,
        sTime: parseInt(sTime / 1000), // 开始时间,
        eTime: parseInt(eTime / 1000), // 结束时间,
        rowId,
        rowCount: 5
      }
      this.queryNode = this.curNode
      return this.$emit('queryNVR', param)
    },
    playItem(item, index) {
      this.plugin.setPluginType('record')
      const param = {
        devIp: item.item.devIp, // 设备ip,
        devPort: +item.item.devPort, // 设备端口,
        channel: item.item.channel, // 通道号,
        sTime: item.item.sTime, // 开始时间,
        eTime: item.item.eTime, // 结束时间,
        streamType: item.item.streamType, // 码流类型,
        streamConnPort: this.queryNode.eid.dport,
        item: item.item,
        node: this.queryNode
      }
      this.$emit('playNVR', param)
    },
    dateToTime(time) {
      return this.$moment(time).format('x')
    }
  }
}
