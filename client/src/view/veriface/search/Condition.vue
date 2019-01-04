<template>
  <div class="track-page">
    <!-- 条件检索 -->
    <div class="track-condition clearfix">
      <div class="condition">
        <Form :model="condition" inline :label-width="60">
          <FormItem style="margin-bottom:16px;" label="时间段" prop="baserary">
            <DatePicker v-model="startTime" @on-change="checkTime('s')" @on-clear="startTime = ''" :options="dateLimit" :editable="false" :clearable="false" type="datetime" style="width: 220px"></DatePicker>
            <span style="padding: 0 5px;">至</span>
            <DatePicker v-model="endTime" @on-change="checkTime('e')" @on-clear="endTime = ''" :options="dateLimit" :editable="false" :clearable="false" type="datetime" style="width: 220px"></DatePicker>
          </FormItem>
          <FormItem label="性别" prop="personSex" style="margin-bottom:16px;">
            <Select v-model="condition.gender" placeholder="请选择" style="width:240px;">
              <Option value="all">全部</Option>
              <Option value="2">男</Option>
              <Option value="1">女</Option>
            </Select>
          </FormItem>
          <FormItem label="年龄范围" style="margin-left:16px;margin-bottom:16px;">
            <Input-number :max="99"
              :min="0"
              v-model="condition.startAge"
              :formatter="value => parseInt(value)"
              class="age-num"></Input-number>
              <span class="age-size">至</span>
            <Input-number :max="100"
              :min="condition.startAge"
              v-model="condition.endAge"
              :formatter="value => parseInt(value)"
              class="age-num"></Input-number>
          </FormItem>
        </Form>
        <Form :model="condition" inline :label-width="60">
          <FormItem label="抓拍位置" style="margin-bottom:16px;">
            <Select style="width:470px" v-model="caremaPos" @on-open-change="changeCamera" placeholder="点击选择抓拍位置">
              <Option style="display:none;" :value="caremaPos">{{caremaPos}}</Option>
              <VTree ref="devTree"
                :treeData="devList"
                :options="{showInput: true}"></VTree>
            </Select>
          </FormItem>
          <Button class="search-btn" type="ghost" @click="pageCur = 1;search()"><i class="iconfont icon-jiansuozhong" style="font-size:12px;"></i> 检索</Button>
          <Button class="search-btn" type="ghost" :disabled="passerList.length === 0" @click="exportData"><i class="iconfont icon-export" style="font-size:12px;"></i> 导出</Button>
        </Form>
      </div>
    </div>
    <div class="search-image clearfix">
      <ul class="tab-header clearfix">
        <li class="active">缩略图</li>
      </ul>
      <div class="search-image-list">
        <div v-if="passerList.length === 0" class="no-result">暂无数据</div>
        <SingImage style="float:left;" v-for="(item,j) in passerList" :key="j" :picInfo="item"></SingImage>
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
      devList: toTreeData([]),
      condition: {
        startTime: '' || this.$moment(this.$moment().format('YYYY-MM-DD')).unix('X'),
        endTime: '' || this.$moment().unix('X'),
        gender: 'all',
        startAge: 0,
        endAge: 100,
        points: '',
        group: 'stranger',
        page: '',
        limit: 100
      },
      startTime: '',
      endTime: '',
      dateLimit: {
        disabledDate(date) {
          return date && date.valueOf() > Date.now()
        }
      },
      pageLimit: this.$PageInfo.limit,
      pageCur: 1,
      caremaPos: '全部'
    }
  },
  computed: {
    ...mapState({
      passerList: state => state.veriface.passerList,
      pageInfo: state => state.veriface.passerPageinfo,
      defaultSearch: state => state.veriface.defaultSearch,
      verifaceParam: state => state.veriface.verifaceParam
    }),
    passerby() {
      return this.verifaceParam.passby
    }
  },
  mounted() {
    if (this.passerby) {
      this.getVerifaceTree()
        .then(res => {
          // 获取设备树
          this.devList = toTreeData([res.data])
          this.$nextTick(() => {
            if (this.defaultSearch) {
              // 是否直接检索
              this.startTime = this.beforeDawn()
              this.endTime = new Date()
              this.search()
              this.SET_DEFAULT_SEARCH(false)
            }
          })
        })
        .catch(err => {
          console.log('获取设备树出错', err)
        })
    }
  },
  created() {
    this.setDate() // 设置默认时间段为近一个月
    this.getVerifaceParam()
  },
  methods: {
    ...mapMutations(['SET_PASSER_LIST', 'SET_DEFAULT_SEARCH', 'SET_PASSER_CONDITION']),
    ...mapActions(['getVerifaceTree', 'getPasserCondition', 'getVerifaceParam', 'getPasserExport']),
    setDate() {
      this.startTime = this.$moment(this.$moment(new Date()).subtract(1, 'months')).format('YYYY-MM-DD') + ' 00:00:00'
      this.endTime = new Date()
    },
    beforeDawn() {
      const start = new Date()
      start.setHours(0)
      start.setMinutes(0)
      start.setSeconds(0)
      start.setMilliseconds(0)
      return start
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
        this.warningMsg('未开启路人库!')
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
      if (this.condition.startAge === null || this.condition.endAge === null) {
        this.warningMsg('年龄范围不能为空！')
        return
      }

      this.condition.startTime = this.$moment(this.startTime).unix('X')
      this.condition.endTime = this.$moment(this.endTime).unix('X')
      if (parseInt(this.condition.endTime) - parseInt(this.condition.startTime) < 0) {
        this.warningMsg('开始时间不能大于结束时间！')
        return
      }
      this.condition.points = this.$refs.devTree.getSelectedDeepIds().toString() || ''
      this.condition.page = Number(this.pageCur) || 1
      this.condition.limit = Number(this.pageLimit)
      this.getPasserCondition(this.condition)
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
      this.condition.startTime = this.$moment(this.startTime).unix('X')
      this.condition.endTime = this.$moment(this.endTime).unix('X')
      if (parseInt(this.condition.endTime) - parseInt(this.condition.startTime) < 0) {
        this.warningMsg('开始时间不能大于结束时间！')
        return
      }
      this.condition.points = this.$refs.devTree ? this.$refs.devTree.getSelectedDeepIds().toString() : ''
      const param = JSON.parse(JSON.stringify(this.condition))
      param.limit = this.pageInfo.count > 99999 ? 99999 : this.pageInfo.count
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
        return
      }
      const end = this.$moment(this.$moment(this.startTime).add(3, 'months')).unix('X')
      if (curend > end) {
        this.warningMsg('时间段最大间隔为3个月!')
        this.setDate(31)
      }
    }
  },
  beforeDestroy() {
    this.SET_PASSER_LIST([])
    this.SET_PASSER_CONDITION()
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
}
.condition {
  width: 100%;
  padding: 16px 24px;
  padding-bottom: 0;
  background-color: #1b3153;
}
.age-size {
  margin: 0 5px;
  float: left;
  width: 16px;
  display: block;
  height: 32px;
}
.age-num {
  width: 64px;
  height: 32px;
  float: left;
}
.search-btn {
  margin-left: 24px;
}
.search-image {
  width: 100%;
  height: calc(100% - 114px);
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
  padding: 12px 24px;
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
