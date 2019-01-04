<template>
  <div>
    <div style='width: 100%;height:100%;'>
      <div class="doorTitle">门禁机构
        <i class="iconfont icon-refresh refresh" style="float:right;font-size: 22px;margin-right:15px;" @click='refresh'></i>
      </div>
      <div style="padding:12px 16px;" class="left-part-style">
        <Input v-model="searchKey" icon="ios-search-strong" size="small" placeholder="请输入..." />
      </div>
      <bs-scroll style='height:400px;' ref='bsScroll'>
        <div style='width: 300px;height: 36px; line-height: 36px; text-align: left; font-size: 12px;padding-left:20px;overflow: hidden;white-space: nowrap;text-overflow:ellipsis;cursor:pointer;' :class='{active: activeBg === item._id}' v-for='(item, index) in serverList' :key='item._id' @click='tiggerDoorList($event, item, index)'>
          <i class="iconfont icon-menjinxitong" style='margin-right:5px;'></i>
          <span>{{item.name}}</span>
          <div class="jiexian"></div>
        </div>
      </bs-scroll>
    </div>
    <div class="bottomPart" v-if="$BShasPower('BS-SETTING-DOOR-SERVER-PAGE') && srvCfg">
      <Menu ref="menu" theme="dark" width="100%" :active-name="route" @on-select="tiggerSrvList">
        <Menu-group class='doorParam' title="门禁系统参数配置">
          <Menu-item name='/settings/door/manage'>门禁服务器管理</Menu-item>
        </Menu-group>
      </Menu>
    </div>
  </div>
</template>
<script>
import { mapActions, mapMutations } from 'vuex'
export default {
  data() {
    return {
      searchKey: '',
      serverList: [],
      bakList: [],
      activeBg: '',
      route: ''
    }
  },
  props: {
    srvCfg: {
      type: Boolean,
      default: true
    }
  },
  created() {
    this.doorSrvList()
  },
  watch: {
    searchKey(val) {
      this.searchDoor(val)
    },
    serverList() {
      this.$refs.bsScroll.update()
    }
  },
  methods: {
    ...mapMutations(['GET_CURRENT_SRV', 'PANEL_SWIFCH']),
    ...mapActions(['getSrvLabeList']),
    // 获取左边门禁服务器列表
    doorSrvList() {
      this.getSrvLabeList()
        .then(res => {
          this.serverList = res
          this.bakList = this.$lodash.cloneDeep(this.serverList)
          // if (this.bakList.length > 0) {
          //   this.activeBg = this.bakList[0]._id
          //   this.$store.commit('GET_CURRENT_SRV', this.bakList[0]._id)
          // }
        })
        .catch(err => {
          this.errorMsg('获取门禁系统失败！')
          console.log('this.doorServerList :' + err)
        })
    },
    // 外部数据更新
    synSrvList(data) {
      this.serverList = data
      this.bakList = this.$lodash.cloneDeep(this.serverList)
    },
    // 刷新
    refresh() {
      this.doorSrvList()
    },
    // 搜索门禁服务器
    searchDoor(key) {
      const newList = []
      if (key === '' || this.serverList.length < 1) {
        this.serverList = JSON.parse(JSON.stringify(this.bakList))
      }
      this.serverList.forEach(item => {
        if (item.name.includes(key)) {
          newList.push(item)
        }
      })
      this.serverList = newList
    },
    // 触发获取门禁列表
    tiggerDoorList(e, item, index) {
      this.activeBg = item._id
      this.$emit('tigger-door', { id: item._id })
    },
    //  触发获取门禁列表
    tiggerSrvList(name) {
      this.route = name
      this.activeBg = ''
      this.$emit('tigger-server')
    }
  }
}
</script>
<style scoped>
.doorTitle {
  width: 100%;
  height: 38px;
  line-height: 38px;
  text-align: center;
  font-size: 16px;
  background-color: #0f2243;
}
.active {
  background-color: #2f497a;
}
.refresh:hover {
  cursor: pointer;
}
.bottomPart {
  width: 100%;
}
.jiexian {
  position: absolute;
  width: 90%;
  height: 0;
  border-top: 1px solid rgba(58, 90, 139, 0.4);
  left: 50%;
  margin-left: -45%;
}
</style>
