import { get } from '../base.js'
export const getTrackConditionApi = payload => {
  const param = {
    url: '/veriface/identify/track',
    query: payload || {}
  }
  return get(param)
}
