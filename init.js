
function startdb(db) {
  var robot = db.user('robot', 'rr')
  robot.then(function(robot) { if (!robot) init(db); })
}

function init(db) {
  var robot = db.create_user('robot', 'rr')
  var users = [ {name: 'ivan', password: 'aa'}, {name: 'aa', password: 'aa'}]
  for(var i in users) { db.create_user(users[i].name, users[i].password)}

  robot.then(function(robot){
    var room = db.create_room('default', robot._id)
    room.then(function(room) {
      var message = {text: "feel better", user: robot._id}
      db.create_message(room._id, message)
      var room = db.enter_room(robot._id, room._id)
    })
  })
}

exports.db = startdb;
