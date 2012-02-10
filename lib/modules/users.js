var config = require("../../config.js").values
var reds = require ('reds')
var querystring = require('querystring')
var common = require ('../common');
var module_cats = require ('./cats.js')
var module_tags = require ('./tags.js')

function $() { return Array.prototype.slice.call(arguments).join(':')}

function get_users_id_list_by_scope (redis, params, callback){ 
	if (!params || !params.id_cat)
		throw 'ERROR: When listing users, must choose a category'

	if (!params.scope)
		params.scope = {region:1000, freelance:false, entrepreneur:false} //if no scope, no filters

	var key=$(config.project_key, 
			'cat', params.id_cat,
			'tag', (params.tag) ? params.tag.toLowerCase() : '',
			'r', params.scope.region || 1000,
			'f', (params.scope.freelance == true || params.scope.freelance == 'true') ? 1 : 0,
			'e', (params.scope.entrepreneur == true || params.scope.entrepreneur == 'true') ? 1 : 0);

	var sort_direction = 'asc';
	if (!params.sort)
		params.sort = 'name';
	else{	
		if (params.sort[params.sort.length-1]=="_"){
			sort_direction = 'desc';
			params.sort = params.sort.substring(0, params.sort.length-1);
		}
	}

	function process_result (err, data){
		var result = {users : {}, total_records: 0};
		result.total_records = data.length;
		if (params.pagination){
			data = data.slice ((params.pagination.from || 0) * (params.pagination.pagesize || config.default_page_size), (params.pagination.from || 0) * (params.pagination.pagesize || config.default_page_size) + (params.pagination.pagesize || config.default_page_size));
		}
		result.users = data;
		callback (err, result);
	}
	
	if (params.sort=='name'){
		var sort_field = $(config.project_key, 'user', '*->' + params.sort);
		redis.sort (key, 'ALPHA', 'by', sort_field, sort_direction, function (err, data){
			process_result (err, data);
		});
	}
	else{
		var sort_field = $(config.project_key, 'user', 'sort', 'votes', '*');
		redis.sort (key, 'by', sort_field, sort_direction, function (err, data){
			process_result (err, data);
		});
	}
}

function getUserFromList(redis, params, callback){
	var scope = params.scope;
	var list = params.list;

	if (!scope)
		scope = {region:1000, freelance:false} //set no filters
	
	var multi = redis.multi()
	var calc_voted = (params.logged_user && params.logged_user.id)

	var multiplier = 4;
	for (var i=0,l=list.length;i<l;i++)	{
		multi.hgetall ($(config.project_key,'user', list[i]));
		multi.smembers($(config.project_key, 'user', list[i], 'tags'));
		multi.smembers($(config.project_key, 'user', list[i], 'cats'));
		multi.scard($(config.project_key, 'votes', list[i]));
		if (calc_voted){
			multiplier=5;
			multi.sismember($(config.project_key, 'votes', list[i]), params.logged_user.id);
		}
	}

	multi.exec(function(err, replies) {
		var users = []
		
		for (var u=0,ul=list.length;u<ul;u++)	{
			var user = replies[multiplier*u];
			if (user && user.id){
				user.tags = replies[multiplier * u  + 1];
				user.cats = replies[multiplier * u  + 2];
				user.votes = replies[multiplier * u  + 3] || 0;
				
				if (calc_voted){
					user.voted = replies[multiplier * u  + 4] || 0;
				}
			
				//region display
				for (var c=0, l=config.regions.length;c<l; c++){
					if (user.region==config.regions[c].value){
						user.region_display = config.regions[c].name;
						break;
					}
				}

				user.other_data = parseJsonData(user.other_data)
				user.portfolio = parseJsonData(user.portfolio)
		
				if (!user.image)
					user.image = '/images/anonymous-user-small.png'
			
				users.push (user);
			}
			else{ //error
				if (!params.ignore_missing_users){
					callback('error. user id ' + list[u] + ' doesnt exist', []);
					return;
				}
			}
		}	
		callback(null, users, params.total_records);
	});	
}
exports.getUserFromList = getUserFromList

function parseJsonData(input){
	var json_data = {}
	try {
		json_data = JSON.parse(input)
	}
	catch (err){
		//console.log ('error parsing other data. raw value: ' + input)
	}
	return json_data
}

function SetUser (redis, params, callback){
	var user = params.user;
	if (!user.id)
		throw 'user id not found'

	function setUser(multi, params,callback){
		var time = new Date().getTime()

		if (!user.cats)
			throw 'user need categories!'

		multi.hmset($(config.project_key, 'user', user.id),
			'id', user.id,
			'name', user.name,
			'location', user.location || '',
			'region', user.region,
			'bio', user.bio || '',
			'github', user.github || '',
			'twitter', user.twitter || '',
			'web', user.web || '',
			'image', user.image || '',
			'linkedin_id', user.linkedin_id,
			'linkedin_profile_url', user.linkedin_profile_url || '',
			'created', user.created || new Date().getTime(),
			'modified', time,
			'email', user.email || '',
			'other_data', JSON.stringify(user.other_data),
			'portfolio', JSON.stringify(user.portfolio))

		multi.sadd($(config.project_key, 'users'), user.id); //add to set of users

		if (user.linkedin_id)
			multi.set($(config.project_key, 'user', 'linkedin', user.linkedin_id), user.id); //conversion linkedin-> system id

		for (c=0;c<user.cats.length;c++){
			multi.sadd($(config.project_key, 'cat', user.cats[c], 'users'), user.id); // add user to cat list
			multi.sadd($(config.project_key, 'user', user.id, 'cats'), user.cats[c]); // add cat to user

			var free_values = (user.other_data && user.other_data.freelance) ? [0,1] : [0]
			var entre_values = (user.other_data && user.other_data.entrepreneur) ? [0,1] : [0]
			var region_values = (user.region <= 10) ? [10,100,1000] : ((user.region <= 100) ? [100,1000] : [1000])

			//create index for filtering
			if (!user.tags) 
				user.tags = [''];
			else
				user.tags.push('');

			for (var t=0;t<user.tags.length;t++) {
				for (var f=0;f<free_values.length;f++){
					for (var e=0;e<entre_values.length;e++){
						for (var r=0;r<region_values.length;r++){
							var key = $(config.project_key, 
								'cat', user.cats[c],
								'tag', user.tags[t].toLowerCase(),
								'r', region_values [r],
								'f' , free_values[f], 
								'e', entre_values[e]);

							multi.sadd(key, user.id);
						}
					}
				}
			}
			user.tags.splice(user.tags.length-1,1)
		}
		

		if (user.tags){
			for (t=0;t<user.tags.length;t++){ //trim tags
				user.tags[t] = common.trim(user.tags[t])
			}
			
			user.tags.sort(function sorter (a,b){
				if (a<b) return 1;
				if (b>a) return -1
				return 0;
			});
			
			for (t=0;t<user.tags.length;t++){
				multi.sadd($(config.project_key, 'tag', user.tags[t].toLowerCase(), 'users'), user.id); //add user to tag list
				multi.sadd($(config.project_key, 'user', user.id, 'tags'), user.tags[t].toLowerCase()); //add tag to user
				multi.sadd($(config.project_key, 'tags'), user.tags[t].toLowerCase());

				if (user.cats){
					for (c=0;c<user.cats.length;c++){
						//multi.sadd($(config.project_key, 'tags', 'cat', user.cats[c]), user.tags[t].toLowerCase());  //tags for a certain cat
						multi.sadd($(config.project_key, 'tag', user.tags[t].toLowerCase(), 'cat', user.cats[c]), user.id); //users for that tag in that cat
					}
				}
			}
		}

		function index_user (item, callback){
			var params = {user: item}
			IndexUser(redis, params, function IndexUserResponseCallback (err, data){
				callback(err, item); //return err, user
			});
		}

		multi.exec(function(err, replies) {
			if (err)
			{
				console.error (err)
				callback(err);
			}
			else{
				exports.GetUser(redis, {id:user.id}, function get_user (err, user_from_db){
					if (user_from_db)
						index_user(user_from_db, callback);
					else
					{
						throw 'user id not found'
						console.error ('user ' + user.id + ' not recorded ok')
						callback('ser not found')
					}
				});
			}
		});
	};
	
	exports.GetUser(redis, {id : params.user.id}, function getTags(err, existent_user){
		//params.existent_user = existent_user;
		function process_edition (multi, params, callback){
			setUser(multi, params, function (err, user){
				multi.exec (function (err, replies){
					callback (err, user);
				})
			});
		}
		
		var multi = redis.multi();
		if (existent_user){
			var params = {user:existent_user};
			delete_user_related_data(multi, params, function (err, data){
				process_edition(multi, params, callback);
			});
		}
		else{
			process_edition(multi, params, callback);
		}
	});
}

function delete_user_related_data (multi, params, callback){
	if (!params || !params.user){
		callback ('wrong parameters')
		return;
	}
		
	for (c=0;c<params.user.cats.length;c++){
		multi.srem($(config.project_key, 'cat', params.user.cats[c], 'users'), params.user.id);
	}
	//remove all cats from this user
	multi.del($(config.project_key, 'user', params.user.id, 'cats'));
	
	//remove index for filters
	var free_values = [0,1];
	var entre_values =[0,1];
	var region_values = [10,100,1000];
	
	for (c=0;c<params.user.cats.length;c++){
		multi.srem($(config.project_key, 'cat', params.user.cats[c], 'users'), params.user.id); // add user to cat list
		multi.srem($(config.project_key, 'user', params.user.id, 'cats'), params.user.cats[c]); // add cat to user
		
		if (!params.user.tags) 
			params.user.tags = [''];
		else
			params.user.tags.push('');
				
		for (var t=0;t<params.user.tags.length;t++){
			for (var f=0;f<free_values.length;f++){
				for (var e=0;e<entre_values.length;e++){
					for (var r=0;r<region_values.length;r++){
						var key = $(config.project_key, 
							'cat', params.user.cats[c],
							'tag', params.user.tags[t].toLowerCase(),
							'r', region_values [r],
							'f' , free_values[f], 
							'e', entre_values[e]);
						multi.srem(key, params.user.id);
					}
				}
			}
		}
		params.user.tags.splice(params.user.tags.length-1,1)
	}
	
	//remove voting info
	multi.del($(config.project_key, 'user', 'sort', 'votes', params.user.id));
	
	
	for (t=0;t<params.user.tags.length;t++){
		multi.srem($(config.project_key, 'tag', params.user.tags[t], 'users'), params.user.id);
	}
	//remove all tags from this user
	multi.del($(config.project_key, 'user', params.user.id, 'tags'));// add cat to user

	if (params.user.tags){
		for (t=0;t<params.user.tags.length;t++){
			multi.srem($(config.project_key, 'tag', params.user.tags[t].toLowerCase(), 'users'), params.user.id); 
			multi.srem($(config.project_key, 'user', params.user.id, 'tags'), params.user.tags[t].toLowerCase()); 

			//todo, ojo! puede quedar huérfano
			//multi.srem($(config.project_key, 'tags'), params.user.tags[t].toLowerCase());

			for (c=0;c<params.user.cats.length;c++){
				//multi.srem($(config.project_key, 'tags', 'cat', params.existent_user.cats[c]), params.existent_user.tags[t].toLowerCase()); 
				multi.srem($(config.project_key, 'tag', params.user.tags[t].toLowerCase(), 'cat', params.user.cats[c]), params.user.id); 
			}
		}
	}

	callback(null);
}

exports.VoteUser = function (redis, params, callback){
	if (!params.user || !params.user.id){
		callback ({error: 'you can not vote if you are not a registered user'});
		return;
	}

	if (!params.uservoted || (!params.uservoted.id) || (!params.vote)){
		callback ({error: 'missing parameters: ' + JSON.stringify(params)});
	}
	else {
		params.id = params.uservoted.id;
		params.logged_user = params.user;

		function return_data (user_voted, voted, callback){
			exports.GetUser(redis, params, function(err, user_voted){
				redis.set($(config.project_key, 'user', 'sort', 'votes', user_voted.id), user_voted.votes, function(err, data){ //store for sorting purposes
					callback(err, {status: 'ok', voted: voted, user: user_voted})
				});
			});
		}

		exports.GetUser(redis, params, function(err, user_voted){
			if (!user_voted){
			 	callback('user ' + params.id + ' doesn\'t exist!')
			}
			else{
				var key = $(config.project_key, 'votes' , user_voted.id);
				if (params.vote == 1){
					redis.sadd (key, params.user.id, function (err, id){
						return_data (user_voted, 1, callback);
					});
				}
				else if (params.vote == -1){
					redis.srem (key, params.user.id, function (err, id){
						return_data (user_voted, -1, callback);
					});
				}
			}
		})
	}
}

exports.GetUserByLinkedinId = function (redis, params, callback){
	var linkedin_id = $(config.project_key, 'user', 'linkedin', params.linkedin_id);
	redis.get (linkedin_id, function (err, id){
		if (!err && id){
			params.id = id; //returns system id
			exports.GetUser (redis, params, callback);
		}
		else{
			callback (err || 'id doesn\'t exist', null); //doesn't exist or eerro
		}
	});	
}

exports.DeleteUser = function (redis, params, callback){
	params.list = [params.id];
	getUserFromList(redis, params, function return_users(err, users){
		if (!users[0]){
			callback('user not found');
		}
		else{
			var multi = redis.multi();
			var user = users[0]
			delete_user_related_data(multi, {user:user}, function (err, data){
				multi.del($(config.project_key, 'user', user.id));
				multi.srem($(config.project_key, 'users'), user.id); //remove from set of users
				multi.del($(config.project_key, 'user', 'linkedin', user.linkedin_id));
				
				multi.exec(function(err, replies) {
					var search = reds.createSearch('dir');
					search.remove (user.id);
					callback (err);
				});
			})
		}
	});
}

exports.GetUser = function (redis, params, callback){
	params.list = [params.id];
	getUserFromList(redis, params, function return_users(err, users){
		callback(err, err ? null : users[0]);
	});
}

exports.GetUsers = function (redis, params, callback){
	get_users_id_list_by_scope(redis, params, function (err, data){
		params.list = data.users;
		params.total_records = data.total_records;
		getUserFromList(redis, params, callback);
	})
}

exports.SetUsers = function (redis, params, callback){
	if (!params.users)
		throw 'no users to update'
		
	var users_saved = []
	
	function update(user, callback){
		SetUser(redis, {user:user}, function SetUserCallback (err, user){
			users_saved.push (user);
			callback(err, null);
		});	
	}
	
	function add (user, callback){
		redis.incr($(config.project_key, 'users_count'), function(err, id) {
			user.id = id;
			SetUser(redis, {user:user}, function SetUserCallback (err, user){
				users_saved.push (user);
				callback(err, null);
			});
		});
	}
	
	function processUser (user, callback){
		if (!user.id){
			add (user, callback);
		}
		else{
			exports.GetUser (redis, {id: user.id}, function (err, user_db){
				if (user_db){
					user.created = user_db.created || new Date().getTime();
					update(user, callback);
				}
				else
					add (user, callback);
			});
		}
	}

	var async = require ('async')
	async.forEachSeries(params.users, processUser, function(err){
		callback(err, users_saved);
	});
}

function IndexUser (redis, params, callback){
	var multi = redis.multi()	
	
	reds.createClient = function (){ 
	  return redis;
	};

	var search = reds.createSearch('dir');
		
	var user = params.user;

 	var index = (user.twitter || '') + ' ' + user.name + ' ' + user.bio + ' ' + user.location + (user.web || '')
	
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
				callback(null);
			}
			else{
				callback(err, null);
			}
		});	
	}
	else{
		callback(null);
	}
}

exports.Search = function  (redis, params, callback){
	var maxresults = params.max || 200;

	if (!params.q && !params.search)
		callback ('no query found')
		
	reds.createClient = function(){ //override 
	  return redis;
	};
	
	var search = reds.createSearch('dir');
	var list=[];
		
	search.query(query = params.q || params.search).end(function(err, ids){
		if (err) 
			throw err;

		ids.forEach(function(id){
			list.push (parseInt(id,10));
		});
		
		if (list.length>maxresults){
			list = list.slice (0, maxresults);
			console.log ('too many results.. slicing to ' + maxresults);
		}
		
		params.list = list
		params.ignore_missing_users = true;
		getUserFromList(redis, params, function return_users(err, users_found){ //todo scope
			callback (err, users_found);
		});	
	});
}