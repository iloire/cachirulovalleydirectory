var config = require("../../config.js")

function $() { return Array.prototype.slice.call(arguments).join(':') }

exports.AddTags = function  (redis, params, callback){
	var multi = redis.multi();
	
	for (i=0;i<params.tags.length;i++){
		multi.rpush($(config.values.project_key, 'tags'),params.tags[i]);
	}
	
	multi.exec(function(err, response){
		callback (err, err ? null : 'ok');
	})
}

exports.GetTagsByCat = function  (redis, params, callback){
	redis.lrange ($(config.values.project_key, 'cat', params.id, 'tags'), 0, 100, function(err, data) {
		var tags = []
		for (i=0;i<data.length;i++)	{
			tags.push (data[i])
		}
		callback (null, tags);
	});
}

exports.GetTags = function  (redis, params, callback){
	redis.lrange ($(config.values.project_key, 'tags'), 0, 100, function(err, data) {
		var tags = []
		for (i=0;i<data.length;i++)	{
			tags.push ({name: data[i]})
		}
		callback (null, tags);
	});
}
