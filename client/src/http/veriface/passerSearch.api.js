import { get } from '../base.js'
export const getPasserConditionApi = payload => {
  const param = {
    url: 'veriface/statistic/passby',
    query: payload || {}
  }
  return get(param)
}
export const getImagesConditionApi = payload => {
  const param = {
    url: 'veriface/statistic/passby/img',
    query: payload || {}
  }
  return get(param)
}
export const getPasserExportApi = payload => {
  const param = {
    url: `/veriface/statistic/passby/export?${payload}`
  }
  return get(param)
}
