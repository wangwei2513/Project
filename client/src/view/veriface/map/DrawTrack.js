const SPEED = 5 // 轨迹动画的播放速率
const STEPTIME = 10000 // 轨迹动画的节点间隔时间（单位：毫秒）
const TRACKZINDEX = 9999 // 轨迹动画的播放速率
const DEFAULTOPS = {
  route: 'route',
  node: 'node',
  geoMarker: 'geoMarker',
  routeWidth: 4, // 路线线宽
  routeColor: '#D0021B', // 路线线颜色
  arrowImg: '/static/veriface/arrow.png' // 箭头图片,
}
let _ol = null // 地图类库
const STYLE = {
  /**
   * 轨迹路线的样式
   * @param {*} feature 要素
   * @returns 样式
   */
  routeStyle(feature) {
    // 路线样式.
    let geometry = feature.get('geometry') // 获取要素的几何图形
    let styles = [] // 样式数组
    styles.push(
      new _ol.style.Style({
        stroke: new _ol.style.Stroke({
          color: DEFAULTOPS.routeColor,
          width: DEFAULTOPS.routeWidth
        }),
        zIndex: TRACKZINDEX + 1
      })
    )
    // 遍历线的每个线段
    geometry.forEachSegment((start, end) => {
      let dx = end[0] - start[0] // x方向上的变化量
      let dy = end[1] - start[1] // y方向上的变化量
      if (dx !== 0 || dy !== 0) { // 判断 start 和 end 坐标不同时
        let rotation = Math.atan2(dy, dx) // 旋转角度
        let segment = new _ol.geom.LineString([start, end]) // 线段
        let pos = segment.getCoordinateAt(0.7) // 计算
        styles.push(
          new _ol.style.Style({
            geometry: new _ol.geom.Point(pos), // 剪头的位置
            image: new _ol.style.Icon({
              src: DEFAULTOPS.arrowImg, // 箭头图片（箭头指向右方）
              rotation: -rotation,
              scale: 0.8
            }),
            zIndex: TRACKZINDEX + 2
          })
        )
      }
    })
    return styles
  },

  /**
   * 节点样式
   * @param {*} feature 要素
   * @returns 样式
   */
  nodeStyle(feature) {
    let style = new _ol.style.Style({
      image: new _ol.style.Circle({
        radius: 7.5,
        fill: new _ol.style.Fill({ color: '#057AFC' }),
        stroke: new _ol.style.Stroke({
          color: '#FFFFFF',
          width: 2
        })
      }),
      zIndex: TRACKZINDEX + 3
    })
    return style
  },

  /**
   * 定位图标样式
   * @param {*} feature 要素
   * @returns 样式
   */
  geoMarkerStyle(feature) {
    // 定位图标样式
    let style = new _ol.style.Style({
      image: new _ol.style.Circle({
        radius: 7.5,
        fill: new _ol.style.Fill({ color: '#057AFC' }),
        stroke: new _ol.style.Stroke({
          color: '#FFFFFF',
          width: 2
        })
      }),
      zIndex: TRACKZINDEX + 4
    })
    return style
  }
}

export default class {
  /**
   * 构造方法
   * @param context 三维视图内容
   * @param coMap 点位坐标map集合
   */
  constructor(ol, map) {
    _ol = ol // 地图引擎类库
    this.map = map // 地图对象
    this.trackSource = new _ol.source.Vector({ wrapX: false }) // 轨迹矢量图层数据源
    this.trackLayer = new _ol.layer.Vector({ // 构造轨迹矢量图层
      source: this.trackSource, // 数据源
      style: this.trackVectorStyle,
      zIndex: TRACKZINDEX
    })
    this.map.addLayer(this.trackLayer)
    this.animating = false
    this.now = null // 当前时间
    this.geoMarker = null
    this.lineCoords = [] // 轨迹坐标数组
    this.lineNodes = [] // 轨迹节点信息数组
  }

  /**
   * 轨迹图层的样式
   * @param {*} feature 要素
   * @returns 样式
   */
  trackVectorStyle(feature) {
    let type = feature.get('type')
    switch (type) {
      case DEFAULTOPS.route:
        return STYLE.routeStyle(feature) // 路线样式
      case DEFAULTOPS.node:
        return STYLE.nodeStyle(feature) // 节点图标样式
      case DEFAULTOPS.geoMarker:
        return STYLE.geoMarkerStyle(feature) // 定位图标样式
    }
  }

  /**
   * 绘制轨迹路线
   * @param {*} lineCoords 线坐标
   */
  drawTrackLine(lineCoords) {
    if (lineCoords && lineCoords.length > 0) {
      this.lineCoords = lineCoords
      let lineGeometry = new _ol.geom.LineString(lineCoords)
      let routeFeature = new _ol.Feature({
        type: DEFAULTOPS.route,
        geometry: lineGeometry
      })
      this.trackSource.addFeature(routeFeature) // 添加路线要素
      this.map.getView().fit(lineGeometry)
    }
  }

  /**
   * 添加轨迹线节点
   * @param {*} lineNodes 线节点信息数组
   */
  addTrackNodes(lineNodes) {
    if (lineNodes && lineNodes.length > 0) {
      this.lineNodes = lineNodes
      // 添加定位节点
      this.geoMarker = new _ol.Feature({
        type: DEFAULTOPS.geoMarker,
        geometry: new _ol.geom.Point(this.lineNodes[0].coodinates)
      })
      this.trackSource.addFeature(this.geoMarker)
      // 添加路线节点
      for (let i = 0; i < this.lineNodes.length; i++) {
        let pointFeature = new _ol.Feature({
          type: DEFAULTOPS.node,
          geometry: new _ol.geom.Point(this.lineNodes[i].coodinates)
        })
        this.trackSource.addFeature(pointFeature)
      }
    }
  }

  /**
   * 控制轨迹移动动画
   */
  controlAnimation() { // 执行动画播放
    if (this.lineCoords && this.lineCoords.length > 0) { // 有轨迹线坐标时
      if (this.animating) { // 播放动画时
        this.stopAnimation() // 停止动画播放
      } else { // 执行动画播放
        this.animating = true //
        this.now = new Date().getTime() // 获取当前时间
        this.map.on('postcompose', (event) => {
          this.moveGeoMarker(event)
        }) // 监听地图渲染
        this.map.render() // 地图继续渲染
      }
    }
  }

  /**
   * 停止轨迹动画播放
   */
  stopAnimation() {
    this.animating = false
    this.geoMarker.getGeometry().setCoordinates(this.lineCoords[0]) // 设置定位图标的位置
    this.map.un('postcompose', (event) => {
      this.moveGeoMarker(event)
    }) // 移除地图渲染的监听
  }

  /**
   * 移动定位图标
   * @param {*} event 事件
   */
  moveGeoMarker(event) { // 移动定位图标
    let frameState = event.frameState
    if (this.animating) {
      let elapsedTime = frameState.time - this.now
      let indexNumber = SPEED * elapsedTime / STEPTIME // 线路节点索引,浮点值
      let index = Math.floor(indexNumber) // 线路节点索引,整数值
      if (index >= this.lineCoords.length - 1) {
        this.stopAnimation()
        return
      }
      let fraction = indexNumber - index // 线段部分
      // console.log('线路节点索引：', indexNumber, '线段部分：', fraction)
      let start = this.lineCoords[index]
      let end = this.lineCoords[index + 1]
      if (start[0] !== end[0] || start[1] !== end[1]) {
        let segment = new _ol.geom.LineString([start, end]) // 线段
        let coord = segment.getCoordinateAt(fraction) // 计算位置坐标
        this.geoMarker.getGeometry().setCoordinates(coord) // 设置定位图标的位置
      }
    }
    this.map.render() // 地图继续渲染
  }

  /**
   * 清除轨迹绘制
   */
  clearTrack() {
    // 清除轨迹
    this.trackSource.clear() // 清空绘制数据源
    this.animateEnable = false
    this.lineCoords = []
    this.lineNodes = []
  }
}
