<template>
  <!--消防主机设备 模态框-->
  <Modal :mask-closable="false" v-model="fireDeviceModal" width="500" :title="isEditDevice?'设备修改':'设备添加'" @on-cancel="cancel">
    <!-- <div>
      <Button-group>
        <Button :type="deviceModalState.pageOneShow ? 'primary' : 'ghost'" @click="modalPageClick('P1')">1 - 基础信息</Button>
        <Button :type="deviceModalState.pageTwoShow ? 'primary' : 'ghost'" @click="modalPageClick('P2')">2 - 设备信息</Button>
      </Button-group>
    </div> -->
    <div>
      <Form ref="fireDevice" :model="deviceFormData" :rules="ruleDeviceForm" :label-width="100" label-position="left" style="padding: 0 20px;">
        <FormItem label="设备名称" prop="name">
          <Input v-model="deviceFormData.name" :minlength=1 :maxlength=64></Input>
        </FormItem>
        <!-- <FormItem label="设备ID" prop="deviceid">
          <Input v-model="deviceFormData.deviceid"></Input>
        </FormItem> -->
        <Form-item label="厂商">
          <Select v-model="deviceFormData.manufacturer">
            <Option v-for="item in fireManufacturerList" :value="item.value" :key="item.value">{{ item.label }}</Option>
          </Select>
        </Form-item>
        <Form-item label="型号">
          <Select v-model="deviceFormData.model">
            <Option v-for="item in fireModelList" :value="item.value" :key="item.value">{{ item.label }}</Option>
          </Select>
        </Form-item>
        <Form-item label="内网地址" prop="intranetIp">
          <Bsipv4 v-model="deviceFormData.intranetIp"></Bsipv4>
        </Form-item>
        <Form-item label="主机地址" prop="ip">
          <Bsipv4 v-model="deviceFormData.ip"></Bsipv4>
        </Form-item>
        <Form-item label="控制端口" prop="cport">
          <Input v-model="deviceFormData.cport" :minlength=1 :maxlength=5></Input>
        </Form-item>
        <Form-item label="用户名" prop="username">
          <Input v-model="deviceFormData.username" :minlength=1 :maxlength=64></Input>
        </Form-item>
        <Form-item label="密码" prop="password">
          <Input v-model="deviceFormData.password" type="password" :minlength=1 :maxlength=64></Input>
        </Form-item>
        <!-- <FormItem label="输入防区个数" prop="defenseicount">
          <Row>
            <Col span="10">
              <Input v-model="deviceFormData.defenseicount"></Input>
            </Col>
            <Col span="4" style="text-align: center">起始编号</Col>
            <Col span="10">
              <Input v-model="deviceFormData.gridinstartnum"></Input>
            </Col>
          </Row>
        </FormItem>
        <FormItem label="输出防区个数" prop="defenseocount">
          <Row>
            <Col span="10">
              <Input v-model="deviceFormData.defenseocount"></Input>
            </Col>
            <Col span="4" style="text-align: center">起始编号</Col>
            <Col span="10">
              <Input v-model="deviceFormData.gridoutstartnum"></Input>
            </Col>
          </Row>
        </FormItem> -->
      </Form>
    </div>
    <div slot="footer">
      <Button type="ghost" @click="cancel">取消</Button>
      <Button type="primary" @click="save('fireDevice')">确定</Button>
    </div>
  </Modal>
</template>
<script>
import Bsipv4 from '../../../../components/BSIPV4.vue'
import deviceValidate from '../deviceValidate.js'
export default {
  components: {
    Bsipv4
  },
  data() {
    return {
      fireDeviceModal: false,
      deviceFormData: {},
      ruleDeviceForm: {
        name: [
          { required: true, message: '设备名称不能为空', trigger: 'change' },
          { validator: deviceValidate.verifyName, trigger: 'change' },
          { validator: deviceValidate.noSpace, trigger: 'change' }
        ],
        cport: [{ required: true, validator: deviceValidate.dePort, trigger: 'change' }],
        intranetIp: [{ required: true, message: 'ip地址不能为空', trigger: 'change' }],
        ip: [{ required: true, message: 'ip地址不能为空', trigger: 'change' }],
        username: [
          { required: true, message: '用户名不能为空', trigger: 'change' },
          { validator: deviceValidate.verifyName, trigger: 'change' },
          { validator: deviceValidate.noSpace, trigger: 'change' }
        ],
        password: [
          { required: true, message: '密码不能为空', trigger: 'change' },
          { validator: deviceValidate.verifyName, trigger: 'change' },
          { validator: deviceValidate.noSpace, trigger: 'change' }
        ]
        // defenseicount: [
        //   { validator: deDefent, trigger: 'change' }
        // ],
        // defenseocount: [
        //   { validator: deDefent, trigger: 'change' }
        // ]
      },
      fireManufacturerList: [
        {
          value: 'lida',
          label: '利达'
        }
      ],
      fireModelList: [
        {
          value: 'ld6930',
          label: 'LD6930'
        }
      ]
    }
  },
  props: {
    // 弹窗展示
    fireDeviceShow: {
      type: Boolean,
      default: false
    },
    // 添加 or 修改
    isEditDevice: {
      type: Boolean,
      default: false
    },
    // 弹窗数据
    formData: {
      type: Object
    }
  },
  watch: {
    // 监听弹窗知否展示
    fireDeviceShow(val) {
      if (val !== this.fireDeviceModal) {
        this.fireDeviceModal = val
      }
    },
    // 监听弹窗数据是否发生变化
    formData: {
      handler: function(val) {
        if (val) {
          this.deviceFormData = val
        }
      },
      deep: true
    }
  },
  methods: {
    // 取消
    cancel() {
      // this.fireDeviceModal = false
      this.$refs['fireDevice'].resetFields()
      this.$emit('cancel')
    },
    // 确定
    save(name) {
      this.$refs[name].validate((valid) => {
        if (valid) {
          this.$emit('save', this.deviceFormData, name)
        }
      })
    }
  }
}
</script>
<style scoped>

</style>
