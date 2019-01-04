<template>
  <div>
    <div class="scrollbar" :class="{disable: !hasContentToSroll}" :style="{margin: `0 ${doption.margin}`, background: doption.background, width: doption.width, height: `${trackSize}px`}" onselectstart="return false">
      <div class="track" :style="{height: `${trackSize}px`}" @mousedown.self="start($event, true)" @mouseup="end">
        <div class="thumb" :style="{background: doption.color, top: `${thumbPositionValue}px`, height: `${thumbSize}px`}" @mousedown="start">
          <div class="end"></div>
        </div>
      </div>
    </div>
    <div class="viewport">
      <div class="overview" :style="{top: `${-contentPosition}px`}" @mousewheel.stop="wheel">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
<script>
import Vue from 'vue'
import './tinyscrollbar.css'
export default {
  props: {
    option: {
      type: Object
    },
    wheelSpeed: {
      type: Number,
      default: 40
    }
  },
  data() {
    return {
      contentPosition: 0,
      thumbPosition: 0,
      contentSize: 0,
      viewportSize: 0,
      trackRatio: 0,
      trackSize: 0,
      thumbSize: 0,
      contentRatio: 0,
      hasContentToSroll: false,
      tempStop: false,
      mousePosition: 0,
      thumbPositionCalc: null,
      thumbSizeMin: 20,
      doption: {
        color: '#909090',
        background: '#e3e3e3',
        width: '10px',
        margin: '0'
      }
    }
  },
  computed: {
    thumbPositionValue() {
      return this.thumbPositionCalc === null ? this.thumbPosition : this.thumbPositionCalc
    }
  },
  methods: {
    wheel(e) {
      if (this.hasContentToSroll) {
        const wheelSpeedDelta = -(e.deltaY || e.detail || (-1 / 3 * e.wheelDelta)) / 40
        this.contentPosition -= wheelSpeedDelta * this.wheelSpeed
        this.contentPosition = Math.min((this.contentSize - this.viewportSize), Math.max(0, this.contentPosition))
        this.thumbPosition = this.contentPosition / this.trackRatio
        if (this.isAtBegin() || this.isAtEnd()) {
          e.preventDefault()
        }
      }
    },
    isAtBegin() {
      return this.contentPosition > 0
    },
    isAtEnd() {
      return this.contentPosition <= (this.contentSize - this.viewportSize) - 5
    },
    updateScroll(scrollTo) {
      this.viewportSize = this.$viewport.offsetHeight
      this.contentSize = this.$overview.scrollHeight
      this.contentRatio = this.viewportSize / this.contentSize
      this.trackSize = this.viewportSize
      this.thumbSize = Math.min(this.trackSize, Math.max(this.thumbSizeMin, this.trackSize * this.contentRatio))
      this.trackRatio = (this.contentSize - this.viewportSize) / (this.trackSize - this.thumbSize)
      this.hasContentToSroll = this.contentRatio < 1

      switch (scrollTo) {
        case 'bottom':
          this.contentPosition = Math.max(this.contentSize - this.viewportSize, 0)
          break

        case 'relative':
          this.contentPosition = Math.min(Math.max(this.contentSize - this.viewportSize, 0), Math.max(0, this.contentPosition))
          break

        default:
          this.contentPosition = parseInt(scrollTo, 10) || 0
      }
      this.thumbPosition = this.contentPosition / this.trackRatio
    },
    start(e, gotoMouse) {
      if (this.hasContentToSroll) {
        this.mousePosition = gotoMouse ? this.$thumb.getBoundingClientRect().top : e.clientY
        document.body.classList.add('noSelect')
        document.addEventListener('mousemove', this.drag)
        document.addEventListener('mouseup', this._end)
        this.drag(e)
      }
    },
    end() {
      this.thumbPosition = parseInt(this.thumbPositionCalc, 10)
      this.thumbPositionCalc = null
      document.removeEventListener('mousemove', this.drag)
      document.removeEventListener('mouseup', this._end)
      document.body.classList.remove('noSelect')
    },
    _drag(e) {
      if (this.hasContentToSroll) {
        const mousePositionNew = e.clientY
        const thumbPositionDelta = mousePositionNew - this.mousePosition
        const thumbPositionNew = Math.min((this.trackSize - this.thumbSize), Math.max(0, this.thumbPosition + thumbPositionDelta))
        this.contentPosition = thumbPositionNew * this.trackRatio
        this.thumbPositionCalc = thumbPositionNew
        if (isNaN(thumbPositionNew)) {
          this.thumbPositionCalc = 0
        }
      }
    }
  },
  created() {
    Object.assign(this.doption, Vue.ScrollOption)
    Object.assign(this.doption, this.option)
  },
  mounted() {
    this.$viewport = this.$el.querySelector('.viewport')
    this.$overview = this.$el.querySelector('.overview')
    this.$thumb = this.$el.querySelector('.thumb')
    this.drag = this._drag.bind(this)
    this._end = this.end.bind(this)
    this.updateScroll()
  },
  beforeDestroy() {
    document.removeEventListener('mousemove', this.drag)
    document.removeEventListener('mouseup', this._end)
    delete this.$viewport
    delete this.$overview
    delete this.$thumb
    delete this.drag
    delete this._end
  }
}
</script>
