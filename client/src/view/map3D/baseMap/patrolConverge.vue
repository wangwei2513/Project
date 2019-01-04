<template>
  <div class="building-alarm-tree">
    <bsr-Tree :treeData="buildIngAlarm||{}" ref="bstree" @node-click='nodeClick'>
      <template slot-scope="{ node }">
        <span>{{node.name}}</span>
        <span class="times" v-show="node.times > 1">{{node.times}}</span>
      </template>
    </bsr-Tree>
  </div>
</template>

<script>
export default {
  data() {
    return {
      
    }
  }
}
</script>

<style scoped>
.building-alarm-tree {
  position: absolute;
  left: 100px;
  top: 100px;
  z-index: 3;
  background: #1c3053;
}
.times {
  border-radius: 50%;
  background: red;
  color: #000;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  margin-left: 8px;
}
</style>
