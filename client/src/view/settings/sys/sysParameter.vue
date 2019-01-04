<template>
  <div class="system-parameter">
    <Row>
      <Col span="24">
      <h3>日志保存天数</h3>
      <Form :model="formItem" :label-width="100" style="margin-left: 48px;" label-position="left" ref="sysForm" :rules="ruelParameterDate">
        <Form-item label="报警/事件日志" prop="alarmValue">
          <Input v-model="formItem.alarmValue" style="width: 300px" :disabled="saveBtn"></Input>天
        </Form-item>
        <Form-item label="设备/系统日志" prop="systemValue">
          <Input v-model="formItem.systemValue" style="width: 300px" :disabled="saveBtn"></Input>天
        </Form-item>
        <Form-item label="操作日志" prop="operateValue">
          <Input v-model="formItem.operateValue" style="width: 300px" :disabled="saveBtn"></Input>天
        </Form-item>
        <Form-item label="配置日志" prop="dispositionValue">
          <Input v-model="formItem.dispositionValue" style="width: 300px" :disabled="saveBtn"></Input>天
        </Form-item>
      </Form>
      <h4>播放参数</h4>
      <Form :model="formItem" :label-width="100" style="margin-left: 48px;" label-position="left">
        <Form-item label="传输协议">
          <Select v-model="formItem.transport" style="width:300px" :disabled="saveBtn">
            <Option v-for="item in transportList" :value="item.value" :key="item.value">{{ item.label }}</Option>
          </Select>
        </Form-item>
        <Form-item label="画质选择">
          <Select v-model="formItem.image" style="width:300px" :disabled="saveBtn">
            <Option v-for="item in imageList" :value="item.value" :key="item.value">{{ item.label }}</Option>
          </Select>
        </Form-item>
        <Form-item label="截图格式">
          <Select v-model="formItem.screenshot" style="width:300px" :disabled="saveBtn">
            <Option v-for="item in screenshotList" :value="item.value" :key="item.value">{{ item.label }}</Option>
          </Select>
        </Form-item>
        <Form-item label="本地录像格式">
          <Select v-model="formItem.local" style="width:300px" :disabled="saveBtn">
            <Option v-for="item in localList" :value="item.value" :key="item.value">{{ item.label }}</Option>
          </Select>
        </Form-item>
      </Form>
      <h4>单兵配置</h4>
      <Form :model="formItem" :label-width="110" style="margin-left: 40px;" label-position="left" ref="sysSoldier" :rules="ruelParameterDate">
        <Form-item label="rtmp流配置" prop="rtmp">
          <Input v-model="formItem.rtmp" style="width: 300px" :disabled="saveBtn"></Input>
        </Form-item>
        <Form-item label="离地高度" prop="height">
          <Input v-model="formItem.height" style="width: 300px" :disabled="saveBtn"></Input>米
        </Form-item>
        <template>
          <Form-item label="录像存储服务器" style="display:inline-block;">
            <Select v-model="formItem.storage" style="width:500px" :disabled="saveBtn">
              <Option v-for="item in serverStoreList" :value="item.value" :key="item.value">{{ item.label }}</Option>
            </Select>
          </Form-item>
          <Form-item label="存储路径" style="display:inline-block;margin-left:50px;" :label-width='75'>
            <!-- {{formItem.url}} -->
            <Select v-model="formItem.path" style="width:300px" :disabled="saveBtn">
              <Option v-for="item in getServerPath" :value="item.value" :key="item.value">{{ item.label }}</Option>
            </Select>
          </Form-item>
        </template>
      </Form>
      <div class="footer">
        <Button type="primary" @click="save" :loading="sureLoading" :disabled="saveBtn">保存</Button>
      </div>
      </Col>
    </Row>
  </div>
</template>
<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
export default {
  computed: {
    ...mapGetters([
      'getParameter',
      'sysConfrole',
      'getStorePath'
    ])
  },
  data() {
    const dePort = (rule, value, callback) => {
      let r = /^([0-9][0-9]*)$/
      if (value === '') {
        return callback(new Error('不可以为空'))
      }
      if (r.test(value)) {
        if (value > 365) {
          return callback(new Error('超过最大值'))
        } else {
          callback()
        }
      } else {
        return callback(new Error('请输入有效数字'))
      }
    }
    const dePortHeight = (rule, value, callback) => {
      let r = /^([0-9][0-9]*)$/
      if (value === '') {
        return callback(new Error('不可以为空'))
      }
      if (r.test(value)) {
        if (value > 50) {
          return callback(new Error('超过最大值50米'))
        } else if (value < 1) {
          return callback(new Error('低于最小值1米'))
        } else {
          callback()
        }
      } else {
        return callback(new Error('请输入有效数字'))
      }
    }
    return {
      saveBtn: false,
      sureLoading: false,
      formItem: {
        // 报警/事件日志天数
        alarmValue: '',
        // 设备/系统日志天数
        systemValue: '',
        // 操作日志天数
        operateValue: '',
        // 配置日志天数
        dispositionValue: '',
        transport: '',
        image: '',
        screenshot: '',
        local: '',
        rtmpValue: '',
        rtmp: '', // rtmp地址
        storage: '', // 服务器配置
        path: 1, // 服务器路径
        height: 1 // 离地高度
      },
      storage: '',
      path: '',
      getServerPath: {},
      number: true,
      transportList: [
        {
          value: 'TCP',
          label: 'TCP'
        },
        {
          value: 'UDP',
          label: 'UDP'
        },
        {
          value: '组播',
          label: '组播'
        }
      ],
      imageList: [{
        value: 'auto',
        label: '自适应'
      }, {
        value: '流畅优先',
        label: '流畅优先'
      },
      {
        value: '画质优先',
        label: '画质优先'
      }],
      screenshotList: [{
        value: 'JPG',
        label: 'JPG'
      },
      {
        value: 'BMP',
        label: 'BMP'
      }],
      localList: [{
        value: 'AVI',
        label: 'AVI'
      }, {
        value: 'BSR',
        label: 'BSR'
      }],
      serverStoreList: [],
      // form基础信息
      ruelParameterDate: {
        alarmValue: [{ validator: dePort, trigger: 'change' }],
        systemValue: [{ validator: dePort, trigger: 'change' }],
        operateValue: [{ validator: dePort, trigger: 'change' }],
        dispositionValue: [{ validator: dePort, trigger: 'change' }],
        height: [{ validator: dePortHeight, trigger: 'change' }]
      }
    }
  },
  created() {
    this.getStorageServer({ servername: 'ds' })
      .then(suc => {
        let data = suc.data
        this.serverStoreList = this._serverStoreDataFn(data)
      })
      .catch(err => {
        console.log('get server err' + err)
      })
    this.getPlatform().then((resp) => {
      this.formItem.alarmValue = typeof (this.getParameter.alarmlog) === 'number' ? this.getParameter.alarmlog : 120
      this.formItem.systemValue = typeof (this.getParameter.equipmentlog) === 'number' ? this.getParameter.equipmentlog : 120
      this.formItem.operateValue = typeof (this.getParameter.operationlog) === 'number' ? this.getParameter.operationlog : 120
      this.formItem.dispositionValue = typeof (this.getParameter.configlog) === 'number' ? this.getParameter.configlog : 120
      this.formItem.transport = this.getParameter.transport === '' ? 'TCP' : this.getParameter.transport
      this.formItem.image = this.getParameter.picture === '' ? 'auto' : this.getParameter.picture
      this.formItem.screenshot = this.getParameter.screenshot === '' ? 'JPG' : this.getParameter.screenshot
      this.formItem.local = this.getParameter.videotape === '' ? 'AVI' : this.getParameter.videotape
      this.formItem.rtmp = resp.data.rtmp || ''
      this.formItem.storage = resp.data.storage || ''
      this.formItem.path = resp.data.path || 1
      this.formItem.height = resp.data.height || 1
      this.storage = resp.data.storage
      this.path = resp.data.path
      this._detectionServerStore()
    }).catch((err) => {
      console.log('getPlatform error: ' + err)
      this.$Notice.warning({
        title: '失败',
        desc: '参数获取失败！',
        duration: 2,
        top: 200
      })
    })
    this.getServerPath = JSON.parse(JSON.stringify(this.getStorePath))
    this.getServerPath.forEach((item, i) => {
      item.value = Number(item._id)
      item.label = item.path
    })
  },
  methods: {
    ...mapMutations(['SET_PARAMETER', 'GET_PLATFORM']),
    ...mapActions(['setPlatform', 'getPlatform', 'getStorageServer']),
    /**
     * 生成默认 录像存储服务器路径配置
     */
    _serverStoreDataFn(arr) {
      let list = []
      for (let i = 0; i < arr.length; i++) {
        list.push({ value: arr[i], label: arr[i] })
      }
      return list
    },
    /**
     * 检测 录像存储服务器是否发生变化
    */
    _detectionServerStore() {
      let list
      for (let i = 0; i < this.serverStoreList.length; i++) {
        let item = this.serverStoreList[i]
        if (this.formItem.storage === item.value) {
          console.log('ds---detection')
        } else {
          list = { value: this.formItem.storage, label: this.formItem.storage }
        }
      }
      if (list) {
        this.serverStoreList.push(list)
      }
      return false
    },
    save() {
      this.sureLoading = true
      let submit = (valid) => {
        this.$refs.sysSoldier.validate(isValid => {
          if (!valid || !isValid) {
            this.$Notice.error({
              title: '警告',
              desc: '保存失败',
              duration: 1
            })
            this.sureLoading = false
          } else {
            const parametersData = {
              alarmlog: Number(this.formItem.alarmValue),
              equipmentlog: Number(this.formItem.systemValue),
              operationlog: Number(this.formItem.operateValue),
              configlog: Number(this.formItem.dispositionValue),
              transport: this.formItem.transport,
              picture: this.formItem.image,
              screenshot: this.formItem.screenshot,
              videotape: this.formItem.local
            }
            this.$store.commit('SET_PARAMETER', parametersData)
            this.setPlatform({
              alarmlog: Number(this.formItem.alarmValue),
              equipmentlog: Number(this.formItem.systemValue),
              operationlog: Number(this.formItem.operateValue),
              configlog: Number(this.formItem.dispositionValue),
              transport: this.formItem.transport,
              picture: this.formItem.image,
              screenshot: this.formItem.screenshot,
              videotape: this.formItem.local,
              rtmp: this.formItem.rtmp,
              storage: this.formItem.storage,
              path: Number(this.formItem.path),
              height: Number(this.formItem.height)
            }).then(res => {
              this.sureLoading = false
              this.$Notice.success({
                title: '成功',
                desc: '参数保存成功！',
                duration: 2,
                top: 200
              })
            }).catch((err) => {
              console.log('setPlatform error: ' + err)
              this.sureLoading = false
              this.$Notice.warning({
                title: '失败',
                desc: '参数保存失败！',
                duration: 2,
                top: 200
              })
            })
          }
        })
      }
      this.$refs.sysForm.validate(submit)
    }
  },
  watch: {
    'formItem.storage'(val) {
      if (val === this.storage) {
        this.formItem.path = this.path
      } else {
        this.formItem.path = 1
      }
    }
  }
}
</script>
<style scoped>
.system-parameter {
  width: 100%;
  background: #1b3153;
}

.system-parameter i {
  font-style: normal;
}

.system-parameter b {
  font-weight: normal;
}

h3,
h4 {
  font-size: 14px;
  height: 38px;
  line-height: 38px;
  background: #0f2243;
  padding-left: 24px;
  font-weight: normal;
  margin-bottom: 15px;
}

.ivu-input-wrapper {
  margin-right: 10px;
}

.footer {
  margin: 30px 0 0 24px;
}

.footer button {
  width: 100px;
}

.footer span {
  padding: 0 40px;
}

.ivu-input-number {
  margin-right: 10px;
}
</style>
