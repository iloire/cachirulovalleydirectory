var app = require ('./app')

var port = parseInt(process.argv[2], 10) || 3000
app.listen(port);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

process.on('SIGINT', function () {
	console.log();
	console.log('Shuting down server..');
	process.exit(0);
});