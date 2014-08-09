var io_ = null;

var messages = {
  'post_message': {
    apply: function(data, db) {
      var room = db.rooms[data.room]
      var mess = {user: data.user, text: data.message, date: new Date}
      room.messages.push(mess)
      mess.room = data.room
      var key = "message_to_client_" + data.room
      io_.sockets.emit(key, mess)
      return db
    }
  },
  'create_room': {
    apply: function(data, db) {
      var room = {name: data.name, maker: data.user, messages: [], users: [] }
      db.rooms.push(room)
      room.idx = db.rooms.length - 1
      io_.sockets.emit("room_to_client", room)
      return db
    }
  },
  'enter_room': {
    apply: function(data, db) {
      var room = db.rooms[data.room]
      room.users = room.users.filter(function(x) { return x != data.user })
      room.users.push(data.user)
      io_.sockets.emit("enter_room_to_client", {users: room.users, room: data.room})
      return db
    }
  },
  'leave_room': {
    apply: function(data, db) {
      var room = db.rooms[data.room]
      room.users = room.users.filter(function(x) { return x != data.user })
      io_.sockets.emit("leave_room_to_client", {users: room.users, room: data.room})
      return db
    }
  },
}

module.exports = function(io) {
  io_ = io
  return {
    msg: messages,
  }
}


