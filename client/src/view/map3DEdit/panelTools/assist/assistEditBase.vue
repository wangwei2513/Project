<!-- 辅助模型信息编辑面板--逻辑控制脚本文件 -->
<script>
import { mapActions } from 'vuex'
import utils from 'assets/3DMap/utils/index'
import { telNumCheck, telNameCheck, peopleNameLengthCheck } from '../formCheck'

export default {
  data() {
    return {
      validateRule: {
        name: [{ required: true, message: '请输入辅助模型名称', trigger: 'change' }]
      }
    }
  },
  methods: {
    ...mapActions([
      'set3DActiveChangePositionDraw', // 控制3D位置绘制
      'deleteAssistHoleById', // 删除辅助杆
      'updateAssistHoleById', // 更新辅助杆
      'getAssistHoleById' // 根据标识获取辅助杆数据
    ]),
    refreashFormInfo(val) { // 刷新表单信息
      this.transAssistPoleInfo(val) // 转换成表单呈现的辅助杆点位信息
      this.loadModelList(val) // 加载模型列表
    },
    transAssistPoleInfo(val) { // 转换成表单呈现的辅助杆点位信息
      this.point3D = val
      this.pointInfo = this.$lodash.cloneDeep(val) // 深拷贝辅助杆点位信息
      if (this.pointInfo.loc) { // 设置高度信息
        let coValues = this.pointInfo.loc.split(',').map(item => Number(item))
        if (coValues && coValues.length === 3) { // 坐标是三维坐标时，设置高度信息
          this.pointInfo.height = coValues[2]
        }
        this.locFormat = utils.formatLoc(this.pointInfo.loc) // 格式化经纬度高度信息
        if (!this.pointInfo.principal || this.pointInfo.principal.length === 0) {
          this.pointInfo.principal = [{name: '', mobile: ''}] // 初始化联系信息
        }
      }
    },
    changePointLoc(loc) { // 改变点位的位置信息
      this.pointInfo.loc = loc
      if (this.pointInfo.loc) {
        let coValues = this.pointInfo.loc.split(',').map(item => Number(item))
        if (coValues && coValues.length === 3) { // 坐标是三维坐标时，设置高度信息
          this.pointInfo.height = coValues[2]
        }
        this.locFormat = utils.formatLoc(this.pointInfo.loc) // 格式化经纬度高度信息
      }
    },
    deleteAssistHolePoint() { // 删除辅助模型点位
      let _pointData = JSON.parse(JSON.stringify(this.mapResource)) // 地图资源数据
      this.$Modal.confirm({
        title: '警告',
        content: '<p>确认删除所选辅助杆点位吗？</p>',
        onOk: () => { // 确认回调方法
          this.deleteAssistHoleById(_pointData._id) // 根据id删除辅助杆点位数据
            .then(res => {
              if (this.is3DMapOuter) { // 楼外3D地图
                this.cancel3DMapSelectedEffect() // 取消实体选中效果
                if (this.ready) { // 地图加载完成时
                  this.$context.viewer.entities.removeById(_pointData._id) // 地图实体集合中根据实体id移除实体
                }
              }
              this.successMsg('辅助杆点位删除成功')
            })
            .catch(err => {
              console.log('辅助杆点位删除失败：', err)
              this.errorMsg('辅助杆点位删除失败')
            })
        },
        onCancel: () => {}
      })
    },
    saveAssistHolePoint(name) { // 保存辅助模型点位信息
      this.$refs[name].validate(valid => {
        if (valid) { // 表单校验成功
          console.log('辅助杆点位信息表单校验成功！')
          let isNameRepeat = telNameCheck(this.pointInfo.principal)
          if (isNameRepeat) {
            this.errorMsg('负责人重复')
            return
          }
          let flag = telNumCheck(this.pointInfo.principal)
          if (flag) {
            this.errorMsg('联系方式输入有误，仅支持数字和(-)')
            return
          } else {
            let result = peopleNameLengthCheck(this.pointInfo.principal)
            if (result.flag) {
              this.errorMsg('第' + result.index + '个负责人长度超过16个字符')
              return
            }
          }
          this.saveAssistHolePointData() // 保存辅助杆点位数据
        } else { // 表单校验失败
          console.log('保存辅助杆点位信息表单校验失败！')
          this.selectedTab = 'resource' // 跳转到资源表单信息
        }
      })
    },
    saveAssistHolePointData() { // 保存辅助杆点位数据
      this.updateAssistHoleById(this.pointInfo).then(res => {
        this.successMsg('辅助杆点位修改成功')
        if (this.is3DMapOuter) { // 楼外3D地图
          this.cancel3DMapSelectedEffect() // 取消3D视地图体选中效果
        }
      }).catch(err => {
        console.log('辅助杆点位修改失败：', err)
        this.errorMsg('辅助杆点位修改失败')
      })
    },
    cancelSaveAssistHolePoint(name) { // 取消保存
      this.$refs[name].resetFields() // 重置表单
      if (this.is3DMapOuter) { // 当前地图是楼外3D地图时
        this.resetPointEntity() // 还原之前的实体效果
        this.cancel3DMapSelectedEffect() // 取消3D地图实体选中效果
      }
    },
    resetPointEntity() { // 重置点为实体
      this.getAssistHoleById(this.mapResource._id).then(res => {
        let point3D = res
        this.resetEntity(point3D) // 还原之前的实体效果
      })
    }
  }
}
</script>
