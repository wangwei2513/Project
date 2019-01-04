<template>
 <div class="imensional-wrap">
    <h3>2D/3D配置</h3>
    <RadioGroup class="timecontent" v-model="imensional">
      <div>
        <label class="lefttitle">2D</label>
        <Radio label="2D">启用</Radio>
      </div>
      <div>
        <label class="lefttitle">3D</label>
        <Radio label="3D">启用</Radio>
      </div>
    </RadioGroup>
    <div class="footer">
      <Button type="primary" @click="save">保存</Button>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { save } from '../../../storage/index.js'

export default {
  data() {
    return {
      imenId: '',
      imensional: '2D'
    }
  },
  created() {
    this.getTwoImensionalInfo()
      .then(suc => {
        this.imenId = suc._id
        if (suc.mapType) {
          this.imensional = '2D'
        } else {
          this.imensional = '3D'
        }
      })
      .catch(err => {
        return this.errosMsg('getTwoImensionalInfo：' + err)
      })
  },
  methods: {
    ...mapActions(['getTwoImensionalInfo', 'setTwoImensionalInfo']),
    save() {
      let id = this.imenId
      let list = {
        _id: id,
        mapType: this.imensional === '2D'
      }
      this.setTwoImensionalInfo(list)
        .then(suc => {
          save('mapType', this.imensional)
          return this.successMsg('设置成功')
        })
        .catch(err => {
          console.log('setTwoImensionalInfo:' + err)
        })
    }
  }
}
</script>

<style scoped>
.imensional-wrap {
  background: #1b3153;
  width: 100%;
  line-height: 35px;
}

h3 {
  font-size: 14px;
  height: 38px;
  line-height: 38px;
  background: #0f2243;
  padding-left: 24px;
  font-weight: normal;
  margin-bottom: 15px;
}

.timecontent {
  margin-left: 48px;
}

.lefttitle {
  width: 100px;
  display: inline-block;
  margin: 20px 0 0 0;
}

.rightcontent {
  margin-left: 100px;
}

.footer {
  margin-top: 40px;
}

.footer button {
  width: 100px;
  margin-left: 100px;
}
</style>
