import { get } from '../base.js'
export const getbaseraryApi = () => {
  const param = {
    url: 'veriface/group'
  }
  return get(param)
}
export const getAlarmConditionApi = payload => {
  const param = {
    url: 'veriface/statistic/alarm',
    query: payload || {}
  }
  return get(param)
}
export const getAlarmExportApi = payload => {
  const param = {
    url: `/veriface/statistic/alarm/export?${payload}`
  }
  return get(param)
}
