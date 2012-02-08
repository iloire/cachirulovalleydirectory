var config = require("../../config.js").values
var common = require("../common.js")
var module_users = require ('./users.js')

function $() { return Array.prototype.slice.call(arguments).join(':') }

exports.GetTagsByCat = function  (redis, params, callback){
	params.id_cat=params.id;
	exports.GetTags(redis, params, callback);
}

exports.GetTags = function  (redis, params, callback){
	redis.smembers($(config.project_key, 'tags'), function(err, tags_db){
		if (err){
			callback (err);
		}else{
			var multi = redis.multi()
			
			if (!params) params = {}
			
			if (params.scope && !params.id_cat)
				throw 'can use scope without id_cat in gettags'
			
			if (!params.scope)
				params.scope = { region:1000, freelance: false, entrepreneur:false }
				
			for (i=0,l=tags_db.length;i<l;i++){
				if (params && params.id_cat){
					var key=$(config.project_key, 
							'cat', params.id_cat,
							'tag', tags_db[i],
							'r', params.scope.region || 1000,
							'f', (params.scope.freelance == true || params.scope.freelance == 'true') ? 1 : 0,
							'e', (params.scope.entrepreneur == true || params.scope.entrepreneur == 'true') ? 1 : 0);
 					multi.smembers(key);
				}
				else{
					multi.scard($(config.project_key, 'tag', tags_db[i], 'users'));
				}
			}

			multi.exec(function(err, replies) {
				var tags = []
				for (i=0,l=tags_db.length;i<l;i++)	{
					var count = (params && params.id_cat) ? replies[i].length : replies[i];
					if (params.fillempty===true || count)
						tags.push({t: tags_db[i], n: count});
				}
				
				callback (null, tags);
			});
		}
	});
}
