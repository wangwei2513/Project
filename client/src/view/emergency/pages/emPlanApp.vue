<template>
  <div class="emHome">
    <div class="emEditLeft">
      <div class="emtop">
        <div class="rmtopImg">
          <div class="buildEditImg">
            <span>预案类型:{{formData.plan}}</span>
            <div class="buildImg">
              <img v-if="formData.planPhoto" @onerror="errorUrl" style="vertical-align:bottom;width:100%;max-width:800px;max-height:580px;border-radius:5px;" :src="formData.planPhoto">
            </div>
          </div>
        </div>
      </div>
      <div class="emtBottom">
        <div class="emtBottomText">
          <Input readonly v-model="formData.remark" type="textarea" :rows="3" :autosize="{minRows: 3, maxRows: 5}" placeholder="请输入文本信息。。。" />
        </div>
      </div>
    </div>
    <div class="emEditRight">
      <Table height="600" size="small" :columns="emColumns" :data="formData.group"></Table>
    </div>
  </div>
</template>
<script>
import { mapState } from 'vuex'
export default {
  data() {
    return {
      // 表单数据
      formData: {
        planPhoto: '',
        remark: '',
        orgid: '',
        group: [],
        plan: '',
        planId: null
      },
      emColumns: [
        {
          title: '序号',
          key: 'name',
          minWidth: 20,
          align: 'center',
          ellipsis: true,
          type: 'index'
        },
        {
          title: '姓名',
          key: 'name',
          minWidth: 60,
          align: 'center',
          ellipsis: true,
          render: (h, params) => {
            return h('div', [h('strong', params.row.name)])
          }
        },
        {
          title: '职务',
          key: 'name',
          align: 'center',
          minWidth: 60,
          ellipsis: true,
          render: (h, params) => {
            return h('div', [h('strong', params.row.position)])
          }
        },
        {
          title: '电话',
          key: 'name',
          minWidth: 60,
          align: 'center',
          ellipsis: true,
          render: (h, params) => {
            return h('div', [h('strong', params.row.phone)])
          }
        }
      ]
    }
  },
  computed: {
    ...mapState({
      oneEmInfo: ({ emergencyMan }) => emergencyMan.oneEmInfo
    })
  },
  watch: {
    oneEmInfo(val) {
      if (val) {
        this.formData = JSON.parse(JSON.stringify(val))
      } else {
        var formDataDef = {
          planPhoto: '',
          remark: '',
          orgid: '',
          group: [],
          plan: '',
          planId: null
        }
        this.formData = JSON.parse(JSON.stringify(formDataDef))
      }
    }
  },
  methods: {
    errorUrl(event) {
      var img = event.srcElement
      img.src = '/api/upload?id=' + this.formData.planPhoto
      img.onerror = null
    }
  }
}
</script>
<style scoped>
.emHome {
  display: -ms-flexbox;
  display: flex;
  overflow: auto;
  -ms-flex: 1;
  flex: 1;
  padding: 16px;
  font-size: 14px;
}
.emHome .emEditLeft {
  display: flex;
  background: #1c3053;
  margin-right: 15px;
  flex-direction: column;
  justify-content: space-between;
  width: 50%;
  max-width: 800px;
}
.emHome .emEditLeft .emtop {
  display: flex;
  flex-direction: column;
  /* flex: 0 0 580px; */
}
.emHome .emEditLeft .emtop .rmtopImg {
  flex: 1;
  display: flex;
  /* margin: 10px 0px 40px 0px; */
  flex-direction: column;
}
.emHome .emEditLeft .emtop .rmtopImg .buildEditImg {
  flex: 1;
}
.emHome .emEditLeft .emtop .rmtopImg .buildEditImg .buildImg {
  width: 100%;
  max-width: 800px;
  max-height: 580px;
  border: 1px solid #5676a9;
  border-radius: 5px;
  min-height: 600px;
}
.emHome .emEditRight {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1c3053;
  margin-right: 15px;
  width: 100%;
}
.emHome .emEditLeft .emtBottom {
  width: 100%;
}
.emtBottomText {
  flex: 1;
  color: #000;
  padding: 3px;
}
</style>
