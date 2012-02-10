var async = require ('async');
var config = require ('../config').values;
var common = require ('../lib/common');
var appFactory = require ('../app');

var dbconfig = config.server.test.database;
var redis = require("redis").createClient(dbconfig.port, dbconfig.host);
redis.select(dbconfig.db)

config.server.production.session_database = dbconfig; //make sure session for tests is saved in testing database

function run_tests (tests, callback){
	async.series(tests, function(err, results){
		callback(err, 'ok');
	});
}

var r = require('../scripts/lib/rebuild_database')

var tests = [
	function rebuild_db (callback){
		console.log('-- Rebulding database:');
		r.rebuild_database(redis, function(err){
			callback(err,'database rebuilt!');
		});
	}
	,
	function do_module_test (callback){ 
		console.log('-- Running module tests:');
		var module = require('./modules/tests.js')
		module.setup({redis:redis});
		run_tests(module.tests, function(err){	
			callback(err, 'modules test passed');
		});
	}
	,
	function do_http_test (callback){ 
		console.log(' -- Running http tests:');
		var app = new appFactory.getApp(redis, config);
		var module = require('./http/tests.js')

		module.setup({app:app});
		var port = 3434
		app.listen(port);
		
		run_tests(module.tests, function(err){
			app.close();	
			callback(err, 'http test passed');
		});
	}
	,
	function do_zombie_test (callback){ 
		console.log(' -- Running zombie tests:');
		var app = new appFactory.getApp(redis, config);
		var module = require('./zombie/tests.js')
		module.setup({app:app});
		var port = 3434
		app.listen(port);
		
		run_tests(module.tests, function(err){
			app.close();	
			callback(err, 'zombie test passed');
		});
	}

];

console.log('Running tests with database: ' + JSON.stringify(dbconfig))
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