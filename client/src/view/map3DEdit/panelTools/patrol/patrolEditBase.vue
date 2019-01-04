<!-- 巡更点位信息编辑面板--逻辑控制脚本文件 -->
<script>
import { mapActions } from 'vuex'
import editPatrol from 'assets/3DMap/editPatrolIpc'
import utils from 'assets/3DMap/utils/index'
import mapUtil from 'assets/3DMap/mapUtil'
export default {
  data() {
    const phoneValidator = (rule, value, callback) => {
      let reg = /^([0-9]|[-])+$/g
      if (value) {
        if (!reg.test(value)) {
          callback(new Error('联系方式输入有误，仅支持数字和(-)'))
        }
      }
      callback()
    }
    return {
      geoFormat: '', // 点位位置格式化信息
      patrolData: {}, // 巡更点位资源表单信息
      validateRule: {
        devName: [{ required: true, message: '请输入设备名称', trigger: 'change' }],
        phone: [{ validator: phoneValidator, trigger: 'change' }]
      }
    }
  },
  methods: {
    ...mapActions([
      'getPatrolOrgTree', // 获取巡更点位树
      'setPatrolList', // 设置巡更点位要素列表
      'saveOrUPdatePatrolPoint', // 保存或者更新巡更点位
      'deletePatrolPointById', // 根据id删除巡更点位信息
      'getOneFloorPatrols', // 获取指定楼层的巡更点位数据
      'getSinglePatrolPoint' // 根据标识获取巡更点位信息
    ]),
    refreashFormInfo(val) { // 刷新表单信息
      this.transPatrolInfo(val) // 转换成表单呈现的巡更点位信息
      this.loadModelList(val[this.mapMode]) // 加载模型列表
    },
    transPatrolInfo(val) { // 转换成表单呈现的巡更点位信息
      if (val[this.mapMode]) {
        this.point3D = val[this.mapMode]
        this.pointInfo = this.$lodash.cloneDeep(this.point3D) // 深拷贝巡更点位信息
        if (this.pointInfo.geo) { // 设置高度信息
          let coValues = this.pointInfo.geo.split(',').map(item => Number(item))
          if (coValues && coValues.length === 3) { // 坐标是三维坐标时，设置高度信息
            this.pointInfo.height = coValues[2]
          }
          this.geoFormat = utils.formatLoc(this.pointInfo.geo) // 格式化经纬度高度信息
        }
        const {devName, devId, devCode, charger, phone} = val
        this.patrolData = {devName: devName, devId: devId, devCode: devCode, charger: charger, phone: phone} // 巡更点位资源信息
      }
    },
    changePointLoc(loc) { // 改变点位的位置信息
      this.pointInfo.geo = loc
      if (this.pointInfo.loc) {
        let coValues = this.pointInfo.loc.split(',').map(item => Number(item))
        if (coValues && coValues.length === 3) { // 坐标是三维坐标时，设置高度信息
          this.pointInfo.height = coValues[2]
        }
        this.geoFormat = utils.formatLoc(this.pointInfo.loc) // 格式化经纬度高度信息
      }
    },
    deletePatrolPoint() { // 删除巡更点位
      let _pointData = JSON.parse(JSON.stringify(this.mapResource)) // 地图资源数据
      this.$Modal.confirm({
        title: '警告',
        content: '<p>确认删除所选巡更点位吗？</p>',
        onOk: () => { // 确认回调方法
          this.deletePatrolPointById(_pointData._id) // 根据id删除巡更点位数据
            .then(res => {
              if (this.is3DMapOuter) { // 楼外3D地图
                this.cancel3DMapSelectedEffect() // 取消实体选中效果
                if (this.ready) { // 地图加载完成时
                  utils.reomoveEntityById(_pointData._id, this.keyTypes.patrol, this.$context)
                }
                this.getPatrolOrgTree({ mapType: '3D' }) // 更新巡更资源树
              } else { // 楼内地图
                this.cancelBuildingMapSelectedEffect() // 取消楼内地图要素选中效果
                if (this.floorData._id) {
                  this.getPatrolOrgTree({ mapType: '3D', floorId: this.floorData._id }) // 根据楼层id更新地图资源树
                  this.refreshPatrolPointDateByFloor() // 刷新楼层巡更点位图层数据源
                }
              }
              this.successMsg('巡更点位删除成功')
            })
            .catch(err => {
              console.log('巡更点位删除失败：', err)
              this.errorMsg('巡更点位删除失败')
            })
        },
        onCancel: () => {}
      })
    },
    refreashPointLayer() { // 刷新点位图层
      this.cancelBuildingMapSelectedEffect() // 取消楼内地图要素选中效果
      if (this.floorData._id) {
        this.refreshPatrolPointDateByFloor() // 刷新楼层巡更点位图层数据源
      }
    },
    refreshPatrolPointDateByFloor() { // 刷新楼层巡更点位图层数据源
      this.getOneFloorPatrols(this.floorData._id).then(patrolDatas => {
        let patrols = editPatrol.convertPatrolPointsToFeatures(patrolDatas, this.mapMode)
        this.setPatrolList(patrols)
      }).catch(err => {
        console.log('加载楼层：', this.floorData._id, '巡更点失败：', err)
      })
    },
    savePatrolPoint(name) { // 保存巡更点位
      this.$refs[name].validate(valid => {
        if (valid) { // 表单校验成功
          console.log('巡更点位信息表单校验成功！')
          this.savePatrolPointData() // 保存巡更点位数据
        } else { // 表单校验失败
          console.log('保存巡更点位信息表单校验失败！')
          this.selectedTab = 'resource' // 跳转到资源表单信息
        }
      })
    },
    savePatrolPointData() { // 保存巡更点位数据
      let patrolDataEdit = JSON.parse(JSON.stringify(this.mapResource))
      patrolDataEdit.devName = this.patrolData.devName // 设置设备名称
      patrolDataEdit.charger = this.patrolData.charger // 设置设备负责人
      patrolDataEdit.phone = this.patrolData.phone // 设置联系电话
      patrolDataEdit[this.mapMode] = this.pointInfo // 设置点位信息
      this.saveOrUPdatePatrolPoint(patrolDataEdit) // 更新巡更点位信息
        .then(res => {
          if (this.is3DMapOuter) { // 楼外3D地图
            this.cancel3DMapSelectedEffect() // 取消3D视地图体选中效果
            this.getPatrolOrgTree({ mapType: '3D' }) // 更新巡更资源树
          } else { // 楼内地图
            this.cancelBuildingMapSelectedEffect() // 取消楼内地图要素选中效果
            if (this.floorData._id) {
              this.getPatrolOrgTree({ mapType: '3D', floorId: this.floorData._id }) // 根据楼层id更新地图资源树
              this.refreshPatrolPointDateByFloor() // 刷新楼层巡更点位图层数据源
            }
          }
          this.successMsg('巡更点位修改成功')
        }).catch(err => {
          console.log('巡更点位修改失败：', err)
          this.errorMsg('巡更点位修改失败')
        })
    },
    resetPointEntity() { // 重置点为实体
      this.getSinglePatrolPoint(this.mapResource._id).then(res => {
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
