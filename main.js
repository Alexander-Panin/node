var http = require('http'), fs = require('fs'), Mustache = require('./mustache')
var qs = require('querystring'), socket_io = require('socket.io')
var redis = require("redis"), async = require('async')
var client = redis.createClient()

//config
var config = {}
// make sure to change it
config.server = "192.168.197.165"

var db = {}
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

var actions = {
  "/public/.+" : {
    auth: true,
    apply: function(res, req, params) {
      var fname = req.url.split("/")[2] // get last param
      var options = {encoding: 'UTF-8'}
      fs.readFile("./public/" + fname, options, function(err, template) {
        if (err) res.end()
        res.writeHeader(200, {'Content-Type': 'application/octet-stream'})
        res.end(template)
      })
    }
  },
  "/rooms/[0-9]+/file" : {
    auth: true,
    apply: function(res, req, params, body) {
      body = qs.parse(body)
      var fname = "./public/" + body.user + params[0] + body.fname
      save_file(fname, body.data)
      var data = {ok: true, url: fname.substring(1)}
      res.writeHeader(200, {'Content-Type': 'application/json'})
      res.end(JSON.stringify(data))
    }
  },
  "/rooms/[0-9]+/": {
    auth: true,
    apply: function(res, req, params, body) {
      render_and_resp(res, "room.html", function() {
        var idx = params[0]
        var room = db.rooms[idx]
        return { title: room.name, users: room.users, idx: idx, server: config.server,
                 messages: room.messages.map(
                    function(x) { return x.date + '  ' + x.user + ' -- ' + x.text }),
        }
      })
    }
  },
  "/rooms": {
    auth: true,
    apply: function(res, req, params) {
      render_and_resp(res, "rooms.html", function() {
        return {
          rooms: db.rooms.map(function(x, i) { x.idx = i; return x; }),
          server: config.server,
        }
      })
    }
  },
  "/auth" : {
    apply: function(res, req, params, body) {
      var data = {}
      if (check_auth(qs.parse(body))) data.ok = true
      res.writeHeader(200, {'Content-Type': 'application/json'})
      res.end(JSON.stringify(data))
    }
  },
  "/users" : {
    apply: function(res, req, params, body) {
      body = qs.parse(body)
      res.writeHeader(200, {'Content-Type': 'application/json'})
      var us = db.users.filter(function(x) { return x.name == body.user })
      if (us.length > 0) { res.end("{}"); return }
      var user = { name: body.user, password: body.password }
      db.users.push(user)
      client.set("db", JSON.stringify(db))
      user.ok = true
      res.end(JSON.stringify(user))
    }
  },
  "/" : {
    apply: function(res, req, params) {
      render_and_resp(res, 'auth.html', function() {})
    }
  },
}

function save_file(fname, body) {
  console.log("save_file", body)
  var file = fs.createWriteStream(fname)
  file.write(body)
}

function render_and_resp(res, fname, view) {
  var options = {encoding: 'UTF-8'}
  fs.readFile("./templates/" + fname, options, function(err, template) {
    res.writeHeader(200, {'Content-Type': 'text/html'})
    res.end(Mustache.to_html(template, view()))
  })
}

function check_auth(body) {
  var u = body.user; p = body.password
  for (var i in db.users)
  { if (db.users[i].name == u && db.users[i].password == p) return true }
  return false
}

function parse_cookies (rc) {
  var list = {}
  rc && rc.split(';').forEach(function( cookie ) {
    var parts = cookie.split('=');
    list[parts.shift().trim()] = unescape(parts.join('='));
  });
  return list;
}

var app = http.createServer(function (req, res) {
  var body = ""
  req.on('data', function(data) { body+= data })
  req.on('end', function() {
    var key = Object.keys(actions).filter(function(x) {
      return RegExp(x).test(req.url);
    })[0] || '/'
    var action = actions[key]
    var params = req.url.match(/[0-9]+/g)
    var cookies = parse_cookies(req.headers.cookie)
    client.get("db", function(err, data) {
      db = JSON.parse(data)
      if (action.auth && !check_auth(cookies)) action = actions["/"]
      action.apply(res, req, params, body)
    })
  })
}).listen(80, '0.0.0.0')

var io = socket_io.listen(app)

var messages = {
  'post_message': {
    apply: function(data) {
      var room = db.rooms[data.room]
      var mess = {user: data.user, text: data.message, date: new Date}
      room.messages.push(mess)
      mess.room = data.room
      io.sockets.emit("message_to_client", mess)
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
