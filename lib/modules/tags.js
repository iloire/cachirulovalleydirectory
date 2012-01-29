var config = require("../../config.js")
var common = require("../common.js")
var module_users = require ('./users.js')

function $() { return Array.prototype.slice.call(arguments).join(':') }

function do_query (f, redis, params, callback){
	f (redis, params, function(err, users){
		var tags = common.get_unique_tags_by_users(users);
		callback(err, tags);
	});
}

exports.GetTagsByCat = function  (redis, params, callback){
	do_query (module_users.GetUsersByCat, redis, params, callback);
}

exports.GetTags = function  (redis, params, callback){
	do_query (module_users.GetUsers, redis, params, callback);
}
