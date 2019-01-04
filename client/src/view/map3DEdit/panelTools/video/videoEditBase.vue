<!-- 视频信息编辑面板--逻辑控制脚本文件 -->
<script>
import { mapActions } from 'vuex'
import mapUtil from 'assets/3DMap/mapUtil'
import editResource from 'assets/3DMap/editResource'
import { telNumCheck, telNameCheck, peopleNameLengthCheck } from '../formCheck'
import utils from 'assets/3DMap/utils/index'

export default {
  data() {
    // 不允许输入空格
    const noSpace = (rule, value, callback) => {
      let r = /\s+/g
      if (value && value.length > 0) {
        if (r.test(value)) {
          return callback(new Error('不允许输入空格'))
        } else {
          callback()
        }
      } else {
        return callback(new Error('名称不能为空'))
      }
    }
    return {
      keyTypes: {},
      validateRule: {
        name: [
          { required: true, validator: noSpace, trigger: 'change' }
        ],
        class: [
          { required: true, message: '请输入可见范围', trigger: 'change' }
        ]
      }
    }
  },
  methods: {
    ...mapActions([
      'getVedioResourceOrgTree', // 获取视频点位资源树
      'setVideoList', // 设置视频点位要素列表
      'saveOrUpdateVedioPoint' // 保存或者更新视频点位
    ]),
    refreashFormInfo(val) { // 刷新表单信息
      this.transVideoInfo(val) // 转换成表单呈现的视频点位信息
      this.loadModelList(val[this.mapMode]) // 加载模型列表
    },
    transVideoInfo(val) { // 转换成表单呈现的视频点位信息
      if (val[this.mapMode]) {
        this.point3D = val[this.mapMode]
        let firm = '-'
        if (val.eid) {
          if (val.eid.manufacturer) {
            firm = val.eid.manufacturer
          }
        }
        this.pointInfo = this.$lodash.cloneDeep(this.point3D) // 深拷贝报警点位信息
        this.pointInfo.name = val.name
        this.pointInfo.firm = firm // 厂商
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
    deleteVideoPoint() { // 删除视频点位
      let _pointData = JSON.parse(JSON.stringify(this.mapResource)) // 地图资源数据
      this.$Modal.confirm({
        title: '警告',
        content: '<p>确认删除所选视频点位吗？</p>',
        onOk: () => { // 确认回调方法
          this.deleteResourceById(_pointData._id) // 根据ID删除资源
            .then(res => {
              if (this.is3DMapOuter) { // 楼外3D地图
                this.cancel3DMapSelectedEffect() // 取消实体选中效果
                if (this.ready) { // 地图加载完成时
                  utils.reomoveEntityById(_pointData._id, this.keyTypes.vedio, this.$context)
                }
                this.getVedioResourceOrgTree({ mapType: '3D' }) // 更新视频资源树
              } else { // 楼内地图
                this.cancelBuildingMapSelectedEffect() // 取消楼内地图要素选中效果
                if (this.floorData._id) {
                  this.getVedioResourceOrgTree({ mapType: '3D', floorId: this.floorData._id }) // 根据楼层id更新地图资源树
                  this.refreshVideoPointDateByFloor() // 刷新楼层视频点位图层数据源
                }
              }
              this.successMsg('视频点位删除成功')
            })
            .catch(err => {
              console.log('视频点位删除失败：', err)
              this.errorMsg('视频点位删除失败')
            })
        },
        onCancel: () => {}
      })
    },
    refreashPointLayer() { // 刷新点位图层
      this.cancelBuildingMapSelectedEffect() // 取消楼内地图要素选中效果
      if (this.floorData._id) {
        this.refreshVideoPointDateByFloor() // 刷新楼层视频点位图层数据源
      }
    },
    refreshVideoPointDateByFloor() { // 刷新楼层视频点位图层数据源
      let param = { tab: mapUtil.TABTYPE.video, sid: this.floorData._id, channelTypes: mapUtil.CHANNELTYPE.vedioResource }
      this.getResourcePointsByChannelType(param).then(res => {
        console.log('楼层ID：', this.floorData._id, '视频点位数据：', res)
        let vedios = editResource.convertPointDataToFeatures(res, this.mapMode)
        this.setVideoList(vedios)
      })
    },
    saveVideoPoint(name) { // 保存视频点位
      this.$refs[name].validate(valid => {
        if (valid) { // 表单校验成功
          console.log('视频点位信息表单校验成功！')
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
          this.saveVideoPointData() // 保存视频点位数据
        } else { // 表单校验失败
          console.log('保存视频点位信息表单校验失败！')
          this.selectedTab = 'resource' // 跳转到资源表单信息
        }
      })
    },
    saveVideoPointData() { // 保存视频点位数据
      let pointDataEdit = JSON.parse(JSON.stringify(this.mapResource))
      pointDataEdit.name = this.pointInfo.name
      pointDataEdit[this.mapMode] = this.pointInfo
      this.saveOrUpdateVedioPoint({ _id: pointDataEdit._id, body: pointDataEdit }) // 更新视频点位信息
        .then(res => {
          this.successMsg('视频点位修改成功')
          if (this.is3DMapOuter) { // 楼外3D地图
            this.cancel3DMapSelectedEffect() // 取消3D视地图体选中效果
            this.getVedioResourceOrgTree({ mapType: '3D' }) // 更新视频资源树
          } else { // 楼内地图
            this.cancelBuildingMapSelectedEffect() // 取消楼内地图要素选中效果
            if (this.floorData._id) {
              this.getVedioResourceOrgTree({ mapType: '3D', floorId: this.floorData._id }) // 根据楼层id更新地图资源树
              this.refreshVideoPointDateByFloor() // 刷新楼层视频点位图层数据源
            }
          }
        }).catch(err => {
          console.log('视频点位修改失败：', err)
          this.errorMsg('视频点位修改失败')
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
