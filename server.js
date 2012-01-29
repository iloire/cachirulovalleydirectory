var config = require ('./config').values
var redis = require("redis").createClient(config.server.database.port, config.server.database.host);

var app = require ('./app').getApp(redis)

var port = parseInt(process.argv[2], 10) || 3000
app.listen(port);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

process.on('SIGINT', function () {
	app.close();
	redis.quit();
	console.log();
	console.log('Shuting down server..');
	process.exit(0);
});