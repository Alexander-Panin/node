var dbjs = require('./db.js');
var db = dbjs('dev');

var messages = {
  post_message: function(data) {
    // require data.keys = [user_id: objId, message: String, room_id: objId]
    var message = {user: data.user_id, text: data.message}
    db.create_message(data.room_id, message)
    var key = "message_to_client_" + data.room_id
    io_.sockets.emit(key, mess)
  },
  create_room: function(data) {
    // data.keys = [name: String, user_id: objId]
    var room = db.create_room(data.name, data.user_id)
    io_.sockets.emit("room_to_client", data.room_id)
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


