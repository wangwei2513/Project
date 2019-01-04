'use strict'
const _ = require('lodash')
/**
 * page query func
 */
module.exports = {
  listQuery: async function (schema, search, selection, sort, pageObj = { limit: 10, page: 1 }, population, ctx) {
    for (var key in search) {
      if (search[key] === undefined || search[key] === '' || search[key] === null) {
        delete search[key]
      }
    }
    const [count, results] = await Promise.all([
      schema.countDocuments(search).exec(), schema.find(search, selection).populate(population).sort(sort).skip((+pageObj.page - 1) * (+pageObj.limit))
        .limit(+pageObj.limit).exec()
    ])
    ctx.set({
      'X-BSC-COUNT': count,
      'X-BSC-PAGES': Math.ceil(count / pageObj.limit),
      'X-BSC-CUR': parseInt(pageObj.page),
      'X-BSC-LIMIT': parseInt(pageObj.limit)
    })
    return {
      results: _.isEmpty(results) ? [] : results
    }
  }
}
