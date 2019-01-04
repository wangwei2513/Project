import _ from 'lodash'

class Personnel {
  constructor(personnel) {
    this._init(personnel)
  }
  _init(personnel) {
    this.number = _.get(personnel, 'code', '-')
    this.name = _.get(personnel, 'name', '-')
    this.sex = this._sex(personnel)
    this.contact = _.get(personnel, 'phone', '-')
    this.teamName = _.get(personnel, 'group.name', '-')
    this.teamId = _.get(personnel, 'group._id', '-')
    this.department = _.get(personnel, 'department', '-')
    this.position = _.get(personnel, 'title', '-')
    this.address = _.get(personnel, 'address', '-')
    this.id = _.get(personnel, '_id', null)
  }
  _sex(personnel) {
    let raw = _.get(personnel, 'gender', '-')
    if (raw === '-') { return '-' }
    if (raw === 0) { return '女' }
    if (raw === 1) { return '男' }
  }
}

export default Personnel
