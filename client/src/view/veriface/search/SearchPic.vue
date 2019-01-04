<template>
  <div class="track-page">
    <!-- 以图搜图 -->
    <div class="track-condition clearfix">
      <div class="img-upload">
        <Upload :on-success="uploadSuccess" :on-error="uploadImgError" :on-format-error="formatError" :on-exceeded-size="exceededSize" action="/api/upload/file?type=image&category=temp" :max-size="2048" :format="['jpg','png','bmp','jpeg']" :show-upload-list="false">
          <img v-if="imageUrl" :src="imageUrl" style="width:52px;height:66px;"/>
          <div v-else class="img-up-icon">
            <i class="ivu-icon ivu-icon-ios-cloud-upload-outline"></i>
            <p>点击上传图片</p>
          </div>
          <p>支持JPG、JPEG、PNG、BMP格式的图片,大小不超过2M</p>
        </Upload>
      </div>
      <div class="condition">
        <div>
        <div class="time-date">
          <span class="search-label">时间段</span>
            <DatePicker v-model="startTime" @on-change="checkTime('s')" :options="dateLimit" :editable="false" :clearable="false" @on-clear="startTime = ''" type="datetime" style="width: 220px"></DatePicker>
            <span style="padding: 0 5px;">至</span>
            <DatePicker v-model="endTime" @on-change="checkTime('e')" @on-clear="endTime = ''" :options="dateLimit" :editable="false" :clearable="false" type="datetime" style="width: 220px"></DatePicker>
        </div>
        <div class="similar">
          <span class="search-label">相似度</span>
          <Select v-model="similar" style="width:200px;">
            <Option v-for="(item,j) in pecentNum" :key="j" :value="item">{{item}}</Option>
          </Select>
        </div>
        </div>
        <div>
        <div class="search-pos">
          <span class="search-label">抓拍位置</span>
           <Select style="width:470px" v-model="caremaPos" @on-open-change="changeCamera" placeholder="点击选择抓拍位置">
               <Option style="display:none;" :value="caremaPos">{{caremaPos}}</Option>
              <VTree ref="devTree"
                :treeData="devList"
                :options="{showInput: true}"></VTree>
            </Select>
        </div>
        <div class="search-btn">
          <Button type="ghost" @click="pageCur = 1;search()"><i class="iconfont icon-jiansuozhong" style="font-size:12px;"></i> 检索</Button>
          <Button style="margin-left:15px" type="ghost" :disabled="passerImageList.length === 0" @click="exportData"><i class="iconfont icon-export" style="font-size:12px;"></i> 导出</Button>
        </div>
        </div>
      </div>
    </div>
    <div class="search-image clearfix">
      <ul class="tab-header clearfix">
        <li class="active">缩略图</li>
      </ul>
      <div class="search-image-list">
        <div v-if="passerImageList.length === 0" class="no-result">暂无数据</div>
        <SingImage style="float:left;" v-for="(item,j) in passerImageList" :key="j" :picInfo="item" type="image"></SingImage>
      </div>
      <Page :page-size="pageLimit" @on-page-size-change="pageSizeChange" @on-change="handlePageChange" :current="pageInfo.current" :total="pageInfo.count" :page-size-opts="$PageInfo.size" style="float:right" show-sizer show-elevator show-total></Page>
    </div>
  </div>
</template>
<script>
import toTreeData from 'src/assets/js/toTreeData.js'
import SingImage from '../passer/SingImage'
import { mapState, mapMutations, mapActions } from 'vuex'
export default {
  components: { SingImage },
  data() {
    return {
      cameraPosition: '',
      devList: toTreeData([]),
      similar: '75%',
      pageLimit: this.$PageInfo.limit,
      pageCur: 1,
      imageUrl: '',
      dateLimit: {
        disabledDate(date) {
          return date && date.valueOf() > Date.now()
        }
      },
      startTime: '',
      endTime: '',
      caremaPos: '全部'
    }
  },
  computed: {
    ...mapState({
      imageToSearch: state => state.veriface.imageToSearch,
      passerImageList: state => state.veriface.passerImageList,
      pageInfo: state => state.veriface.passerImagePageinfo,
      verifaceParam: state => state.veriface.verifaceParam
    }),
    pecentNum() {
      const list = []
      let item = 50
      for (let i = 0; item < 100; i++) {
        list.push(item + '%')
        item += 5
      }
      return list
    },
    passerby() {
      return this.verifaceParam.passby
    }
  },
  mounted() {
    this.setDate()
  },
  watch: {
    imageToSearch(news, old) {
      if (this.imageToSearch !== '' && news !== old) {
        this.imageUrl = this.imageToSearch
        this.search()
      }
    }
  },
  created() {
    this.getVerifaceTree()
      .then(res => {
        this.devList = toTreeData([res.data])
        this.$nextTick(() => {
          if (this.imageToSearch) {
            this.imageUrl = this.imageToSearch
            this.search()
          }
        })
      })
      .catch(err => {
        console.log('获取设备树出错', err)
      })
    this.getVerifaceParam()
  },
  methods: {
    ...mapMutations(['SET_IMAGE_URL', 'SET_IMAGES_LIST', 'SET_IMAGES_PAGE_INFO']),
    ...mapActions(['getVerifaceTree', 'getImagesCondition', 'getVerifaceParam', 'getPasserExport']),
    setDate() {
      this.startTime = this.$moment(this.$moment(new Date()).subtract(1, 'months')).format('YYYY-MM-DD') + ' 00:00:00'
      this.endTime = new Date()
    },
    removeUrl() {
      this.imageUrl = ''
      this.SET_IMAGE_URL('')
    },
    uploadSuccess(response, file, fileList) {
      this.imageUrl = response.path
      this.SET_IMAGE_URL('')
    },
    uploadImgError(err, file, fileList) {
      if (err) {}
      this.errorMsg('图片上传失败！')
      this.removeUrl()
    },
    formatError(file) {
      this.warningMsg('图片 ' + file.name + ' 格式不正确，请上传 jpg, png, bmp 或 jpeg 格式的图片。')
      this.removeUrl()
    },
    exceededSize(file) {
      this.warningMsg('图片 ' + file.name + ' 大小超过限制，请上传小于2M的图片。')
      this.removeUrl()
    },
    changeCamera() {
      const selectTree = this.$refs.devTree ? this.$refs.devTree.getSelectedDeepNameIds() : {}
      if (selectTree.name.length === 0 || selectTree.name.length === selectTree.count) {
        this.caremaPos = '全部'
      } else {
        this.caremaPos = selectTree.name.join(';')
      }
    },
    search() {
      if (!this.passerby) {
        this.imageUrl = ''
        this.warningMsg('未开启路人库!')
        return
      }
      if (!this.imageUrl) {
        this.warningMsg('图片为空！')
        return
      }
      if (!this.startTime) {
        this.warningMsg('开始时间不能为空！')
        return
      }
      if (!this.endTime) {
        this.warningMsg('结束时间不能为空！')
        return
      }
      const condition = {}
      condition.startTime = this.$moment(this.startTime).unix('X')
      condition.endTime = this.$moment(this.endTime).unix('X')
      if (parseInt(condition.endTime) - parseInt(condition.startTime) < 0) {
        this.warningMsg('开始时间不能大于结束时间！')
        return
      }
      if (this.imageToSearch) {
        condition.target = 'data' // 以库中存在的图片检索
      }
      condition.points = this.$refs.devTree.getSelectedDeepIds().toString() || ''
      condition.page = this.pageCur || 1
      condition.limit = this.pageLimit
      condition.image = this.imageUrl
      condition.similar = parseInt(this.similar)
      this.getImagesCondition(condition)
        .then(res => {
          if (res.data.length === 0) {
            this.warningMsg('查询无结果！')
          }
        })
        .catch(() => {
          this.errorMsg('检索失败！')
        })
    },
    pageSizeChange(n) {
      this.pageCur = 1
      this.pageLimit = n
      this.search()
    },
    handlePageChange(page) {
      this.pageCur = page
      this.search()
    },
    exportData() {
      const condition = {}
      condition.startTime = this.$moment(this.startTime).unix('X')
      condition.endTime = this.$moment(this.endTime).unix('X')
      if (parseInt(condition.endTime) - parseInt(condition.startTime) < 0) {
        this.warningMsg('开始时间不能大于结束时间！')
        return
      }
      condition.points = this.$refs.devTree ? this.$refs.devTree.getSelectedDeepIds().toString() : ''
      condition.page = this.pageCur || 1
      condition.limit = this.pageLimit
      condition.image = this.imageUrl
      condition.similar = parseInt(this.similar)
      const param = JSON.parse(JSON.stringify(condition))
      param.limit = this.pageInfo.count > 99999 ? 99999 : this.pageInfo.count
      param.tag = 'img' // 是否以图搜图的导出
      const str = []
      for (const item in param) {
        str.push(`${item}=${param[item]}`)
      }
      this.getPasserExport(str.join('&'))
        .then(() => {
          if (!this.elemIF) {
            this.elemIF = document.createElement('iframe')
          }
          this.elemIF.src = window.location.origin + `/api/veriface/statistic/passby/export?${str.join('&')}`
          this.elemIF.style.display = 'none'
          document.body.appendChild(this.elemIF)
        })
        .catch(() => {
          this.errorMsg('导出失败！')
        })
    },
    checkTime(v) {
      const start = this.$moment(this.startTime).unix('X')
      const curend = this.$moment(this.endTime).unix('X')
      if (parseInt(curend) - parseInt(start) < 0) {
        if (v === 's') {
          this.warningMsg('开始时间不能大于结束时间！')
        } else {
          this.warningMsg('结束时间不能小于开始时间！')
        }
      }
    }
  },
  beforeDestroy() {
    this.SET_IMAGE_URL('')
    this.SET_IMAGES_LIST([])
    this.SET_IMAGES_PAGE_INFO()
  }
}
</script>
<style scoped>
.track-page {
  width: 100%;
  height: 100%;
}
.track-condition {
  width: 100%;
  background-color: #1b3153;
}
.img-upload {
  float: left;
  text-align: center;
  padding: 12px 24px 8px;
  width: 423px;
  margin-left: 5px;
}
.img-upload .img-up-icon {
  background: rgb(60, 80, 115);
  width: 205px;
  margin-left: 52px;
  padding: 5px 0;
  margin-bottom: 8px;
  border-radius: 4px;
}
.img-upload i {
  font-size: 38px;
  cursor: pointer;
  color: #4699f9;
}
.condition {
  float: left;
  padding: 16px 24px;
  padding-bottom: 0;
  display: flex;
  flex-direction: column;
}
.condition > div {
  padding-bottom: 16px;
}
.search-label {
  margin-right: 15px;
  text-align: right;
  width: 50px;
  display: inline-block;
}
.time-date {
  float: left;
}
.similar {
  margin-left: 24px;
  float: left;
}
.search-pos {
  float: left;
}
.search-btn {
  float: left;
  margin-left: 90px;
}
.search-image {
  width: 100%;
  height: calc(100% - 112px);
  background-color: #1b3153;
}
.tab-header {
  width: 100%;
  list-style: none;
  outline: none;
  background: #0f2243;
}
.tab-header li {
  height: 38px;
  float: left;
  padding: 0 24px;
  line-height: 38px;
  font-size: 14px;
  border-top: 2px solid #0f2343;
  outline: none;
  cursor: pointer;
  color: #8c8e98;
}
.tab-header .active {
  color: #fff;
  border-top: 2px solid #0f2243;
  background: #1c3054;
}
.search-image-list {
  width: 100%;
  height: calc(100% - 80px);
  overflow: auto;
}
.search-image-list .no-result {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.clearfix:after {
  content: '.';
  display: block;
  height: 0;
  clear: both;
  visibility: hidden;
}
</style>
