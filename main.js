var socket_io = require('socket.io')
var express = require('express')
var redis = require('redis')
var path = require('path')

var init_data = require('./init.js')
var validation = require('./validation.js')

//config
var config = { server: "192.168.188.128" }
var client = redis.createClient()
init_data.db(client)

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
    if (validation.auth(req.body, db)) res_data.ok = true
    res.json(res_data)
  })
})

app.get("/rooms", function(req, res) {
  client.get("db", function(err, data) {
    var db = JSON.parse(data)
    if (!validation.auth(req.body, db)) { res.json({err: 'bad_auth'}); return }
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
  function add_user(db, params) {
    var user = { name: params.user, password: params.password }
    db.users.push(user)
    client.set("db", JSON.stringify(db))
    return user
  }

  client.get("db", function(err, data) {
    var db = JSON.parse(data)
    var params = req.body
    if (validation.user_exist) { res.json({ok: false, err: "already exist"}); return }
    var user = add_user(db, params)
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

var message = require('./message.js')
var message_ = message(io)
io.sockets.on('connection', function(socket) {
  socket.on('chat', function(data) {
    client.get("db", function(err, redisdb) {
     var db = message_.msg[data.type].apply(data, JSON.parse(redisdb))
     client.set("db", JSON.stringify(db))
    })
  })
})
