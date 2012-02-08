var _redis = require("redis")
var config = require ('../config').values
var redis = _redis.createClient(config.server.production.database.port, config.server.production.database.host)
var common = require ('../lib/common.js');

var module_users = require("../lib/modules/users.js")

var params = { id_cat: parseInt(process.argv[2], 10) || 1, max: 5000 }
module_users.GetUsers(redis, params, function(err, users){
	var fs = require('fs');
	fs.writeFile("exported_users_cat_" +  params.id_cat + ".json", JSON.stringify(users), function(err) {
	    if(err) {
	        console.error(err);
	    } else {
	        console.log("Users from category " + params.id_cat + " saved on file!");
	    }
		redis.quit();
		process.exit(0);
	});
})
