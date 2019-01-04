<template>
  <div class='err-Model'>
    <Modal v-model="errorModel" title="错误信息" :mask-closable="false" @on-visible-change="readeError">
      <div class="err-Model-div">
        <div class="err-info" v-for="(info, i) in errorInfo" :key="i">
          {{i + 1}} : {{info}}
        </div>
      </div>
        <div slot="footer" style="position:relative;z-index:99">
          <Button type="ghost" @click="readeError(false)">确定</Button>
        </div>
      </Modal>
  </div>
</template>

<script>
export default {
  props: {
    /**
     * errorInfo:后端接口返回的信息
     * readEventName: 确认错误信息事件名
     */
    errorInfo: {
      type: Array,
      default: () => {
        return []
      }
    }
  },
  data() {
    return {}
  },
  computed: {
    errorModel() {
      return this.errorInfo.length > 0
    }
  },
  methods: {
    readeError(val) {
      if (!val) {
        this.$emit('onError', false)
      }
    }
  }
}
</script>

<style scoped>
.err-Model-div {
  height: 400px;
  word-wrap: break-word;
  overflow-y: scroll;
}
.err-info {
  padding: 10px 5px;
  border-bottom: 1px solid #000;
}
</style>
