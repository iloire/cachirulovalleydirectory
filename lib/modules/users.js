var config = require("../../config.js").values
var reds = require ('reds')
var querystring = require('querystring')
var module_cats = require ('./cats.js')
var module_tags = require ('./tags.js')

function $() { return Array.prototype.slice.call(arguments).join(':')}

/*helpers*/
function getUserFromList(redis, list, scope, callback){

	if (!scope)
		scope = {region:2, freelance:false} //set no filters
		
	var multi = redis.multi()

	for (i=0;i<list.length;i++)	{
		multi.hgetall ($(config.project_key,'user', list[i]));
		multi.smembers($(config.project_key, 'user', list[i], 'tags'));
		multi.smembers($(config.project_key, 'user', list[i], 'cats'));
	}

	multi.exec(function(err, replies) {
		var users = []
		for (i=0;i<replies.length;i++)	{
			var user = replies[i];
			i++;
			user.tags = replies[i] || [];
			i++;
			user.cats = replies[i] || [];
			
			//region display
			for (c=0;c<config.regions.length;c++){
				if (user.region==config.regions[c].value){
					user.region_display = config.regions[c].name;
					break;
				}
			}
			
			user.other_data = parseOtherData(user.other_data)
			if (!user.image){
				user.image = '/images/anonymous-user-small.png'
			}

			var add=false
			if ((scope.region==0 && user.region <10) || (scope.region==1 && user.region < 100) || (scope.region==2))
				add=true
				
			if (scope.freelance == 'true' && (!user.other_data.freelance)) //careful with quotes
				add=false

			if (add)
				users.push (user);
			
		}	
		callback(null, users);
	});	
}

/*public methods*/

exports.GetUserByLinkedinId = function (redis, params, callback){
	var linkedin_id = $(config.project_key, 'user', 'linkedin', params.linkedin_id);
	redis.get (linkedin_id, function (err, id){
		if (id){
			params.id = id; //returns system id
			exports.GetUser (redis, params, callback);
		}
		else{
			callback (null, null); //doesn't exist
		}
	});	
}

function parseOtherData(input){
	var other_data = {}
	try {
		other_data = JSON.parse(input)
	}
	catch (err){
		//console.log ('error parsing other data. raw value: ' + input)
	}
	return other_data
}

exports.GetUser = function (redis, params, callback){
	getUserFromList(redis, [params.id], null, callback);
}

exports.GetUsers = function (redis, params, callback){	
	var scope = params.scope;
	redis.smembers ($(config.project_key, 'users'), function(err, list) {
		getUserFromList(redis, list, scope, function return_users(err, users){
			callback(err, users);
		});
	});
}

exports.GetUsersByCat = function (redis, params, callback){
	var scope = params.scope;
	redis.smembers ($(config.project_key, 'cat', params.id, 'users'), function(err, list) {
		getUserFromList(redis, list, scope, function return_users(err, users){ //todo: filter by region scope
			callback(err, users);
		});
	});
}

exports.GetUsersByTag = function (redis, params, callback){	
	var scope = params.scope;	
	redis.smembers ($(config.project_key, 'tag', params.id, 'users'),  function(err, list) {
		getUserFromList(redis, list, scope, function return_users(err, users){ //todo: filter by region scope
			callback(err, users);
		});
	});
}

exports.AddOrEditUser = function (redis, params, callback){
	exports.GetUserByLinkedinId (redis, {linkedin_id: params.user.linkedin_id}, function (err, user){
		if (user) //user exists
		{
			params.user.id = user.id //translate to system id
			exports.SetUser(redis, params, callback);
		}
		else{
			exports.AddUsers(redis, {users:[params.user]}, callback);
		}
	})
}


exports.SetUser = function (redis, params, callback){
	
	var user = params.user;
	if (!user.id)
		throw 'user id not found'
	
	module_cats.GetCats(redis, params, function getCats(err, cats){
		module_tags.GetTags(redis, params, function getTags(err, tags){
			exports.GetUser(redis, params, function getTags(err, existant_user){
				var multi = redis.multi()	
				var time = new Date().getTime()

				multi.incr($(config.project_key, 'users_count'));
				multi.hmset($(config.project_key, 'user', user.id),
					'id', user.id,
					'name', user.name,
					'location', user.location || '',
					'region', user.region,
					'bio', user.bio || '',
					'twitter', user.twitter || '',
					'web', user.web || '',
					'image', user.image || '',
					'linkedin_id', user.linkedin_id,
					'linkedin_profile_url', user.linkedin_profile_url || '',
					'creation_date', time,
					'email', user.email || '',
					'other_data', JSON.stringify(user.other_data))

				multi.sadd($(config.project_key, 'users'),user.id); //set of users
				if (user.linkedin_id){
					multi.set($(config.project_key, 'user', 'linkedin', user.linkedin_id), user.id); //conversion linkedin-> system id
				}

				//** categories
				//remove user from all cats lists
				for (c=0;c<cats.length;c++){
					multi.srem($(config.project_key, 'cat', cats[c], 'users'),user.id);
				}
				//remove all cats from this user
				multi.del($(config.project_key, 'user', user.id, 'cats'));// add cat to user

				if (user.cats){
					for (c=0;c<user.cats.length;c++){
						multi.sadd($(config.project_key, 'cat', user.cats[c], 'users'), user.id); // add user to cat list
						multi.sadd($(config.project_key, 'user', user.id, 'cats'), user.cats[c]); // add cat to user
					}
				}

				//** tags
				//remove user from all tags lists
				for (t=0;t<tags.length;t++){
					multi.srem($(config.project_key, 'tag', tags[t], 'users'), user.id);
				}
				//remove all tags from this user and repopulate
				multi.del($(config.project_key, 'user', user.id, 'tags'));// add cat to user

				if (user.tags){
					for (t=0;t<user.tags.length;t++){
						//multi.sadd($(config.project_key, 'tags'), user.tags[t]);
						multi.sadd($(config.project_key, 'tag', user.tags[t], 'users'), user.id); //add user to tag list
						multi.sadd($(config.project_key, 'user', user.id, 'tags'), user.tags[t]); //add tag to user
					}
				}

				function indexUser (item, callback){
					var params = {user: item}
					exports.IndexUser(redis, params, function IndexUserCallback (err, data){
						callback(err, err ? null : 'ok');
					});		
				}

				multi.exec(function(err, replies) {
					indexUser(user,callback);
				});	
			});
		});		
	});
	
}

exports.AddUsers = function (redis, params, callback){
	var users = params.users;
	if( typeof(users.length)=="undefined") //accept either one item or an array of items
	    users = [users];
	
	function setUser (user, callback){
		redis.incr($(config.project_key, 'users_count'), function(err, id) {
			user.id = id;
			exports.SetUser(redis, {user:user}, function SetUserCallback (err, data){
				callback(err, err ? null : 'ok');
			});	
		});		
	}

	var async = require ('async')
	async.forEach(users, setUser, function(err){
		callback(err, err ? null : 'ok');
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
			var key = $(config.project_key, 'cat', user.cats[c]);
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
				
		getUserFromList(redis, list, null, function return_users(err, users_found){ //todo scope
			callback (err, users_found);
		});	
	});
}