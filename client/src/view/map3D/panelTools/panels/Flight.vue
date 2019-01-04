<template>
  <div class="flightContainer">
    <div class="flightTitle"><span>飞行漫游</span></div>
    <div class="flightContent">
      <Form label-position="top">
        <FormItem label="飞行路线" prop="passwd">
          <Select v-model="route" @on-change="initRoute">
            <Option v-for="item in routes" :value="item.value" :key="item.value">{{ item.label }}</Option>
        </Select>
        </FormItem>
        <FormItem label="飞行站点" prop="passwdCheck">
          <Select v-model="stopPosition" @on-change="setRouteToStop">
            <Option v-for="item in stops" :value="item.value" :key="item.value">{{ item.label }}</Option>
          </Select>
        </FormItem>
        <FormItem>
          <Checkbox on-change="showRoute">显示飞行路线</Checkbox>
          <Checkbox on-change="showStop">显示飞行站点</Checkbox>
        </FormItem>
        <FormItem>
          <Button type="info" @click="start" style="margin-right: 16px;">开始</Button>
          <Button type="success" @click="pause" style="margin-right: 16px;">暂停</Button>
          <Button type="warning" @click="stop">停止</Button>
        </FormItem>
      </Form>
    </div>
  </div>
</div>
</template>
<script>
import { mapState } from 'vuex'
export default {
  data() {
    return {
      routes: [
        {
          value: 'route1',
          label: '路线1'
        },
        {
          value: 'route2',
          label: '路线2'
        },
        {
          value: 'route3',
          label: '路线3'
        }
      ],
      stops: [
        {
          value: 'stop1',
          label: '站点1'
        },
        {
          value: 'stop2',
          label: '站点2'
        },
        {
          value: 'stop3',
          label: '站点3'
        },
        {
          value: 'stop4',
          label: '站点4'
        }
      ],
      route: '',
      stopPosition: '',
      flyManager: null
    }
  },
  computed: {
    ...mapState({
      ready: ({ tdIndex }) => tdIndex.ready, // 三维地图是否加载完成的标识----
      mapMode: ({ tdIndex }) => tdIndex.mapMode, // 地图模式----
      is3DMapOuter: ({ tdIndex }) => tdIndex.is3DMapOuter
    })
  },
  methods: {
    initRoute(routeUrl) {
      if (this.ready) {
        const viewer = this.$context.viewer
        let routes = new this.$context.Cesium.RouteCollection(viewer.entities)
        routes.fromFile(routeUrl)
        // 初始化飞行管理
        this.flyManager = new this.$context.Cesium.FlyManager({
          scene: viewer.scene,
          routes: routes
        })
        // 注册站点到达事件
        this.flyManager.stopArrived.addEventListener((routeStop) => {
          let stopName = routeStop.stopName
          let entity = new this.$context.Cesium.Entity({
            description: '到达站点 : ' + stopName,
            name: stopName
          })
          viewer.selectedEntity = entity
          setTimeout(function() {
            viewer.selectedEntity = undefined
          }, 1000)
          routeStop.waitTime = 1
        })
        if (this.flyManager.readyPromise) {
          this.$context.Cesium.when(this.flyManager.readyPromise, () => {
            let currentRoute = this.flyManager.currentRoute
            currentRoute.isLineVisible = true
            currentRoute.isStopVisible = true
            let allStops = this.flyManager.getAllRouteStops()
            allStops.forEach((elem, index) => {
              this.stops.push({value: elem.index, label: '站点' + (index + 1)})
            })
          })
        }
      }
    },
    start() {
      if (this.flyManager) {
        this.flyManager.play()
      }
    },
    stop() {
      if (this.flyManager) {
        this.flyManager.stop()
      }
    },
    pause() {
      if (this.flyManager) {
        this.flyManager.pause()
      }
    },
    setRouteToStop(index) {
      let route = this.flyManager.currentRoute
      let stop = route.get(index)
      this.flyManager.currentStopIndex = index
      this.flyManager.viewToStop(stop)
    },
    showRoute(flag) {
      if (this.flyManager) {
        this.flyManager.currentRoute.isStopVisible = flag
      }
    },
    showStop(flag) {
      if (this.flyManager) {
        this.flyManager.currentRoute.isLineVisible = flag
      }
    }
  },
  mounted() {

  }
}
</script>
<style scoped>
.flightContainer {
  width: 100%;
  height: 100%;
  background: #1b3153;
}
/* 标题样式 */
.flightTitle {
  background: #0f2343;
  padding: 0 16px;
  height: 38px;
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}
.flightTitle span {
  height: 40px;
  line-height: 40px;
  float: left;
}
.flightContent {
  width: 100%;
  padding: 24px 20px;
}
</style>
