<template>
  <div class="track-page">
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
            <DatePicker v-model="startTime" @on-change="checkTime('s')" @on-clear="startTime = ''" :options="dateLimit" :editable="false" :clearable="false" type="datetime" style="width: 220px"></DatePicker>
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
          <Select  style="width:470px" v-model="caremaPos" @on-open-change="changeCamera" placeholder="点击选择抓拍位置">
            <Option style="display:none;" :value="caremaPos">{{caremaPos}}</Option>
            <VTree ref="devTree"
              :treeData="devList"
              :options="{showInput: true}"></VTree>
          </Select>
        </div>
        <div class="search-btn">
          <Button type="ghost" @click="pageCur = 1;search()"><i class="iconfont icon-jiansuozhong" style="font-size:12px;"></i> 检索</Button>
          <Button style="margin-left:15px" type="ghost" :disabled="trackList.length === 0" @click="trackAnimate"><i class="iconfont icon-guiji" style="font-size:12px;"></i> 轨迹刻画</Button>
        </div>
        </div>
      </div>
    </div>
    <div class="cartogram">
      <ul class="tab-header clearfix">
        <li :class="{active: !showList}" @click="showList = false">缩略图</li>
        <li :class="{active: showList}" @click="showList = true">列表</li>
      </ul>
      <div class="search-map">
        <t-map v-show="!showList" ref="tMap"></t-map>
        <div v-show="showList" style="height:100%; overflow:auto;">
          <bs-scroll ref="bsScrollOrg" style=" width: 100%;height: 100%;overflow: auto;">
            <Table class="track-image" :columns="columns" :data="tableList" size="small" style="height: 100%;"></Table>
          </bs-scroll>
          <!-- <Page :page-size="pageLimit" @on-page-size-change="pageSizeChange" @on-change="handlePageChange" :current="pageInfo.current" :total="pageInfo.count" :page-size-opts="$PageInfo.size" style="float:right;" show-sizer show-elevator show-total></Page> -->
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import toTreeData from 'src/assets/js/toTreeData.js'
import TMap from './map/TMap'
import { mapState, mapMutations, mapActions } from 'vuex'
export default {
  components: { TMap },
  data() {
    return {
      similar: '75%',
      startTime: this.beforeDawn(),
      endTime: new Date(),
      dateLimit: {
        disabledDate(date) {
          return date && date.valueOf() > Date.now()
        }
      },
      devList: toTreeData([]),
      imageUrl: '',
      showList: false,
      columns: [
        {
          title: '序号',
          align: 'center',
          type: 'index',
          width: 60
        },
        {
          title: '抓拍图像',
          align: 'center',
          key: 'faceImage',
          className: 'img-td',
          render: (h, params) => {
            return h('img', {
              class: params.row.class,
              attrs: {
                src: params.row.faceImage
              },
              on: {
                click: function() {
                  if (params.row.error || !params.row.faceImage) {
                    return false
                  }
                  const index = params.row.class.indexOf('big-img')
                  if (index === -1) {
                    params.row.class.push('big-img')
                  } else {
                    params.row.class.pop()
                  }
                },
                error: function() {
                  params.row.error = true
                }
              }
            })
          }
        },
        {
          title: '抓拍时间',
          align: 'center',
          key: 'timestamp'
        },
        {
          title: '抓拍位置',
          align: 'center',
          key: 'resName'
        },
        {
          title: '年龄',
          align: 'center',
          key: 'age'
        },
        {
          title: '性别',
          key: 'gender',
          align: 'center'
        },
        {
          title: '相似度',
          align: 'center',
          key: 'similar'
        }
      ],
      pageLimit: this.$PageInfo.limit,
      pageCur: 1,
      caremaPos: '全部'
    }
  },
  computed: {
    ...mapState({
      imageToSearch: state => state.veriface.imageToSearch,
      trackList: ({ veriface }) => veriface.trackList, // 人脸轨迹数据
      pageInfo: state => state.veriface.trackPageinfo,
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
    tableList() {
      const list = JSON.parse(JSON.stringify(this.trackList))
      for (let i = 0; i < list.length; i++) {
        list[i].timestamp = list[i].timestamp ? this.$moment.unix(list[i].timestamp).format('YYYY-MM-DD HH:mm:ss') : ''
        list[i].gender = list[i].gender === '1' ? '女' : list[i].gender === '2' ? '男' : ' '
        list[i].similar = list[i].similar + '%'
        list[i].class = ['people-img']
      }
      return list
    },
    passerby() {
      return this.verifaceParam.passby
    }
  },
  created() {
    this.getVerifaceTree()
      .then(res => {
        // 获取设备树
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
    ...mapMutations(['SET_IMAGE_URL', 'SET_TRACK_LIST', 'SET_TRACK_PAGE_INFO']),
    ...mapActions(['getVerifaceTree', 'getTrackCondition', 'getVerifaceParam']),
    beforeDawn() {
      const start = new Date()
      start.setHours(0)
      start.setMinutes(0)
      start.setSeconds(0)
      start.setMilliseconds(0)
      return start
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
      if (err) {
      }
      this.removeUrl()
      this.errorMsg(file.message === 'ETIMEDOUT' ? '连接超时' : file.message)
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
      if (this.trackList && this.trackList.length > 0) {
        this.clearTrack() // 清空之前的轨迹
      }
      const condition = {}
      condition.beginTime = this.$moment(this.startTime).unix('X')
      condition.endTime = this.$moment(this.endTime).unix('X')
      if (parseInt(condition.endTime) - parseInt(condition.startTime) < 0) {
        this.warningMsg('开始时间不能大于结束时间！')
        return
      }
      if (this.imageToSearch) {
        condition.isdefense = true // 查询历史报警信息
        condition.target = 'data' // 跳转后，以图搜图
      } else {
        condition.isdefense = false
      }
      condition.page = this.pageCur || 1
      condition.limit = this.pageLimit
      condition.resStr = this.$refs.devTree.getSelectedDeepIds().toString() || ''
      condition.image = this.imageUrl
      condition.similar = parseInt(this.similar)
      this.getTrackCondition(condition)
        .then(res => {
          if (res.data.length === 0) {
            this.warningMsg('查询无结果！')
          }
          this.expand()
        })
        .catch(() => {
          this.errorMsg('检索失败！')
        })
    },
    trackAnimate() {
      // 轨迹动画
      if (this.trackList && this.trackList.length > 0) {
        let tMap = this.$refs.tMap
        if (tMap && tMap.trackAnimate) {
          tMap.trackAnimate() // 控制轨迹动画
        }
      }
    },
    clearTrack() {
      // 清除轨迹绘制
      let tMap = this.$refs.tMap
      if (tMap && tMap.clearTrack) {
        tMap.clearTrack() // 清除绘制轨迹
      }
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
    checkTime(v) {
      const start = this.$moment(this.startTime).unix('X')
      const end = this.$moment(this.endTime).unix('X')
      if (parseInt(end) - parseInt(start) < 0) {
        if (v === 's') {
          this.warningMsg('开始时间不能大于结束时间！')
        } else {
          this.warningMsg('结束时间不能小于开始时间！')
        }
      }
    },
    expand() {
      this.$refs.bsScrollOrg.update()
    }
  },
  beforeDestroy() {
    this.SET_IMAGE_URL('')
    this.SET_TRACK_LIST([])
    this.SET_TRACK_PAGE_INFO()
  }
}
</script>
<style scoped>
.track-page {
  padding: 16px 0;
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
  width: 482px;
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
.img-upload img {
  width: 65px;
  height: 65px;
  cursor: pointer;
}
.condition {
  float: left;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
}
.search-label {
  margin-right: 15px;
  width: 50px;
  display: inline-block;
  text-align: right;
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
  margin-top: 16px;
}
.search-btn {
  float: left;
  margin-top: 16px;
  margin-left: 90px;
}
.cartogram {
  width: 100%;
  height: calc(100% - 112px);
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
.search-map {
  width: 100%;
  height: calc(100% - 38px);
  background-color: #1b3153;
}
.clearfix:after {
  content: '.';
  display: block;
  height: 0;
  clear: both;
  visibility: hidden;
}
</style>
<style>
.track-image .img-td {
  position: relative;
  overflow: inherit;
}
.track-image .people-img {
  display: inline-block;
  outline: none;
  height: 32px;
  width: 32px;
  cursor: pointer;
}
.track-image .big-img {
  position: absolute;
  width: 120px;
  height: 150px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}
</style>
