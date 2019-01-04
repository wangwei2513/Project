<!-- 报警点位信息编辑面板--逻辑控制脚本文件 -->
<script>
import { mapActions } from 'vuex'
import mapUtil from 'assets/3DMap/mapUtil'
import editResource from 'assets/3DMap/editResource'
import { telNumCheck, telNameCheck, peopleNameLengthCheck } from '../formCheck'
import utils from 'assets/3DMap/utils/index'

export default {
  data() {
    const chanValidator = (rule, value, callback) => { // 编号校验
      let reg = /^[0-9a-zA-Z_]{1,}$/g
      if (value) {
        if (reg.test(value)) {
          callback()
        } else {
          callback(new Error('只支持数字、字母和下划线'))
        }
      }
    }
    return {
      alarmData: {}, // 报警资源信息
      keyTypes: {},
      validateRule: {
        name: [
          { required: true, message: '请输入设备名称', trigger: 'change' }
        ],
        chan: [
          { required: true, validator: chanValidator, trigger: 'change' }
        ]
      }
    }
  },
  methods: {
    ...mapActions([
      'getAlarmResourceOrgTree', // 获取报警点位树
      'setAlarmList', // 设置报警点位要素列表
      'saveOrUPdateAlarmPoint' // 保存或者更新报警点位
    ]),
    refreashFormInfo(val) { // 刷新表单信息
      this.transAlarmInfo(val) // 转换成表单呈现的报警点位信息
      this.loadModelList(val[this.mapMode]) // 加载模型列表
    },
    transAlarmInfo(val) { // 转换成表单呈现的报警点位信息
      if (val[this.mapMode]) {
        this.point3D = val[this.mapMode]
        this.pointInfo = this.$lodash.cloneDeep(this.point3D) // 深拷贝报警点位信息
        this.pointInfo.name = val.name
        if (this.pointInfo.loc) {
          let coValues = this.pointInfo.loc.split(',').map(item => Number(item))
          if (coValues && coValues.length === 3) { // 坐标是三维坐标时，设置高度信息
            this.pointInfo.height = coValues[2]
          }
          this.locFormat = utils.formatLoc(this.pointInfo.loc) // 格式化经纬度高度信息
        }
        if (!this.pointInfo.principal || this.pointInfo.principal.length === 0) {
          this.pointInfo.principal = [{name: '', mobile: ''}] // 初始化联系信息
        }
      }
      const {name, chan, level} = val
      this.alarmData = {name: name, chan: chan, level: level, alarmTemplate: ''}
      if (val.alarmtemplate) { // 布撤防时间
        this.alarmData.alarmTemplate = val.alarmtemplate.name
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
    deleteAlarmPoint() { // 删除报警点位
      let _pointData = JSON.parse(JSON.stringify(this.mapResource)) // 地图资源数据
      this.$Modal.confirm({
        title: '警告',
        content: '<p>确认删除所选报警点位吗？</p>',
        onOk: () => { // 确认回调方法
          this.deleteResourceById(_pointData._id) // 根据id删除报警点位数据
            .then(res => {
              if (this.is3DMapOuter) { // 楼外3D地图
                this.cancel3DMapSelectedEffect() // 取消实体选中效果
                if (this.ready) { // 地图加载完成时
                  utils.reomoveEntityById(_pointData._id, this.keyTypes.alarm, this.$context)
                }
                this.getAlarmResourceOrgTree({ mapType: '3D' }) // 更新报警资源树
              } else { // 楼内地图
                this.cancelBuildingMapSelectedEffect() // 取消楼内地图要素选中效果
                if (this.floorData._id) {
                  this.getAlarmResourceOrgTree({ mapType: '3D', floorId: this.floorData._id }) // 根据楼层id更新地图资源树
                  this.refreshAlarmPointDateByFloor() // 刷新楼层报警点位图层数据源
                }
              }
              this.successMsg('报警点位删除成功')
            })
            .catch(err => {
              console.log('报警点位删除失败：', err)
              this.errorMsg('报警点位删除失败')
            })
        },
        onCancel: () => {}
      })
    },
    refreashPointLayer() { // 刷新点位图层
      this.cancelBuildingMapSelectedEffect() // 取消楼内地图要素选中效果
      if (this.floorData._id) {
        this.refreshAlarmPointDateByFloor() // 刷新楼层报警点位图层数据源
      }
    },
    refreshAlarmPointDateByFloor() { // 刷新楼层报警点位图层数据源
      // 资源类型为报警点位（普通报警、消防报警、报警主机报警）
      let channelTypes = mapUtil.CHANNELTYPE.commonAlarmResource + ',' + mapUtil.CHANNELTYPE.fireAlarmResource + ',' + mapUtil.CHANNELTYPE.alarmHostResource
      let param = { sid: this.floorData._id, channelTypes: channelTypes }
      this.getResourcePointsByChannelType(param).then(res => {
        console.log('楼层ID：', this.floorData._id, '报警求助点位数据：', res)
        let alarms = editResource.convertPointDataToFeatures(res, this.mapMode)
        this.setAlarmList(alarms)
      })
    },
    saveAlarmPoint(name) { // 保存报警点位
      this.$refs[name].validate(valid => {
        if (valid) { // 表单校验成功
          console.log('报警点位信息表单校验成功！')
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
          this.saveAlarmPointData() // 保存报警点位数据
        } else { // 表单校验失败
          console.log('保存报警点位信息表单校验失败！')
          this.selectedTab = 'resource' // 跳转到资源表单信息
        }
      })
    },
    saveAlarmPointData() { // 保存报警点位数据
      let alarmDataEdit = JSON.parse(JSON.stringify(this.mapResource))
      alarmDataEdit.name = this.alarmData.name // 名称
      alarmDataEdit.chan = this.alarmData.chan // 编号
      alarmDataEdit[this.mapMode] = this.pointInfo
      this.saveOrUPdateAlarmPoint({ _id: alarmDataEdit._id, body: alarmDataEdit }) // 更新报警点位信息
        .then(res => {
          this.successMsg('报警点位修改成功')
          if (this.is3DMapOuter) { // 楼外3D地图
            this.cancel3DMapSelectedEffect() // 取消3D视地图体选中效果
            this.getAlarmResourceOrgTree({ mapType: '3D' }) // 更新报警资源树
          } else { // 楼内地图
            this.cancelBuildingMapSelectedEffect() // 取消楼内地图要素选中效果
            if (this.floorData._id) {
              this.getAlarmResourceOrgTree({ mapType: '3D', floorId: this.floorData._id }) // 根据楼层id更新地图资源树
              this.refreshAlarmPointDateByFloor() // 刷新楼层报警点位图层数据源
            }
          }
        }).catch(err => {
          console.log('报警点位修改失败：', err)
          this.errorMsg('报警点位修改失败')
        })
    },
    resetPointEntity() { // 重置点为实体
      this.getResourceById(this.mapResource._id).then(res => {
        let point3D = res[this.mapMode]
        this.resetEntity(point3D) // 还原之前的实体效果
      })
    }
  },
  mounted() {
    this.keyTypes = mapUtil.getKeyType()
  }
}
</script>
