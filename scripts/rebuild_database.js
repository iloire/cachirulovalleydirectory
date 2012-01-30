var script = require ('./lib/rebuild_database');
var config = require ('../config').values

if (process.argv[2]!="deletealldata"){
	console.log('--------------');
	console.log('WARNING!!! this will destroy your production database at: ' + JSON.stringify(config.server.production.database))
	console.log ('If you really want to flush the database, use:');
	console.log();
	console.log(' $ node rebuild_database.js deletealldata')
	console.log()
}
else{
	var redis = require("redis").createClient(config.server.production.database.port, config.server.production.database.host);

	script.rebuild_database(redis, function(err){
		redis.quit();
		if (err){
			console.log ('ERROR:')
			console.log (err)
			process.exit(1);
		}
		else{
			console.log ('Database rebuilt!');
			process.exit(0);
		}
	});
}