import {
  AV_NVRRECORD_LIST
} from 'http/video.api'

export default {
  methods: {
    validCheckSync(nodes, time) {
      if (!nodes.length) {
        this.warningMsg('请选择一个摄像头')
        return false
      }
      if (nodes.length > 4) {
        this.warningMsg('最多支持4通道同步回放')
        return false
      }
      if (!time) {
        this.warningMsg('请选择正确的开始时间')
        return false
      }
      if (nodes.length !== nodes.filter(item => item.eid.type === 'nvr').length) {
        this.warningMsg('选中设备不支持前端回放')
        return false
      }
      return true
    },
    async queryNVRSync(time) {
      time = parseInt(time)
      this.clearNVRList()
      const nodeList = this.getSelectedNodes().filter(item => item.eid)
      let nodes = []
      let noPower = 0
      for (let index = 0; index < nodeList.length; index++) {
        const node = nodeList[index]
        const power = await this.getCameraPower(node._id)
        if (power && power.includes('playbackDownload')) {
          nodes.push(node)
        } else {
          noPower++
        }
      }
      if (noPower) { this.$Notice.warning({ desc: `${noPower}个通道没有权限！`, title: '警告' }) }
      if (!this.validCheckSync(nodes, time)) {
        return
      }
      this.plugin.stopAll()
      if (this.showThumb === 1) {
        this.plugin.setShowscreen(4)
        this.showThumb = 4
      }
      const pros = []
      const timeDis = 12 * 60 * 60
      nodes.forEach((node, index) => {
        pros.push(
          new Promise(async resolve => {
            const obj = {
              recordType: 'all',
              rowId: 1,
              rowCount: 50,
              sTime: time - timeDis,
              eTime: +time + timeDis,
              streamType: node.stream,
              time,
              channel: node.chan,
              devIp: node.eid.ip,
              devPort: node.eid.cport
            }
            const result = {
              res: node._id,
              name: node.name,
              node: node,
              queryParam: obj,
              queryTime: {
                str: obj.sTime,
                end: obj.eTime
              }
            }
            try {
              this.setPlayLog({ ip: node.eid.ip, name: node.name })
              const res = await this.requestQuery(obj)
              Object.assign(result, res.data)
            } catch (e) {
              console.log(e, '查询NVR')
              this.errorMsg('查询失败')
            } finally {
              this.SET_RESOURCE({
                index,
                item: result
              })
              resolve()
            }
          })
        )
      })
      Promise.all(pros).then(() => {
        const info = this.findAvailableSyncTime(time)
        if (info.time) {
          this.syncTime(info.time)
          this.avtiveChange(info.index)
        } else {
          this.syncTime(time)
          this.avtiveChange(0)
        }
        this.addAllTimelineInfo()
      })
    },
    queryAPINVR(obj) {
      return AV_NVRRECORD_LIST(obj)
    }
  }
}
