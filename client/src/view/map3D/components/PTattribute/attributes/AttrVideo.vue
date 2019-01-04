<template>
  <div class="attr-video attr-panel">
    <header>
      <span class="title">视频点位</span>
      <Icon class="btn" type="ios-videocam" :class="attrInfo.isOnline ? 'online' : 'offline'"
        @click.native="attrInfo.isOnline && setVideoDragList([{data: attrInfo.videoInfo}])">
      </Icon>
    </header>
    <section class="main">
      <ul class="info-list">
        <li v-show="attrInfo.name">
          <span class="label">名称</span>
          <span class="value" :title="attrInfo.name">{{attrInfo.name}}</span>
        </li>
        <li v-show="attrInfo.vendor">
          <span class="label">厂商</span>
          <span class="value" :title="attrInfo.vendor">{{attrInfo.vendor}}</span>
        </li>
        <div v-for="(val, i) in attrInfo.contactsInfo" :key="i">
          <li v-show="val.contacts">
            <span class="label">联系人</span>
            <span class="value" :title="val.contacts">{{val.contacts}}</span>
          </li>
          <li v-show="val.telContacts">
            <span class="label">电话</span>
            <span class="value" :title="val.telContacts">{{val.telContacts}}</span>
          </li>
        </div>
      </ul>
    </section>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
export default {
  computed: {
    ...mapGetters('map3DApplyIX', ['attrInfo'])
  },
  methods: {
    ...mapActions(['setVideoDragList'])
  }
}
</script>
<style lang="less" scoped>
@import url(./style.less);
.online {
  color: green;
}
.offline {
  color: gray;
  cursor: no-drop !important;
}
</style>
