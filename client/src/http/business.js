
import {get} from './base'

export const getDutyListApi = (name) => get({
  url: '/business/duty/dutylist' + name,
  query: {}
})

export const getDutyByNameApi = (name) => get({
  url: '/business/duty/byname',
  query: name
})
