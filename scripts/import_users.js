var _redis = require("redis")
var config = require ('../config').values
var fs = require('fs');
var redis = _redis.createClient(config.server.production.database.port, config.server.production.database.host)

var common = require ('../lib/common.js');
var module_users = require("../lib/modules/users.js")

var file = process.argv[2] || '';
var keep_id = (process.argv[3] == 'true') || false;

fs.readFile(file, 'utf-8', function(err, data) {
    if(err) throw err;
	var users = JSON.parse(data)
	if (!keep_id){
		console.log ('All users will be added to database')
		for (var u=0, ul = users.length; u<ul; u++) {
			users[u].id = null;
		}
	}
	else{
		console.log ('Users will be updated or added according to user.id')
	}
	module_users.SetUsers(redis, {users:users}, function(err, users_db){
		//for (var i=0, il = users_db.length; i<il; i++) {
	       // console.log(users_db [i].name + ' added!');
		//}
		redis.quit();
		process.exit(0);
		
	})
});
