<template>
  <div class="layout-content bs-content">
    <div class="bs-left">
      <Menu theme="dark" :active-name="setActive" width="auto" @on-select="openPage">
        <Menu-item name="/veriface/Statistics/today" v-if="dayData">
          今日数据
        </Menu-item>
        <Menu-item name="/veriface/Statistics/analyze" v-if="statisticsAnalyze">
          统计分析
        </Menu-item>
      </Menu>
    </div>
    <div class="bs-main main-page-bg">
      <transition mode="out-in">
        <router-view></router-view>
      </transition>
    </div>
  </div>
</template>
<script>
import { mapGetters } from 'vuex'
export default {
  name: 'FaceSearch',
  data() {
    return {
      // 权限
      dayData: true,
      statisticsAnalyze: true
    }
  },
  computed: {
    ...mapGetters(['faceRecognitionrole']),
    setActive() {
      return this.$route.path
    }
  },
  methods: {
    openPage(e) {
      this.$router.replace(e)
    }
  },
  beforeDestroy() {
    for (let i = this.$chartList.length; i > 0; i--) {
      this.$chartList[i - 1].dispose()
      this.$chartList[i - 1] = null
      this.$chartList.pop()
    }
  }
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
