/* eslint-disable camelcase */
require('dotenv').config()
const {
  NODE_ENV,
  WEB_PORT,
  NODE_HOST,
  NODE_PORT,
  SECRET,
  VIDEOUPLOAD_DIR,
  TEMPPIC_DIR,
  MODELFILE_DIR,
  MODELPICTURE_DIR,
  PICCOMMON_DIR,
  VIDEOCOMMON_DIR,
  ALARM_URI,
  BSTARTCP_SERVER,
  BSTARTCP_PORT,
  PROXY_API,
  websockUrl,
  serviceUrl,
  mongoUri,
  mongoLogUri,
  FACEUSERPICUURE_DIR,
  FACEPASSERPICUURE_DIR,
  DEFENSEAUDIO_DIR
} = process.env
var path = require('path')
var _ = require('lodash')
var backendBase = {
  // Root path of server
  root: path.normalize(__dirname),
  // Server port
  port: NODE_PORT || 20000,
  // Secret for session, you will want to change this and make it an environment variable
  secrets: {
    session: SECRET || 'bs-security-secret'
  },
  // List of user roles
  userRoles: ['admin', 'user'],
  // MongoDB connection options
  mongo: {
    options: {
      useNewUrlParser: true,
      poolSize: 20
    }
  },
  // struct video upload dir
  videoDir: VIDEOUPLOAD_DIR || path.resolve(__dirname, './client/static/video'),
  fileDirs: {
    // temp dir
    tempDir: TEMPPIC_DIR || path.resolve(__dirname, './server/public/temp'),
    // 3d model file dir
    modelFileDir: MODELFILE_DIR || path.resolve(__dirname, './server/public/modelFile'),
    // 3d model picture dir
    modelPictureDir: MODELPICTURE_DIR || path.resolve(__dirname, './server/public/modelPicture'),
    // common picture upload dier
    picCommon: PICCOMMON_DIR || path.resolve(__dirname, './server/public/common'),
    // common video upload dier
    videoCommon: VIDEOCOMMON_DIR || path.resolve(__dirname, './server/public/common'),
    // face image upload dir
    faceUserPictureDir: FACEUSERPICUURE_DIR || path.resolve(__dirname, './server/public/face/user'),
    facePasserPictureDir: FACEPASSERPICUURE_DIR || path.resolve(__dirname, './server/public/face/passer'),
    // faceUserPictureDir
    defenseAudioDir: DEFENSEAUDIO_DIR || path.resolve(__dirname, './server/public/face/audio')
  },
  veriface: {
    cameraCfg: {
      pixel: 48, // 最小人脸像素
      interval: 1000,
      ambiguity: 0.7, // 模糊度
      roll: 25, // 翻滚角
      yaw: 27, // 偏航角
      pitch: 180 // 俯仰角
    }
  },
  // frontend folder
  frontend: path.resolve(__dirname, './client/dist'),
  // white list
  whiteList: ['/api/security/auth/local', '/'],
  // bstar server url
  serviceUrl: serviceUrl || 'http://127.0.0.1',
  // alarm websocket server url
  websockUrl: websockUrl || 'ws://127.0.0.1/api/ws/alarm',
  // send alarm to alarm machine
  sendAlarmUrl: ALARM_URI || 'http://127.0.0.1:5000',
  /**
   * 文件分表间隔时间
   * eg:
   *   {second:x ,minute: x, hour: x, day: x, month: x, dayofweek: x}
   * or '* * * * * *'  (秒 分 时 日 月 年 )
   */
  createFileConnectTime: {
    second: 0,
    minute: 0,
    hour: 0
  }
}
const development = {
  frontend: {
    port: WEB_PORT,
    assetsRoot: path.resolve(__dirname, './client/src'),
    assetsSubDirectory: 'static',
    assetsPublicPath: '/',
    proxyTable: {
      '/api/socket.io': {
        target: 'http://localhost:' + backendBase.port,
        changeOrigin: true,
        ws: true
      },
      '/image/face': {
        target: 'http://localhost:' + backendBase.port,
        changeOrigin: true
      },
      '/api/ctl': {
        target: 'http://192.168.20.7',
        changeOrigin: true
      },
      '/api': {
        // target: 'http://localhost:' + backendBase.port
        // target: 'http://192.168.20.7'
        target: 'http://192.168.0.134'
        // target: PROXY_API
      },
      '/image': {
        // target: 'http://localhost:' + backendBase.port
        // target: 'http://192.168.20.7'
        target: 'http://192.168.0.134'
        // target: PROXY_API
      }
    },
    cssSourceMap: false
  },
  backend: _.merge({}, backendBase, {
    mongo: {
      uri: mongoUri || 'mongodb://192.168.20.7:27017/bs-security',
      logUri: mongoLogUri || 'mongodb://192.168.20.7:27017/bstar'
    },
    // bstar server url
    serviceUrl: serviceUrl || 'http://192.168.20.7:80',
    // bstar tcp server host
    tcpServer: BSTARTCP_SERVER || '192.168.14.127',
    // bstar tcp server prot
    tcpPort: BSTARTCP_PORT || 7000,
    // alarm websocket server url
    websockUrl: websockUrl || 'ws://192.168.8.113/api/ws/alarm'
  })
}
const production = {
  frontend: {
    port: WEB_PORT,
    index: path.resolve(__dirname, './client/dist/index.html'),
    assetsRoot: path.resolve(__dirname, './client/dist'),
    assetsSubDirectory: 'static',
    assetsPublicPath: '/',
    cssSourceMap: true,
    // Gzip off by default as many popular static hosts such as
    // Surge or Netlify already gzip all static assets for you.
    // Before setting to `true`, make sure to:
    // npm install --save-dev compression-webpack-plugin
    productionGzip: false,
    productionGzipExtensions: ['js', 'css'],
    proxyTable: {
      '/api/socket.io': {
        target: 'http://localhost:' + backendBase.port,
        changeOrigin: true,
        ws: true
      },
      '/api': {
        target: 'http://localhost:' + backendBase.port,
        changeOrigin: true
      }
    }
  },
  backend: _.merge({}, backendBase, {
    // whether backend servers the frontend,
    // you can use nginx to server frontend and proxy to backend services
    // if set to true, you need no web services like nginx
    serverFrontend: true,
    // Server IP
    ip: NODE_HOST || '0.0.0.0',
    // Server port
    port: NODE_PORT || 20000,
    // MongoDB connection options
    mongo: {
      uri: mongoUri || 'mongodb://127.0.0.1:27017/bs-security',
      logUri: mongoLogUri || 'mongodb://127.0.0.1:27017/bstar'
    },
    fileDirs: {
      // temp dir
      tempDir: TEMPPIC_DIR || '/opt/bstar/pic/temp',
      // 3d model file dir
      modelFileDir: MODELFILE_DIR || '/opt/bstar/pic/model/file',
      // 3d model picture dir
      modelPictureDir: MODELPICTURE_DIR || '/opt/bstar/pic/model/picture',
      // common picture upload dier
      picCommon: PICCOMMON_DIR || '/opt/bstar/pic/common',
      // common video upload dier
      videoCommon: VIDEOCOMMON_DIR || '/opt/bstar/video/common',
      // face image upload dir
      faceUserPictureDir: FACEUSERPICUURE_DIR || '/opt/bstar/pic/face/user',
      // face image upload dir
      facePasserPictureDir: FACEPASSERPICUURE_DIR || '/opt/bstar/pic/face/passer',
      // defense audio dir
      defenseAudioDir: DEFENSEAUDIO_DIR || path.resolve(__dirname, './server/public/face/audio')
    },
    // frontend folder
    frontend: path.resolve(__dirname, './client/dist'),
    // bstar server url
    serviceUrl: serviceUrl || 'http://127.0.0.1',
    // bstar tcp server host
    tcpServer: BSTARTCP_SERVER || '127.0.0.1',
    // bstar tcp server prot
    tcpPort: BSTARTCP_PORT || 7000,
    // alarm websocket server url
    websockUrl: websockUrl || 'ws://127.0.0.1/api/ws/alarm'
  })
}
module.exports = _.assign({}, NODE_ENV === 'production' ? production : development)
