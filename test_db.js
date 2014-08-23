var dbjs = require('./db.js')
var db = dbjs('test')
var shared = {};

exports.create_user = function(t) {
  t.expect(1)
  var name = 'aa'
  var password = 'aa'
  shared.username = name
  shared.password = password
  var new_user = db.create_user(name, password)
  new_user.then(function(user) {
    t.ok(user.name == name)
    shared['user_id'] = user._id
    t.done()
  })
}

exports.users = function(t) {
  t.expect(1)
  var users = db.users()
  users.then(function(data) { t.ok(true); t.done() })
}

exports.user = function(t) {
  t.expect(1)
  var user = db.user(shared.username, shared.password);
  user.then(function(user) {
    t.ok(user.name == shared.username);
    t.done();
  })
}

exports.create_room = function(t) {
  t.expect(1)
  var name = "room_name_aa"
  shared.room_name = name
  var new_room = db.create_room(name, shared['user_id'])
  new_room.then(function(room) {
    t.ok(room.name == name)
    shared['room_id'] = room._id
    t.done()
  })
}

exports.rooms = function(t) {
  t.expect(1)
  var rooms = db.rooms()
  rooms.then(function(data) { t.ok(true); t.done() })
}

exports.room = function(t) {
  t.expect(1)
  var room = db.room(shared['room_id'])
  room.then(function(room) {
    t.ok(room.name == shared.room_name);
    t.done();
  })
}

exports.room_populate = function(t) {
  t.expect(2)
  var room = db.room(shared['room_id'], {populate: true})
  room.then(function(room) {
    t.ok(room.owner.name = shared.username);
    t.ok(room.name == shared.room_name);
    t.done();
  })
}

exports.room_users = function(t) {
  t.expect(1)
  var room_users = db.room_users( shared['room_id'])
  room_users.then(function(data) { t.ok(true); t.done() })
}

exports.enter_room = function(t) {
  t.expect(1)
  var room = db.enter_room(shared['user_id'], shared['room_id'])
  room.then(function(data) { t.ok(true); t.done() })
}

exports.leave_room = function(t) {
  t.expect(1)
  var room = db.leave_room(shared['user_id'], shared['room_id'])
  room.then(function(data) { t.ok(true); t.done() })
}

exports.room_messages = function(t) {
  t.expect(1)
  var room = db.room_messages(shared['room_id'])
  room.then(function(data) { t.ok(true); t.done() })
}

exports.create_message = function(t) {
  t.expect(1)
  var message = {text: 'hei hei', user: shared['user_id']}
  var room = db.create_message(shared['room_id'], message)
  room.then(function(data) { t.ok(true); t.done() })
}

exports.room_populate2 = function(t) {
  t.expect(3)
  var room = db.room(shared['room_id'], {populate: true})
  room.then(function(room) {
    t.ok(room.owner.name = shared.username);
    t.ok(room.messages[0].user.name = shared.username);
    t.ok(room.name == shared.room_name);
    t.done();
  })
}

