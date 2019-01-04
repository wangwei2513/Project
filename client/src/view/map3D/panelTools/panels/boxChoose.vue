<template>
  <div class="box-choose-panel">
    <span v-if="pointList.length"></span>
    <div class="point-content">
      <div class="title">
        已选资源
      </div>
      <div class="tools" v-if="pointList.length>0">
        <Button-group>
          <Button icon="arrow-up-c" @click="moveUp('up')" title="上移" :disabled="isChoosing"></Button>
          <Button icon="arrow-down-c" @click="moveDown('down')" title="下移" :disabled="isChoosing"></Button>
          <Button icon="trash-a" @click="deleteOne" title="删除" :disabled="isChoosing"></Button>
        </Button-group>
      </div>
      <ul class="point-list" v-if="pointList.length">
        <!-- <bs-scroll ref="scroller"> -->
          <li v-for="(item, index) in pointList" :key="item.index" @click="chooseOne(index)" :class="{'active-li':choosingIndex===index}" :title="item.name">
            <i class="iconfont icon-qiangji1"></i>
            {{item.name}}
          </li>
        <!-- </bs-scroll> -->
      </ul>
      <p class="notice-msg" v-else>未框选到点位资源</p>
      <div class="bottom-btn">
        <Button size="small" type="text" @click="cancel">取消</Button>
        <Button size="small" type="primary" @click="preview">预览</Button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
export default {
  data() {
    return {
      choosingIndex: 0,
      isChoosing: false,
      pointList: [],
      showPop: false
    }
  },
  methods: {
    ...mapActions(['set3DActiveDraw', 'setPreviewPointList', 'setIsBoxChoosePreview', 'setSelectedEntity', 'setIsBoxChooseClosed']),
    ...mapActions('map3DApplyIX', ['changeToolsPanelToBoxChoose', 'changePointChooseStatus', 'switchToolsPanel']),
    chooseOne(index) {
      this.choosingIndex = index
      console.log(index, 'index')
    },
    add() { },
    deleteOne() {
      this.pointList.splice(this.choosingIndex, 1)
    },
    moveUp() {
      if (this.choosingIndex > 0) {
        let chooseingOne = this.pointList.splice(this.choosingIndex, 1)
        this.pointList.splice(this.choosingIndex - 1, 0, chooseingOne[0])
        this.choosingIndex -= 1
      }
    },
    moveDown() {
      if (this.choosingIndex < this.pointList.length - 1) {
        let chooseingOne = this.pointList.splice(this.choosingIndex, 1)
        this.pointList.splice(this.choosingIndex + 1, 0, chooseingOne[0])
        this.choosingIndex += 1
      }
    },
    /**
     * @msg: 预览
     * @param {type}
     * @return:
     */
    preview() {
      this.changePointChooseStatus(false)
      this.setPreviewPointList(this.pointList)
      console.log(this.pointList, 'pointList')
      this.setIsBoxChoosePreview(true)
      this.switchToolsPanel(false)
      // this.changeToolsPanelToBoxChoose('')
    },
    cancel() {
      this.setPreviewPointList([])
      this.setSelectedEntity({})
      this.set3DActiveDraw(false)
      this.changeToolsPanelToBoxChoose('')
      this.changePointChooseStatus(false)
      this.setIsBoxChooseClosed(true)
      this.switchToolsPanel(false)
    }
  },
  computed: {
    ...mapState({
      selectBoxVideoData: ({ tdPoint }) => tdPoint.selectBoxVideoData,
      previewPointList: ({ tdPoint }) => tdPoint.previewPointList
    })
  },
  watch: {
    selectBoxVideoData(val) {
      console.log(val, 'selectBoxVideoData')
      for (const key in val) {
        const element = val[key]
        for (const key in this.pointList) {
          const item = this.pointList[key]
          if (item._id === element._id) {
            console.log(key)
            this.pointList.splice(key, 1)
            continue
          }
        }
      }
      let newVal = JSON.parse(JSON.stringify(val))
      this.pointList = [...this.pointList, ...newVal]
      console.log(this.pointList)
    },
    previewPointList(val) {
      this.pointList = JSON.parse(JSON.stringify(this.previewPointList))
    }
  },
  mounted() {
    // this.setPreviewPointList([])
    this.setIsBoxChooseClosed(false)
    if (this.previewPointList.length) {
      console.log(this.previewPointList, 'this.previewPointList')
      this.pointList = JSON.parse(JSON.stringify(this.previewPointList))
    } else {
      this.pointList = JSON.parse(JSON.stringify(this.selectBoxVideoData))
    }
  }
}
</script>

<style scoped lang="less">
@textleft: 24px;
@topAndBottom: 12px;
.box-choose-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: #1b3153;
  .point-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    .title {
      width: 100%;
      height: 38px;
      line-height: 38px;
      padding: 0 @textleft;
      background: #0f2343;
    }
    ul.point-list {
      padding: 2px @textleft;
      // height: 100%;
      display: flex;
      flex: 1;
      flex-direction: column;
      .active-li {
        background: rgb(10, 141, 184);
        color: #1b3153;
      }
      li {
        height: 38px;
        line-height: 38px;
        text-align: left;
        font-size: 14px;
        border-radius: 4px;
        padding: 0 @topAndBottom;
        cursor: pointer;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        .icon-qiangji1 {
          font-size: 14px;
        }
      }
      li:hover {
        background: lightblue;
        color: #1b3153;
        .icon-qiangji1 {
          font-size: 14px;
        }
      }
    }
    .tools {
      width: 83.5%;
      margin: 8px auto;
      .ivu-poptip-popper {
        min-width: 69px !important;
      }
      .ivu-btn-group {
        width: 100% !important;
      }
      .ivu-btn-group .ivu-btn {
        padding: 0;
        width: 33.3333333%;
        height: 24px;
      }
    }
    .bottom-btn {
      display: flex;
      flex: 0 0 38px;
      background: #1b3153;
      // justify-content: space-evenly;
      padding: 4px 0;
      button {
        display: flex;
        margin: 0 -50px 0 80px;
      }
    }
    .notice-msg {
      margin: 10px auto;
    }
  }
}
</style>
