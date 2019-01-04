<!-- 报警求助点位信息编辑面板--逻辑控制脚本文件 -->
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
      alarmHelpData: {}, // 报警求助资源信息
      keyTypes: {},
      validateRule: {
        name: [
          { required: true, message: '请输入终端名称', trigger: 'change' }
        ],
        chan: [
          { required: true, validator: chanValidator, trigger: 'change' }
        ]
      }
    }
  },
  methods: {
    ...mapActions([
      'getAlarmHelpOrgTree', // 获取报警求助点位树
      'setAlarmHelpList', // 设置报警点求助位要素列表
      'saveOrUpdateAlarmHelpPoint' // 保存或者更新报警求助点位
    ]),
    refreashFormInfo(val) { // 刷新表单信息
      this.transAlarmInfo(val) // 转换成表单呈现的报警求助点位信息
      this.loadModelList(val[this.mapMode]) // 加载模型列表
    },
    transAlarmInfo(val) { // 转换成表单呈现的报警求助信息
      if (val[this.mapMode]) {
        this.point3D = val[this.mapMode]
        this.pointInfo = this.$lodash.cloneDeep(this.point3D) // 深拷贝报警求助信息
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
      const {name, chan} = val
      this.alarmHelpData = {name: name, chan: chan}
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
    deleteAlarmHelpPoint() { // 删除报警求助
      let _pointData = JSON.parse(JSON.stringify(this.mapResource)) // 地图资源数据
      this.$Modal.confirm({
        title: '警告',
        content: '<p>确认删除所选报警求助吗？</p>',
        onOk: () => { // 确认回调方法
          this.deleteResourceById(_pointData._id) // 根据id删除报警求助数据
            .then(res => {
              if (this.is3DMapOuter) { // 楼外3D地图
                this.cancel3DMapSelectedEffect() // 取消实体选中效果
                if (this.ready) { // 地图加载完成时
                  utils.reomoveEntityById(_pointData._id, this.keyTypes.alarmHelp, this.$context)
                }
                this.getAlarmHelpOrgTree({ mapType: '3D' }) // 更新报警资源树
              } else { // 楼内地图
                this.cancelBuildingMapSelectedEffect() // 取消楼内地图要素选中效果
                if (this.floorData._id) {
                  this.getAlarmHelpOrgTree({ mapType: '3D', floorId: this.floorData._id }) // 根据楼层id更新地图资源树
                  this.refreshAlarmHelpPointDateByFloor() // 刷新楼层报警求助图层数据源
                }
              }
              this.successMsg('报警求助删除成功')
            })
            .catch(err => {
              console.log('报警求助删除失败：', err)
              this.errorMsg('报警求助删除失败')
            })
        },
        onCancel: () => {}
      })
    },
    refreashPointLayer() { // 刷新点位图层
      this.cancelBuildingMapSelectedEffect() // 取消楼内地图要素选中效果
      if (this.floorData._id) {
        this.refreshAlarmHelpPointDateByFloor() // 刷新楼层报警求助图层数据源
      }
    },
    refreshAlarmHelpPointDateByFloor() { // 刷新楼层报警求助图层数据源
      let param = { tab: mapUtil.TABTYPE.alarmHelp, sid: this.floorData._id, channelTypes: mapUtil.CHANNELTYPE.vedioResource }
      this.getResourcePointsByChannelType(param).then(res => {
        console.log('楼层ID：', this.floorData._id, '报警求助点位数据：', res)
        let alarms = editResource.convertPointDataToFeatures(res, this.mapMode)
        this.setAlarmHelpList(alarms)
      })
    },
    saveAlarmHelpPoint(name) { // 保存报警求助点位
      this.$refs[name].validate(valid => {
        if (valid) { // 表单校验成功
          console.log('报警求助点位信息表单校验成功！')
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
          this.saveAlarmHelpPointData() // 保存报警求助点位数据
        } else { // 表单校验失败
          console.log('保存报警求助点位信息表单校验失败！')
          this.selectedTab = 'resource' // 跳转到资源表单信息
        }
      })
    },
    saveAlarmHelpPointData() { // 保存报警求助点位数据
      let _dataEdit = JSON.parse(JSON.stringify(this.mapResource))
      _dataEdit.name = this.alarmHelpData.name // 名称
      _dataEdit.chan = this.alarmHelpData.chan // 编号
      _dataEdit[this.mapMode] = this.pointInfo
      this.saveOrUpdateAlarmHelpPoint({ _id: _dataEdit._id, body: _dataEdit }) // 更新报警求助点位信息
        .then(res => {
          this.successMsg('报警求助点位修改成功')
          if (this.is3DMapOuter) { // 楼外3D地图
            this.cancel3DMapSelectedEffect() // 取消3D视地图体选中效果
            this.getAlarmHelpOrgTree({ mapType: '3D' }) // 更新报警资源树
          } else { // 楼内地图
            this.cancelBuildingMapSelectedEffect() // 取消楼内地图要素选中效果
            if (this.floorData._id) {
              this.getAlarmHelpOrgTree({ mapType: '3D', floorId: this.floorData._id }) // 根据楼层id更新地图资源树
              this.refreshAlarmHelpPointDateByFloor() // 刷新楼层报警求助点位图层数据源
            }
          }
        }).catch(err => {
          console.log('报警求助点位修改失败：', err)
          this.errorMsg('报警求助点位修改失败')
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
