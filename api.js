var common = require ('./lib/common.js');

exports.configure = function (app, redis, module_users, module_cats, module_tags){
	app.get('/api/tags', function(req, res){
		module_tags.GetTags (redis, {}, function (err, tags){
			common.renderJSON(req, res, {tags:tags} , 200, req.query["callback"])
		});
	});

	app.get('/api/cats', function(req, res){
		module_cats.GetCats (redis, {}, function (err, cats){
			common.renderJSON(req, res, {cats:cats} , 200, req.query["callback"])
		});
	});

	app.get('/api/tagsautocomplete', function(req, res){
		module_tags.GetTags (redis, {}, function (err, tags){
			res.send (tags.join('\n'))
		});
	});

	app.get('/api/users/bycat', function(req, res){
		var params = {id : req.query["id"], scope: req.query["scope"], logged_user: req.session.user}
		module_cats.GetCat (redis, params, function (err, cat){ //get cat
			module_users.GetUsersByCat (redis, params, function (err, users){ //get users in that cat
				common.renderJSON(req, res, {users:common.removeEmail(users), tags: common.get_unique_tags_by_users(users), cat: cat}, 200, req.query["callback"])
			});
		});
	});

	app.get('/api/users/bytag', function(req, res){
		var params = {id : req.query["id"].toLowerCase(), scope: req.query["scope"], logged_user: req.session.user}
		module_users.GetUsersByTag (redis, params, function (err, users) {
			common.renderJSON(req, res, {users:common.removeEmail(users), tags: common.get_unique_tags_by_users(users)}, 200, req.query["callback"])
		})
	});

	app.get('/api/users/byid', function(req, res){
		var params = {id : req.query["id"], logged_user: req.session.user}
		module_users.GetUser (redis, params, function (err, user){
			common.renderJSON(req, res, {user:common.removeEmail(user)}, 200, req.query["callback"])
		})
	});

	app.get('/api/search', function(req, res){
		var params = {q : req.query["q"], scope: req.query["scope"], logged_user: req.session.user}
		module_users.Search (redis, params, function (err, users){
			common.renderJSON(req, res, {users:common.removeEmail(users), tags: common.get_unique_tags_by_users(users)}, 200, req.query["callback"])
		})
	});
}