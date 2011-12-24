var testosterone = require('testosterone')({port: 3000})
  , assert = testosterone.assert;

testosterone
	/*MAIN*/
	.get('/', function (res) {
	  assert.equal(res.statusCode, 200)
	})
	
	.get('/directory', function (res) {
	  assert.equal(res.statusCode, 200)
	})

	 /*REST*/
	.get('/api/cats', function (res) {
	//console.log (assert)
	  assert.equal(res.statusCode, 200);
	  assert.ok(res.body.indexOf ('{"cats":')>-1);
	})

	.get('/api/tags', function (res) {
	//console.log (assert)
	  assert.equal(res.statusCode, 200);
	  assert.ok(res.body.indexOf ('{"tags":')>-1);
	})

	.get('/api/tagsautocomplete', function (res) {
	  assert.equal(res.statusCode, 200);
	  assert.ok(res.body.indexOf ('c#')>-1);
	})

	.get('/api/users/bycat?id=1', function (res) {
	  assert.equal(res.statusCode, 200);
	  assert.ok(res.body.indexOf ('Loire')>-1);
	})

	.get('/api/users/bytag?id=node.js', function (res) {
	  assert.equal(res.statusCode, 200);
	  assert.ok(res.body.indexOf ('Loire')>-1);
	})

	.get('/api/users/byid?id=1', function (res) {
	  assert.equal(res.statusCode, 200);
	  assert.ok(res.body.indexOf ('Loire')>-1);
	})

	.get('/api/search?q=Zufaria', function (res) {
	  assert.equal(res.statusCode, 200);
	  assert.ok(res.body.indexOf ('Loire')>-1);
	})
