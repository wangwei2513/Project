<template>
  <div class="bs-main emergenceHome">
    <div class="emergenceLeft">
      <div v-if="menuTag==='app'" style="height:100%">
        <div class="leftTittle">
          应急预案
        </div>
        <div class="input" style="width:100%;padding:10px;">
          <Input v-model="searchVal" icon="ios-search-strong" placeholder="请输入..." />
        </div>
        <div class="box-tree" style="padding:0px;height:calc(100% - 110px)">
          <bs-scroll ref="scroller">
            <v-tree @on-expand="$refs.scroller.update()" ref='tree' :treeData="treeData" :options="options" @node-click="handleNode" :activeId="activeId" :searchVal="searchVal"></v-tree>
          </bs-scroll>
        </div>
      </div>
      <!-- 机构相关操作 -->
      <div v-if="menuTag==='edit'" class="orgControl">
        <emTree @call="getDevicesDataClick" :orgType="5" orgTitle="应急预案"></emTree>
      </div>
    </div>
    <div class="emergenceCenter">
      <div class="centerTittle">
        <ul>
          <li @click="applyClick('app')" :class="{'active':menuTag==='app'}">应用模式</li>
          <li @click="editClick('edit')" :class="{'active':menuTag==='edit'}">编辑模式</li>
        </ul>
      </div>
      <div v-if="menuTag==='app'" class="emPosition">
        <!-- 应急指挥应用模式 -->
        <emPlanApp></emPlanApp>
      </div>
      <div v-if="menuTag==='edit'" class="emPosition">
        <!-- 应急指挥编辑模式 -->
        <emPlanEdit></emPlanEdit>
      </div>
    </div>
  </div>
</template>
<script>
import { mapState, mapActions, mapMutations } from 'vuex'
import emTree from './pages/emTree'
import emPlanApp from './pages/emPlanApp'
import emPlanEdit from './pages/emPlanEdit'
export default {
  components: {
    emTree,
    emPlanApp,
    emPlanEdit
  },
  data() {
    return {
      menuTag: 'app',
      activeId: '',
      treeData: [],
      options: {
        showFolder: true
      },
      searchVal: ''
    }
  },
  computed: {
    ...mapState({
      emTree: ({ emergencyMan }) => emergencyMan.emTree
    })
  },
  watch: {
    menuTag(val) {
      if (val === 'app') {
        this.activeId = this.treeData[0]._id
      }
    }
  },
  methods: {
    ...mapActions(['getEmTree', 'getOneEmPlan']),
    ...mapMutations(['SET_EMPLAN_MODEL', 'SET_EMNOSE_STATE']), // 应急预案编辑模式应用模式切换
    getDevicesDataClick(node) {
      this.$store.commit('SET_EMNOSE_STATE', node)
      this.getOneEmPlan(node._id)
    },
    applyClick(val) {
      this.getEmTree(5).then((res) => {
        this.treeData = JSON.parse(JSON.stringify(this.emTree))
        this.activeId = this.treeData[0]._id
        this.handleNode(this.treeData[0])
      }).catch((err) => {
        console.log('getEmTree error: ' + err)
      })
      this.menuTag = val
    },
    editClick(val) {
      this.menuTag = val
    },
    handleNode(node) {
      this.activeId = node._id
      this.getOneEmPlan(node._id).then(res => {
        // this.successMsg('预案信息获取成功')
      }).catch(err => {
        console.log(err)
        this.errorMsg('预案信息获取失败')
      })
    }
  },
  created() {
    this.getEmTree(5).then((res) => {
      this.treeData = JSON.parse(JSON.stringify(this.emTree))
      this.activeId = this.treeData[0]._id
      this.handleNode(this.treeData[0])
    }).catch((err) => {
      console.log('getEmTree error: ' + err)
    })
  }
}
</script>
<style scoped>
.emergenceHome {
  display: -ms-flexbox;
  display: flex;
  -ms-flex: 1;
  flex: 1;
  padding: 16px 0;
  font-size: 14px;
  overflow: auto;
}
.emergenceHome .emergenceLeft {
  flex: 0 0 300px;
  min-height: 670px;
  background: #1c3053;
  margin-right: 15px;
  width: 300px;
}
.emergenceHome .emergenceLeft .orgControl {
  height: 100%;
}
.emergenceHome .emergenceCenter {
  flex: 1;
  display: flex;
  min-height: 670px;
  background: #1c3053;
  margin-right: 15px;
  flex-direction: column;
}
.emergenceHome .emergenceCenter .emPosition {
  flex: 1;
  display: flex;
}
.emergenceHome .emergenceCenter .centerTittle,
.emergenceHome .emergenceLeft .leftTittle {
  display: inline-block;
  text-align: center;
  font-size: 14px;
  color: #fff;
  background-color: #0f2243;
  height: 40px;
  line-height: 40px;
  /* margin-bottom: 10px; */
  width: 100%;
}
.emergenceHome .emergenceCenter .centerTittle li,
.emergenceHome .emergenceLeft .leftTittle li {
  width: 100px;
  float: left;
  cursor: pointer;
  border-right: 1px solid rgb(16, 27, 49);
  list-style: none;
}
.emergenceHome .emergenceCenter .centerTittle .active,
.emergenceHome .emergenceLeft .leftTittle .active {
  background: #1b3153;
}
</style>
