export default [
  {
    path: '/home',
    component: resolve => {
      require(['../view/homePage/Dashboard.vue'], resolve)
    }
  },
  {
    path: '/maintenance',
    component: resolve => {
      require(['../view/maintenance/maintenance.vue'], resolve)
    }
  },
  {
    path: '/fire/control',
    component: resolve => {
      require(['../view/fire/control.vue'], resolve)
    }
  },
  {
    path: '/fire/manage',
    component: resolve => {
      require(['../view/fire/manage.vue'], resolve)
    }
  },
  {
    path: '/door/list',
    component: resolve => {
      require(['../view/door/list.vue'], resolve)
    }
  },
  {
    path: '/door/useList',
    component: resolve => {
      require(['../view/door/useList.vue'], resolve)
    }
  },
  {
    path: '/keepwatch/patrol',
    component: resolve => {
      require(['../view/keepwatch/keepwatch.vue'], resolve)
    }
  },
  {
    path: '/keepwatch/tasklist',
    component: resolve => {
      require(['../view/keepwatch/taskList.vue'], resolve)
    }
  },
  {
    path: '/keepwatch/record',
    component: resolve => {
      require(['../view/keepwatch/record.vue'], resolve)
    }
  },
  {
    path: '/keepwatch/message',
    component: resolve => {
      require(['../view/keepwatch/message.vue'], resolve)
    }
  },
  {
    path: '/keepwatch/single',
    component: (resolve) => {
      require(['../view/keepwatch/single.vue'], resolve)
    }
  },
  {
    path: '/soldier/manage',
    component: resolve => {
      require(['../view/soldier/manage.vue'], resolve)
    }
  },
  {
    path: '/soldier/point',
    component: resolve => {
      require(['../view/soldier/point.vue'], resolve)
    }
  },
  {
    path: '/tsmanagement/roll',
    component: resolve => {
      require(['../view/tsmanagement/roll.vue'], resolve)
    }
  },
  {
    path: '/tsmanagement/staff',
    component: resolve => {
      require(['../view/tsmanagement/staff.vue'], resolve)
    }
  },
  {
    path: '/tsmanagement/omecard',
    component: resolve => {
      require(['../view/tsmanagement/omeCard.vue'], resolve)
    }
  },
  {
    path: '/dict',
    component: resolve => {
      require(['../view/settings/sys/dict.vue'], resolve)
    }
  },
  {
    // 视频监控路由
    path: '/play_video',
    redirect: '/play_video/playback'
  },
  {
    path: '/play_video/realtime',
    component: resolve => {
      require(['../view/video/realtime.vue'], resolve)
    }
  },
  {
    path: '/play_video/playback',
    component: resolve => {
      require(['../view/video/playback/playrecord/playRecord.vue'], resolve)
    }
  },
  {
    path: '/play_video/picture',
    component: resolve => {
      require(['../view/video/playback/playpicture/pictureRecord.vue'], resolve)
    }
  },
  {
    path: '/play_video/download',
    component: resolve => {
      require(['../view/video/playback/downloadrecord/playDownload.vue'], resolve)
    }
  },
  {
    path: '/play_video/tvwall',
    component: resolve => {
      require(['../view/video/TVwall.vue'], resolve)
    }
  },
  {
    // 警情处理路由
    path: '/warning',
    component: resolve => {
      require(['../view/warning/warningManage.vue'], resolve)
    },
    redirect: '/warning/receive',
    children: [
      {
        path: '/warning/receive',
        component: resolve => {
          require(['../view/warning/receiveWarning.vue'], resolve)
        }
      },
      {
        path: '/warning/alarmMainframe',
        component: resolve => {
          require(['../view/warning/alarmMainframe.vue'], resolve)
        }
      },
      {
        path: '/warning/count',
        component: resolve => {
          require(['../view/warning/warningCount.vue'], resolve)
        }
      }
    ]
  },
  {
    path: '/map/2D',
    component: resolve => {
      require(['../view/map/mapHome.vue'], resolve)
    }
  },
  {
    // 3D电子地图
    path: '/map/3D',
    component: resolve => {
      require(['../view/map3D/map3D.vue'], resolve)
    }
  },
  {
    path: '/mapEdit/2D',
    component: resolve => {
      require(['../view/map/mapHomeEdit.vue'], resolve)
    }
  },
  {
    // 3D电子地图 mapHomeEdit
    path: '/mapEdit/3D',
    component: resolve => {
      require(['../view/map3DEdit/map3DEdit.vue'], resolve)
    }
  },
  {
    // 应急指挥
    path: '/emergency/main',
    component: resolve => {
      require(['../view/map/mapHome.vue'], resolve)
    }
  },
  {
    // 应急预案
    path: '/emergency/plan',
    component: resolve => {
      require(['../view/emergency/emergencyPlan.vue'], resolve)
    }
  },
  {
    path: '/face',
    redirect: '/face/capture'
  },
  {
    path: '/face/capture',
    component: resolve => {
      require(['../view/face/Capture.vue'], resolve)
    }
  },
  {
    path: '/pass/koala',
    component: resolve => {
      require(['../view/face/koala.vue'], resolve)
    }
  },
  {
    path: '/face/manage',
    component: resolve => {
      require(['../view/face/Manage.vue'], resolve)
    },
    redirect: '/face/manage/list',
    children: [
      {
        path: '/face/manage/list',
        component: resolve => {
          require(['../view/face/manage/List.vue'], resolve)
        }
      }
    ]
  },
  {
    path: '/face/dispatch',
    component: resolve => {
      require(['../view/face/Dispatch.vue'], resolve)
    },
    redirect: '/face/dispatch/task',
    children: [
      {
        path: '/face/dispatch/task',
        component: resolve => {
          require(['../view/face/dispatch/Task.vue'], resolve)
        }
      }
    ]
  },
  {
    path: '/face/search',
    component: resolve => {
      require(['../view/face/Search.vue'], resolve)
    },
    redirect: '/face/search/compare',
    children: [
      {
        path: '/face/search/compare',
        component: resolve => {
          require(['../view/face/search/Compare.vue'], resolve)
        }
      },
      {
        path: '/face/search/stranger',
        component: resolve => {
          require(['../view/face/search/Stranger.vue'], resolve)
        }
      }
    ]
  },
  {
    path: '/face/statistics',
    component: resolve => {
      require(['../view/face/Statistics.vue'], resolve)
    },
    redirect: '/face/statistics/today',
    children: [
      {
        path: '/face/statistics/today',
        component: resolve => {
          require(['../view/face/statistics/Today.vue'], resolve)
        }
      },
      {
        path: '/face/statistics/analyze',
        component: resolve => {
          require(['../view/face/statistics/Analyze.vue'], resolve)
        }
      },
      {
        path: '/face/statistics/compare',
        component: resolve => {
          require(['../view/face/search/Compare.vue'], resolve)
        }
      },
      {
        path: '/face/statistics/stranger',
        component: resolve => {
          require(['../view/face/search/Stranger.vue'], resolve)
        }
      }
    ]
  },
  {
    // 人员通行
    path: '/pass',
    redirect: '/pass/search'
  },
  {
    path: '/pass/search',
    component: resolve => {
      require(['../view/pass/Search.vue'], resolve)
    },
    redirect: '/pass/search/compare',
    children: [
      {
        path: '/pass/search/compare',
        component: resolve => {
          require(['../view/pass/search/Compare.vue'], resolve)
        }
      },
      {
        path: '/pass/search/stranger',
        component: resolve => {
          require(['../view/pass/search/Stranger.vue'], resolve)
        }
      }
    ]
  },
  {
    path: '/pass/statistics',
    component: resolve => {
      require(['../view/pass/Statistics.vue'], resolve)
    },
    redirect: '/pass/statistics/today',
    children: [
      {
        path: '/pass/statistics/today',
        component: resolve => {
          require(['../view/pass/statistics/Today.vue'], resolve)
        }
      },
      {
        path: '/pass/statistics/analyze',
        component: resolve => {
          require(['../view/pass/statistics/Analyze.vue'], resolve)
        }
      }
    ]
  },
  {
    path: '/veriface',
    redirect: '/veriface/capture'
  }, {
    path: '/veriface/capture',
    component: (resolve) => {
      require(['../view/veriface/capture.vue'], resolve)
    }
  }, {
    path: '/veriface/manage',
    component: (resolve) => {
      require(['../view/veriface/manage.vue'], resolve)
    }
  }, {
    path: '/veriface/dispatch',
    component: (resolve) => {
      require(['../view/veriface/Dispatch.vue'], resolve)
    }
  }, {
    path: '/veriface/alarmSearch',
    component: (resolve) => {
      require(['../view/veriface/AlarmSearch.vue'], resolve)
    }
  }, {
    path: '/veriface/passerSearch',
    component: resolve => {
      require(['../view/veriface/PasserSearch.vue'], resolve)
    },
    redirect: '/veriface/PasserSearch/condition',
    children: [
      {
        path: '/veriface/PasserSearch/condition',
        component: resolve => {
          require(['../view/veriface/search/Condition.vue'], resolve)
        }
      },
      {
        path: '/veriface/PasserSearch/searchpic',
        component: resolve => {
          require(['../view/veriface/search/SearchPic.vue'], resolve)
        }
      }
    ]
  }, {
    path: '/veriface/track',
    component: (resolve) => {
      require(['../view/veriface/Track.vue'], resolve)
    }
  }, {
    path: '/veriface/statistics',
    component: (resolve) => {
      require(['../view/veriface/Statistics.vue'], resolve)
    },
    redirect: '/veriface/Statistics/today',
    children: [{
      path: '/veriface/Statistics/today',
      component: (resolve) => {
        require(['../view/veriface/statistics/Today.vue'], resolve)
      }
    }, {
      path: '/veriface/Statistics/analyze',
      component: (resolve) => {
        require(['../view/veriface/statistics/Analyze.vue'], resolve)
      }
    }]
  }, {
    path: '/setting/veriface',
    component: resolve => {
      require(['../view/veriface/setting/setting.vue'], resolve)
    },
    redirect: '/setting/veriface/org',
    children: [
      {
        path: '/setting/veriface/org',
        component: resolve => {
          require(['../view/veriface/setting/org.vue'], resolve)
        }
      },
      {
        path: '/setting/veriface/argumentSet',
        component: resolve => {
          require(['../view/veriface/setting/argumentSet.vue'], resolve)
        }
      },
      {
        path: '/setting/veriface/server',
        component: resolve => {
          require(['../view/veriface/setting/server.vue'], resolve)
        }
      }
    ]
  },
  {
    // 车辆分析
    path: '/vehicle',
    redirect: '/vehicle/carDetection'
  },
  {
    path: '/vehicle/analyze',
    component: resolve => {
      require(['../view/vehicle/analyze.vue'], resolve)
    }
  },
  {
    path: '/vehicle/outpark',
    component: resolve => {
      require(['../view/vehicle/outpark.vue'], resolve)
    }
  },
  {
    path: '/vehicle/stat',
    component: resolve => {
      require(['../view/vehicle/stat.vue'], resolve)
    },
    redirect: '/vehicle/stat/day',
    children: [
      {
        path: '/vehicle/stat/day',
        component: resolve => {
          require(['../view/vehicle/stat/day.vue'], resolve)
        }
      },
      {
        path: '/vehicle/stat/cross',
        component: resolve => {
          require(['../view/vehicle/stat/cross.vue'], resolve)
        }
      },
      {
        path: '/vehicle/stat/warning',
        component: resolve => {
          require(['../view/vehicle/stat/warning.vue'], resolve)
        }
      },
      {
        path: '/vehicle/stat/flow',
        component: resolve => {
          require(['../view/vehicle/stat/flow.vue'], resolve)
        }
      },
      {
        path: '/vehicle/stat/pass',
        component: resolve => {
          require(['../view/vehicle/query/pass.vue'], resolve)
        }
      }
    ]
  },
  {
    path: '/vehicle/deploy',
    component: resolve => {
      require(['../view/vehicle/deploy.vue'], resolve)
    },
    redirect: '/vehicle/deploy/exact',
    children: [
      {
        path: '/vehicle/deploy/exact',
        component: resolve => {
          require(['../view/vehicle/deploy/exact.vue'], resolve)
        }
      },
      {
        path: '/vehicle/deploy/black',
        component: resolve => {
          require(['../view/vehicle/deploy/black.vue'], resolve)
        }
      },
      {
        path: '/vehicle/deploy/other',
        component: resolve => {
          require(['../view/vehicle/other.vue'], resolve)
        }
      }
    ]
  },
  {
    path: '/vehicle/detection',
    component: resolve => {
      require(['../view/vehicle/detection.vue'], resolve)
    }
  },
  {
    path: '/vehicle/manage',
    component: resolve => {
      require(['../view/vehicle/manage.vue'], resolve)
    }
  },
  {
    path: '/structuring',
    redirect: '/structuring/humanContrast'
  },
  {
    path: '/structuring/humanContrast',
    component: resolve => {
      require(['../view/structuring/HumanContrast.vue'], resolve)
    }
  },
  {
    path: '/structuring/vehicleSearch',
    component: resolve => {
      require(['../view/structuring/VehicleSearch.vue'], resolve)
    }
  },
  {
    // 交通管理应用
    path: '/traffic',
    component: resolve => {
      require(['../view/settings/trafficManage/serverLink.vue'], resolve)
    }
  },
  {
    // 运维管理
    path: '/ops',
    redirect: '/ops/deviceMonitor'
  },
  {
    path: '/ops/deviceMonitor',
    component: resolve => {
      require(['../view/ops/deviceMonitor.vue'], resolve)
    }
  },
  {
    path: '/ops/videoMonitor',
    component: resolve => {
      require(['../view/ops/videoMonitor.vue'], resolve)
    }
  },
  {
    path: '/ops/assetManage',
    component: resolve => {
      require(['../view/ops/assetManage.vue'], resolve)
    }
  },
  {
    path: '/ops/VideoDiagnostic',
    component: resolve => {
      require(['../view/ops/VideoDiagnostic.vue'], resolve)
    }
  },
  {
    path: '/ops/log',
    component: resolve => {
      require(['../view/ops/log.vue'], resolve)
    }
  },
  {
    // 业务管理
    path: '/business/dutyManage',
    redirect: '/business/dutyManage/list',
    component: resolve => {
      require(['../view/business/dutyManage.vue'], resolve)
    },
    children: [
      {
        path: 'list',
        name: 'DutyList',
        component: resolve => {
          require(['src/view/business/duty/DutyList.vue'], resolve)
        }
      },
      {
        path: 'log',
        name: 'DutyLog',
        component: resolve => {
          require(['src/view/business/duty/DutyLog.vue'], resolve)
        }
      },
      {
        path: 'shift_log',
        name: 'ShiftLog',
        component: resolve => {
          require(['src/view/shift/DutyShift.vue'], resolve)
        }
      },
      {
        path: 'plan',
        name: 'DutyPlan',
        component: resolve => {
          require(['src/view/business/duty/DutyPlan.vue'], resolve)
        }
      },
      {
        path: 'template',
        name: 'DutyTemplate',
        component: resolve => {
          require(['src/view/business/duty/DutyTemplate.vue'], resolve)
        }
      },
      {
        path: 'personnel',
        name: 'DutyPersonnel',
        component: resolve => {
          require(['src/view/business/duty/DutyPersonnel.vue'], resolve)
        }
      }
    ]
  },
  {
    path: '/business/receiveAlarm',
    component: resolve => {
      require(['../view/business/receiveAlarm.vue'], resolve)
    }
  },
  {
    // 系统配置
    path: '/settings',
    redirect: '/settings/equipment'
  },
  {
    // 校内交通
    path: '/settings/vehicle',
    component: resolve => {
      require(['../view/settings/carManage.vue'], resolve)
    },
    redirect: '/settings/vehicle/org',
    children: [
      {
        path: '/settings/vehicle/org',
        component: resolve => {
          require(['../view/settings/carPage/org.vue'], resolve)
        }
      },
      {
        path: '/settings/vehicle/server',
        component: resolve => {
          require(['../view/settings/carPage/server.vue'], resolve)
        }
      }
    ]
  },
  {
    // 交通管理配置
    path: '/settings/traffic',
    component: resolve => {
      require(['../view/settings/trafficManage/traffic.vue'], resolve)
    },
    redirect: '/settings/traffic/trafficDevice',
    children: [
      {
        path: '/settings/traffic/trafficDevice',
        component: resolve => {
          require(['../view/settings/trafficManage/trafficDevice.vue'], resolve)
        }
      },
      {
        path: '/settings/traffic/trafficServer',
        component: resolve => {
          require(['../view/settings/trafficManage/trafficServer.vue'], resolve)
        }
      }
    ]
  },
  {
    // 设备管理
    path: '/settings/equipment',
    component: resolve => {
      require(['../view/settings/equipment/equipmentManage.vue'], resolve)
    }
  },
  {
    // rtsp流配置
    path: '/settings/rtsp',
    component: resolve => {
      require(['../view/settings/equipment/rtspStreamConfig.vue'], resolve)
    }
  },
  {
    path: '/settings/door',
    component: resolve => {
      require(['../view/door/manage.vue'], resolve)
    }
  },
  {
    path: '/settings/door/manage/serverConfig',
    component: resolve => {
      require(['../view/door/serverConfig.vue'], resolve)
    }
  },
  {
    path: '/settings/door/manage/orgConfig',
    component: resolve => {
      require(['../view/door/orgConfig.vue'], resolve)
    }
  },
  {
    // 访客管理
    path: '/settings/face',
    component: resolve => {
      require(['../view/settings/faceManage.vue'], resolve)
    },
    redirect: '/settings/face/faceChannel',
    children: [
      {
        path: '/settings/face/faceChannel',
        component: resolve => {
          require(['../view/settings/facePage/faceChannel.vue'], resolve)
        }
      },
      {
        path: '/settings/face/faceServer',
        component: resolve => {
          require(['../view/settings/facePage/faceServer.vue'], resolve)
        }
      }
    ]
  },
  {
    // 报警管理
    path: '/settings/alarm',
    redirect: '/settings/alarm/org',
    component: resolve => {
      require(['../view/settings/alarmManage/orgConfig.vue'], resolve)
    },
    children: [
      {
        path: '/settings/alarm/time',
        component: resolve => {
          require(['../view/settings/alarmManage/timeTemplate.vue'], resolve)
        }
      },
      {
        path: '/settings/alarm/params',
        component: resolve => {
          require(['../view/settings/alarmManage/paramsSetting.vue'], resolve)
        }
      },
      {
        path: '/settings/alarm/org',
        component: resolve => {
          require(['../view/settings/alarmManage/orgConfig.vue'], resolve)
        }
      },
      {
        path: '/settings/alarm/sort',
        component: resolve => {
          require(['../view/settings/alarmManage/sortShow.vue'], resolve)
        }
      }
    ]
  },
  {
    // 报警求助
    path: '/settings/alarmHelps',
    redirect: '/settings/alarmHelps/center',
    component: resolve => {
      require(['../view/settings/alarmHelps/alarmCenter.vue'], resolve)
    },
    children: [
      {
        path: '/settings/alarmHelps/server',
        component: resolve => {
          require(['../view/settings/alarmHelps/alarmServer.vue'], resolve)
        }
      },
      {
        path: '/settings/alarmHelps/terminal',
        component: resolve => {
          require(['../view/settings/alarmHelps/alarmTerminal.vue'], resolve)
        }
      },
      {
        path: '/settings/alarmHelps/center',
        component: resolve => {
          require(['../view/settings/alarmHelps/alarmCenter.vue'], resolve)
        }
      }
    ]
  },
  {
    path: '/settings/inspectServer',
    component: resolve => {
      require(['../view/settings/sys/inspectServer.vue'], resolve)
    }
  },
  {
    // 资源管理
    path: '/settings/resource',
    component: resolve => {
      require(['../view/settings/resource/resourceManage.vue'], resolve)
    }
  },
  {
    path: '/settings/broadcast',
    component: resolve => {
      require(['../view/settings/inspectPage/inspectManage.vue'], resolve)
    }
  },
  {
    path: '/system/log',
    component: resolve => {
      require(['src/view/settings/sys/SysLog.vue'], resolve)
    }
  },
  {
    path: '/settings/system',
    component: resolve => {
      require(['../view/settings/sys/sysManage.vue'], resolve)
    },
    redirect: '/settings/system/platform',
    children: [
      {
        path: '/settings/system/platform',
        component: resolve => {
          require(['../view/settings/sys/platformInfor.vue'], resolve)
        }
      },
      {
        path: '/settings/system/params',
        component: resolve => {
          require(['../view/settings/sys/sysParameter.vue'], resolve)
        }
      },
      {
        path: '/settings/system/timeconfig',
        component: resolve => {
          require(['../view/settings/sys/timeConfig.vue'], resolve)
        }
      },
      {
        path: '/settings/system/TwoImensional',
        component: resolve => {
          require(['../view/settings/sys/TwoImensional.vue'], resolve)
        }
      },
      {
        path: '/settings/system/threeMapMode',
        component: resolve => {
          require(['../view/settings/sys/threeMapMode.vue'], resolve)
        }
      },
      {
        path: '/settings/system/inspectServer',
        component: resolve => {
          require(['../view/settings/sys/inspectServer.vue'], resolve)
        }
      }
    ]
  },
  {
    path: '/settings/user',
    component: resolve => {
      require(['../view/settings/user/userManage.vue'], resolve)
    },
    redirect: '/settings/user/custom',
    children: [
      {
        path: '/settings/user/custom',
        component: resolve => {
          require(['../view/settings/user/user/user.vue'], resolve)
        }
      },
      {
        path: '/settings/user/powerdist',
        component: resolve => {
          require(['../view/settings/user/power/powerdist.vue'], resolve)
        }
      },
      {
        path: '/settings/user/role',
        component: resolve => {
          require(['../view/settings/user/role/role.vue'], resolve)
        }
      },
      {
        path: '/settings/user/safe',
        component: resolve => {
          require(['../view/settings/user/safe/safePolicy.vue'], resolve)
        }
      }
    ]
  },
  {
    // 录像管理
    path: '/settings/video',
    component: resolve => {
      require(['../view/settings/videoManage.vue'], resolve)
    },
    redirect: '/settings/video/homepage',
    children: [
      {
        path: '/settings/video/homepage',
        component: resolve => {
          require(['../view/settings/videoPage/videoShow.vue'], resolve)
        }
      },
      {
        path: '/settings/video/plan',
        component: resolve => {
          require(['../view/settings/videoPage/videoPane/plan.vue'], resolve)
        }
      },
      {
        path: '/settings/video/holiday',
        component: resolve => {
          require(['../view/settings/videoPage/videoPane/holiday.vue'], resolve)
        }
      }
    ]
  },
  {
    // 运维配置
    path: '/settings/ops',
    redirect: '/ops/repairUnit'
  },
  {
    path: '/ops/repairUnit',
    component: resolve => {
      require(['../view/settings/ops/repairUnit.vue'], resolve)
    }
  },
  {
    path: '/ops/parameter',
    component: resolve => {
      require(['../view/settings/ops/parameter.vue'], resolve)
    }
  },
  {
    path: '/ops/diagnoseServer',
    component: resolve => {
      require(['../view/settings/ops/diagnoseServer.vue'], resolve)
    }
  },
  {
    path: '/apitest',
    component: resolve => {
      require(['../view/apitest.vue'], resolve)
    }
  },
  {
    path: '/log',
    component: resolve => {
      require(['../view/log/query.vue'], resolve)
    }
  },
  {
    path: '/journal',
    component: resolve => {
      require(['../view/log/journal.vue'], resolve)
    }
  },
  {
    path: '/interconnect/local',
    component: resolve => {
      require(['../view/interconnect/Interconnect.vue'], resolve)
    }
  }
]
