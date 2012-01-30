var async = require ('async');
var config = require ('../config').values;
var common = require ('../lib/common');
var appFactory = require ('../app');

var redis = require("redis").createClient(config.server.database.port, config.server.database.host);
		
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
		var app = new appFactory.getApp(redis);
		var module = require('./http/tests.js')

		module.setup(app);
		var port = 3434
		app.listen(port);
		
		run_tests(module.tests, function(err){
			app.close();	
			callback(err, 'http test passed');
		});
	}
	,
	function do_zombie_test (callback){ 
		var app = new appFactory.getApp(redis);
		var module = require('./zombie/tests.js')
		module.setup(app);
		var port = 3434
		app.listen(port);
		
		run_tests(module.tests, function(err){
			app.close();	
			callback(err, 'zombie test passed');
		});
	}
];

async.series(tests, function(err, results){
	if (err){
		console.log ('ERROR')
		console.log (err);
	}
	else {
		console.log ('All tests ok!');
		redis.quit();
		process.exit(0);
	}
});