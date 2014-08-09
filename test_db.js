var db = require('./db.js')
var shared = {};

exports.setUp = function(callback) { callback() }
exports.tearDown = function(callback) { callback() }

exports.create_user = function(t) {
  t.expect(1)
  var name = 'aa'
  var new_user = db.apply('users/create', {name: name, password: 'aa'})
  new_user.then(function(data) {
    t.ok(data.name == name)
    shared['user_id'] = data._id
    t.done()
  })
}

exports.users = function(t) {
  t.expect(1)
  var users = db.apply('users/', {})
  users.then(function(data) { t.ok(true); t.done() })
}

exports.rooms = function(t) {
  t.expect(1)
  var rooms = db.apply('rooms/', {})
  rooms.then(function(data) { console.log(data); t.ok(true); t.done() })
}

exports.create_room = function(t) {
  t.expect(1)
  var name = "room_name_aa"
  var new_room = db.apply('rooms/create', {name: name})
  new_room.then(function(data) {
    t.ok(data.name == name);
    shared['room_id'] = data._id
    t.done()
  })
}

exports.room_users = function(t) {
  t.expect(1)
  var room_users = db.apply('rooms/users/', {room_id: shared['room_id']})
  room_users.then(function(data) { t.ok(true); t.done() })
}

exports.enter_room = function(t) {
  t.expect(1)
  var attrs = {room_id: shared['room_id'], user_id: shared['user_id']}
  var room_users = db.apply('rooms/users/enter', attrs)
  room_users.then(function(data) { t.ok(true); t.done() })
}

exports.leave_room = function(t) {
  t.expect(1)
  var attrs = {room_id: shared['room_id'], user_id: shared['user_id']}
  var room_users = db.apply('rooms/users/leave', attrs)
  room_users.then(function(data) { t.ok(true); t.done() })
}

exports.room_messages = function(t) {
  t.expect(1)
  var room_users = db.apply('rooms/messages/', {room_id: shared['room_id']})
  room_users.then(function(data) { t.ok(true); t.done() })
}

exports.create_message = function(t) {
  t.expect(1)
  var message = {text: 'hei hei', user: shared['user_id']}
  var attrs = {room_id: shared['room_id'], message: message}
  var room_users = db.apply('rooms/users/messages/create', attrs)
  room_users.then(function(data) { t.ok(true); t.done() })
}

