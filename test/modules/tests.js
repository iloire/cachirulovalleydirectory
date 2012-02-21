var assert = require('assert')
var request = require('request')
var module_users = require ('../../lib/modules/users')
var module_tags = require ('../../lib/modules/tags')
var module_cats = require ('../../lib/modules/cats')
var config = require ('../../config').values
var redis 
var extra_dummy_users_for_each_cat 

function $() { return Array.prototype.slice.call(arguments).join(':')}

exports.setup = function (params){
	redis=params.redis;
}

function printCurrentTest() {
	console.log(arguments.callee.caller.name + " ..............................");
}

exports.tests = [
	function getUsersFromCat (callback){
		printCurrentTest();
		var params = {id_cat: 1, pagination: {pagesize : 100}}
		module_users.GetUsers(redis, params, function(err, users){
			assert.equal (users.length, 30)
			for (var i = 0;i<users.length;i++)
				assert.ok (users[i].id) //all users with id

			callback(null);
		})
	}
	,
	function getUser (callback){
		printCurrentTest();
		module_users.GetUser(redis, {id:81}, function(err, user){
			assert.ok (user.id) //user ok
			assert.ok (user.name) 
			assert.ok (user.bio)
			callback(null);
		})
	}	
	,
	function getInvalidUser (callback){
		printCurrentTest();
		module_users.GetUser(redis, {id:1181}, function(err, user){
			assert.ok(!user);
			callback(null);
		})
	}
	,
	function getTags (callback){
		printCurrentTest();
		module_tags.GetTags(redis, {}, function(err, tags){
			assert.equal(tags.length, 35)
			for (var i=0, l=tags.length;i<l;i++){
				assert.ok (tags[i].n > -1);
				
				if (tags[i].t=='.net')
					assert.equal (tags[i].n, 3)

				if (tags[i].t=='adsense')
					assert.equal (tags[i].n, 2)

				if (tags[i].t=='html5')
					assert.equal (tags[i].n, 4)

				if (tags[i].t=='node.js')
					assert.equal (tags[i].n, 3)
			}
			callback(null);
		})
	}
	,
	function getTagsByCat (callback){
		printCurrentTest();
		module_tags.GetTagsByCat(redis, {id:5}, function(err, tags){
			assert.ok(tags.length, 18)
			for (var i=0, l=tags.length;i<l;i++){
				if (tags[i].t=='redis')
					assert.equal (tags[i].n, 2)

				if (tags[i].t=='node.js')
					assert.equal (tags[i].n, 2)

				if (tags[i].t=='adsense')
					assert.equal (tags[i].n, 0)
			}
			callback(null);
		})
	}
	,
	function update_user (callback){
		printCurrentTest();
		module_users.GetUser(redis, {id:1}, function(err, user){
			user.tags = ['ios', 'adsense'];
			module_users.SetUsers(redis, {users:[user]}, function(err, users){
				callback(null);
			});
		})
	}
	,
	function getTagsByCatAfterUpdateUser (callback){
		printCurrentTest();
		module_tags.GetTagsByCat(redis, {id:5, fillempty: true}, function(err, tags){
			assert.ok(tags.length, 18)
			for (var i=0, l=tags.length;i<l;i++){
				if (tags[i].t=='redis')
					assert.equal (tags[i].n, 1)

				if (tags[i].t=='node.js')
					assert.equal (tags[i].n, 1)

				if (tags[i].t=='adsense')
					assert.equal (tags[i].n, 1)
			}
			callback(null);
		})
	}
	,
	function getTags (callback){
		printCurrentTest();
		module_tags.GetTags(redis, {}, function(err, tags){
			for (var i=0, l=tags.length;i<l;i++){
				assert.equal(tags.length, 33)

				if (tags[i].t=='adsense')
					assert.equal (tags[i].n, 3)
			}
			callback(null);
		})
	}
	,
	function getAllCats (callback){
		printCurrentTest();
		module_cats.GetCats(redis, {}, function(err, cats){
			assert.equal(cats.length, 7)
			for (var i=0, l=cats.length;i<l;i++){
				if (cats[i].name=='Programadores')
					assert.equal (cats[i].users_count, 30)
			}
			callback(null);
		})
	}
	,
	function getCatsWithScope (callback){
		printCurrentTest();
		var params = {tag:'node.js', scope : {region:10 }} 
		module_cats.GetCats(redis, params, function(err, cats){
			assert.equal(cats.length, 7)
			for (var i=0, l=cats.length;i<l;i++){
				if (cats[i].name=='Programadores')
					assert.equal (cats[i].users_count, 14)

				if (cats[i].name=='Diseñadores')
					assert.equal (cats[i].users_count, 10)

				if (cats[i].name=='SEO')
					assert.equal (cats[i].users_count, 10)
			}
			callback(null);
		})
	}
	,
	function TrimTags (callback){
		printCurrentTest();
		module_users.GetUser(redis, {id: 1}, function(err, user){
			var length = user.tags[0].length;
			user.tags[0] = " " + user.tags[0] + " ";
			module_users.SetUsers(redis, {users:[user]}, function (err, users){
				assert.equal (users[0].tags[0].length, length);
				callback(null);	
			})
		})
	}
	,
	function SearchBeforeDeleting (callback){
		module_users.Search(redis, {search:'redis'}, function(err, users){
			assert.equal (users[0].id, 1);
			assert.equal (users[1].id, 2);
			callback(null);
		})
	}	
	,
	function DeleteUser(callback){
		printCurrentTest();
		module_users.GetUser(redis, {id: 2}, function(err, user){
			var user_original = user;
			redis.sismember($(config.project_key, 'tag', 'ios', 'users'), user.id, function(err, exists){
				assert.equal (exists, 1)
				module_users.DeleteUser (redis, {id:2}, function(err){
					//check that user doesn't exist
					redis.sismember($(config.project_key, 'tag', 'ios', 'users'), user.id, function(err, exists){
						assert.equal (exists, 0)
						redis.sismember($(config.project_key, 'cat', '1', 'users'), user.id, function(err, exists){
							assert.equal (exists, 0);
							
							module_users.GetUser(redis, {id: 2}, function(err, user){
								assert.ok (!user);
								module_cats.GetCats(redis, {}, function(err, cats){
									assert.equal(cats.length, 7)
									for (var i=0, l=cats.length;i<l;i++){
										if (cats[i].name=='Programadores')
											assert.equal (cats[i].users_count, 29)
									}

									module_tags.GetTags(redis, {}, function(err, tags){
										for (var i=0, l=tags.length;i<l;i++){
											if (tags[i].t=='redis')
												assert.equal (tags[i].n, 1)
										}
										module_users.SetUsers(redis, {users:[user_original]}, function (err, users){
											assert.equal(users[0].id, 153);
											callback(null);	
										})
									})
								})
							})
						})
					});
				});
				
			})
		})
	}
	,
	function Search (callback){
		module_users.Search(redis, {search:'redis node'}, function(err, users){
			assert.equal (users[0].id, 1);
			assert.equal (users.length, 2);
			var found_new_user=false
			for (var i=0;i<users.length;i++){
				assert.ok(users[i].id!=2); //user 2 has been deleted
				
				if (users[i].id==153)
					found_new_user=true;
			}
			assert.ok(found_new_user);
			callback(null);
		})
	}
	,
	function SearchWithAccent (callback){
		module_users.Search(redis, {search:'rèdís nodé'}, function(err, users){
			assert.equal (users[0].id, 1);
			assert.equal (users.length, 2);
			var found_new_user=false
			for (var i=0;i<users.length;i++){
				assert.ok(users[i].id!=2);
				
				if (users[i].id==153)
					found_new_user=true;
			}
			assert.ok(found_new_user);
			callback(null);
		})
	}
	,
	function SearchPagination (callback){
		module_users.Search(redis, {search:'javascript'}, function(err, users){
			assert.equal (users.length, 140); //no pagination
			module_users.Search(redis, {pagination:{from: 0}, search:'javascript'}, function(err, users){
				assert.equal (users[0].id, 13);
				assert.equal (users.length, 15);
				module_users.Search(redis, {pagination:{from: 1}, search:'javascript'}, function(err, users){
					assert.equal (users[0].id, 28);
					assert.equal (users.length, 15);
					callback(null);
				})
			})
		})
	}
	,	
	function FavUser(callback){
		printCurrentTest();
		var new_user_id = 153
		module_users.GetUser(redis, {id: new_user_id}, function(err, user){
			var user_original = user;
			assert.ok(user);
			assert.ok (!user.favorite);
			var params = {user: {id:1 }, userfav :{id:new_user_id}}
			module_users.FavUser(redis, params, function (err, user){
				assert.ok (!user)
				assert.ok (err);  //bad params (missing favstatus)
				var params = {user: {id:1 }, userfav :{id:new_user_id}, favstatus:1}
				module_users.FavUser(redis, params, function (err, user){
					assert.ok (user.favorite)
					assert.ok (!err);
					params.logged_user = params.user
					params.id = new_user_id
					module_users.GetUser(redis, params, function(err, user){
						assert.equal (user.favorite, 1);
						callback(null);
					});
				});
			})
		})
	}
	
]
