<template>
  <div style="height:100%;position:relative;">
    <p v-if="showLayoutModal" class="layout-titie">电视墙布局模板编辑模式</p>
    <div class="theme-bg" style="background:#0f2343;line-height:38px" v-if="!showLayoutModal">
      <div style="font-size:14px;line-height:30px;height:30px;display:inline-block;margin-left:20px;color: #fff;">电视墙布局</div>
      <!-- <div class="top-con" v-if="showControllerModel" style="float:right;">
        产品沟通：拼控的拆分合并不做、暂做注释
        <ul class="top-btns">
          <li>
            <Button type="ghost" :disabled="false" @click="mergeTV">合并</Button>
          </li>
          <li>
            <Button type="ghost" :disabled="false" @click="splitTV">拆分</Button>
          </li>
        </ul>
      </div> -->
    </div>
    <div class="video-con" :style="videoConStyle">
        <div class="left-list" v-if="showLayoutModal">
          <p class="list-titie">电视墙布局模板</p>
          <bs-scroll ref="scorlls" style="height: calc(100% - 140px);">
            <ul class="layout-list">
              <li v-for="(item, v) in layoutArr" :key="v" :class="{active: v===layoutIndex}" @click="changeLayoutIndex(v)">
                <span @dblclick="rename(item)">{{item.name}}</span>
                <div class="bottom-btn">
                  <i class='iconfont icon-edit' title="修改" @click.stop.prevent="changeLayout(item, v)"></i>
                  <i class='iconfont icon-delete' title="删除" @click.stop.prevent="deleteLayout(item._id)"></i>
                </div>
              </li>
            </ul>
          </bs-scroll>
          <div class="left-bottom-btn">
            <Button type="ghost" @click="saveLayout(isInit = true)">添加</Button>
            <Button @click="dropOut">退出</Button>
          </div>
        </div>
      <div class="right-con">
        <div class="top-con" v-if="showLayoutModal">
          <ul class="top-btns">
            <li>
              <Button type="ghost" :disabled="initLayout" icon="plus" @click="openCreateModel">添加</Button>
            </li>
            <li>
              <Button type="ghost" :disabled="disableclear" icon="trash-a" @click="delMonitor(activeIndex, tvs[activeIndex])">删除</Button>
            </li>
            <li>
              <Button type="ghost" :disabled="initLayout || disableAllDel" icon="close-round" @click="delAllMonitor">清除</Button>
            </li>
            <li>
              <Button type="ghost" :disabled="initLayout" icon="android-checkbox-outline" @click="saveLayout(isInit = false)">保存</Button>
            </li>
          </ul>
        </div>
        <div class="videos-box" :style="videoBoxStyle">
          <div v-for="(tv, index) in tvs" :key="index" :style="{
              width: tv.width || wd,
              height: tv.height || ht,
              top: tv.top,
              left: tv.left,
              bottom: tv.bottom,
              right: tv.right,
              position: tv.posit
            }" :class="[index === activeIndex || tv.isClick ? 'active' : '', 'tvs']" @click="clickTV(tv, index)">
            <div class="tv" :style="{background: bgColor}">
              <div class="center3">{{tv.orginName}}</div>
              <div>
                <div class="center2" v-if="tv.settle">
                  <i class="icon iconfont icon-edit" @click.stop.prevent="openAltModal(index)" title="编辑"></i>
                  <i class="icon iconfont icon-delete" v-if="tv.settle && !enableController" style="float:right" @click.stop.prevent="delMonitor(index, getTVName(tv))" title="删除"></i>
                </div>
                <div class="center1" v-if="!tv.settle && !enableController">
                  <i class="icon iconfont icon-add" @click.stop.prevent="openAddModal(index)" title="添加"></i>
                </div>
              </div>
            </div>
            <div class="bottom theme-pane tvname">{{getTVName(tv)}}</div>
          </div>
        </div>
        <div class="bg-box" v-if="enableController">
          <div :style="bgBoxStyle" v-for="(tv, index) in bgTV" :key="index">
            <span class="inner-number">{{index + 1}}</span>
          </div>
        </div>
        <div class="bottom-btns" v-if="showLayoutModal">
          <ul class="bot-btns">
            <li>
              <Button type="ghost" :disabled="true">合并</Button>
            </li>
            <li>
              <Button type="ghost" :disabled="true">拆分</Button>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="bottom-con" v-if="!showLayoutModal && !enableController">
      <div class="dp-con" @mouseenter="hoverLayout=selectedLayout; showlayout=true" @mouseleave="showlayout=false">
        <i class="icon iconfont icon-multi-screen" title="更改布局"></i>
        <ul v-show="showlayout">
          <i></i>
          <li v-for="layt in layoutArr" :key="layt._id" @mouseenter="hoverLayout=layt._id" @click="setLayout(layt)" :class="{active: layt._id===hoverLayout}">{{layt.name}}</li>
        </ul>
      </div>
    </div>
    <div class="bottom-con" v-if="!showControllerModel && enableController">
      <div class="dp-con">
        <Button type="ghost" :disabled="true" style="margin-left:16px;" @click="changeEnableController">修改</Button>
      </div>
    </div>
    <div class="bottom-con" v-if="showControllerModel && enableController">
      <div class="dp-con">
        <Button type="ghost" style="margin-left:16px;" @click="saveEnableController">保存</Button>
      </div>
    </div>
    <Modal v-model="showModal" :title="modalTitle" :width="480" :mask-closable="false">
      <div style="padding: 20px 10px 0 10px">
        <Form label-position="left" :label-width="100" :model="monitor" :rules="ruleValidate" ref="form">
          <Form-item label="监视器编号" prop="code">
            <Input v-model="monitor.code" />
          </Form-item>
          <Form-item label="监视器名称" prop="name">
            <Input v-model="monitor.name" />
          </Form-item>
          <Form-item label="解码器名称" prop="equipment" v-if="!enableController">
            <i-select :disabled="enableController" v-model="decoderValue">
              <i-option v-for="item in decoderCfg" :value="item.value" :key="item.value">{{item.label}}</i-option>
            </i-select>
          </Form-item>
          <Form-item label="解码器IP" prop="ip" v-if="!enableController">
            <Input disabled :value="monitor.ip" />
          </Form-item>
          <Form-item label="解码通道" prop="channel" v-if="!enableController">
            <i-select :disabled="enableController" v-model="channelValue">
              <i-option v-for="item in channelCfg" :value="item.value" :key="item.value">{{item.label}}</i-option>
            </i-select>
          </Form-item>
          <Form-item label="拼接控制器信源" prop="splicingController" v-if="false">
            <i-select v-model="controllerValue" :disabled="true">
              <i-option v-for="item in controllerCfg" :value="item.value" :key="item.value">{{item.label}}</i-option>
            </i-select>
          </Form-item>
        </Form>
      </div>
      <div slot="footer">
        <Button type="ghost" @click="showModal=false">取消</Button>
        <Button type="ghost" @click="modalOK">确定</Button>
      </div>
    </Modal>
    <Modal title="创建电视墙" v-model="creatModal" :width="600" :mask-closable="false" @on-visible-change="closeCreateModel">
      <div class="creatLayout" :style="{height: `${50 * 8 + 100}px`, width: '100%', position: 'relative'}">
        <!-- <div class="creatLayout" :style="{height: `${50 * 8 + 100}px`, width: '100%', position: 'relative'}"> -->
        <div class="wrap-layout" :style="{width:wrapLayoutWidth}" @click="isClickBox = !isClickBox" @mouseleave="initLayoutWrap()">
          <span v-for="(div, v) in innerBoxData" :key="v" @mouseenter="innetBoxEnter(div)" @click="clickBox(div)" :class="[div.active ? 'active' : '']"></span>
        </div>
      </div>
      <Form label-position="left" :label-width="50" :model="layform" :rules="layValidate" ref="layform" class="inner-form">
        <Form-item label="横向" prop="column" style="width:40%;float:left">
          <Input v-model="layform.column" number />
        </Form-item>
        <Form-item label="纵向" prop="row" style="width:40%;float:right">
          <Input v-model="layform.row" number />
        </Form-item>
      </Form>
      <div slot="footer" style="position:relative;z-index:99">
        <Button type="ghost" @click="insertModel">插入</Button>
      </div>
    </Modal>
    <Modal v-model="renameModel" title="重命名布局" :mask-closable="false">
      <bs-cover v-if="renameModel" v-model="renameModel">
        <Input v-model="changeLayoutData.name" autofocus/>
      </bs-cover>
      <div slot="footer" style="position:relative;z-index:99">
        <Button type="ghost" @click="renameModel=false">取消</Button>
        <Button type="ghost" @click="renameModel=false||saveRename()">确定</Button>
      </div>
    </Modal>
  </div>
</template>
<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import { GET_DECODER_ABILITY } from 'http/tvwall.api'
import { generateMonitorValidator, layoutValidator } from './tvform.validator'
import common from './tvcommon'
export default {
  mixins: [common],
  data() {
    return {
      showlayout: false,
      hoverLayout: '1',
      selectValue: {},
      showModal: false,
      showLayoutModal: false,
      showControllerModel: false,
      renameModel: false,
      creatModal: false,
      modalTitle: '添加监视器',
      layform: {
        row: '',
        column: ''
      },
      monitor: {
        code: 0,
        name: '',
        ip: '',
        equipment: '',
        channel: '',
        settle: false
      },
      controllerValue: '',
      defaultMonitor: {
        code: '001',
        name: '解码器',
        ip: '',
        equipment: '',
        channel: '',
        settle: false
      },
      ruleValidate: generateMonitorValidator(this),
      layValidate: layoutValidator,
      videoConStyle: {
        top: '38px',
        bottom: '72px'
      },
      videoBoxStyle: {
        height: '100%',
        position: 'relative'
      },
      initLayout: true, // 初始化按钮的禁用
      disableAllDel: true,
      disableclear: true,
      innerBoxData: [],
      isClickBox: false, // 是否点击box窗格
      isInsert: false, //  是否插入
      changeLayoutData: {
        id: '',
        name: '',
        row: '',
        column: ''
      },
      layoutIndex: 0,
      activeIndex: -1,
      tvList: []
    }
  },
  computed: {
    ...mapState({
      layoutList: ({ tvwall }) => tvwall.allLayoutList,
      channelList: ({ tvwall }) => tvwall.channelList,
      decoderList: ({ tvwall }) => tvwall.decoderList,
      rtscene: ({ tvwall }) => tvwall.rtscene,
      monitors: ({ tvwall }) => tvwall.monitorList,
      enableController: ({ tvwall }) => tvwall.enableController,
      controllerCfg: ({ tvwall }) => tvwall.controllerCfg,
      originList: ({ tvwall }) => tvwall.originList
    }),
    ...mapGetters(['layout', 'jointcontroller', 'bgBoxStyle', 'bgTV']),
    wd() {
      if (this.showLayoutModal && !this.enableController) {
        return this.isInsert
          ? (1 / this.changeLayoutData.column) * 100 + '%'
          : (1 / this.layoutList[this.layoutIndex].column) * 100 + '%'
      }
      return !this.enableController
        ? (1 / this.layout.column) * 100 + '%'
        : this.layout.screeninfo.width * this.row + 'px'
    },
    ht() {
      if (this.showLayoutModal && !this.enableController) {
        return this.isInsert
          ? (1 / this.changeLayoutData.row) * 100 + '%'
          : (1 / this.layoutList[this.layoutIndex].row) * 100 + '%'
      }
      return !this.enableController
        ? (1 / this.layout.row) * 100 + '%'
        : this.layout.screeninfo.height * this.clo + 'px'
    },
    wrapLayoutWidth() {
      return `${50 * 8 + 8 * 5}px`
    },
    channelValue: {
      get: function() {
        const l = this.channelCfg.filter(item => item.value === this.monitor.channel)
        if (l.length) {
          return this.monitor.channel
        } else if (this.channelCfg.length) {
          return this.channelCfg[0].value
        } else {
          return ''
        }
      },
      set: function(v) {
        this.monitor.channel = v || ''
      }
    },
    decoderValue: {
      get: function() {
        const l = this.decoderCfg.filter(item => item.value === this.monitor.equipment)
        if (l.length) {
          return this.monitor.equipment
        } else if (this.decoderCfg.length) {
          return this.decoderCfg[0].value
        } else {
          return ''
        }
      },
      set: function(v) {
        this.monitor.equipment = v || ''
        if (this.enableController) {
          return
        }
        const l = this.decoderCfg.filter(item => item.value === v)
        if (l.length) {
          this.monitor.ip = l[0].ip
          this.monitor.port = l[0].cport
        } else {
          this.monitor.ip = ''
          this.monitor.port = ''
        }
      }
    },
    decoderCfg() {
      return this.decoderList.map(item => {
        return {
          value: item._id,
          label: item.name,
          ...item
        }
      })
    },
    channelCfg() {
      const list = this.channelList.map(item => {
        return {
          value: item._id,
          label: item.name,
          ...item
        }
      })
      return list
    },
    tvs() {
      if (this.showLayoutModal && this.layoutArr.length === 0) {
        return []
      }
      var count = 0
      count = this.compuTvCount()
      if (count === 0) {
        return []
      }
      if (this.enableController) {
        this.setControllerList()
        if (this.originList.length > 0) {
          this.originList.forEach(item => {
            this.tvList.forEach(tv => {
              if (!item.jointorigin || tv.jointorigin) {
                return
              }
              if (item.jointorigin._id === tv.jointorigin) {
                return (tv.orginName = item.origin)
              }
            })
          })
        }
      } else {
        this.setList(count)
      }
      return this.tvList
    },
    layoutArr() {
      const arr = this.layoutList.map(item => {
        return {
          _id: item._id,
          name: item.name,
          column: item.column,
          row: item.row
        }
      })
      if (!this.showLayoutModal) {
        arr.push({ _id: 'new', name: '自定义' })
      }
      return arr
    },
    selectedLayout() {
      return this.layout._id
    },
    bgColor() {
      return this.rtscene.info.length > 0 ? '#000' : 'rgb(204, 204, 204)'
    }
  },
  watch: {
    decoderCfg(f) {
      this.monitor.equipment = f[0] ? f[0].value : ''
      this.defaultMonitor.equipment = f[0] ? f[0].value : ''
    },
    channelCfg(list) {
      this.defaultMonitor.channel = list.length ? list[0].value : ''
    },
    'monitor.equipment': function(v) {
      if (v) {
        v = typeof v === 'object' ? v._id : v
        this.getChannelCfg(v)
      }
    },
    layform: {
      deep: true,
      handler: function(v) {
        if (v.row === '' || v.column === '' || v.row === 0 || v.column === 0 || v.row > 8 || v.colum > 8) {
          return
        }
        this.changeActive(v)
      }
    },
    activeIndex(index) {
      if (this.tvs[index].settle) {
        this.disableclear = false
      } else {
        this.disableclear = true
      }
    }
  },
  methods: {
    ...mapActions([
      'getAllLayoutList',
      'getDecoderList',
      'setTVLayout',
      'addLayout',
      'delLayout',
      'chanLayout',
      'setDecoder',
      'addDecoder',
      'deleteDecoder',
      'getChannelCfg',
      'clearCfg',
      'getDecoderList',
      'recordLog'
    ]),
    // 计算比例
    proportionRow() {
      if (!this.layout.screeninfo) {
        return 0
      }
      // 横向
      const row = this.layout.row // 数量
      const clientWidth = document.body.clientWidth - 332 // 浏览器可是区域宽度
      const physicalWidth =
        this.layout.screeninfo.width * this.layout.column + (row - 1) * this.layout.screeninfo.hinterval // 物理宽度
      this.row = clientWidth / physicalWidth
    },
    proportionClo() {
      if (!this.layout.screeninfo) {
        return 0
      }
      // 纵向
      const clo = this.layout.column // 数量
      const clientHeight = document.body.clientHeight - 238.6 // 浏览器可是区域高度
      const physicalHeight =
        this.layout.screeninfo.height * this.layout.row + (clo - 1) * this.layout.screeninfo.vinterval // 物理宽度
      this.clo = clientHeight / physicalHeight
    },
    // 设置监视器信息
    setList(count) {
      this.tvList.length = 0
      while (count--) {
        this.tvList.push({
          name: '',
          settle: false,
          isClick: false,
          posit: 'relative'
        })
      }
      if (this.monitors && this.monitors.length > 0) {
        this.disableAllDel = false
      }
      this.monitors.length > 0 &&
        this.monitors.forEach(item => {
          const it = {
            settle: true,
            isClick: false,
            posit: 'relative',
            ...item
          }
          it.equipment = item.equipment._id || item.equipment
          it.channel = item.channel._id || item.channel
          this.tvList[item.position] && (this.tvList[item.position] = it)
        })
    },
    // 设置启用拼控监视器信息
    setControllerList() {
      this.tvList.length = 0
      this.proportionRow()
      this.proportionClo()
      // 暂且当做监视器列表等于拼接屏下得监视器列表
      if (this.layout.wininfo.length > 0) {
        this.layout.wininfo.forEach(item => {
          for (let i = 0; i < this.monitors.length; i++) {
            if (this.monitors[i]._id === item.monitor) {
              const obj = {
                settle: true,
                isClick: false,
                posit: 'absolute',
                ...this.monitors[i]
              }
              obj.top = `${item.top * this.clo}px`
              obj.bottom = `${item.bottom * this.clo}px`
              obj.left = `${item.left * this.row}px`
              obj.right = `${item.right * this.row}px`
              if (item.hasOwnProperty('top') && item.hasOwnProperty('bottom')) {
                obj.height = `${(item.bottom - item.top) * this.clo}px`
              }
              if (item.hasOwnProperty('left') && item.hasOwnProperty('right')) {
                obj.width = `${(item.right - item.left) * this.row}px`
              }
              return this.tvList.push(obj)
            }
          }
        })
      }
    },
    // 计算窗口数
    compuTvCount(count) {
      if (this.showLayoutModal) {
        if (this.isInsert) {
          count = this.changeLayoutData.row * this.changeLayoutData.column
        } else {
          let tempLayout = this.layoutList[this.layoutIndex]
          count = tempLayout.row * tempLayout.column
        }
      } else {
        count = this.layout.row * this.layout.column
      }
      return count
    },
    setLayout(v) {
      this.showlayout = false
      if (v._id === 'new') {
        this.videoConStyle.top = '54px'
        this.videoConStyle.bottom = '16px'
        this.videoBoxStyle.height = 'calc(100% - 96px)'
        this.showLayoutModal = true
      } else if (v._id !== this.layout._id) {
        this.recordLog({
          logType: '操作日志',
          module: '电视墙',
          operateName: '切换布局',
          operateContent: `切换布局: ${this.layout.name}`
        })
        this.commonAPIHandle(this.setTVLayout({ _id: v._id }), '切换布局', 'setLayout')
      }
    },
    getTVName(tv) {
      if (tv.settle) {
        return tv.name + '-' + tv.code
      } else {
        return tv.name
      }
    },
    checkUsing(index) {
      if (this.rtscene.info) {
        const info = this.rtscene.info[index]
        if (info && info.resources) {
          if (info.resources.filter(item => !!item).length) {
            return true
          }
        }
      }
      return false
    },
    openAddModal(index) {
      this.modalTitle = '添加监视器'
      this.$refs.form.resetFields()
      this.aindex = index
      Object.assign(this.monitor, this.defaultMonitor)
      if (!this.enableController) {
        this.decoderValue = this.defaultMonitor.equipment
      }
      this.monitor.code = this.getcode(index + 1)
      this.showModal = true
    },
    openAltModal(index) {
      const isUsing = this.checkUsing(index)
      if (isUsing) {
        this.$Notice.error({
          title: '错误',
          desc: '该监视器正在使用, 无法修改',
          duration: 3
        })
        return
      }
      this.modalTitle = '修改监视器'
      this.aindex = index
      Object.assign(this.monitor, this.tvs[index])
      this.validChangeOption()
      this.showModal = true
    },
    getcode(code) {
      const c = '000' + code
      return c.slice(-3)
    },
    async delMonitor(index, name) {
      const res = await this.confirmModal(`确定要删除"${name}"吗?`)
      if (!res) {
        return
      }
      this.deleteDecoder([this.tvs[index]._id])
        .then(resp => {
          if (resp) {
            this.disableclear = true
            this.$Notice.success({
              title: '成功',
              desc: '删除布局成功',
              duration: 3
            })
          }
        })
        .catch(err => {
          this.$Notice.error({
            title: '错误',
            desc: err.response.data.message,
            duration: 3
          })
        })
    },
    validChangeOption() {
      setTimeout(() => {
        this.validInput()
      }, 100)
    },
    async modalOK() {
      const valid = await this.validInput()
      if (!valid) {
        return
      }
      const param = {
        code: this.monitor.code,
        name: this.monitor.name,
        equipment: this.monitor.equipment,
        channel: this.monitor.channel,
        number: 1
      }
      if (this.enableController) {
        param.jointorigin = this.controllerValue
      }
      if (this.monitor.settle) {
        param.id = this.monitor._id
        this.commonAPIHandle(this.setDecoder(param), '修改', 'setDecoder')
      } else {
        param.position = this.aindex
        this.commonAPIHandle(this.addDecoder(param), '添加', 'addDecoder')
      }
      this.showModal = false
    },
    validInput() {
      return new Promise(resolve => {
        this.$refs.form.validate(valid => {
          resolve(valid)
        })
      })
    },
    requestMonitorNumber() {
      return GET_DECODER_ABILITY({
        id: 2,
        ip: this.monitor.ip,
        port: this.monitor.port
      })
    },
    validLayInput() {
      return new Promise(resolve => {
        this.$refs.layform.validate(valid => {
          resolve(valid)
        })
      })
    },
    async saveLayout(isInit) {
      if (isInit) {
        this.layform = {
          column: '',
          row: ''
        }
        let name = `布局${this.layoutArr.length + 1}`
        this.layoutArr.forEach(item => {
          if (item.name === name) {
            name = `布局${this.layoutArr.length + 2}`
          }
        })
        return this.addLayout({
          row: 0,
          column: 0,
          name: name,
          isTvwall: true
        })
          .then(resp => {
            this.changeLayoutData.id = resp.data._id
            this.getAllLayoutList().then(() => {
              this.scorll()
              this.layoutIndex = this.layoutArr.length - 1
              this.initLayout = false
            })
            this.$Notice.success({
              title: '成功',
              desc: '添加布局成功',
              duration: 3
            })
          })
          .catch(err => {
            this.$Notice.error({
              title: '错误',
              desc: err.response.data.message,
              duration: 3
            })
          })
      }
      const param = {
        row: this.layform.row,
        column: this.layform.column,
        id: this.changeLayoutData.id
      }
      this.chanLayout(param)
        .then(() => {
          this.$Notice.success({
            title: '成功',
            desc: '修改成功',
            duration: 3
          })
          this.getAllLayoutList()
        })
        .catch(err => {
          this.$Notice.error({
            title: '错误',
            desc: err.response.data.message,
            duration: 3
          })
        })
      this.creatModal = false
    },
    async insertModel() {
      const res = await this.validLayInput()
      if (!res) {
        return
      }
      this.changeLayoutData.row = this.layform.row
      this.changeLayoutData.column = this.layform.column
      this.isInsert = true
      this.creatModal = false
    },
    // 激活窗格
    clickTV(tv, index) {
      if (this.initLayout) {
        return
      }
      if (this.enableController && this.showControllerModel) {
        tv.isClick = !tv.isClick
      } else if (this.showLayoutModal && !this.enableController) {
        this.activeIndex = index
      }
    },
    openCreateModel() {
      this.layform.row = this.changeLayoutData.row
      this.layform.column = this.changeLayoutData.column
      this.creatModal = true
      this.changeActive(this.layform)
    },
    closeCreateModel(val) {
      if (!val) {
        this.$refs.layform.resetFields()
        this.isClickBox = false
      }
    },
    deleteLayout(id) {
      if (id === this.selectedLayout) {
        return this.$Notice.error({
          title: '错误',
          desc: '该布局正在使用, 无法删除',
          duration: 3
        })
      }
      this.delLayout(id)
        .then(() => {
          this.getAllLayoutList().then(() => {
            this.initLayout = true
            this.layoutIndex = this.layoutArr.length - 1
            this.changeLayoutIndex(this.layoutIndex)
            this.scorll()
            this.$Notice.success({
              title: '成功',
              desc: '删除成功',
              duration: 3
            })
          })
        })
        .catch(err => {
          console.error('delLayout', err)
          this.$Notice.error({
            title: '错误',
            desc: '删除失败',
            duration: 3
          })
        })
    },
    // 改变选中布局
    changeLayoutIndex(index) {
      this.layoutIndex = index
      this.initLayout = true
      this.isInsert = false
      this.activeIndex = -1
    },
    changeLayout(obj, index) {
      if (obj._id === this.selectedLayout) {
        return this.$Notice.error({
          title: '错误',
          desc: '该布局正在使用, 无法修改',
          duration: 3
        })
      }
      this.layoutIndex = index
      this.changeLayoutData.id = obj._id
      this.changeLayoutData.name = obj.name
      this.layform.column = this.changeLayoutData.column = obj.column
      this.layform.row = this.changeLayoutData.row = obj.row
      this.initLayout = false // 右侧添加按钮可用
      this.isInsert = false
    },
    delAllMonitor() {
      const delList = []
      this.tvs.forEach(tv => {
        if (tv.settle) {
          delList.push(tv._id)
        }
      })
      this.commonAPIHandle(this.deleteDecoder(delList), '删除', 'deleteDecoder')
    },
    // 自定义布局的退出方法
    dropOut() {
      this.videoConStyle.top = '38px'
      this.videoConStyle.bottom = '72px'
      this.videoBoxStyle.height = '100%'
      this.showLayoutModal = false
      this.initLayout = true
      this.activeIndex = -1
      this.layoutIndex = 0
    },
    // 布局重命名
    rename(val) {
      this.changeLayoutData.id = val._id
      this.changeLayoutData.name = val.name
      this.renameModel = true
    },
    saveRename() {
      if (!this.changeLayoutData.name || this.changeLayoutData.name.replace(/\s+/g, '') === '') {
        this.$nextTick(() => {
          this.showModal = true
        })
        this.$Notice.error({
          title: '错误',
          desc: '布局名称不能为空',
          duration: 3
        })
      } else {
        this.chanLayout({
          id: this.changeLayoutData.id,
          name: this.changeLayoutData.name
        })
          .then(() => {
            this.getAllLayoutList()
            this.$Notice.success({
              title: '成功',
              desc: '修改布局名称成功',
              duration: 3
            })
          })
          .catch(err => {
            console.error('chanLayout', err)
            this.$Notice.error({
              title: '错误',
              desc: '修改布局名称失败',
              duration: 3
            })
          })
      }
    },
    // 根据传入对象，变更所有数据的active
    changeActive(obj = { column: 0, row: 0 }, arr = this.innerBoxData) {
      arr.forEach(item => {
        if (item.row <= obj.row) {
          item.column <= obj.column ? (item.active = true) : (item.active = false)
        } else {
          if (item.active) {
            item.active = false
          }
        }
      })
    },
    // 清除选中的TvBox
    changeClickTv() {
      this.tvs.forEach(tv => {
        if (tv.isClick) {
          tv.isClick = false
        }
      })
    },
    // 点击innetBox
    clickBox(item) {
      this.layform.row = item.row
      this.layform.column = item.column
      this.changeActive(item)
    },
    innetBoxEnter(td) {
      if (this.isClickBox) {
        return
      }
      this.layform.column = td.column
      this.layform.row = td.row
      this.changeActive(td)
    },
    initLayoutWrap() {
      if (this.isClickBox) {
        return
      }
      this.$refs.layform.resetFields()
      this.changeActive()
    },
    // 计算table的data值
    computerTableData(row = 8, col = 8, arr = this.innerBoxData) {
      arr.length = 0
      for (let i = 0; i < row * col; i++) {
        let obj = {
          column: i < 8 ? i + 1 : (i % col) + 1,
          row: i < 8 ? 1 : Math.ceil((i + 1) / row),
          active: false
        }
        arr.push(obj)
      }
    },
    // 修改拼接控制器布局
    changeEnableController() {
      this.showControllerModel = true
    },
    saveEnableController() {
      this.showControllerModel = false
      this.changeClickTv()
    },
    // 合并
    mergeTV() {
      this.changeClickTv()
    },
    // 拆分
    splitTV() {
      this.changeClickTv()
    },
    setProportion() {
      this.proportionRow()
      this.proportionClo()
      this.setControllerList()
      this.showLayoutModal && this.scorll()
    },
    scorll() {
      if (this.$refs.scorlls) {
        this.$refs.scorlls.update()
      }
    }
  },
  created() {
    this.getDecoderList()
    this.computerTableData()
    // 如果启用拼接控制器 就重置样式
    if (this.enableController && this.activeIndex !== -1) {
      this.activeIndex = -1
    }
    if (this.enableController) {
      window.addEventListener('resize', this.setProportion)
    }
  },
  beforeDestroy() {
    this.clearCfg()
    if (this.enableController) {
      window.removeEventListener('resize', this.setProportion)
    }
  }
}
</script>
<style lang="less" scoped>
.tvname {
  width: 100%;
  white-space: pre;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-con {
  position: absolute;
  left: 0;
  right: 0;
  top: 38px;
  display: flex;
}
.video-con .right-con {
  flex: 1;
}
.video-con .bottom-btns {
  height: 56px;
  line-height: 56px;
  width: 100%;
  background: #1b3153;
}

// .btn-mode {
//   padding: 10px;
//   background: #000;
//   color: #fff;
//   border: 0 none;
//   float: right;
// }

.theme-btn.tvbtn-hover {
  background: #434343;
  border: 1px solid #00a5e3;
}
.videos-box .active .tv {
  border-color: #00a5e3;
}
.bg-box {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  z-index: 1;
  top: -100%;
}
.inner-number {
  display: inline-block;
  border: 1px solid #fff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  text-align: center;
  line-height: 50px;
  font-size: 24px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.tvs {
  display: inline-block;
  vertical-align: middle;
  transition: transform 0.3s;
  z-index: 10;
  .bottom {
    // position: absolute;
    width: 100%;
    bottom: 0;
    height: 30px;
    padding-left: 10px;
    line-height: 30px;
  }

  .tv {
    height: calc(~'100% - 30px');
    width: 100%;
    border: 1px solid #444;
    .iconfont {
      font-size: 30px;
      cursor: pointer;
      &:hover {
        color: #00a5e3;
      }
    }
  }
}

.tvs.dragging {
  transform: scale(1.1);
  border-color: #555;

  .bottom {
    background: #555;
  }
}

.form {
  margin: 50px 0 100px;
  width: 450px;
  text-align: center;
  padding: 0 10px;

  .item {
    label {
      display: inline-block;
      width: 80px;
      height: 40px;
      line-height: 40px;
    }

    input {
      padding: 2px;
      width: 160px;
    }
  }
}

.tv-pane {
  border: 0 none;

  &:hover {
    color: #fff;
    background: #171717;
  }
}

.center1 {
  position: absolute;
  top: calc(~'50% - 50px');
  left: calc(~'50% - 20px');
}

.center2 {
  position: absolute;
  width: 100px;
  top: calc(~'50% - 50px');
  left: calc(~'50% - 50px');
}

.bottom-con {
  position: absolute;
  bottom: 16px;
  height: 56px;
  width: 100%;
  background: #1b3153;
  border-top: 1px solid rgba(58, 90, 139, 0.4);
}

.tv-btn {
  padding: 4px 12px;
  font-size: 12px;
  border-radius: 3px;
  cursor: pointer;
  margin: 0 5px;
  border: 1px solid transparent;
}
.dp-con:hover .iconfont {
  color: #fda54b;
}
.dp-con:active .iconfont {
  color: #c47019;
}

.dp-con {
  height: 40px;
  position: absolute;
  bottom: 0;
  .iconfont {
    color: #fff;
    font-size: 20px;
    cursor: pointer;
    padding: 0 11px;
    line-height: 20px;
  }

  .iconfont:hover {
    color: #fda54b;
  }

  .iconfont.disable:hover,
  .iconfont.disable {
    color: rgba(255, 255, 255, 0.5);
  }

  ul {
    position: relative;
    height: 40px;
    line-height: 47px;
    background: #335589;
    bottom: 29px;
    left: 43px;
    margin-left: -1px;
    border-radius: 4px;
    li {
      color: #fff;
      height: 20px;
      line-height: 20px;
      text-align: center;
      cursor: pointer;
      position: relative;
      display: inline-block;
      padding: 0 15px;
      border-right: 1px solid rgba(255, 255, 255, 0.1);
    }

    li:last-child {
      border-right: 0;
    }

    i {
      display: block;
      position: absolute;
      background: #335589;
      width: 14px;
      height: 14px;
      z-index: 0;
      transform: rotate(45deg);
      top: 12px;
      left: -7px;
    }

    .active {
      color: #c47019;
    }
  }
}

iframe {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 0;
  border: 0 none;
}

.inbl {
  display: inline-block;
  width: 160px;
}
.layout-titie {
  width: 100%;
  height: 38px;
  line-height: 38px;
  font-size: 14px;
  background: #1b3153;
  padding-left: 24px;
  margin-bottom: 16px;
}
.left-list {
  width: 272px;
  margin-right: 16px;
  background: #1b3153;
  overflow: hidden;
}
.left-list li {
  display: flex;
  line-height: 36px;
  border-bottom: 1px solid rgba(58, 90, 139, 0.4);
  padding: 0 16px;
  box-sizing: border-box;
}
.left-list li:hover {
  background: #2a436a;
}
.left-list span {
  flex: 1;
  cursor: pointer;
  padding-right: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.iconfont {
  color: #fff;
  margin: 0 2px;
  cursor: pointer;
}
.iconfont:hover {
  color: #449af8;
}
.left-list .active {
  color: #c47019;
  background: #2a436a;
}
.left-bottom-btn {
  width: 100%;
  margin-top: 40px;
  text-align: center;
}
.list-titie {
  height: 40px;
  line-height: 40px;
  padding: 0 16px;
  background: rgb(15, 35, 67);
}
.left-list button {
  margin: 0 6px;
}
.top-con {
  height: 40px;
  padding-left: 18px;
}
.bottom-btns {
  padding-left: 18px;
  border-top: 1px solid rgba(58, 90, 139, 0.4);
}
.top-btns,
.bot-btns {
  text-align: center;
  float: left;
}
.top-btns li,
.bot-btns li {
  margin: 0 6px;
  display: inline-block;
}
.wrap-layout {
  margin: 0 auto;
}
.wrap-layout span {
  width: 50px;
  height: 50px;
  margin-right: 5px;
  display: inline-block;
  border: 1px solid #fff;
}
.wrap-layout .active {
  background: #000;
  border-color: #f00;
}
.inner-form {
  height: 34px;
  width: 400px;
  position: absolute;
  bottom: 100px;
  left: 100px;
}
</style>
