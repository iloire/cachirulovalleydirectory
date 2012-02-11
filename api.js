var common = require ('./lib/common');
var config = require ('./config').values;

exports.configure = function (app, redis, module_users, module_cats, module_tags){

	function format_tags (simple_arr_tags){
		var tags = [];
		for (var t=0, tl=simple_arr_tags.length;t<tl; t++){ 
			tags.push ({t: simple_arr_tags[t], n: 0});
		}
		return sort_tags(tags);
	}

	function get_unique_tags_by_users(users){
		var tags = []
		for(var u=0,l=users.length; u<l; u++){
			for (var t=0, tl=users[u].tags.length;t<tl; t++){ 
				var found=false;
				for (var i=0,il=tags.length;i<il; i++){
					if (tags[i].t==users[u].tags[t]){
						found=true;
						tags[i].n++;
					}
				}

				if (!found)
					tags.push ({t: users[u].tags[t], n: 1});
			}
		}
		return sort_tags(tags);
	}


	function sort_tags (tags){
		function sorter (a,b){
			return ((a.t < b.t) ? -1 : ((a.t > b.t) ? 1 : 0));
		}
		return tags.sort(sorter);
	}
	
	function PrepareForDisplayUsers (req, users){ //users or user
		if (users.length==undefined) //single object, not array
			return common.removeUnwantedFields(users);

		var sortfield = req.query["sort"] || 'name';
		var desc=false
		if (sortfield[sortfield.length-1]=="_"){
			desc=true;
			sortfield = sortfield.substring(0, sortfield.length-1);
		}
		return common.sort(common.removeUnwantedFields(users), sortfield, desc);
	}
	
	app.get('/api/tags', function(req, res){
		module_tags.GetTags (redis, {}, function (err, tags){
			common.renderJSON(req, res, {tags:sort_tags(tags)} , 200, req.query["callback"])
		});
	});

	app.get('/api/cats', function(req, res){
		module_cats.GetCats (redis, {}, function (err, cats){
			common.renderJSON(req, res, {cats:cats} , 200, req.query["callback"])
		});
	});

	app.get('/api/tagsautocomplete', function(req, res){
		module_tags.GetTags (redis, {}, function (err, tags){
			var tags_text=[]
			for (var i=0, l=tags.length;i<l;i++){
				tags_text.push(tags[i].t)
			}
			res.send (tags_text.join('\n'))
		});
	});

	app.get('/api/users', function(req, res){
		var params = {
					id_cat : req.query["id_cat"] || '',
					tag : req.query["tag"] || '',
					scope: req.query["scope"],
					sort: req.query["sort"],
					pagination : {from : req.query["from"] || 0, pagesize : req.query["page"] || config.default_page_size},
					logged_user: req.session.user || null
				}
		
		module_cats.GetCats (redis, params, function (err, cats){
			module_tags.GetTags (redis, params, function (err, tags){
				module_users.GetUsers(redis, params, function(err, users, total_records){
					var cat=null;
					for (var i=0;i<cats.length;i++){
						if (cats[i].id==params.id_cat)
						{
							cat=cats[i];
							break;
						}
					}

					common.renderJSON(req, res, {
						users: common.removeUnwantedFields(users),
						tags: sort_tags(tags),
						cats: cats,
						cat: cat,
						pagination: {
							pagesize: params.pagination.pagesize,
							from: params.pagination.from, 
							total: Math.ceil(total_records / params.pagination.pagesize),
							total_records: total_records
						},
						tag: params.tag,
						scope: params.scope,
						}, 200, req.query["callback"])
				});
			});
		});
	});	

	app.get('/api/users/byid', function(req, res){
		var params = {id : req.query["id"], logged_user: req.session.user}
		module_users.GetUser (redis, params, function (err, user){
			common.renderJSON(req, res, {user: user ? common.removeUnwantedFields(user) : null}, 200, req.query["callback"])
		})
	});

	app.get('/api/search', function(req, res){
		var params = {q : req.query["search"] || req.query["q"] || '', scope: req.query["scope"], logged_user: req.session.user}
		module_cats.GetCats (redis, params, function (err, cats){
			params.max = 100; //max number of results in search
			module_users.Search (redis, params, function (err, users){
				common.renderJSON(req, res, {
					cats: cats,
					users: PrepareForDisplayUsers(req, users), 
					tags: get_unique_tags_by_users(users),
					pagination: {
						pagesize: config.default_page_size,
						from: 0,
						total: Math.ceil(users.length / config.default_page_size),
						total_records: users.length
					}
					}, 200, req.query["callback"])
			})
		})
	});
}