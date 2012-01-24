var testosterone = require('testosterone')({port: 3000, sync: false})
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
	//cats
	.get('/api/cats', function (res) {
		assert.equal(res.statusCode, 200);
		assert.ok(res.body.indexOf ('{"cats":')>-1);
	})

	//cats jsonp
	.get('/api/cats?callback=test', function (res) {
		assert.equal(res.statusCode, 200);
		assert.ok(res.body.indexOf ('test({"cats":')>-1);
	})

	//tags
	.get('/api/tags', function (res) {
		assert.equal(res.statusCode, 200);
		assert.ok(res.body.indexOf ('{"tags":')>-1);
	})

	//tags jsonp
	.get('/api/tags?callback=test', function (res) {
		assert.equal(res.statusCode, 200);
		assert.ok(res.body.indexOf ('test({"tags":')>-1);
	})

	//tags autocomplete
	.get('/api/tagsautocomplete', function (res) {
		assert.equal(res.statusCode, 200);
		assert.ok(res.body.indexOf ('c#')>-1);
	})

	//users by cat
	.get('/api/users/bycat?id=1', function (res) {
		assert.equal(res.statusCode, 200);
		assert.ok(res.body.indexOf ('Loire')>-1);
		assert.ok(res.body.indexOf('email')==-1); //make sure email is not returned for public calls
	})
	
	//users by cat jsonp
	.get('/api/users/bycat?id=1&callback=test', function (res) {
		assert.equal(res.statusCode, 200);
		assert.ok(res.body.indexOf ('test({"users":[')>-1);
		assert.ok(res.body.indexOf ('Loire')>-1);
	})
	
	//users by tag
	.get('/api/users/bytag?id=node.js', function (res) {
		assert.equal(res.statusCode, 200);
		assert.ok(res.body.indexOf ('Loire')>-1);
		assert.ok(res.body.indexOf('email')==-1); //make sure email is not returned for public calls
	})

	//users by tag jsonp
	.get('/api/users/bytag?id=node.js&callback=test', function (res) {
		assert.equal(res.statusCode, 200);
		assert.ok(res.body.indexOf ('test({"users":[')>-1);	
		assert.ok(res.body.indexOf ('Loire')>-1);
		assert.ok(res.body.indexOf('email')==-1); //make sure email is not returned for public calls
	})

	//user by id
	.get('/api/users/byid?id=1', function (res) {
		assert.equal(res.statusCode, 200);
		assert.ok(res.body.indexOf ('Loire')>-1);
		assert.ok(res.body.indexOf('email')==-1); //make sure email is not returned for public calls
	})
	
	//user by id jsonp
	.get('/api/users/byid?id=1&callback=test', function (res) {
		assert.equal(res.statusCode, 200);
		assert.ok(res.body.indexOf ('test({"user":')>-1);
		assert.ok(res.body.indexOf ('Loire')>-1);
	})

	//api search
	.get('/api/search?q=Zufaria', function (res) {
	  assert.equal(res.statusCode, 200);
	  assert.ok(res.body.indexOf ('Loire')>-1);
	})

	//web search
	.get('/search?q=gogogo', function (res) {
	  assert.equal(res.statusCode, 302);
	  assert.ok(res.headers.location.indexOf('#/search/gogogo') > -1, res.headers.location);	
	})
    
     //web search with spaces
	.get('/search?q=rails%20ruby', function (res) {
	  assert.equal(res.statusCode, 302);
	  assert.ok(res.headers.location.indexOf('#/search/rails%20ruby') > -1, res.headers.location);	
	})
