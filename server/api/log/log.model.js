const { db, mongoose } = require('../log/model.base')

const roleSchema = mongoose.Schema({
  roleType: String,
  roleName: String,
  memo: String
})
const collectionName = 'Role'

exports.RoleLogs = db.model('RoleLog', roleSchema, collectionName)
