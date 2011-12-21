var config = require("../../config.js")
var reds = require ('reds')
var querystring = require('querystring')

function $() { return Array.prototype.slice.call(arguments).join(':')}

var max = 100

/*helpers*/
function getUserFromList(redis, list, callback){
	var multi = redis.multi()
	var users = []
	for (i=0;i<list.length;i++)	{
		var key = $(config.values.project_key, 'user', list[i]);
		multi.hmget (key, 'id', 'name', 'bio', 'image', 'twitter');
	}

	multi.exec(function(err, replies) {
		for (i=0;i<list.length;i++)	{
			users.push ({id: replies[i][0], name: replies[i][1], bio: replies[i][2], image: replies[i][3], twitter: replies[i][4]})
		}	
		callback(null, users);
	});	
}

/*public methods*/

exports.GetUser = function (redis, params, callback){
	var id = params.id
	var multi = redis.multi()
	
	multi.hgetall ($(config.values.project_key,'user', id));
	multi.lrange($(config.values.project_key, 'user', id, 'tags'),0,100);
	multi.lrange($(config.values.project_key, 'user', id, 'cats'),0,100);

	multi.exec(function(err, replies) {
		var user = replies[0];
		user.tags = replies[1];
		user.cats = replies[2];
		//todo fill cats
		callback (err, user || null)
	});	
	
}

exports.GetUsers = function (redis, params, callback){
	redis.lrange ($(config.values.project_key, 'users'), 0, params.max || max, function(err, list) {
		getUserFromList(redis, list, function return_users(err, users){
			callback(err, users);
		});
	});
}

exports.GetUsersByCat = function (redis,params, callback){
	redis.lrange ($(config.values.project_key, 'cat', params.id, 'users'), 0, max, function(err, list) {
		getUserFromList(redis, list, function return_users(err, users){
			callback(err, users);
		});
	});
}

exports.GetUsersByTag = function (redis,params, callback){	
	redis.lrange ($(config.values.project_key, 'tag', params.id, 'users'), 0, max, function(err, list) {
		getUserFromList(redis, list, function return_users(err, users){
			callback(err, users);
		});
	});
}

exports.AddUsers = function (redis, params, callback){	
	var multi = redis.multi()	
	var time = new Date().getTime()
	var users = params.users;
	
	if( typeof(users.length)=="undefined") //accept either one item or an array of items
	    users = [users];
	
	redis.incr($(config.values.project_key, 'users_count'), function(err, id) {
		for (i=0;i<users.length;i++){
			var user = users[i]
			user.id = id + i;

			multi.incr($(config.values.project_key, 'users_count'));
			multi.hmset($(config.values.project_key, 'user', user.id),
				'id', user.id,
				'name', user.name,
				'location', user.location,
				'bio', user.bio,
				'twitter', user.twitter,
				'image', user.image,
				'creation_date', time,
				'email', user.email)

			multi.rpush($(config.values.project_key, 'users'),user.id);
			
			if (user.cats){
				for (c=0;c<user.cats.length;c++){
					multi.rpush($(config.values.project_key, 'cat', user.cats[c], 'users'), user.id); // add user to cat list
					multi.rpush($(config.values.project_key, 'user', user.id, 'cats'), user.cats[c]); // add cat to user
				}
			}

			if (user.tags){
				for (t=0;t<user.tags.length;t++){
					multi.rpush($(config.values.project_key, 'tag', user.tags[t], 'users'), user.id); //add user to tag list
					multi.rpush($(config.values.project_key, 'user', user.id, 'tags'), user.tags[t]); //add tag to user
				}
			}
			
			if (user.cats && user.tags){ //maintain a list of tags for each category
				for (c=0;c<user.cats.length;c++){
					for (t=0;t<user.tags.length;t++){
						multi.rpush($(config.values.project_key, 'cat', user.cats[c], 'tags'), user.tags[t]); //add user to tag list
					}
				}
			}
		}

		function indexUser (item, callback){
			var params = {user: item}
			console.log ('indexing user: ' + item.name)
			exports.IndexUser(redis, params, function IndexUserCallback (err, data){
				callback(err, err ? null : 'ok');
			});		
		}

		multi.exec(function(err, replies) {
			if (users.length){
				var async = require ('async')
				async.forEach(users, indexUser, function(err){
					callback(err, err ? null : 'ok');
				});
			}
			else{
				callback(null, 'ok')
			}
		});
	});
}

exports.IndexUser = function (redis, params, callback){
	var multi = redis.multi()	
	
	reds.createClient = function (){ 
	  return redis;
	};

	var search = reds.createSearch('dir');
		
	var user = params.user;

 	var index = user.twitter + ' ' + user.name + ' ' + user.bio + ' ' + user.location
	
	if (user.tags){
		for (t=0;t<user.tags.length;t++){
			index+= ", " + user.tags[t]
		}
	}

	if (user.cats){
		for (c=0;c<user.cats.length;c++){
			var key = $(config.values.project_key, 'cat', user.cats[c]);
			multi.hmget (key, 'name');
		}	
	
		multi.exec(function(err, replies) {
			if (!err){
				for (i=0;i<replies.length;i++){
					index+= ", " + replies[i]; 
				}
				search.index(index, user.id);
				callback(null, 'ok')
			}
			else{
				callback(err, null)
			}
		});	
	}
	else{
		callback(null, 'ok')
	}
}

exports.Search = function  (redis, params, callback){
	var maxresults = 200;

	reds.createClient = function(){ //override 
	  return redis;
	};
	var search = reds.createSearch('dir');
	var list=[];
		
	search.query(query = params.q).end(function(err, ids){
		if (err) 
			throw err;

		ids.forEach(function(id){
			list.push (id);
		});
		
		if (list.length>maxresults){
			list = list.slice (0, maxresults);
			console.log ('too many results.. slicing to ' + maxresults);
		}
				
		getUserFromList(redis, list, function return_users(err, users_found){
			callback (err, users_found);
		});	
	});
}