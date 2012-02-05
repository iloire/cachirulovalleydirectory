var assert = require('assert')
var request = require('request')
var module_users = require ('../../lib/modules/users')
var module_tags = require ('../../lib/modules/tags')

var redis 
var extra_dummy_users_for_each_cat 

exports.setup = function (params){
	redis=params.redis;
}

exports.tests = [
	function getUsers (callback){
		module_users.GetUsers(redis, {}, function(err, users){
			assert.equal (users.length,82)
			for (var i = 0;i<users.length;i++){
				assert.ok (users[i].id) //all users with id
			}
			callback(null);
		})
	}
	,
	function getUser (callback){
		module_users.GetUser(redis, {id:81}, function(err, user){
			assert.ok (user.id) //user ok
			assert.ok (user.name) 
			assert.ok (user.bio)
			callback(null);
		})
	}	
	,
	function getInvalidUser (callback){
		module_users.GetUser(redis, {id:1181}, function(err, user){
			assert.ok(!user)
			callback(null);
		})
	}
	,
	function getTags (callback){
		module_tags.GetTags(redis, {}, function(err, tags){
			assert.ok(tags.length, 35)
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
		module_tags.GetTagsByCat(redis, {id:5}, function(err, tags){
			assert.ok(tags.length, 18)
			for (var i=0, l=tags.length;i<l;i++){
				if (tags[i].t=='redis')
					assert.equal (tags[i].n, 2)

				if (tags[i].t=='node.js')
					assert.equal (tags[i].n, 2)
			}
			callback(null);
		})
	}
	
	/*
	,
	function Search (callback){
		module_users.Search(redis, {q:'redis'}, function(err, users){
			assert.equal (users.length, 3, JSON.stringify(users));
			callback(null);
		})
	}	
	,
	*/
]
