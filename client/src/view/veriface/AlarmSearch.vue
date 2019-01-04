<template>
  <div class="alarm-search">
    <div class="search-condition">
      <Form :model="condition" :rules="inforules" inline :label-width="85">
        <FormItem style="width:270px;margin-bottom:16px;" label="底库选择" prop="group">
          <Select v-model="condition.group">
            <Option value="all">全部</Option>
            <Option v-for="(item,j) in baseraryChange" :key="j" :value="item.label">{{item.value}}</Option>
          </Select>
        </FormItem>
        <FormItem style="width:270px;margin-bottom:20px;" label="姓名" prop="name">
          <Input type="text" v-model="condition.name" placeholder="请输入姓名">
          </Input>
        </FormItem>
        <FormItem style="width:270px;margin-bottom:16px;" label="性别" prop="gender">
          <Select v-model="condition.gender">
            <Option value="all">全部</Option>
            <Option value="2">男</Option>
            <Option value="1">女</Option>
          </Select>
        </FormItem>
        <FormItem style="width:270px;margin-bottom:16px;" label="相似度大于">
          <Select v-model="similar">
            <Option v-for="(item,j) in pecentNum" :key="j" :value="item">{{item}}</Option>
          </Select>
        </FormItem>
      </Form>
      <div class="search-time clearfix">
        <div>
          <span class="search-label">时段选择</span>
          <DatePicker v-model="startTime" @on-change="checkTime('s')" @on-clear="startTime = ''" :options="dateLimit" :editable="false" :clearable="false" type="datetime" style="width: 220px"></DatePicker>
          <span style="padding: 0 5px;">至</span>
          <DatePicker v-model="endTime" @on-change="checkTime('e')" @on-clear="endTime = ''" :options="dateLimit" :editable="false" :clearable="false" type="datetime" style="width: 220px"></DatePicker>
        </div>
        <div>
          <span class="search-pos">抓拍位置</span>
          <Select style="width:470px" v-model="caremaPos" @on-open-change="changeCamera" placeholder="点击选择抓拍位置">
            <Option style="display:none;" :value="caremaPos">{{caremaPos}}</Option>
            <VTree ref="devTree"
              :treeData="devList"
              :options="{showInput: true}"></VTree>
          </Select>
        </div>
        <div class="search-btn">
          <Button type="ghost" @click="pageCur = 1;search()"><i class="iconfont icon-jiansuozhong" style="font-size:12px;"></i> 检索</Button>
          <Button type="ghost" :disabled="alarmList.length === 0" @click="exportData"><i class="iconfont icon-export" style="font-size:12px;"></i> 导出</Button>
        </div>
      </div>
    </div>
    <div class="cartogram">
      <ul class="tab-header clearfix">
        <li class="active">缩略图</li>
      </ul>
      <div class="search-img">
        <div class="search-image-list">
          <div v-if="alarmList.length === 0" class="no-result">暂无数据</div>
          <BaseImage style="float:left;" v-for="(item,j) in alarmList || []" :key="j" :picInfo="item"></BaseImage>
        </div>
        <Page :page-size="pageLimit" @on-page-size-change="pageSizeChange" @on-change="handlePageChange" :current="pageInfo.current" :total="pageInfo.count" :page-size-opts="$PageInfo.size" style="float:right;" show-sizer show-elevator show-total></Page>
      </div>
    </div>
  </div>
</template>
<script>
import BaseImage from './alarmsearch/BaseImage.vue'
import toTreeData from 'src/assets/js/toTreeData.js'
import { mapState, mapMutations, mapActions } from 'vuex'
export default {
  components: { BaseImage },
  data() {
    return {
      condition: {
        group: 'all',
        name: '',
        gender: 'all'
      },
      similar: '75%',
      startTime: this.beforeDawn(),
      endTime: new Date(),
      dateLimit: {
        disabledDate(date) {
          return date && date.valueOf() > Date.now()
        }
      },
      devList: toTreeData([]),
      inforules: {
        name: [{ validator: this.validateName, trigger: 'change' }]
      },
      pageLimit: this.$PageInfo.limit,
      pageCur: 1,
      caremaPos: '全部'
    }
  },
  mounted() {},
  created() {
    this.getVerifaceTree()
      .then(res => {
        // 获取设备树
        this.devList = toTreeData([res.data])
        this.$nextTick(() => {
          if (this.defaultSearch) {
            // 是否直接检索
            this.search()
            this.SET_DEFAULT_SEARCH(false)
          }
        })
      })
      .catch(err => {
        console.log('获取设备树出错', err)
      })
    this.getbaserary()
    this.getVerifaceParam()
  },
  computed: {
    ...mapState({
      alarmList: state => state.veriface.alarmList,
      baserary: state => state.veriface.baserary,
      pageInfo: state => state.veriface.alarmPageinfo,
      defaultSearch: state => state.veriface.defaultSearch,
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
    },
    baseraryChange() {
      let list = JSON.parse(JSON.stringify(this.baserary))
      for (let i = 0; i < list.length; i++) {
        if (!this.passerby && list[i].value === '路人库') {
          list.splice(i, 1)
        }
      }
      return list
    }
  },
  methods: {
    ...mapMutations(['SET_ALARM_LIST', 'SET_DEFAULT_SEARCH', 'SET_ALARM_PAGE_INFO']),
    ...mapActions(['getVerifaceTree', 'getbaserary', 'getAlarmCondition', 'getAlarmExport', 'getVerifaceParam']),
    beforeDawn() {
      const start = new Date()
      start.setHours(0)
      start.setMinutes(0)
      start.setSeconds(0)
      start.setMilliseconds(0)
      return start
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
    changeCamera() {
      const selectTree = this.$refs.devTree ? this.$refs.devTree.getSelectedDeepNameIds() : {}
      if (selectTree.name.length === 0 || selectTree.name.length === selectTree.count) {
        this.caremaPos = '全部'
      } else {
        this.caremaPos = selectTree.name.join(';')
      }
    },
    search() {
      if (!this.startTime) {
        this.warningMsg('开始时间不能为空！')
        return
      }
      if (!this.endTime) {
        this.warningMsg('结束时间不能为空！')
        return
      }
      this.condition.startTime = this.$moment(this.startTime).unix('X')
      this.condition.endTime = this.$moment(this.endTime).unix('X')
      if (parseInt(this.condition.endTime) - parseInt(this.condition.startTime) < 0) {
        this.warningMsg('开始时间不能大于结束时间！')
        return
      }
      this.condition.points = this.$refs.devTree.getSelectedDeepIds().toString() || ''
      this.condition.page = this.pageCur || 1
      this.condition.limit = this.pageLimit
      this.condition.similar = parseInt(this.similar)
      this.getAlarmCondition(this.condition)
        .then(res => {
          if (res.data.length === 0) {
            this.warningMsg('查询无结果！')
          }
        })
        .catch(() => {
          this.errorMsg('检索失败！')
        })
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
      this.getAlarmExport(str.join('&'))
        .then(() => {
          if (!this.elemIF) {
            this.elemIF = document.createElement('iframe')
          }
          this.elemIF.src = window.location.origin + `/api/veriface/statistic/alarm/export?${str.join('&')}`
          this.elemIF.style.display = 'none'
          document.body.appendChild(this.elemIF)
        })
        .catch(() => {
          this.errorMsg('导出失败！')
        })
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
    validateName(rule, value, callback) {
      if (value.indexOf(' ') !== -1) {
        return callback(new Error('不能输入空格'))
      }
      let strlen = 0
      for (let i = 0; i < value.length; i++) {
        if (value.charCodeAt(i) > 255) {
          strlen += 2
        } else {
          strlen++
        }
      }
      if (strlen > 16) {
        return callback(new Error('请输入小于16位字符的内容'))
      } else {
        return callback()
      }
    }
  },
  beforeDestroy() {
    this.SET_ALARM_LIST([])
    this.SET_ALARM_PAGE_INFO()
  }
}
</script>
<style scoped>
.alarm-search {
  padding: 16px 0;
  width: 100%;
  height: 100%;
}
.search-condition {
  width: 100%;
  padding: 16px 0;
  background-color: #1b3153;
}
.search-time > div {
  float: left;
}
.search-label {
  margin-left: 24px;
  margin-right: 10px;
}
.search-pos {
  margin-left: 36px;
  margin-right: 10px;
}
.search-btn {
  margin-left: 24px;
}
.search-btn > button {
  margin-left: 16px;
}
.clearfix:after {
  content: '.';
  display: block;
  height: 0;
  clear: both;
  visibility: hidden;
}
.cartogram {
  width: 100%;
  height: calc(100% - 115px);
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
.search-img {
  width: 100%;
  height: calc(100% - 36px);
  background-color: #1b3153;
  padding: 16px;
}

.search-image-list {
  width: 100%;
  height: calc(100% - 35px);
  overflow: auto;
}
.search-image-list .no-result {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
