/*
 * @Author: zhangminbo
 * @Date: 2018-09-05 19:01:57
 * @Last Modified by: hansen.liuhao
 * @Last Modified time: 2018-12-20 16:04:11
 */
/**
 * Populate DB with admin user data on server start
 */

'use strict'

const mongoose = require('mongoose')
const Org = mongoose.model('Org')
const Sysparamters = mongoose.model('Sysparamters')
const FireAlarmConf = require('mongoose').model('fireAlarmConf')
const Dict = mongoose.model('Dict')
const Action = mongoose.model('Action')
const PlatformServer = mongoose.model('PlatformServer')
const PlanTemplate = mongoose.model('PlanTemplate')
const FaceAlgorithm = mongoose.model('FaceAlgorithm')
const Strategy = require('mongoose').model('Strategy')
const AlarmType = require('mongoose').model('alarmType')
const AlarmLevel = require('mongoose').model('alarmLevel')
const AlarmTimeTemplate = require('mongoose').model('alarmTimeTemplate')
const Role = mongoose.model('Role')
const FaceParameter = mongoose.model('FaceParameter')

// 删除旧的角色数据
// Role.find({}, (err, data) => {
//   if (!_.isEmpty(data)) {
//     data = JSON.parse(JSON.stringify(data))
//     const roleIds = []
//     data.forEach(item => {
//       if (_.has(item, 'roleName')) {
//         roleIds.push(item._id)
//       }
//     })
//     if (!_.isEmpty(roleIds)) {
//       Role.deleteMany({ _id: { $in: roleIds } }, (err, data) => {
//         console.log('finished del old roles data')
//       })
//     }
//   }
// })
// // 删除旧的用户数据
// User.find({}, (err, data) => {
//   if (!_.isEmpty(data)) {
//     data = JSON.parse(JSON.stringify(data))
//     const userIds = []
//     data.forEach(item => {
//       if (_.has(item, 'orgId')) {
//         userIds.push(item._id)
//       }
//     })
//     if (!_.isEmpty(userIds)) {
//       User.deleteMany({ _id: { $in: userIds } }, (err, data) => {
//         console.log('finished del old users data')
//       })
//     }
//   }
// })
// 添加默认角色数据
// const actions = require('./actions.json')
// const actIds = actions.map(item => {
//   return item._id
// })
// const roleObj = {
//   _id: '5be27279e74ee9376c681111',
//   name: '超级管理员',
//   actions: actIds
// }
// Role.remove({ name: '超级管理员' }, (err, data) => {
//   Role.create(roleObj, (err, data) => {
//     console.log('finished init Role')
//     Resource.find({ type: TYPE }, '_id', (err, data) => {
//       if (!_.isEmpty(data)) {
//         const resIds = data.map(item => item._id)
//         Role.findByIdAndUpdate(roleObj._id, { resources: resIds }, (err, data) => {
//           const props = []
//           resIds.forEach(item => {
//             let obj = {
//               role: roleObj._id,
//               resource: item,
//               properties: ['preview', 'cloudControl', 'playbackDownload']
//             }
//             props.push(obj)
//           })
//           Property.deleteMany({ role: roleObj._id }, (err, data) => {
//             Property.create(props, (err, data) => {
//               console.log('finish init ResProperty')
//             })
//           })
//         })
//       }
//     })
//   })
// })
// 初始化抓拍参数
FaceParameter.findOne({}, (err, data) => {
  if (err) {
    throw err
  }
  if (!data) {
    const obj = {
      pattern: 'face',
      output: 1,
      passby: true,
      saveTime: 30,
      capacity: 3000
    }
    FaceParameter.create(obj, (err, data) => {
      if (err) {
        throw err
      }
    })
  }
})
// 更新超级管理员角色actions字段数据
const actions = require('./actions.json')
const actIds = actions.map(item => {
  return item._id
})
Role.update({ name: '超级管理员' }, { actions: actIds }, (err, data) => {
  if (err) {
    throw err
  }
  console.log('finished udpate role data')
})
// 添加默认用户数据
// const userObj = {
//   _id: '5be27d69e74eeee76c682222',
//   name: 'admin',
//   pwd: '21232f297a57a5a743894a0e4a801fc3', // admin
//   realName: '初始账户',
//   role: roleObj._id,
//   level: 1,
//   exptime: -1
// }
// User.remove({ name: 'admin' }, (err, data) => {
//   User.create(userObj, (err, data) => {
//     console.log('finished init User')
//   })
// })
// 更新actions表数据
Action.remove(function (err) {
  if (err) {
    throw err
  }
  Action.create(require('./actions.json'), function () {
    console.log('finished init Action')
  })
})

Org.find({ type: 0, isroot: true }, function (err, org) {
  if (err) {
    throw err
  }
  if (!org.length) {
    Org.bulkWrite(
      [
        {
          insertOne: {
            document: {
              name: '根节点-现场',
              type: 0,
              order: 0,
              isroot: true
            }
          }
        }
      ],
      function (err, orgData) {
        if (err) {
          throw err
        }
        require('../api/platform/generateNum').orgAndresInitGbDeviceId()
      }
    )
  }
  // else {
  //   // initUser(org[0]._id)
  //   // require('../api/platform/generateNum').orgAndresInitGbDeviceId()
  // }
})

Org.find(
  {
    type: 1,
    isroot: true
  },
  function (err, org) {
    if (err) {
      throw err
    }
    if (!org.length) {
      Org.bulkWrite(
        [
          {
            insertOne: {
              document: {
                name: '根节点-车辆',
                type: 1,
                order: 0,
                isroot: true
              }
            }
          }
        ],
        function () {
          console.log('finished populating org(1)')
        }
      )
    }
  }
)

Org.find(
  {
    type: 2,
    isroot: true
  },
  function (err, org) {
    if (err) {
      throw err
    }
    if (!org.length) {
      Org.bulkWrite(
        [
          {
            insertOne: {
              document: {
                name: '根节点-人脸',
                type: 2,
                order: 0,
                isroot: true
              }
            }
          }
        ],
        function () {
          console.log('finished populating org(2)')
        }
      )
    }
  }
)

Org.find(
  {
    type: 3,
    isroot: true
  },
  function (err, org) {
    if (err) {
      throw err
    }
    if (!org.length) {
      Org.bulkWrite(
        [
          {
            insertOne: {
              document: {
                name: '根节点-单兵',
                type: 3,
                order: 0,
                isroot: true
              }
            }
          }
        ],
        function () {
          console.log('finished populating org(3)')
        }
      )
    }
  }
)

Org.find(
  {
    type: 4,
    isroot: true
  },
  function (err, org) {
    if (err) {
      throw err
    }
    if (!org.length) {
      Org.bulkWrite(
        [
          {
            insertOne: {
              document: {
                name: '根节点-巡更点位',
                type: 4,
                order: 0,
                isroot: true
              }
            }
          }
        ],
        function () {
          console.log('finished populating org(4)')
        }
      )
    }
  }
)

Org.find(
  {
    type: 5,
    isroot: true
  },
  function (err, org) {
    if (err) {
      throw err
    }
    if (!org.length) {
      Org.bulkWrite(
        [
          {
            insertOne: {
              document: {
                name: '根节点-应急预案',
                type: 5,
                order: 0,
                isroot: true
              }
            }
          }
        ],
        function () {
          console.log('finished populating org(5)')
        }
      )
    }
  }
)
Org.find(
  {
    type: 6,
    isroot: true
  },
  function (err, org) {
    if (err) {
      throw err
    }
    if (!org.length) {
      Org.bulkWrite(
        [
          {
            insertOne: {
              document: {
                name: '根节点-人脸抓拍',
                type: 6,
                order: 0,
                isroot: true
              }
            }
          }
        ],
        function () {
          console.log('finished populating org(6)')
        }
      )
    }
  }
)
Org.find(
  {
    type: 7,
    isroot: true
  },
  function (err, org) {
    if (err) {
      throw err
    }
    if (!org.length) {
      Org.bulkWrite(
        [
          {
            insertOne: {
              document: {
                name: '班组列表',
                type: 7,
                order: 0,
                isroot: true
              }
            }
          }
        ],
        function () {
          console.log('finished populating org(7)')
        }
      )
    }
  }
)

Sysparamters.find({}, function (err, sys) {
  if (err) {
    throw err
  }
  if (!sys.length) {
    Sysparamters.create(
      {
        name: '园区综合性管理平台',
        titlecolor: '#171717',
        titlefont: '{"font":"微软雅黑","size":"16","fontColor":"#FFFFFF","fontItalic":"normal","fontRegular":"normal"}',
        alarmlog: 120,
        equipmentlog: 120,
        operationlog: 120,
        configlog: 120,
        transport: 'TCP',
        picture: 'auto',
        screenshot: 'JPG',
        videotape: 'AVI',
        creatdbtime: Math.floor(new Date() / 1000)
      },
      function () {
        require('./initAudioFile') // 初始化报警音频文件（文件目录在public/alarmAudio）
        console.log('finished init Sysparamters')
      }
    )
  } else {
    require('./initAudioFile') // 初始化报警音频文件（文件目录在public/alarmAudio）
  }
})

const dictDatas = [
  {
    code: '4',
    name: '小汽车',
    type: 'vehicle'
  },
  {
    code: '5',
    name: '三轮车',
    type: 'vehicle'
  },
  {
    code: '6',
    name: '巴士车',
    type: 'vehicle'
  },
  {
    code: '7',
    name: '面包车',
    type: 'vehicle'
  },
  {
    code: '8',
    name: '卡车',
    type: 'vehicle'
  },
  {
    code: '1',
    name: '布控车辆',
    type: 'vehicleListType'
  },
  {
    code: '1',
    name: '精准布控',
    type: 'defenseType'
  },
  {
    code: '2',
    name: '黑名单布控',
    type: 'defenseType'
  },
  {
    code: '0',
    name: '陌生车辆',
    type: 'vehicleListType'
  },
  {
    code: '2',
    name: '白名单',
    type: 'vehicleListType'
  },
  {
    code: '3',
    name: '黑名单',
    type: 'vehicleListType'
  },
  {
    code: '4',
    name: '正常车辆',
    type: 'vehicleListType'
  },
  {
    code: '3',
    name: '白名单布控',
    type: 'defenseType'
  },
  {
    type: 'alarmType',
    code: '1',
    name: '车辆布控'
  },
  {
    type: 'alarmType',
    code: '2',
    name: '人员布控'
  },
  {
    type: 'alarmType',
    name: '黑名单',
    code: '3'
  },
  {
    type: 'vehicleColor',
    code: '1',
    name: '黑色'
  },
  {
    type: 'vehicleColor',
    code: '2',
    name: '蓝色'
  },
  {
    type: 'vehicleColor',
    code: '4',
    name: '绿色'
  },
  {
    type: 'vehicleColor',
    code: '5',
    name: '灰色'
  },
  {
    type: 'vehicleColor',
    code: '6',
    name: '白色'
  },
  {
    type: 'vehicleColor',
    code: '7',
    name: '红色'
  },
  {
    type: 'vehicleColor',
    code: '8',
    name: '黄色'
  },
  {
    type: 'vehicleColor',
    code: '9',
    name: '粉色'
  },
  {
    type: 'vehicleColor',
    code: '10',
    name: '紫色'
  },
  {
    type: 'vehicleColor',
    code: '11',
    name: '青色'
  },
  {
    type: 'vehicleColor',
    code: '12',
    name: '深灰色'
  },
  {
    type: 'vehicleColor',
    code: '13',
    name: '金色'
  }
]

Dict.find({}, function (err, sys) {
  if (err) {
    throw err
  }
  if (!sys.length) {
    Dict.create(dictDatas, function () {
      console.log('finished init Dict')
    })
  }
})
// 初始化计划模板
PlanTemplate.find({}, function (err, result) {
  if (err) {
    throw err
  }
  if (!result.length) {
    PlanTemplate.insertMany([
      {
        name: '全天',
        elements: [
          {
            week: 1,
            timeList: [
              {
                beginTime: 0,
                endTime: 86400
              }
            ]
          },
          {
            week: 2,
            timeList: [
              {
                beginTime: 0,
                endTime: 86400
              }
            ]
          },
          {
            week: 3,
            timeList: [
              {
                beginTime: 0,
                endTime: 86400
              }
            ]
          },
          {
            week: 4,
            timeList: [
              {
                beginTime: 0,
                endTime: 86400
              }
            ]
          },
          {
            week: 5,
            timeList: [
              {
                beginTime: 0,
                endTime: 86400
              }
            ]
          },
          {
            week: 6,
            timeList: [
              {
                beginTime: 0,
                endTime: 86400
              }
            ]
          },
          {
            week: 7,
            timeList: [
              {
                beginTime: 0,
                endTime: 86400
              }
            ]
          },
          {
            week: 8,
            timeList: [
              {
                beginTime: 0,
                endTime: 86400
              }
            ]
          }
        ]
      },
      {
        name: '工作时间',
        elements: [
          {
            week: 1,
            timeList: [
              {
                endTime: 72000,
                beginTime: 28800
              }
            ]
          },
          {
            week: 2,
            timeList: [
              {
                endTime: 72000,
                beginTime: 28800
              }
            ]
          },
          {
            week: 3,
            timeList: [
              {
                endTime: 72000,
                beginTime: 28800
              }
            ]
          },
          {
            week: 4,
            timeList: [
              {
                endTime: 72000,
                beginTime: 28800
              }
            ]
          },
          {
            week: 5,
            timeList: [
              {
                endTime: 72000,
                beginTime: 28800
              }
            ]
          },
          {
            week: 6,
            timeList: []
          },
          {
            week: 7,
            timeList: []
          },
          {
            week: 8,
            timeList: []
          }
        ]
      },
      {
        name: '工作日24小时',
        elements: [
          {
            week: 1,
            timeList: [
              {
                beginTime: 0,
                endTime: 86400
              }
            ]
          },
          {
            week: 2,
            timeList: [
              {
                beginTime: 0,
                endTime: 86400
              }
            ]
          },
          {
            week: 3,
            timeList: [
              {
                beginTime: 0,
                endTime: 86400
              }
            ]
          },
          {
            week: 4,
            timeList: [
              {
                beginTime: 0,
                endTime: 86400
              }
            ]
          },
          {
            week: 5,
            timeList: [
              {
                beginTime: 0,
                endTime: 86400
              }
            ]
          },
          {
            week: 6,
            timeList: []
          },
          {
            week: 7,
            timeList: []
          },
          {
            week: 8,
            timeList: []
          }
        ]
      },
      {
        name: '节假日',
        elements: [
          {
            week: 1,
            timeList: []
          },
          {
            week: 2,
            timeList: []
          },
          {
            week: 3,
            timeList: []
          },
          {
            week: 4,
            timeList: []
          },
          {
            week: 5,
            timeList: []
          },
          {
            week: 6,
            timeList: [
              {
                beginTime: 0,
                endTime: 86400
              }
            ]
          },
          {
            week: 7,
            timeList: [
              {
                beginTime: 0,
                endTime: 86400
              }
            ]
          },
          {
            week: 8,
            timeList: [
              {
                beginTime: 0,
                endTime: 86400
              }
            ]
          }
        ]
      }
    ])
  }
})
FaceAlgorithm.find({}, function (err, result) {
  if (err) {
    throw err
  }
  if (!result.length) {
    FaceAlgorithm.insertMany([
      {
        loginApi: {
          url: '/auth/login',
          method: 'POST',
          headers: {
            'User-Agent': 'Koala Admin'
          }
        },
        createUserApi: {
          url: '/subject',
          method: 'POST'
        },
        updateUserApi: {
          url: '/subject/:id',
          method: 'PUT'
        },
        deleteUserApi: {
          url: '/subject/:id',
          method: 'DELETE'
        },
        historyApi: {
          url: '/event/events',
          method: 'GET'
        },
        uploadApi: {
          url: '/subject/photo',
          method: 'POST'
        },
        timeout: 1000,
        type: 'BSR-KS'
      }
    ])
  }
})

FireAlarmConf.find({}, function (err, sys) {
  if (err) {
    throw err
  }
  if (!sys.length) {
    FireAlarmConf.create(
      {
        ismap: true
      },
      function () {
        console.log('finished init FireAlarmConf')
      }
    )
  }
})

Strategy.find({}, function (err, act) {
  if (err) {
    throw err
  }
  if (!act.length) {
    Strategy.create(
      {
        passwordType: 'middle',
        loginCount: 5,
        lockTime: 5,
        initPassword: 'admin'
      },
      function () {
        console.log('finished init Strategy')
      }
    )
  }
})

AlarmType.find({}, function (err, data) {
  if (err) {
    throw err
  }
  if (!data.length) {
    const arr = []
    for (var i = 1; i < 10; i++) {
      const temp = {
        name: '分类' + i
      }
      temp.actionRule = []
      for (var j = 0; j < 4; j++) {
        temp.actionRule.push({
          status: false,
          actionVideo: false,
          endTime: 86399,
          beginTime: 0,
          actionOutPut: false
        })
      }
      arr.push(temp)
    }
    AlarmType.insertMany(arr, function () {
      console.log('finished init AlarmType')
    })
  }
})
AlarmLevel.find({}, function (err, data) {
  if (err) {
    throw err
  }
  if (!data.length) {
    const arr = []
    for (var i = 1; i < 10; i++) {
      arr.push({
        level: i
      })
    }
    AlarmLevel.insertMany(arr, function () {
      console.log('finished init AlarmLevel')
    })
  }
})
PlatformServer.find({ type: 'loc' }, function (err, data) {
  if (err) {
    throw err
  }
  if (!data.length) {
    PlatformServer.create(
      {
        name: '设备根节点',
        type: 'loc',
        userName: '',
        pwd: ''
      },
      function () {
        console.log('finished init PlatformServer')
      }
    )
  }
})
AlarmTimeTemplate.find({}, function (err, data) {
  if (err) {
    throw err
  }
  if (!data.length) {
    AlarmTimeTemplate.insertMany(
      [
        {
          name: '全天24小时',
          elements: {
            week8: [
              {
                endTime: 86400,
                beginTime: 0
              }
            ],
            week7: [
              {
                endTime: 86400,
                beginTime: 0
              }
            ],
            week6: [
              {
                endTime: 86400,
                beginTime: 0
              }
            ],
            week5: [
              {
                endTime: 86400,
                beginTime: 0
              }
            ],
            week4: [
              {
                endTime: 86400,
                beginTime: 0
              }
            ],
            week3: [
              {
                endTime: 86400,
                beginTime: 0
              }
            ],
            week2: [
              {
                endTime: 86400,
                beginTime: 0
              }
            ],
            week1: [
              {
                endTime: 86400,
                beginTime: 0
              }
            ]
          }
        },
        {
          name: '工作日8小时',
          elements: {
            week5: [
              {
                endTime: 64800,
                beginTime: 32400
              }
            ],
            week4: [
              {
                endTime: 64800,
                beginTime: 32400
              }
            ],
            week3: [
              {
                endTime: 64800,
                beginTime: 32400
              }
            ],
            week2: [
              {
                endTime: 64800,
                beginTime: 32400
              }
            ],
            week1: [
              {
                endTime: 64800,
                beginTime: 32400
              }
            ]
          }
        },
        {
          name: '工作日24小时',
          elements: {
            week5: [
              {
                endTime: 86400,
                beginTime: 0
              }
            ],
            week4: [
              {
                endTime: 86400,
                beginTime: 0
              }
            ],
            week3: [
              {
                endTime: 86400,
                beginTime: 0
              }
            ],
            week2: [
              {
                endTime: 86400,
                beginTime: 0
              }
            ],
            week1: [
              {
                endTime: 86400,
                beginTime: 0
              }
            ]
          }
        },
        {
          name: '节假日',
          elements: {
            week8: [
              {
                endTime: 86400,
                beginTime: 0
              }
            ]
          }
        }
      ],
      function () {
        console.log('finished init AlarmTimeTemplate')
      }
    )
  }
})
