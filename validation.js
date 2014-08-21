function check_auth(data, db) {
  var u = data.user
  var p = data.password
  for (var i in db.users) {
    if (db.users[i].name == u && db.users[i].password == p) {
      return true
    }
  }
  return false
}

function check_existing(params, db) {
  var us = db.users.filter(function(x) { return x.name == params.user })
  return new Boolean(us.length > 0)
}

exports.auth = check_auth;
exports.user_exist = check_existing;
