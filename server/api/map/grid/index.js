/*
* 网格路由
* @Author: chenkaibo
* @Date: 2018-06-05 15:29:20
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-10-31 09:21:11
*/

'use strict'

const router = require('koa-router')()
const controller = require('./grid.controller')

router.get('/mapid', controller.getGridByMapId)
router.get('/sid', controller.getGridBySid) // 根据楼层id获取网格
router.get('/checkRepeat', controller.checkRepeat)
router.get('/', controller.getAll)
router.get('/:id/statistic', controller.statistic)
router.get('/:id', controller.getOne)
router.put('/:id', controller.updateOne)
router.delete('/:id', controller.deleteOne)
router.post('/', controller.add)

module.exports = router
