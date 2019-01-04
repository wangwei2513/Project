<template>
  <div :class="['base-image', picInfo.userId?'active':'']">
    <!-- 条件检索 | 以图搜图 单个检索结果图片显示 -->
		<div class="picture-info clearfix">
			<span :title="picInfo.resName"><i class="iconfont icon-Location"></i> {{picInfo.resName}}</span>
      <i class="ivu-icon ivu-icon-ios-personadd-outline" style="font-size: 23px;" @click="showAddpage = true" title="人员入库"></i>
			<i class="iconfont icon-icon-test" title="以图搜图" @click="imgSearch"></i>
		</div>
		<div class="images clearfix">
			<div class="sing-img">
				<img :src="picInfo.faceImage?picInfo.faceImage:'/static/noImg1.png'" @click="showDetail = true" draggable="false" alt="无图片" @error="imgErr"/><br/>
        <span v-if="type === 'image'" class="similar-num">{{picInfo.similar}}%</span>
				<span>{{$moment.unix(picInfo.time).format('YYYY-MM-DD HH:mm:ss')}}</span>
			</div>
		</div>
		<AlarmModal v-if="showDetail" :show="showDetail" @close="showDetail = false" type="passer" :picInfo="picInfo"></AlarmModal>
    <Passer v-if="showAddpage" :show="showAddpage" @close="showAddpage = false" :imageUrl="picInfo.faceImage"></Passer>
  </div>
</template>
<script>
import AlarmModal from '../alarmsearch/AlarmModal.vue'
import Passer from './AddPasser'
import { mapMutations } from 'vuex'
export default {
  components: { AlarmModal, Passer },
  data() {
    return {
      showDetail: false,
      showAddpage: false
    }
  },
  props: {
    type: {
      type: String, // search 条件检索 | image 以图搜图
      default: 'search'
    },
    picInfo: {
      type: Object
    }
  },
  methods: {
    ...mapMutations(['SET_IMAGE_URL']),
    imgErr(e) {
      e.target.src = '/static/noImg1.png'
    },
    imgSearch() {
      this.$router.replace('/veriface/PasserSearch/searchpic')
      this.SET_IMAGE_URL(this.picInfo.faceImage)
    }
  }
}
</script>
<style scoped>
.base-image {
  background-color: rgba(15, 35, 67, 0.3);
  width: 149px;
  height: 232px;
  min-height: 186px;
  padding: 6px 12px;
  user-select: none;
  margin: 4px;
}
.base-image.active {
  border: 1px solid #fd6600;
}
.picture-info > span {
  float: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: calc(100% - 50px);
}
.picture-info > i {
  float: right;
  margin: 3px;
  cursor: pointer;
}
.images {
  position: relative;
  text-align: center;
  height: calc(100% - 30px);
}
.images .sing-img {
  width: 100%;
  float: left;
  height: 100%;
}
.images .sing-img img {
  display: inline-block;
  cursor: pointer;
  width: 100%;
  height: calc(100% - 22.5px);
  background-color: #1b3153;
}
.similar-num {
  position: absolute;
  bottom: 22px;
  right: 35px;
  background: url('../../../../static/similarity.png') no-repeat;
  font-size: 14px;
  font-weight: 400;
  font-style: normal;
  background-size: 100%;
  width: 50px;
  height: 16px;
}
.clearfix:after {
  content: '.';
  display: block;
  height: 0;
  clear: both;
  visibility: hidden;
}
</style>
