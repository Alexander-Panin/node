var http = require('http'), fs = require('fs'), Mustache = require('./mustache')
var $ = require('./jquery'), qs = require('querystring'), socket_io = require('socket.io')

var rooms = [
  { users: ['robot'],
    messages: [{user: 'robot', text: "hello guy", date: new Date}],
    maker: 'robot',
    name: 'default',
  },
];

var actions = {
  "/rooms/[0-9]+/message" : {
    apply: function(res, req, params, body) {
      var idx = params[0];
      var room = rooms[idx];
      push_and_fired(room.messages, {user: 'hz', text: 'hz', date: new Date})
      res.end()
    }
  },
  "/rooms/[0-9]+/": {
    apply: function(res, req, params) {
      function view() {
        var idx = params[0];
        var room = rooms[idx];
        return {
          title: room.name,
          users: room.users,
          idx: idx,
          messages: room.messages.map( function(x)
            { return x.date.toDateString() + ' ' + x.user + ' -- ' + x.text }),
        }
      }
      render_and_resp_end(res, "room.html", view)
    }
  },
  "/": {
    apply: function(res, req, params) {
      function view() { return { rooms: rooms.map(function(x, i) { x.idx = i; return x; })} }
      render_and_resp_end(res, "index.html", view)
    }
  },
}

function render_and_resp_end(res, fname, view) {
  var options = {encoding: 'UTF-8'}
  fs.readFile("./templates/" + fname, options, function(err, template) {
    res.writeHeader(200, {'Content-Type': 'text/html'})
    res.end(Mustache.to_html(template, view()))
  })
}

var app = http.createServer(function (req, res) {
  var body = ""
  req.on('data', function(data) { body+= data; })
  req.on('end', function() {
    var key = Object.keys(actions).filter(function(x) {
      return RegExp(x).test(req.url);
    })[0] || '/'
    var action = actions[key]
    var params = req.url.match(/[0-9]+/g)
    action.apply(res, req, params, qs.parse(body))
  })
}).listen(80, '0.0.0.0')

var io = socket_io.listen(app)

io.sockets.on('connection', function(socket) {
  socket.on('post_message', function(data) {
    var room = rooms[data.room]
    var mess = {user: data.user, text: data.message, date: new Date}
    room.messages.push(mess)
    io.sockets.emit("message_to_client", mess)
  });
});

console.log('Server running at http://192.168.197.165/')
