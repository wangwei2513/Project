/**
 * 请求授权中间件
 */
const config = require('../../config').backend
const jwt = require('jsonwebtoken')
const User = require('mongoose').model('User')
const _ = require('lodash')

const auth = async (ctx, next) => {
  // white list directly pass
  if (config.whiteList.indexOf(ctx.path) !== -1 || ctx.request.path.indexOf('api') === -1) {
    await next()
  } else {
    try {
      if (ctx.headers.authorization) {
        ctx.headers.authorization = ctx.headers.authorization.replace(/Bearer /, '')
      }
      const decoded = jwt.verify(ctx.headers.authorization || ctx.query.access_token || '', config.secrets.session)
      const user = await User.findById(decoded._id).exec()
      if (_.isEmpty(user)) {
        ctx.status = 401
        return
      }
      ctx.state.user = decoded
      await next()
    } catch (err) {
      ctx.status = 401
      ctx.body = {
        message: err.message || 'JsonWebTokenError'
      }
    }
  }
}

module.exports = auth
