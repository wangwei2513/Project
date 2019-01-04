<template>
<div style="width:100%">
  <theme></theme>
  <div class="flex flex-1"
       style="width:100%;height:calc(100% - 70px)">
    <transition name="router"
                mode="out-in">
      <div class="router-view">
        <router-view></router-view>
      </div>
    </transition>
  </div>
</div>
</template>
<script>
import theme from '../components/navigation/theme'
export default {
  components: {
    theme
  },
  created() {
  }
}
</script>
<style lang="less" scoped>
.router-enter-active,
.router-leave-active {
  transition: all 0.4s cubic-bezier(0, 0, 0, 1);
}

.router-enter,
.router-leave-active {
  opacity: 0.1;
}

.router-enter {
  transform: translate3D(100%, 0, 0);
}

.router-leave-active {
  transform: translate3D(-100%, 0, 0);
}

.router-view {
  flex: 1;
  display: flex;
}
</style>
