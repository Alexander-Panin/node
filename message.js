var dbjs = require('./db.js');
var db = dbjs('dev');

var messages = {
  post_message: function(data) {
    // require data.keys = [user_id: objId, message: String, room_id: objId]
    var attrs = {user: data.user_id, text: data.message, date: new Date() }
    db.create_message(data.room_id, attrs)
    var key = "message_to_client_" + data.room_id
    attrs.user = data.user
    io_.sockets.emit(key, attrs)
  },
  create_room: function(data) {
    // data.keys = [name: String, user_id: objId]
    var room = db.create_room(data.name, data.user_id)
    room.then(function(room) {
      room.user = data.user
      io_.sockets.emit("room_to_client", room)
    })
  },
  enter_room: function(data) {
    // data.keys = [room_id: objId, user_id: objId]
    db.enter_room(data.user_id, data.room_id)
    var room = db.room(data.room_id, {populate: true})
    room.then(function(room){
      io_.sockets.emit("enter_room_to_client", room)
    })
  },
  leave_room: function(data) {
    // data.keys = [room_id: objId, user_id: objId]
    db.leave_room(data.user_id, data.room_id)
    var room = db.room(data.room_id, {populate: true})
    room.then(function(room){
      io_.sockets.emit("leave_room_to_client", room)
    })
  },
}

var io_ = null;
module.exports = function(io) {
  io_ = io
  return {
    msg: messages,
  }
}


