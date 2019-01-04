<template>
  <div class="layout-content bs-content">
    <div class="bs-left">
      <Menu theme="dark" :active-name="route" width="auto" @on-select="openPage">
        <Menu-item name="/veriface/PasserSearch/condition">
          条件检索
        </Menu-item>
        <Menu-item name="/veriface/PasserSearch/searchpic">
          以图搜图
        </Menu-item>
      </Menu>
    </div>
    <div class="bs-main">
      <router-view></router-view>
    </div>
  </div>
</template>
<script>
import { mapState } from 'vuex'
export default {
  name: 'passerSearch',
  data() {
    return {}
  },
  computed: {
    ...mapState({
      imageToSearch: state => state.veriface.imageToSearch
    })
  },
  watch: {
    imageToSearch() {
      if (this.imageToSearch) { // 跳转后直接搜图时更改active-name
        this.route = '/veriface/PasserSearch/searchpic'
      }
    }
  },
  methods: {
    openPage(e) {
      this.$router.replace(e)
      this.route = e
    }
  },
  created() {
    this.route = this.$route.path
  },
  beforeDestroy() {}
}
</script>
<style scoped>
.layout-content {
  min-height: 100%;
  width: 100%;
  padding: 16px 0;
}
.layout-content-main {
  flex: 1;
  margin-bottom: 2px;
  background: #1c3054;
}
</style>
