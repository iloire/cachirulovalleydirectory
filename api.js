var common = require ('./lib/common');
var config = require ('./config').values;

exports.configure = function (app, redis, module_users, module_cats, module_tags){

	function PrepareForDisplayTags (req, tags){
		function sorter (a,b){
			return ((a.t < b.t) ? -1 : ((a.t > b.t) ? 1 : 0));
		}
		return tags.sort(sorter);
	}
	
	function PrepareForDisplayUsers (req, users){ //users or user
		if (users.length==undefined) //single object, not array
			return common.removeEmail(users);

		var sortfield = req.query["sort"] || 'name';
		var desc=false
		if (sortfield[sortfield.length-1]=="_"){
			desc=true;
			sortfield = sortfield.substring(0, sortfield.length-1);
		}
		return common.sort(common.removeEmail(users), sortfield, desc);
	}
	
	app.get('/api/tags', function(req, res){
		module_tags.GetTags (redis, {}, function (err, tags){
			common.renderJSON(req, res, {tags:PrepareForDisplayTags(req, tags)} , 200, req.query["callback"])
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
				console.log (params)

		module_cats.GetCats (redis, params, function (err, cats){
			module_users.GetUsersByScope(redis, params, function(err, users){
				var cat=null;
				for (var i=0;i<cats.length;i++){
					if (cats[i].id==params.id_cat)
					{
						cat=cats[i];
						break;
					}
				}

				//TODO: pagination in db, instead of after objects have been retrieved
				common.renderJSON(req, res, {
					users: PrepareForDisplayUsers(req, users.slice(params.pagination.from * params.pagination.pagesize, (params.pagination.from *  params.pagination.pagesize) +  params.pagination.pagesize)),
					tags: PrepareForDisplayTags(req, common.get_unique_tags_by_users(users)),
					cats: cats,
					cat: cat,
					pagination: {from: params.pagination.from, total: Math.ceil(users.length / params.pagination.pagesize), total_records: users.length},
					tag: params.tag,
					}, 200, req.query["callback"])
			});	
		});	
	});	

	app.get('/api/users/byid', function(req, res){
		var params = {id : req.query["id"], logged_user: req.session.user}
		module_users.GetUser (redis, params, function (err, user){
			user.tags = PrepareForDisplayTags(req, common.get_unique_tags_by_users([user]));
			common.renderJSON(req, res, {user: PrepareForDisplayUsers(req, user)}, 200, req.query["callback"])
		})
	});

	app.get('/api/search', function(req, res){
		var params = {q : req.query["search"] || req.query["q"] || '', scope: req.query["scope"], logged_user: req.session.user}
		module_cats.GetCats (redis, params, function (err, cats){		
			module_users.Search (redis, params, function (err, users){
				common.renderJSON(req, res, {
					cats: cats,
					users:PrepareForDisplayUsers(req, users), 
					tags: PrepareForDisplayTags(req, common.get_unique_tags_by_users(users))
					}, 200, req.query["callback"])
			})
		})
	});
}