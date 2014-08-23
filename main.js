var socket_io = require('socket.io')
var express = require('express')
var redis = require('redis')
var path = require('path')

var init_data = require('./init.js')
var validation = require('./validation.js')
var dbjs = require('./db.js')
var db = dbjs('dev')

//config
//var config = { server: "192.168.188.128" }
var config = { server: "127.0.0.1" }
init_data.db(db)

var app = express()
// set view's dir
app.engine('.html', require('ejs').__express)
app.set('views', __dirname + '/templates')
app.set('view engine', 'html')

// settings
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var multer = require('multer')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use("/public", express.static(path.join(__dirname, 'public')))
app.use(multer({ dest:'./public/'}))

app.get('/', function(req, res) { res.render('auth', {}) })

function _auth_check(req, res, next, options) {
  // options.keys = [right: function, left: function, where: cookies or body]
  var password = options.where == "body" ? req.body.password : req.cookies.password;
  var username = options.where == "body" ? req.body.user : req.cookies.user;
  var user = db.user(username, password);
  user.then(function(user) {
    if (!options.right)
      options.right = function(req, user, next) { req.current_user = user; next(); }
    if (user) options.right(req, user, next);
    else options.left(req, next);
  })
}

function is_user_exist(req, res, next) {
  var l = function(req, next) { next(); }
  _auth_check(req, res, next, {left: l, where: "body"});
}
function check_auth(req, res, next) {
  var l = function(req, next) { next(new Error(401)); }
  _auth_check(req, res, next, {left: l, where: "cookies"});
}

app.post('/auth', is_user_exist, function(req, res) {
  if (req.current_user) res.json({ok: true})
  else res.json({})
})

app.get("/rooms", check_auth, function(req, res) {
  var rooms = db.rooms({populate: true});
  rooms.then(function(rooms) {
    res.render('rooms', { rooms: rooms, server: config.server, user_id: req.current_user._id })
  });
})

app.get("/rooms/:id", check_auth, function(req, res) {
  var room_id = req.params.id
  var room = db.room(room_id, {populate: true})
  room.then(function(room) {
    res.render('room', { server: config.server, room: room, user_id: req.current_user._id});
  })
})

app.post("/users", is_user_exist, function(req, res) {
  if (req.current_user) { res.json({ok: false, err: 'already exist'}); return; }
  var user = db.create_user(req.body.user, req.body.password);
  user.then(function(user){
    res.json({ok: true, user: user})
  })
})

app.post("/rooms/:id/file", check_auth, function(req, res) {
  var img = req.files.img
  var url = "/" + img.path
  res.json({ok: true, url: url})
})

var serverApp = app.listen(80)
var io = socket_io.listen(serverApp)

var message = require('./message.js')
var message_ = message(io)
io.sockets.on('connection', function(socket) {
  socket.on('chat', function(data) {
    message_.msg[data.type](data)
  })
})
