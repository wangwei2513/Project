<template>
  <div class="calendarinputgroup">
    <div class="starttime">
      <span>{{$t('playBack.startTime')}}</span>
      <div class="checkdate">
        <input type="text"
               readonly
               :tabindex="tabindex"
               class="timebox form-control"
               v-model='checkTimeStart'
               v-on:focus='clicks'
               :style="{width:width + 'px'}"
               v-on:change='changecheck1'
               @click='calendarclick' />
        <label class="icon iconfont icon-rili"
               @click='clicks'></label>
        <calendar v-show='hideStart.startF'
                  showtime=true
                  class='calendars'
                  @checktimes="getStart"
                  :hide='hideStart'
                  :defaultdate='defaultdate1'
                  :width='width'
                  :timesback='timesBackStart'
                  @click='calendarclick'></calendar>
      </div>
    </div>
    <div class="endtime">
      <span>{{$t('playBack.endTime')}}</span>
      <div class="checkdate">
        <input type="text"
               readonly
               :tabindex="tabindex"
               class="timebox form-control"
               v-model='checkTimeEnd'
               v-on:focus='clicks1'
               :style="{width:width + 'px'}"
               v-on:change='changecheck2'
               @click='calendarclick' />
        <label class="icon iconfont icon-rili"
               @click='clicks1'></label>
        <calendar v-show='hideEnd.endF'
                  showtime=true
                  class='calendars'
                  @checktimes="getEnd"
                  :hide='hideEnd'
                  :defaultdate='defaultdate2'
                  :width='width'
                  :timesback='timesBackEnd'
                  @click='calendarclick'></calendar>
      </div>
    </div>
  </div>
</template>

<script>
import calendar from './BScalendar.vue'
export default {
  name: 'BSdateRange',
  components: {
    calendar
  },
  props: {
    defaultdate1: { type: String },
    defaultdate2: { type: String },
    width: {
      default: 244
    },
    tabindex: {
      type: [String, Number],
      default: 'none'
    }
  },
  data() {
    return {
      checkTimeStart: this.$t('commonComponents.calendar.select'),
      checkTimeEnd: this.$t('commonComponents.calendar.select'),
      hideStart: { startF: false },
      hideEnd: { endF: false },
      timesTampStart: '',
      timesTampEnd: '',
      timesBackStart: { time: '', newTime: '' },
      timesBackEnd: { time: '', newTime: '' }
    }
  },
  methods: {
    getStart(msg) {
      this.checkTimeStart = msg.time
      this.hideStart.startF = msg.f
      this.timesTampStart = msg.t.getTime()
      if (this.timesTampEnd < this.timesTampStart && this.timesTampEnd !== '') {
        this.checkTimeEnd = this.checkTimeStart
        this.timesTampEnd = this.timesTampStart
        this.timesBackEnd.time = this.checkTimeStart
        this.timesBackEnd.newTime = new Date()
      }
      this.$emit('starendtime', { start: this.checkTimeStart, end: this.checkTimeEnd, startTimes: this.timesTampStart, endTimes: this.timesTampEnd })
    },
    getEnd(msg) {
      this.checkTimeEnd = msg.time
      this.hideEnd.endF = msg.f
      this.timesTampEnd = msg.t.getTime()
      if (this.timesTampEnd < this.timesTampStart && this.timesTampStart !== '') {
        this.checkTimeStart = this.checkTimeEnd
        this.timesTampStart = this.timesTampEnd
        this.timesBackStart.time = this.checkTimeEnd
        this.timesBackStart.newTime = new Date()
      }
      this.$emit('starendtime', { start: this.checkTimeStart, end: this.checkTimeEnd, startTimes: this.timesTampStart, endTimes: this.timesTampEnd })
    },
    changecheck1: function() {
      this.hideStart.startF = false
    },
    changecheck2: function() {
      this.hideEnd.endF = false
    },
    clicks: function(e) {
      e.stopPropagation()
      if (this.hideStart.startF) {
        this.hideStart.startF = false
      } else {
        this.hideStart.startF = true
      }
      this.hideEnd.endF = false
    },
    clicks1: function(e) {
      e.stopPropagation()
      if (this.hideEnd.endF) {
        this.hideEnd.endF = false
      } else {
        this.hideEnd.endF = true
      }
      this.hideStart.startF = false
    },
    calendarclick: function(e) {
      e.stopPropagation()
    }
  },
  created: function() {
    if (this.defaultdate1) {
      this.checkTimeStart = this.defaultdate1
      this.timesTampStart = new Date(this.defaultdate1.replace(/-/g, '/')).getTime()
    }
    if (this.defaultdate2) {
      this.checkTimeEnd = this.defaultdate2
      this.timesTampEnd = new Date(this.defaultdate2.replace(/-/g, '/')).getTime()
    }
    this.bindedOnClick = () => {
      if (this.hideStart.startF) {
        this.hideStart.startF = false
        this.timesBackStart.time = this.checkTimeStart
        this.timesBackStart.newTime = new Date()
      }
      if (this.hideEnd.endF) {
        this.hideEnd.endF = false
        this.timesBackEnd.time = this.checkTimeEnd
        this.timesBackEnd.newTime = new Date()
      }
    }
  },
  mounted: function() {
    document.querySelector('body').addEventListener('click', this.bindedOnClick, false)
  },
  beforeDestroy() {
    document.querySelector('body').removeEventListener('click', this.bindedOnClick)
    this.bindedOnClick = null
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0px;
  padding: 0px;
}

.calendarinputgroup {
  height: auto;
  width: 100%;
  margin-left: 4px;
}

.calendarinputgroup:after {
  content: '';
  display: block;
  clear: both;
}

.starttime,
.endtime {
  float: left;
  font-size: 12px;
  width: 350px;
  height: 26px;
  color: #414141;
  margin-bottom: 8px;
}

.starttime {
  margin-right: 70px;
}

.checkdate {
  width: 230px;
  position: relative;
  height: 26px;
  font-size: 14px;
  float: right;
}

.checkdate label {
  position: absolute;
  color: #414141;
  font-size: 18px;
  right: 4px;
  top: 2px;
  cursor: pointer;
}

.timebox {
  height: 26px;
  padding: 0 10px;
  color: #414141;
  border-radius: 2px;
  font-size: 12px;
  cursor: default;
  background: #fff;
}

.calendars {
  position: absolute;
  left: 0;
  top: 27px;
  z-index: 999;
}

.starttime>span,
.endtime>span {
  display: inline-block;
  line-height: 26px;
}
</style>
