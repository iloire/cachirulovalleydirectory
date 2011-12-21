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

			console.log ('adding cat: ' + key + ':' + cat.name)

			multi.hmset(key,
				'id', cat.id,
				'name', cat.name,
				'descr', cat.descr,
				'creation_date', time)

			multi.rpush($(config.values.project_key, 'cats'), cat.id);
					
			multi.incr($(config.values.project_key, 'categories_count'));
		}
	
		multi.exec(function(err, response){
			callback (err, err ? null : cats);
		})
	});
}


exports.GetCats = function  (redis, params, callback){
	var cats = [];
	redis.lrange ($(config.values.project_key, 'cats'), 0, 100, function(err, list) {
		if (err){
			callback (err, null);
		}else{
			var multi = redis.multi()
			for (i=0;i<list.length;i++)	{
				var key = $(config.values.project_key, 'cat', list[i]);
				multi.hmget (key, 'id', 'name', 'descr');
				multi.llen($(config.values.project_key, 'cat', list[i], 'users'));
			}

			multi.exec(function(err, replies) {
				for (i=0;i<replies.length;i=i+2)	{
					cats.push  ({
						id:replies[i][0], 
						name:replies[i][1], 
						descr: replies[i][2], 
						users_count: replies[i+1].toString()
						});
				}
				callback (null, cats);
			});
		}
	});
}
