'use strict'
const config = require('../config')
const errors = require('./components/errors')
const routes = require('./routes.json')
module.exports = function (app) {
  router.get('/api/heartbeat', ctx => {
    ctx.status = 200
  })
  routes.forEach(item => {
    router.use(item[0], require(item[1]).routes(), require(item[1]).allowedMethods())
  })
  router.use('/:url(api|auth|static)', errors.routes(), errors.allowedMethods())
  app.use(router.routes(), router.allowedMethods())
  if (config.backend.serverFrontend) {
    app.use(ctx => {
      if (ctx.request.path.indexOf('api') === -1) {
        const data = fs.readFileSync(path.join(config.backend.frontend, '/index.html'))
        ctx.type = 'text/html; charset=utf-8'
        ctx.body = data
      }
    })
  }
}
