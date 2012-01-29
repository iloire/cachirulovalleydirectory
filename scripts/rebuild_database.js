var script = require ('./lib/rebuild_database');
var config = require ('../config').values
var redis = require("redis").createClient(config.server.database.port, config.server.database.host);

script.rebuild_database(redis, function(err){
	redis.quit();
	if (err){
		console.log ('ERROR:')
		console.log (err)
		//process.exit(1);
	}
	else{
		console.log ('Database rebuilt!');
		//process.exit(0);
	}
});