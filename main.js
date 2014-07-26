var http = require('http'), fs = require('fs'), Mustache = require('./mustache')
var qs = require('querystring'), socket_io = require('socket.io'),express = require('express')
var redis = require("redis"), async = require('async')
var client = redis.createClient()
var path = require('path')

//config
var config = {}
// make sure to change it
config.server = "192.168.188.128"

// init db gunction
client.get("db", function(err, data) {
  if (data == null) {
    db.users = [{name: 'ivan', password: 'aa'}, {name: 'aa', password: 'aa'}]
    db.rooms = [
      { users: ['robot'],
        messages: [{user: 'robot', text: "feel better", date: new Date}],
        maker: 'robot',
        name: 'default',
      },
    ];
    client.set("db", JSON.stringify(db))
  }
})

function check_auth(body, db) {
  var u = body.user; p = body.password
  for (var i in db.users)
  { if (db.users[i].name == u && db.users[i].password == p) return true }
  return false
}

var app = express();
// set view's dir
app.engine('.html', require('ejs').__express)
app.set('views', __dirname + '/templates')
app.set('view engine', 'html')

// settings
app.use(express.json())
app.use(express.urlencoded())
app.use("/public", express.static(path.join(__dirname, 'public')))
app.use(express.bodyParser({uploadDir:'./public'}))

app.get('/', function(req, res) { res.render('auth', {}) })

app.post('/auth', function(req, res) {
  client.get("db", function(err, data) {
    var res_data = {}
    var db = JSON.parse(data)
    console.log(req.body)
    if (check_auth(req.body, db)) res_data.ok = true
    res.json(res_data)
  })
})

app.get("/rooms", function(req, res) {
  client.get("db", function(err, data) {
    var db = JSON.parse(data)
    res.render('rooms', {
      rooms: db.rooms.map(function(x, i) { x.idx = i; return x; }),
      server: config.server,
    })
  })
})

app.get("/rooms/:id", function(req, res) {
  var idx = req.params.id
  client.get("db", function(err, data) {
    var db = JSON.parse(data)
    var room = db.rooms[idx]
    res.render('room', {
      title: room.name, users: room.users, idx: idx, server: config.server,
        messages: room.messages.map(
          function(x) { return x.date + '  ' + x.user + ' -- ' + x.text }),
    })
  })
})

app.post("/users", function(req, res) {
  client.get("db", function(err, data) {
    var db = JSON.parse(data)
    console.log(db.users)
    var params = req.body
    var us = db.users.filter(function(x) { return x.name == params.user })
    if (us.length > 0) { res.json({ok: false, err: "already exist"}); return }
    var user = { name: params.user, password: params.password }
    db.users.push(user)
    client.set("db", JSON.stringify(db))
    user.ok = true
    res.json(user)
  })
})

app.post("/rooms/:id/file", function(req, res) {
  client.get("db", function(err, data) {
    var db = JSON.parse(data)
    var img = req.files.img
    var url = "/" + img.path
    res.json({ok: true, url: url})
  })
})

var serverApp = app.listen(80)
var io = socket_io.listen(serverApp)
var db = {}

var messages = {
  'post_message': {
    apply: function(data) {
      var room = db.rooms[data.room]
      var mess = {user: data.user, text: data.message, date: new Date}
      room.messages.push(mess)
      mess.room = data.room
      var key = "message_to_client_" + data.room
      io.sockets.emit(key, mess)
    }
  },
  'create_room': {
    apply: function(data) {
      var room = {name: data.name, maker: data.user, messages: [], users: [] }
      db.rooms.push(room)
      room.idx = db.rooms.length - 1
      io.sockets.emit("room_to_client", room)
    }
  },
  'enter_room': {
    apply: function(data) {
      var room = db.rooms[data.room]
      room.users = room.users.filter(function(x) { return x != data.user })
      room.users.push(data.user)
      io.sockets.emit("enter_room_to_client", {users: room.users, room: data.room})
    }
  },
  'leave_room': {
    apply: function(data, socket) {
      var room = db.rooms[data.room]
      room.users = room.users.filter(function(x) { return x != data.user })
      io.sockets.emit("leave_room_to_client", {users: room.users, room: data.room})
    }
  },
}

io.sockets.on('connection', function(socket) {
  socket.on('chat', function(data) {
    client.get("db", function(err, redisdb) {
      db = JSON.parse(redisdb)
      messages[data.type].apply(data, socket)
      client.set("db", JSON.stringify(db))
    })
  });
});
