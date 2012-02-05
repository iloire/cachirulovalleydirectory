var config = require("../../config.js").values
var common = require("../common.js")
var module_users = require ('./users.js')

function $() { return Array.prototype.slice.call(arguments).join(':') }

exports.GetTagsByCat = function  (redis, params, callback){
	redis.smembers($(config.project_key, 'tags', 'cat', params.id), function (err, tags_db){
		var multi = redis.multi()
		var tags = []
		for (var i=0, l=tags_db.length; i < l; i++) {
			multi.scard($(config.project_key, 'tag', tags_db[i].toLowerCase(), 'cat', params.id));
		};
		
		multi.exec(function(err, replies) {
			for (i=0, l=replies.length;i<l;i++){
				tags.push ({t: tags_db[i], n: replies[i]});
			}
			callback (err, tags)
		});
	});	
}

exports.GetTags = function  (redis, params, callback){
	redis.smembers($(config.project_key, 'tags'), function(err, tags_db){
		var multi = redis.multi()
		var tags = []
		for (var i=0, l=tags_db.length; i < l; i++) {
			multi.scard($(config.project_key, 'tag', tags_db[i].toLowerCase(), 'users'));
		};
		
		multi.exec(function(err, replies) {
			for (i=0, l=replies.length;i<l;i++){
				tags.push ({t: tags_db[i], n: replies[i]});
			}
			callback (err, tags)
		});
	});
}
