var assert = require('assert')
var request = require('request')

var base_address = 'http://localhost:3434';

var mocked_user = {
	linkedin_id: '555554',  //let's make up a user that doesn't exist
	name : 'mocked profile ' + new Date().getTime(), 
	bio: 'im a mock object',
	email : 'mocked@object.com',
	web: 'mywebsite.com',
	twitter : 'mytwitteraccount',
	region : 2,
	location : 'my city, my state',
	other_data : {},
	portfolio : []
};

exports.setup = function (app){
	app.get('/injectsession', function(req, res){
		req.session.user = mocked_user;
		res.end('session mocked');
	});
}

exports.tests = [
	function go_root (callback){
		request.get({url: base_address + '/'}, function (err, res, body) {
			assert.ok(!err)
			assert.equal(res.statusCode, 200)
			callback(null);
		})
	}
	,
	function directory (callback){
		request(base_address + '/directory', function (err,res,body) {
			assert.equal(res.statusCode, 200)
			callback(null);
		})
	}
	,
	function cats (callback){
		request(base_address + '/api/cats', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json;charset=utf8');
			assert.equal(res.statusCode, 200)
			assert.ok(body.indexOf ('{"cats":')>-1);
			callback(null);
		})
	}
	,
	function cats_jsop (callback){
		request(base_address + '/api/cats?callback=test', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/javascript;charset=utf8');
			assert.equal(res.statusCode, 200)
			assert.ok(body.indexOf ('test({"cats":')>-1);
			callback(null);
		});
	}
	,
	function tags (callback){
		request(base_address + '/api/tags', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json;charset=utf8');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('{"tags":')>-1);
			assert.equal(JSON.parse(body).tags.length,25)
			callback(null);
		});
	}	
	,
	function tags_sorted (callback){
		request(base_address + '/api/tags?sort=name', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json;charset=utf8');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('{"tags":')>-1);
			var tags = JSON.parse(body).tags;
			assert.equal(tags.length,25)
			assert.equal(tags[1],'adsense');
			assert.equal(tags[2],'android');
			callback(null);
		});
	}	
	,
	function tags_jsonp (callback){
		request(base_address + '/api/tags?callback=test', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/javascript;charset=utf8');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('test({"tags":')>-1);
			callback(null);
		});
	}
	,
	function tags_autocomplete (callback){
		request(base_address + '/api/tagsautocomplete', function (err,res,body) {
			assert.equal (res.headers['content-type'],'text/html; charset=utf-8');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('html5')>-1);
			callback(null);
		});
	}
	,
	function users_by_cat (callback){
		request(base_address + '/api/users/bycat?id=1', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json;charset=utf8');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('Loire')>-1);
			assert.ok(body.indexOf('email')==-1); //make sure email is not returned for public calls
			assert.equal(JSON.parse(body).users.length, 20);
			assert.equal(JSON.parse(body).cat.id, 1);
			assert.equal(JSON.parse(body).cat.name, 'Programadores');
			callback(null);
		});
	}
	,
	function users_by_cat_sorted_by_name_asc (callback){
		request(base_address + '/api/users/bycat?id=1&sort=name', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json;charset=utf8');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('Loire')>-1);
			assert.ok(body.indexOf('email')==-1); //make sure email is not returned for public calls
			var users=JSON.parse(body).users;
			assert.equal(users.length, 20);
			assert.ok (users[0].name <= users[1].name);
			assert.ok (users[2].name <= users[3].name);
			assert.ok (users[10].name <= users[11].name);
			assert.equal(JSON.parse(body).cat.id, 1);
			assert.equal(JSON.parse(body).cat.name, 'Programadores');
			callback(null);
		});
	}
	,
	function users_by_cat_sorted_by_name_desc (callback){
		request(base_address + '/api/users/bycat?id=1&sort=name_', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json;charset=utf8');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('Loire')>-1);
			assert.ok(body.indexOf('email')==-1); //make sure email is not returned for public calls
			var users=JSON.parse(body).users;
			assert.equal(users.length, 20);
			assert.ok (users[0].name >= users[1].name);
			assert.ok (users[2].name >= users[3].name);
			assert.ok (users[10].name >= users[11].name);
			assert.equal(JSON.parse(body).cat.id, 1);
			assert.equal(JSON.parse(body).cat.name, 'Programadores');
			callback(null);
		});
	}
	,
	function users_by_cat_sorted_by_votes (callback){
		request(base_address + '/api/users/bycat?id=1&sort=votes_', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json;charset=utf8');
			assert.equal(res.statusCode, 200);
			var users=JSON.parse(body).users;
			assert.equal(users.length, 20);
			assert.ok (users[0].name =="Fernando Val"); //TODO: rebuild database with votes
			assert.equal(JSON.parse(body).cat.id, 1);
			assert.equal(JSON.parse(body).cat.name, 'Programadores');
			callback(null);
		});
	}
	,
	function users_by_cat_jsonp (callback){
		request(base_address + '/api/users/bycat?id=1&callback=test', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/javascript;charset=utf8');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('test({"users":[')>-1);
			assert.ok(body.indexOf ('Loire')>-1);
			assert.ok(body.indexOf ('"cat":{"id":"1","name":"Programadores"')>-1);
			callback(null);
		});
	}
	,
	function users_by_tag (callback){
		request(base_address + '/api/users/bytag?id=node.js', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json;charset=utf8');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('Loire')>-1);
			assert.ok(body.indexOf('email')==-1); //make sure email is not returned for public calls
			assert.equal(JSON.parse(body).users.length, 3);
			callback(null);
		});
	}	
	,
	function users_by_tag_jsonp (callback){
		request(base_address + '/api/users/bytag?id=node.js&callback=tagcall', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/javascript;charset=utf8');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('Loire')>-1);
			assert.equal(body.indexOf('email'),-1); //make sure email is not returned for public calls
			assert.equal(body.indexOf('tagcall({"users":[{'),0)
			callback(null);
		});
	}
	,
	function users_by_id (callback){
		request(base_address + '/api/users/byid?id=1', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json;charset=utf8');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf('email')==-1); //make sure email is not returned for public calls
			var user = JSON.parse(body).user;
			assert.ok(user.name.indexOf('Loire')>-1);
			callback(null);
		});
	}
	,
	function users_by_id_jsonp (callback){
		request(base_address + '/api/users/byid?id=1&callback=test', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/javascript;charset=utf8');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('test({"user":{')>-1);
			assert.ok(body.indexOf ('Loire')>-1);
			assert.ok(body.indexOf('email')==-1); //make sure email is not returned for public calls
			callback(null);
		});
	}	
	,
	function api_search (callback){
		request(base_address + '/api/search?q=Zufaria', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json;charset=utf8');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('Loire')>-1);
			callback(null);
		});
	}
	,
	function web_search (callback){
		request({url: base_address + '/search?q=gogogo', followRedirect:false}, function (err,res,body) {
			assert.equal (res.headers['content-type'],'text/html');
			assert.equal(res.statusCode, 302);
			assert.ok(res.headers.location.indexOf('#/search/gogogo') > -1, res.headers.location);	
			callback(null);
		});
	}
	,
	function web_search_with_spaces (callback){
		request({url: base_address + '/search?q=rails%20ruby', followRedirect:false}, function (err,res,body) {
			assert.equal (res.headers['content-type'],'text/html');
			assert.equal(res.statusCode, 302);
			assert.ok(res.headers.location.indexOf('#/search/rails%20ruby') > -1, res.headers.location);	
			callback(null);
		});
	}
	,
	function vote_denied_if_not_logged (callback){
		request.post({url: base_address + '/vote', data:{}}, function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json;charset=utf8');
			assert.equal(res.statusCode, 403);
			callback(null);
		});
	}
	,
	function vote_with_session_missing_parameters (callback){
		request.get({url: base_address + '/injectsession'}, function (err,res,body) {
			request.post({url: base_address + '/vote', json:true, body: {}}, function (err,res,body) {
				assert.equal (res.headers['content-type'],'application/json;charset=utf8');
				assert.equal(res.statusCode, 503, JSON.stringify(body)); //missing parameter
				callback(null);
			});
		});	
	}	
	,
	function vote_with_session_ok (callback){
		var user_to_vote = 2;
		request.get({url: base_address + '/injectsession'}, function (err,res,body) {
			request(base_address + '/api/users/byid?id=' + user_to_vote, function (err,res,body) {
				assert.equal (res.headers['content-type'],'application/json;charset=utf8');				
				assert.ok (res.statusCode, 200);
				var user = JSON.parse(body).user;
				request.post({url: base_address + '/vote', json:true, body: {vote:-1, user_voted_id:user_to_vote}}, function (err,res,body) {
					assert.equal (res.headers['content-type'],'application/json;charset=utf8');
					assert.equal(res.statusCode, 200, JSON.stringify(body)); 
					assert.ok (body.user);
					var votes = body.user.votes;
					request.post({url: base_address + '/vote', json:true, body: {vote:1, user_voted_id:user_to_vote}}, function (err,res,body) {
						assert.equal (res.headers['content-type'],'application/json;charset=utf8');						
						assert.equal (body.user.votes,(votes+1), JSON.stringify(body));
						//if voted again, votes counter should remain the same
						request.post({url: base_address + '/vote', json:true, body: {vote:1, user_voted_id:user_to_vote}}, function (err,res,body) {						
							assert.equal (body.user.votes,(votes+1), JSON.stringify(body));
							callback(null);
						});
					});
				});
			});
		});	
	}	
	
]
