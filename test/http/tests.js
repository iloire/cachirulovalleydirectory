var assert = require('assert')
var request = require('request')

var base_address = 'http://localhost:3434';

function printCurrentTest() {
	console.log(arguments.callee.caller.name + " ..............................");
}

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

exports.setup = function (params){
	params.app.get('/injectsession', function(req, res){
		req.session.user = mocked_user;
		if (req.query['id'])
			req.session.user.id = req.query['id'];
		
		res.end('session mocked');
	});
}

exports.tests = [
	function go_root (callback){
		printCurrentTest();
		request.get({url: base_address + '/'}, function (err, res, body) {
			assert.ok(!err)
			assert.equal(res.statusCode, 200)
			callback(null);
		})
	}
	,
	function directory (callback){
		printCurrentTest();
		request(base_address + '/directory', function (err,res,body) {
			assert.equal(res.statusCode, 200)
			callback(null);
		})
	}
	,
	function cats (callback){
		printCurrentTest();
		request(base_address + '/api/cats', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json');
			assert.equal(res.statusCode, 200)
			var cats = JSON.parse(body).cats
			assert.equal (cats.length, 7);
			assert.equal (cats[0].users_count, 30);
			assert.ok(body.indexOf ('{"cats":')>-1);
			callback(null);
		})
	}
	,
	function cats_jsop (callback){
		printCurrentTest();
		request(base_address + '/api/cats?callback=test', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/javascript');
			assert.equal(res.statusCode, 200)
			assert.ok(body.indexOf ('test({"cats":')>-1);
			callback(null);
		});
	}
	,
	function tags (callback){
		printCurrentTest();
		request(base_address + '/api/tags', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json');
			assert.equal(res.statusCode, 200);
			var tags = JSON.parse (body).tags;
			assert.ok(body.indexOf ('{"tags":')>-1);
			assert.equal(tags.length, 33)
			callback(null);
		});
	}	
	,
	function tags_sorted (callback){
		printCurrentTest();
		request(base_address + '/api/tags?sort=name', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('{"tags":')>-1);
			var tags = JSON.parse(body).tags;
			assert.equal(tags.length, 33)
			assert.equal(tags[1].t,'adsense');
			assert.equal(tags[1].n, 3);
			assert.equal(tags[2].t,'android');
			assert.equal(tags[2].n, 1);
			callback(null);
		});
	}	
	,
	function tags_jsonp (callback){
		printCurrentTest();
		request(base_address + '/api/tags?callback=test', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/javascript');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('test({"tags":')>-1);
			callback(null);
		});
	}
	,
	function tags_autocomplete (callback){
		printCurrentTest();
		request(base_address + '/api/tagsautocomplete', function (err,res,body) {
			assert.equal (res.headers['content-type'],'text/html; charset=utf-8');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('html5')>-1);
			callback(null);
		});
	}
	,
	function users_by_cat_from (callback){
		printCurrentTest();
		request(base_address + '/api/users?id_cat=1&from=0&page=30', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('Loire')>-1);
			var users = JSON.parse(body).users;
			assert.equal (users.length, 30);
			callback(null);
		});
	}
	,
	function email_is_not_public (callback){
		printCurrentTest();
		request(base_address + '/api/users?id_cat=1&from=0&page=100', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf('email')==-1); //make sure email is not returned for public calls
			callback(null);
		});
	}
	,
	function users_by_cat (callback){
		printCurrentTest();
		request(base_address + '/api/users?id_cat=1&page=11', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json');
			assert.equal(res.statusCode, 200);

			var users = JSON.parse(body).users;
			var tags = JSON.parse(body).tags;
			
			assert.equal(users.length, 11);
			
			for (var i=0, l=users.length;i<l;i++){
				assert.ok (users[i].region_display);
			}
			for (var t=0, l=tags.length;t<l;t++){
				if (tags[t].t == '.net')
					assert.equal (tags[t].n, 2);

				if (tags[t].t == 'node.js')
					assert.equal (tags[t].n, 2);

				if (tags[t].t == 'ios')
					assert.equal (tags[t].n, 5);
			}
			assert.equal(JSON.parse(body).cat.id, 1);
			assert.equal(JSON.parse(body).cat.name, 'Programadores');
			
			var pagination = JSON.parse(body).pagination;
			assert.equal (pagination.pagesize, 11);
			assert.equal (pagination.from, 0)
			assert.equal (pagination.total, 3)
			assert.equal (pagination.total_records, 30)
			
			callback(null);
		});
	}
	,
	function users_by_cat_sorted_by_name_asc (callback){
		printCurrentTest();
		request(base_address + '/api/users?id_cat=1&sort=name&page=30', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('Loire')>-1);
			assert.ok(body.indexOf('email')==-1); //make sure email is not returned for public calls
			var users=JSON.parse(body).users;
			assert.equal(users.length, 30);
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
		printCurrentTest();
		request(base_address + '/api/users?id_cat=1&sort=name_&page=30', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('Loire')>-1);
			assert.ok(body.indexOf('email')==-1); //make sure email is not returned for public calls
			var users=JSON.parse(body).users;
			assert.equal(users.length, 30);
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
		printCurrentTest();
		request(base_address + '/api/users?id_cat=1&sort=votes_', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json');
			assert.equal(res.statusCode, 200);
			var users=JSON.parse(body).users;
			assert.equal(users.length, 15);
			assert.equal (users[0].name, "Fernando Val", JSON.stringify(users[0])); //TODO: rebuild database with votes
			assert.equal(JSON.parse(body).cat.id, 1);
			assert.equal(JSON.parse(body).cat.name, 'Programadores');
			callback(null);
		});
	}
	,
	function users_by_cat_jsonp (callback){
		printCurrentTest();
		request(base_address + '/api/users?id_cat=1&page=20&callback=test', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/javascript');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('test({"users":[')>-1);
			assert.ok(body.indexOf ('Loire')>-1);
			assert.ok(body.indexOf ('"cat":{"id":"1","name":"Programadores"')>-1);
			callback(null);
		});
	}
	,
	function users_by_cat_paged_from (callback){
		printCurrentTest();
		request(base_address + '/api/users?id_cat=1&from=1', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json');
			assert.equal(res.statusCode, 200);
			var users=JSON.parse(body).users;
			assert.equal(users.length, 15);
			assert.equal(JSON.parse(body).cat.id, 1);
			assert.equal(JSON.parse(body).pagination.from, 1);
			assert.equal(JSON.parse(body).pagination.total, 2);
			assert.equal(JSON.parse(body).cat.name, 'Programadores');
			callback(null);
		});
	}
	,
	function users_by_cat_paged_from_page (callback){
		printCurrentTest();
		request(base_address + '/api/users?id_cat=1&from=0&page=8', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json');
			assert.equal(res.statusCode, 200);
			var users=JSON.parse(body).users;
			assert.equal(users.length, 8);
			assert.equal(JSON.parse(body).cat.id, 1);
			assert.equal(JSON.parse(body).pagination.from, 0);
			assert.equal(JSON.parse(body).pagination.total, 4);
			assert.equal(JSON.parse(body).pagination.total_records, 30);
			assert.equal(JSON.parse(body).cat.name, 'Programadores');
			callback(null);
		});
	}
	,
	function users_by_cat_paged_from_page_bigger (callback){
		printCurrentTest();
		request(base_address + '/api/users?id_cat=1&from=0&page=20', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json');
			assert.equal(res.statusCode, 200);
			var users=JSON.parse(body).users;
			assert.equal(users.length, 20);
			assert.equal(JSON.parse(body).cat.id, 1);
			assert.equal(JSON.parse(body).pagination.from, 0);
			assert.equal(JSON.parse(body).pagination.total, 2);
			assert.equal(JSON.parse(body).cat.name, 'Programadores');
			callback(null);
		});
	}
	,
	function users_by_tag (callback){
		printCurrentTest();
		request(base_address + '/api/users?id_cat=1&tag=ios', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('Loire')>-1);
			assert.ok(body.indexOf('email')==-1); //make sure email is not returned for public calls
			assert.equal(JSON.parse(body).users.length, 5);
			callback(null);
		});
	}	
	,
	function users_by_region_and_cat (callback){
		printCurrentTest();
		request(base_address + '/api/users?id_cat=1&' + encodeURIComponent('scope[region]') + '=10', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json');
			assert.equal(res.statusCode, 200);
			var users=JSON.parse(body).users;
			assert.equal (users.length,14)
			callback(null);
		});
	}
	,
	function users_by_tag_jsonp (callback){
		printCurrentTest();
		request(base_address + '/api/users?id_cat=1&tag=ios&callback=tagcall', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/javascript');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('Loire')>-1);
			assert.equal(body.indexOf('email'),-1); //make sure email is not returned for public calls
			assert.equal(body.indexOf('tagcall({"users":[{'),0)
			callback(null);
		});
	}
	,
	function users_by_id (callback){
		printCurrentTest();
		request(base_address + '/api/users/byid?id=1', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf('email')==-1); //make sure email is not returned for public calls
			var user = JSON.parse(body).user;
			assert.ok (user.tags)
			assert.ok (user.tags.length>0);
			assert.ok (user.cats.length>0);
			assert.ok(user.name.indexOf('Loire')>-1);
			callback(null);
		});
	}
	,
	function users_by_wrong_id (callback){
		printCurrentTest();
		request(base_address + '/api/users/byid?id=12323233sd', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json');
			assert.equal(res.statusCode, 200);
			var user = JSON.parse(body).user;
			assert.ok (!user)
			callback(null);
		});
	}
	,
	function users_by_id_jsonp (callback){
		printCurrentTest();
		request(base_address + '/api/users/byid?id=1&callback=test', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/javascript');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('test({"user":{')>-1);
			assert.ok(body.indexOf ('Loire')>-1);
			assert.ok(body.indexOf('email')==-1); //make sure email is not returned for public calls
			callback(null);
		});
	}	
	,
	function api_search (callback){
		printCurrentTest();
		request(base_address + '/api/search?search=Zufaria', function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json');
			assert.equal(res.statusCode, 200);
			assert.ok(body.indexOf ('Loire')>-1);
			callback(null);
		});
	}
	,
	function web_search (callback){
		printCurrentTest();
		request({url: base_address + '/search?q=gogogo', followRedirect:false}, function (err,res,body) {
			assert.equal (res.headers['content-type'],'text/html');
			assert.equal(res.statusCode, 302);
			assert.ok(res.headers.location.indexOf('#/search/gogogo') > -1, res.headers.location);	
			callback(null);
		});
	}
	,
	function web_search_with_spaces (callback){
		printCurrentTest();
		request({url: base_address + '/search?q=rails%20ruby', followRedirect:false}, function (err,res,body) {
			assert.equal (res.headers['content-type'],'text/html');
			assert.equal(res.statusCode, 302);
			assert.ok(res.headers.location.indexOf('#/search/rails%20ruby') > -1, res.headers.location);	
			callback(null);
		});
	}
	,
	function vote_denied_if_not_logged (callback){
		printCurrentTest();
		request.post({url: base_address + '/vote', data:{}}, function (err,res,body) {
			assert.equal (res.headers['content-type'],'application/json');
			assert.equal(res.statusCode, 403);
			callback(null);
		});
	}
	,
	function vote_with_session_missing_parameters (callback){
		printCurrentTest();
		request.get({url: base_address + '/injectsession'}, function (err,res,body) {
			request.post({url: base_address + '/vote', json:true, body: {}}, function (err,res,body) {
				assert.equal (res.headers['content-type'],'application/json');
				assert.equal(res.statusCode, 503, JSON.stringify(body)); //missing parameter
				callback(null);
			});
		});	
	}	
	,
	function edit_other_profile_fails (callback){
		printCurrentTest();
		request.get({url: base_address + '/editprofile?id=45'}, function (err,res,body) {
			assert.equal (res.headers['content-type'],'text/plain');
			assert.equal(res.statusCode, 403); 
			callback(null);
		});	
	}
	,	
	function load_user_page_directly (callback){
		printCurrentTest();
		request.get({url: base_address + '/user/45', followRedirect:false}, function (err,res,body) {
			assert.equal(res.statusCode, 302); 
			assert.equal(res.headers.location, base_address + '/directory#/user/45'); 
			callback(null);
		});	
	}
	,	
	function load_user_page_directly_with_name (callback){
		printCurrentTest();
		request.get({url: base_address + '/user/45/randomtext', followRedirect:false}, function (err,res,body) {
			assert.equal(res.statusCode, 302); 
			assert.equal(res.headers.location, base_address + '/directory#/user/45/randomtext'); 
			callback(null);
		});	
	}
	,	
	function load_user_page_directly_directory (callback){
		printCurrentTest();
		request.get({url: base_address + '/directory/user/45', followRedirect:false}, function (err,res,body) {
			assert.equal(res.statusCode, 302); 
			assert.equal(res.headers.location, base_address + '/directory#/user/45'); 
			callback(null);
		});	
	}
	,	
	function load_user_page_directly_with_name_directory (callback){
		printCurrentTest();
		request.get({url: base_address + '/directory/user/45/randomtext', followRedirect:false}, function (err,res,body) {
			assert.equal(res.statusCode, 302); 
			assert.equal(res.headers.location, base_address + '/directory#/user/45/randomtext'); 
			callback(null);
		});	
	}
	,	
	function load_categories_page_directly (callback){
		printCurrentTest();
		request.get({url: base_address + '/directory/categories/1/randomname', followRedirect:false}, function (err,res,body) {
			assert.equal(res.statusCode, 302); 
			assert.equal(res.headers.location, base_address + '/directory#/categories/1/randomname'); 
			callback(null);
		});	
	}
	,	
	function load_categories_page_with_tag_directly (callback){
		printCurrentTest();
		request.get({url: base_address + '/directory/categories/1/randomname/tag/atag', followRedirect:false}, function (err,res,body) {
			assert.equal(res.statusCode, 302); 
			assert.equal(res.headers.location, base_address + '/directory#/categories/1/randomname/tag/atag'); 
			callback(null);
		});	
	}
	,	
	function vote_with_session_ok (callback){
		printCurrentTest();
		var user_to_vote = 3;
		request.get({url: base_address + '/injectsession?id=1'}, function (err,res,body) {
			request(base_address + '/api/users/byid?id=' + user_to_vote, function (err,res,body) {
				assert.equal (res.headers['content-type'],'application/json');
				assert.ok (res.statusCode, 200);
				var user = JSON.parse(body).user;
				assert.equal(user.votes, 0)
				request.post({url: base_address + '/vote', json:true, body: {vote:-1, user_voted_id:user_to_vote}}, function (err,res,body) {
					assert.equal (res.headers['content-type'],'application/json');
					assert.equal(res.statusCode, 200, JSON.stringify(body)); 
					assert.ok(body.user);
					assert.equal(body.user.votes, 0)
					assert.ok(!body.user.voted)
					assert.equal (body.voted, -1);
					var votes = body.user.votes;
					request.post({url: base_address + '/vote', json:true, body: {vote:1, user_voted_id:user_to_vote}}, function (err,res,body) {
						assert.equal (res.headers['content-type'],'application/json');
						assert.equal (body.user.votes,(votes+1), JSON.stringify(body));
						assert.equal(body.user.votes, 1)
						assert.equal (body.voted, 1);
						assert.ok (body.user.voted)
						//if voted again, votes counter should remain the same
						request.post({url: base_address + '/vote', json:true, body: {vote:1, user_voted_id:user_to_vote}}, function (err,res,body) {						
							assert.ok(body.user.voted)
							assert.equal (body.user.votes, 1, JSON.stringify(body));
							request.post({url: base_address + '/vote', json:true, body: {vote:-1, user_voted_id:user_to_vote}}, function (err,res,body) {						
								assert.ok(!body.user.voted)
								assert.equal (body.user.votes, 0, JSON.stringify(body));
								callback(null);
							});
						});
					});
				});
			});
		});	
	}	
	,
	function cant_vote_to_myself (callback){
		printCurrentTest();
		var user_to_vote = 1;
		request.get({url: base_address + '/injectsession?id=1'}, function (err,res,body) {
			request(base_address + '/api/users/byid?id=' + user_to_vote, function (err,res,body) {
				assert.equal (res.headers['content-type'],'application/json');
				assert.ok (res.statusCode, 200);
				var user = JSON.parse(body).user;
				assert.equal (user.votes, 0);
				request.post({url: base_address + '/vote', json:true, body: {vote:1, user_voted_id:user_to_vote}}, function (err,res,body) {
					assert.equal (res.headers['content-type'],'application/json');
					assert.equal(res.statusCode, 503, JSON.stringify(body));
					assert.ok (body.error) //can't vote to yourself
					callback(null);
				});
			});
		});	
	}	
	
]
