var config = require("../../config.js")

function $() { return Array.prototype.slice.call(arguments).join(':') }

exports.AddCategories = function (redis, params, callback){
	var multi = redis.multi()
	var time = new Date().getTime()
	var key_incr = $(config.values.project_key, 'cats','count');

	redis.get(key_incr, function(err, id) {
		for (i=0,l=params.cats.length;i<l;i++){
			var cat = params.cats[i]
			cat.id = (id || 1) + i;

			multi.hmset($(config.values.project_key, 'cat', cat.id),
				'id', cat.id,
				'name', cat.name,
				'descr', cat.descr,
				'creation_date', time)

			multi.sadd($(config.values.project_key, 'cats'), cat.id); //add id to 'cats' set

			multi.incr(key_incr);
		}

		multi.exec(function(err, response){
			callback (err, err ? null : params.cats);
		})
	});
}

exports.GetCats = function  (redis, params, callback){
	var cats = [];
	redis.smembers ($(config.values.project_key, 'cats'), function(err, list) {
		if (err){
			callback (err);
		}else{
			var multi = redis.multi()
			for (i=0,l=list.length;i<l;i++)	{
				var key = $(config.values.project_key, 'cat', list[i]);
				multi.hmget (key, 'id', 'name', 'descr');
				if (params && params.scope){
					var key=$(config.values.project_key, 
							'cat', list[i],
							'tag', '',
							'r', params.scope.region || 1000	,
							'f', (params.scope.freelance == true || params.scope.freelance == 'true') ? 1 : 0,
							'e', (params.scope.entrepreneur == true || params.scope.entrepreneur == 'true') ? 1 : 0);

 					multi.smembers(key);
				}
				else{
					multi.scard($(config.values.project_key, 'cat', list[i], 'users'));
				}
			}

			multi.exec(function(err, replies) {
				for (i=0,l=replies.length;i<l;i=i+2)	{
					var cat={
						id:replies[i][0], 
						name:replies[i][1], 
						descr: replies[i][2]
						};
						
					cat.users_count = (params && params.scope) ? replies[i+1].length : replies[i+1];
					cats.push(cat)
				}
				
				callback (null, cats);
			});
		}
	});
}

exports.GetCat = function  (redis, params, callback){
	var key = $(config.values.project_key, 'cat', params.id);
	redis.hgetall (key, function (err,data){
		callback(err, data);
	});
}