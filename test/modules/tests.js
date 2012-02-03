var assert = require('assert')
var request = require('request')
var module_users = require ('../../lib/modules/users')

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
