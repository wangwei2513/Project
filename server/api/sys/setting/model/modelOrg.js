/*
 * @Author: chenkaibo
 * @Date: 2018-11-01 17:55:11
 * @Last Modified by: chenkaibo
 * @Last Modified time: 2018-11-06 11:01:46
 */
'use strict'
module.exports = {
  name: '根节点-模型',
  _id: 'root',
  children: [
    {
      name: '视频',
      _id: '0',
      pid: 'root',
      children: [
        {
          name: '枪机',
          _id: '00',
          pid: '0'
        },
        {
          name: '红外枪机',
          _id: '01',
          pid: '0'
        },
        {
          name: '半球',
          _id: '02',
          pid: '0'
        },
        {
          name: '快球',
          _id: '03',
          pid: '0'
        },
        {
          name: '全景',
          _id: '04',
          pid: '0'
        }
      ]
    },
    {
      name: '报警',
      _id: '1',
      pid: 'root',
      children: [
        {
          name: '普通报警',
          _id: '10',
          pid: '1'
        },
        {
          name: '报警主机',
          _id: '90',
          pid: '1'
        },
        {
          name: '消防报警',
          _id: '110',
          pid: '1'
        }
      ]
    },
    {
      name: '报警求助',
      _id: '13',
      pid: 'root',
      children: [
        {
          name: '报警箱',
          _id: '130',
          pid: '13'
        },
        {
          name: '报警柱',
          _id: '131',
          pid: '13'
        }
      ]
    },
    {
      name: '巡更',
      _id: '14',
      pid: 'root',
      children: [
        {
          name: '常规',
          _id: '140',
          pid: '14'
        },
        {
          name: '聚合',
          _id: '141',
          pid: '14'
        }
      ]
    },
    {
      name: '单兵',
      _id: '15',
      pid: 'root'
    },
    {
      name: '辅助',
      _id: '16',
      pid: 'root'
    }
  ]
}
