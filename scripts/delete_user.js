var _redis = require("redis")
var config = require ('../config').values
var redis = _redis.createClient(config.server.production.database.port, config.server.production.database.host)
var common = require ('../lib/common.js');

var module_users = require("../lib/modules/users.js")

var id = parseInt(process.argv[2], 10)
if (!id){
	console.log ('please user id as parameter')
	redis.quit();
	process.exit(0);
}
else
{
	var params = { id: parseInt(process.argv[2], 10) }
	module_users.DeleteUser(redis, params, function(err){
		if (err)
			console.log (err)
		else
			console.log ('user deleted');
			redis.quit();
			process.exit(0);
	})
}