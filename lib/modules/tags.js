var config = require("../../config.js")
var module_users = require ('./users.js')

function $() { return Array.prototype.slice.call(arguments).join(':') }

var cache_expiration_secs = 10

function get_unique_tags_by_users(users){
	var tags = []
	for(var u=0,l=users.length; u<l; u++){
		for (var t=0, tl=users[u].tags.length;t<tl; t++){ 
			var found=false;
			for (var i=0,il=tags.length;i<il; i++){
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
					if (err)
						console.log ('error saving tags by cat to cache... ' + err)
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
					if (err)
						console.log ('error saving tags to cache... ' + err)
				})				
				callback (null, tags);
			});
		}
	});
}
