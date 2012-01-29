var async = require ('async');
var config = require ('../config').values
var common = require ('../lib/common')

var redis = require("redis").createClient(config.server.database.port, config.server.database.host);
var app = require ('../app').getApp(redis)

function run_tests (tests, callback){
	async.series(tests, function(err, results){
		callback(err, 'ok');
	});
}

var r = require('../scripts/lib/rebuild_database')
var tests = [
	function rebuild_db (callback){
		r.rebuild_database(redis, function(err){
			callback(err,'ok rebuild database');
		});
	}
	,
	function do_http_test (callback){ 
		var module = require('./http/tests.js')
		module.setup(app);
		run_tests(module.tests, callback);
	}
	,
	function do_zombie_test (callback){ 
		var module = require('./zombie/tests.js')
		module.setup(app);
		run_tests(module.tests, callback);
	}
];

var port = 3434
app.listen(port);

async.series(tests, function(err, results){
	if (err){
		console.log ('ERROR')
		console.log (err);
	}
	else {
		console.log ('All tests ok!');
		app.close();
		redis.quit();
		process.exit(0);
	}
});