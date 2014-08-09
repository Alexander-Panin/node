var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection eror'))
db.once('open', function() { console.log.bind(console, 'yeap'); })

var userSchema = mongoose.Schema({ name: String, password: String })

var Ref_t = mongoose.Schema.Types.ObjectId

var roomSchema = mongoose.Schema({
  name: String,
  users: [Ref_t],
  messages: [{
    text: String,
    date: {type: Date, default: Date.now },
    user: Ref_t,
  }],
})

var Room = mongoose.model('Room', roomSchema)
var User = mongoose.model('User', userSchema)

function users(data) {
  if (Object.keys(data) == 0) return User.find().exec()
  return User.find({name: data.name, password: data.password}).exec()
}

function create_user(data) {
  var user = User.create(data)
  return user
}

function rooms() {
  var rooms = Room.find().exec()
  return rooms
}

function create_room(data) {
  var room = Room.create(data)
  return room
}

function room_users(data) {
  var room = Room.find({_id: data.room_id}, 'users').exec()
  return room
}

function leave_room(data) {
  var room = Room.update({_id: data.room_id}, {$pull: {users: data.user_id}}).exec()
  return room
}

function enter_room(data) {
  var room = Room.update({_id: data.room_id}, {$push: {users: data.user_id}}).exec()
  return room
}

function rooms_messages(data) {
  var room = Room.find({_id: data.room_id}, 'messages').exec()
  return room
}

function create_message(data) {
  var room = Room.update({_id: data.room_id}, {$push: {messages: data.message}}).exec()
  return room
}

exports.apply = function (key, data) {
  m = {
    'users/': users,
    'users/create': create_user,
    'rooms/': rooms,
    'rooms/create': create_room,
    'rooms/users/': room_users,
    'rooms/users/leave': leave_room,
    'rooms/users/enter': enter_room,
    'rooms/messages/': rooms_messages,
    'rooms/users/messages/create': create_message,
  }
  return m[key](data)
}

function init(){ }

