var mongoose = require('mongoose');

var userSchema = mongoose.Schema({ name: String, password: String })
var roomSchema = mongoose.Schema({
  name: String,
  owner: mongoose.Schema.Types.ObjectId,
  users: [mongoose.Schema.Types.ObjectId],
  messages: [{
    text: String,
    date: {type: Date, default: Date.now },
    user: mongoose.Schema.Types.ObjectId,
  }],
})

var Room = mongoose.model('Room', roomSchema)
var User = mongoose.model('User', userSchema)

var namespace = {
  users: function(name, password) {
    if (name && password) return User.find({name: name, password: password}).exec()
    return User.find().exec()
  },

  create_user: function(name, password) {
    var user = User.create({name: name, password: password})
    return user
  },

  rooms: function() {
    var rooms = Room.find().exec()
    return rooms
  },

  create_room: function(name, owner) {
    var room = Room.create({name: name, owner: owner})
    return room
  },

  room_users: function(room_id) {
    var room = Room.find({_id: room_id}, 'users').exec()
    return room
  },

  leave_room: function (user_id, room_id) {
    var room = Room.update({_id: room_id}, {$pull: {users: user_id}}).exec()
    return room
  },

  enter_room: function(user_id, room_id) {
    var room = Room.update({_id: room_id}, {$push: {users: user_id}}).exec()
    return room
  },

  room_messages: function (room_id) {
    var room = Room.find({_id: room_id}, 'messages').exec()
    return room
  },

  create_message: function (room_id, message) {
    // message = {text: String, user: obj_id}
    var room = Room.update({_id: room_id}, {$push: {messages: message}}).exec()
    return room
  },
}

module.exports = function(dbtype) {
  //dbtype [test, dev]
  var connect_string = 'mongodb://localhost/' + dbtype;
  mongoose.connect(connect_string);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection eror'))
  db.once('open', function() { console.log.bind(console, 'yeap'); })
  return namespace
}

