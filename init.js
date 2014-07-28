function startdb(client) {
  //require client should have getter and setter
  client.get("db", function(err, data) {
    if (data == null) {
      var db = {}
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
}

exports.db = startdb;
