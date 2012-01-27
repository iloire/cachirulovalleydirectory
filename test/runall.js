var async = require ('async');

var app = require ('../app')

process.on('SIGINT', function () {
	console.log();
	console.log('Shuting down server..');
	process.exit(0);
});

function run_tests (tests, callback){
	async.series(tests, function(err, results){
		if (err){
			console	.log (err);
			callback(err);
		}
		else {
			callback(null);
		}
	});	
}

var tests = [];
var test_modules = ['http','zombie']; //folders with tests.js file inside

//setup
for (var i=0;i<test_modules.length;i++){
	var module = require('./' + test_modules[i] + '/tests.js')
	module.setup(app);
	tests.push (
		function (module){
			return (function do_test (callback){ run_tests(module.tests, callback);})
		}(module)
	);
}

var port = 3434
app.listen(port);

async.series(tests, function(err, results){
	if (err){
		console.log (err);
	}
	else {
		console.log ('All tests ok!');
		process.exit(1);
	}
});	

