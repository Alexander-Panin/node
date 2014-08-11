function startdb(db) {
  var robot = db.create_user('robot', 'rr')
  var users = [ {name: 'ivan', password: 'aa'}, {name: 'aa', password: 'aa'}]
  for(var i in users) { db.create_user(users[i].name, users[i].password)}

  robot.then(function(robot){
    var room = db.create_room('default', robot._id)
    room.then(function(room) {
      var message = {text: "feel better", user: robot._id}
      db.create_messages(room._id, message)
    }
  })
}

exports.db = startdb;
