<template>
  <div class="bs-content">
    <div class="bs-left">
      <SrvSideBar @tigger-door='queryDoor' @tigger-server='queryServer' ref='srvSideBar' :srvCfg='true'></SrvSideBar>
    </div>
    <div class="bs-main">
      <orgConfig v-if='showOrgOrServer' ref='orgConfig'></orgConfig>
      <ServerManage v-if='!showOrgOrServer' ref='serverManage' @tigger-change='synSrvSideBar'></ServerManage>
    </div>
  </div>
</template>
<script>
import orgConfig from './orgConfig'
import ServerManage from './serverConfig'
import SrvSideBar from './srvSideBar'
import { mapGetters, mapMutations } from 'vuex'
export default {
  name: 'bs-content',
  components: { SrvSideBar, orgConfig, ServerManage },
  computed: {
    ...mapGetters(['showOrgOrServer'])
  },
  methods: {
    ...mapMutations(['PANEL_SWIFCH']),
    // 获取门禁设备列表
    queryDoor(params) {
      this.$store.commit('GET_CURRENT_SRV', params.id)
      this.$store.commit('PANEL_SWIFCH', true)
      this.$refs.orgConfig.getDoor()
    },
    // 获取服务器配置列表
    queryServer() {
      this.$store.commit('PANEL_SWIFCH', false)
      this.$refs.serverManage.getDatas()
    },
    // 修改服务器同步更新侧边栏服务器列表
    synSrvSideBar(data) {
      console.log(35)
      this.$refs.srvSideBar.synSrvList()
    }
  },
  // 切换右边内容页面
  destroyed() {
    this.$store.commit('PANEL_SWIFCH', true)
  }
}
</script>

<style lang='less' scoped>
.bs-content {
  // padding: 20px !important;
  .bs-left {
    position: relative;
  }
}
</style>
