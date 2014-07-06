var config = require ('./config').values;

if (!config.base_url || !config.LINKEDIN_API_KEY || !config.LINKEDIN_SECRET_KEY){
  return console.error("Missing config parameter. Please setup your ENV accordingly");
}

var redis = require("redis").createClient(config.server.production.database.port, config.server.production.database.host);
redis.select (config.server.production.database.db);

var app = require ('./app').getApp(redis, config);

var port = parseInt(process.argv[2], 10) || 3000;
app.listen(port);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

process.on('SIGINT', function () {
	app.close();
	redis.quit();
	console.log();
	console.log('Shuting down server..');
	process.exit(0);
});