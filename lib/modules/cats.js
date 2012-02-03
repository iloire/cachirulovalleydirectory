var config = require("../../config.js")

function $() { return Array.prototype.slice.call(arguments).join(':') }

exports.AddCategories = function (redis, params, callback){
	var multi = redis.multi()
	var time = new Date().getTime()	

	var cats = params.cats

	redis.incr($(config.values.project_key, 'categories_count'), function(err, id) {
		for (i=0;i<cats.length;i++){
			var cat = cats[i]
			cat.id = id + i;
			var key = $(config.values.project_key, 'cat', cat.id)

			multi.hmset(key,
				'id', cat.id,
				'name', cat.name,
				'descr', cat.descr,
				'creation_date', time)

			multi.sadd($(config.values.project_key, 'cats'), cat.id); //add id to 'cats' set

			multi.incr($(config.values.project_key, 'categories_count')); 
		}

		multi.exec(function(err, response){
			callback (err, err ? null : cats);
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
			for (i=0;i<list.length;i++)	{
				var key = $(config.values.project_key, 'cat', list[i]);
				multi.hmget (key, 'id', 'name', 'descr');
				if (params && params.scope){
					var key=$(config.values.project_key, 
							'cat', list[i], 
							'tag', [''],
							'freelance', (params.scope.freelance == true || params.scope.freelance == 'true') ? 1 : 0,
							'entrepreneur', (params.scope.entrepreneur == true || params.scope.entrepreneur == 'true') ? 1 : 0);

 					multi.zrangebyscore(key, 0, params.scope.region || 1000);

				}
				else{
					multi.scard($(config.values.project_key, 'cat', list[i], 'users'));
				}
			}

			multi.exec(function(err, replies) {
				for (i=0;i<replies.length;i=i+2)	{
					var cat={
						id:replies[i][0], 
						name:replies[i][1], 
						descr: replies[i][2]
						};
						
					cat.users_count = (params && params.scope) ? replies[i+1].length : replies[i+1].toString();
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