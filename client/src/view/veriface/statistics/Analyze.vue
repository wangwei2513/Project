<template>
  <div class="content">
    <Form inline :label-width="20">
      <Form-item>
        <Select placeholder="点击选择机构" v-model="caremaPos" style="width: 300px;">
          <Option style="display:none;" value="all">全部</Option>
          <VTree ref="devTree" :treeData="devList" :options="{
                showInput: true
              }"></VTree>
        </Select>
      </Form-item>
      <Form-item label="">
        <Date-picker :options="{
            disabledDate (date) {
              return date && date.valueOf() > Date.now()
            }
          }" v-model="dateRange" type="daterange" placement="bottom-start" placeholder="选择日期" style="width: 200px" :clearable="false"></Date-picker>
      </Form-item>
      <Form-item>
        <Button-group style="width: 200px;">
          <Button :class="{'active': timeFrame === 7}" type="ghost" style="width: 33.33%" @click="setDate($event, 7)">7天</Button>
          <Button :class="{'active': timeFrame === 14}" type="ghost" style="width: 33.33%" @click="setDate($event, 14)">14天</Button>
          <Button :class="{'active': timeFrame === 30}" type="ghost" style="width: 33.33%" @click="setDate($event, 30)">30天</Button>
        </Button-group>
      </Form-item>
      <Form-item>
        <div style="margin-left: 20px;">
          <Button type="ghost" style="width: 90px; margin-right: 10px;" @click="getChartData">统计</Button>
          <Button type="ghost" @click="exportData" style="width: 90px;">导出</Button>
        </div>
      </Form-item>
    </Form>
    <div class="cartogram">
      <Row>
        <Col span="24">
        <ul class="tabHeader clearfix">
          <span class="title-font" style="float:left;margin-right:100px;">指标详解</span>
        </ul>
        <BSechart style="width:50%; height:500px;float:left" :options="passbyChartOption"></BSechart>
        <BSechart style="width:50%; height:500px;float:left" :options="alarmChartOption"></BSechart>
        <div style="width:50%;float:left;text-align: center;font-size: 20px;">路人识别量</div>
        <div style="width:50%;float:left;text-align: center;font-size: 20px;">布控报警量</div>
        </Col>
      </Row>
    </div>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import BSechart from 'components/BSechart'
import toTreeData from '../../../assets/js/toTreeData.js'
export default {
  components: {
    BSechart
  },
  data() {
    return {
      elemIF: null,
      alarmChartOption: null,
      passbyChartOption: null,
      nowDate: this.$moment().format('YYYY-MM-DD'),
      dateRange: [],
      caremaPos: 'all',
      todayChartData: [
        {
          date: this.$moment().format('YYYY-MM-DD'),
          hourData: [],
          label: [1, 2, 3, 4, 5, 6, 7]
        }
      ],
      devList: [],
      groupList: [
        {
          id: '1',
          name: '对比识别总数'
        },
        {
          id: '2',
          name: '布控识别总数'
        }
      ],
      echartActive: '1'
    }
  },
  created() {
    this.setDate('', 7)
    this.getVerifaceTree().then(res => {
      this.devList = toTreeData([res.data])
      const param = {
        startTime: this.$moment(this.dateRange[0]).unix('X'),
        endTime: this.$moment(this.dateRange[1]).unix('X'),
        id: this.echartActive,
        points: ''
      }
      this.getVerifaceStatisticAnalysis(param).then(res => {
        this.drawChart()
      })
    })
  },
  methods: {
    ...mapActions(['getVerifaceTree', 'getAnalyzeExportData', 'getVerifaceStatisticAnalysis']),
    changeActive(item) {
      this.echartActive = item.id
      this.drawChart()
    },
    setDate(e, n) {
      const moment = this.$moment
      const start = new Date(moment(moment().format('YYYY-MM-DD')) - 3600 * 1000 * 24 * (n - 1))
      const end = new Date(moment(moment().format('YYYY-MM-DD')))
      const dateRange = []
      dateRange[0] = start
      dateRange[1] = end
      this.dateRange = JSON.parse(JSON.stringify(dateRange))
    },
    drawChart() {
      const alarmChartSeries = []
      const passbyChartSeries = []
      const colorList = [
        {
          color: '#83CB71',
          areaColor: 'rgba(131, 203, 113, .3)'
        },
        {
          color: 'rgba(229, 198,90, .9)',
          areaColor: 'rgba(229, 198, 90, .3)'
        }
      ]
      const chartDataAlarm = JSON.parse(JSON.stringify(this.todayChartData))
      const chartDataPassby = JSON.parse(JSON.stringify(this.todayChartData))

      chartDataAlarm.map((item, index) => {
        alarmChartSeries.push({
          type: 'line',
          smooth: true,
          data: this.deployData.data,
          label: {
            formatter: '{ a }:{ b }'
          },
          itemStyle: {
            normal: {
              color: colorList[index].color
            }
          },
          areaStyle: {
            normal: {
              color: colorList[index].areaColor
            }
          }
        })
      })
      chartDataPassby.map((item, index) => {
        passbyChartSeries.push({
          type: 'line',
          smooth: true,
          data: this.contrastData.data,
          label: {
            formatter: '{ a }:{ b }'
          },
          itemStyle: {
            normal: {
              color: colorList[index].color
            }
          },
          areaStyle: {
            normal: {
              color: colorList[index].areaColor
            }
          }
        })
      })
      this.alarmChartOption = {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: 'red' // 0% 处的颜色
            },
            {
              offset: 1,
              color: 'blue' // 100% 处的颜色
            }
          ],
          globalCoord: false // 缺省为 false
        },
        grid: {
          left: '80px',
          right: '20px',
          top: 40,
          bottom: 40
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params, callback) => {
            let title = params.length ? `时间 :${params[0].axisValue}<br />` : ''
            let allData = []
            params.map((item, index) => {
              allData.push(`数量:${item.data}`)
            })
            let str = title + allData.join('<br />')
            return str
          }
        },
        legend: {
          data: this.todayChartData.map(v => {
            return v.date
          }),
          textStyle: {
            color: '#fff'
          }
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.deployData.label,
          axisLine: {
            lineStyle: {
              color: '#fff'
            }
          }
        },
        yAxis: {
          type: 'value',
          axisLine: {
            lineStyle: {
              color: '#fff'
            }
          },
          min: this.chartMinY
        },
        series: alarmChartSeries
      }
      this.passbyChartOption = {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: 'red' // 0% 处的颜色
            },
            {
              offset: 1,
              color: 'blue' // 100% 处的颜色
            }
          ],
          globalCoord: false // 缺省为 false
        },
        grid: {
          left: '80px',
          right: '20px',
          top: 40,
          bottom: 40
        },
        tooltip: {
          trigger: 'axis',
          formatter: (params, callback) => {
            let title = params.length ? `时间 :${params[0].axisValue}<br />` : ''
            let allData = []
            params.map(item => {
              allData.push(`数量:${item.data}`)
            })
            let str = title + allData.join('<br />')
            return str
          }
        },
        legend: {
          data: this.todayChartData.map(v => {
            return v.date
          }),
          textStyle: {
            color: '#fff'
          }
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.contrastData.label,
          axisLine: {
            lineStyle: {
              color: '#fff'
            }
          }
        },
        yAxis: {
          type: 'value',
          axisLine: {
            lineStyle: {
              color: '#fff'
            }
          },
          min: this.chartMinY
        },
        series: passbyChartSeries
      }
    },
    getChartData() {
      const selectTree = this.$refs.devTree ? this.$refs.devTree.getSelectedDeepNameIds() : {}
      if (selectTree.name.length === 0 || selectTree.name.length === selectTree.count) {
        this.caremaPos = 'all'
      } else {
        this.caremaPos = 'part'
      }
      const param = {
        startTime: this.$moment(this.dateRange[0]).unix('X'),
        endTime: this.$moment(this.dateRange[1]).unix('X'),
        id: this.echartActive,
        points: selectTree.id ? selectTree.id.toString() : ''
      }
      this.getVerifaceStatisticAnalysis(param).then(res => {
        this.drawChart()
      })
    },
    exportData() {
      const param = {
        startTime: this.$moment(this.dateRange[0]).unix('X'),
        endTime: this.$moment(this.dateRange[1]).unix('X'),
        points: this.$refs.devTree.getSelectedDeepIds().toString() || ''
      }
      let str = []
      for (let item in param) {
        str.push(`${item}=${param[item]}`)
      }
      if (!this.elemIF) {
        this.elemIF = document.createElement('iframe')
      }
      this.elemIF.src = window.location.origin + `/api/veriface/statistic/analysis/export?${str.join('&')}`
      this.elemIF.style.display = 'none'
      document.body.appendChild(this.elemIF)
    },
    dateSelected(date) {},
    tabChange(name) {}
  },
  watch: {
    sysTabActive(val) {
      this.getChartData()
      this.getResTree(this.sysTabActive === 'current' ? '0' : '1').catch(err => {
        this.$Notice.warning({
          title: '获取人脸资源机构树失败',
          desc: err.response.data.message,
          duration: 1
        })
      })
    },
    faceResTree: {
      handler(val) {
        this.devList = this.$lodash.cloneDeep(val)
      },
      deep: true
    },
    analyzeChart: {
      handler(val) {
        this.chart = this.$lodash.cloneDeep(val)

        this.drawChart()
      },
      deep: true
    }
  },
  computed: {
    ...mapState({
      contrastData: state => state.veriface.contrastData,
      deployData: state => state.veriface.deployData
    }),
    timeFrame() {
      const moment = this.$moment
      return (moment(this.dateRange[1]) - moment(this.dateRange[0])) / 1000 / 3600 / 24 + 1
    },
    chartData() {
      return this.echartActive === '1' ? this.contrastData : this.deployData
    },
    passbyData() {
      const arr = []
      this.contrastData.forEach(item => {
        arr.push(item.count)
      })
      return arr
    },
    passbyTime() {
      const arr = []
      this.contrastData.forEach(item => {
        arr.push(this.$moment(item.date).format('YYYY-MM-DD'))
      })
      return arr
    },
    alarmData() {
      const arr = []
      this.deployData.forEach(item => {
        arr.push(item.count)
      })
      return arr
    },
    alarmTime() {
      const arr = []
      this.deployData.forEach(item => {
        arr.push(this.$moment(item.date).format('YYYY-MM-DD'))
      })
      return arr
    }
  },
  beforeDestroy() {
    this.elemIF = null
  }
}
</script>

<style lang="less" scoped>
.content {
  flex: 1;
  padding: 0;
}
.clearfix:after {
  content: '.';
  display: block;
  height: 0;
  clear: both;
  visibility: hidden;
}

.cartogram {
  position: relative;
}

.tabHeader {
  width: 100%;
  list-style: none;
  outline: none;
  background: #0f2343;
  margin-bottom: 16px;
  li {
    height: 34px;
    float: left;
    padding: 0 10px;
    line-height: 34px;
    font-size: 14px;
    border-top: 2px solid #0f2343;
    outline: none;
    margin-bottom: -1px;
    cursor: pointer;
    // border-right: 2px solid #0f1e3b;
    color: #8c8e98;
  }
  .active {
    color: #fff;
    border-top: 2px solid #0f2243;
    background: #1c3053;
  }
}

.title-font {
  height: 34px;
  line-height: 34px;
  font-size: 16px;
  font-weight: bold;
  margin-left: 15px;
}

.title-style {
  font-size: 18px;
  color: #0099ff;
  height: 36.8px;
  line-height: 36.8;
}

.ivu-BStabs-nav .ivu-BStabs-tab-disabled {
  font-size: 16px;
  font-weight: bold;
  color: #495060 !important;
}
.ivu-form-item {
  margin-top: 13px;
  margin-bottom: 13px;
}
</style>
