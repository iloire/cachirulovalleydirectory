var config = require("../../config.js")
var module_users = require ('./users.js')

function $() { return Array.prototype.slice.call(arguments).join(':') }

var cache_expiration_secs = 10

function get_unique_tags_by_users(users){
	var tags = []
	for(u=0;u<users.length;u++){
		for (t=0;t<users[u].tags.length;t++){ 
			var found=false;
			for (i=0;i<tags.length;i++){
				if (tags[i].toLowerCase()==users[u].tags[t].toLowerCase())
					found=true;
			}

			if (!found)
				tags.push (users[u].tags[t].toLowerCase());
		}
	}
	return tags;
}

exports.GetTagsByCat = function  (redis, params, callback){
	
	//todo: show tags with a minimum number of occurrences
	
	var cache_key = $(config.values.project_key, 'tagsbycat', params.id);
	redis.get(cache_key, function(err, tags){
		if (tags){
			callback (err, JSON.parse(tags))
		}else{
			module_users.GetUsersByCat (redis,params, function(err, users){
				var tags = get_unique_tags_by_users(users);				
				redis.setex (cache_key, cache_expiration_secs, JSON.stringify(tags), function(err, data){ //save to cache
					console.log (err)
				})
				callback (null, tags);
			});
		}
	})
}

exports.GetTags = function  (redis, params, callback){
	
	//todo: show tags with a minimum number of occurrences
	//todo: always show suggested tabs (from config)
		
	var cache_key = $(config.values.project_key, 'tags');
	redis.get(cache_key, function(err, tags){
		if (tags){
			callback (err, JSON.parse(tags))
		}else{
			module_users.GetUsers (redis, params, function(err, users){
				var tags = get_unique_tags_by_users(users);
				redis.setex (cache_key, cache_expiration_secs, JSON.stringify(tags), function(err, data){ //save to cache
					console.log (err)
				})				
				callback (null, tags);
			});
		}
	});
}
