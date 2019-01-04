import {
  post, get, put, remove
} from './base'

/* 报警确认（普通、消防、报警助） */
export const alarmToBeSureApi = payload => {
  const param = {
    url: '/alarm/alarmaffirm',
    body: payload
  }
  return post(param)
}

/*  获取报警时间模板 */
export const getMapAlarmTemp = (data) => {
  const params = {
    query: data,
    url: 'setting/alarmcfg/timetemplate'
  }
  return get(params)
}

/*  获取布放状态 */
export const getLayoutStatus = (data) => {
  const params = {
    url: 'setting/alarm/' + data.id + '/status'
  }
  return get(params)
}

/*  获取警情处理 */
export const getAlarmDeal = (data) => {
  const params = {
    query: data,
    url: '/setting/alarmcfg/deal'
  }
  return get(params)
}

/*  警情处理添加 */
export const addAlarmDeal = (data) => {
  const params = {
    url: '/setting/alarmcfg/deal',
    body: data
  }
  return post(params)
}

/*  警情处理修改 */
export const reviseAlarmDeal = (data) => {
  const params = {
    body: {
      name: data.name,
      page: data.page
    },
    url: '/setting/alarmcfg/deal/' + data.id
  }
  return put(params)
}

/*  警情处理删除 */
export const deleteAlarmDeal = (data) => {
  const params = {
    url: '/setting/alarmcfg/deal/' + data
  }
  return remove(params)
}

/*  获取警情处理启用状态 */
export const getAlarmDealStatus = (data) => {
  const params = {
    url: '/setting/alarmcfg/param'
  }
  return get(params)
}
/*  获取警情处理启用状态 */
export const reviseAlarmDealStatus = (data) => {
  let params
  if (data.type === 'fire') {
    params = {
      body: {
        fireOpen: data.fireOpen
      },
      url: '/setting/alarmcfg/param/' + data.id
    }
  } else {
    params = {
      body: {
        alarmOpen: data.alarmOpen
      },
      url: '/setting/alarmcfg/param/' + data.id
    }
  }
  return put(params)
}
/* 获取角色下报警资源、设备的报警权限 */
export const getAlarmPower = (data) => {
  const params = {
    query: data,
    url: 'setting/role/assign'
  }
  return get(params)
}
