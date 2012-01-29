var config = require("../../config.js")
var common = require("../common.js")
var module_users = require ('./users.js')

function $() { return Array.prototype.slice.call(arguments).join(':') }

var cache_expiration_secs = 1

function do_query (cache_key, f, redis, params, callback){
	redis.get(cache_key, function(err, tags){
		if (tags){
			callback (err, JSON.parse(tags))
		}else{
			f (redis,params, function(err, users){
				var tags = common.get_unique_tags_by_users(users);
				redis.setex (cache_key, cache_expiration_secs, JSON.stringify(tags), function(err, data){ //save to cache
					callback (err, tags);
				})
			});
		}
	})	
}

exports.GetTagsByCat = function  (redis, params, callback){
	var cache_key = $(config.values.project_key, 'tagsbycat', params.id);
	do_query (cache_key, module_users.GetUsersByCat, redis, params, callback);
}

exports.GetTags = function  (redis, params, callback){
	var cache_key = $(config.values.project_key, 'tags', params.id);
	do_query (cache_key, module_users.GetUsers, redis, params, callback);
}
