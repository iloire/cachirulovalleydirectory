var getApp = function (redis, config) {
	var express = require('express')
	, common = require ('./lib/common.js')
	, api = require ('./api')
	, module_cats = require("./lib/modules/cats.js")
	, module_tags = require("./lib/modules/tags.js")
	, module_users = require("./lib/modules/users.js")

	var linkedin_client = require('linkedin-js')(
		config.LINKEDIN_API_KEY, 
		config.LINKEDIN_SECRET_KEY, 
		config.base_url + "/login"
	)

	var app = module.exports = express.createServer();

	function local_env (req, res, next){
		res.local('config', config);
		next();
	}

	app.configure(function(){
		app.set('views', __dirname + '/views');
		app.set('view engine', 'ejs');
		app.use(express.bodyParser());
		app.use(express.methodOverride());
		app.use(express.cookieParser());
		app.use(local_env);
		
		//app.use(express.session({ secret: 'your secret here.. shhaahh' }));
		var RedisStore = require('connect-redis')(express);
		app.use(express.session({ secret: "keyboard cat", store: new RedisStore({
			host: config.server.production.session_database.host,
			port : config.server.production.session_database.port, 
			db : config.server.production.session_database.db
		}) }));

		app.use(app.router);

		var gzippo = require('gzippo');
		app.use(gzippo.staticGzip(__dirname + '/public'));

	});

	app.configure('development', function(){
	  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
	});

	app.configure('production', function (){
	  app.use(express.errorHandler()); 
	});

	//REST
	api.configure(app, redis, module_users, module_cats, module_tags);

	app.get('/user/:id', function(req, res){
		res.redirect ('/directory#/user/' + req.param('id'))
	});

	app.get('/user/:id/:name', function(req, res){
		res.redirect ('/directory#/user/' + req.param('id') + '/' + req.param('name'));
	});

	app.get('/directory/user/:id', function(req, res){
		res.redirect ('/directory#/user/' + req.param('id'))
	});

	app.get('/directory/user/:id/:name', function(req, res){
		res.redirect ('/directory#/user/' + req.param('id') + '/' + req.param('name'))
	});

	app.get('/directory/categories/:id/:name', function(req, res){
		res.redirect ('/directory#/categories/' + req.param('id') + '/' + req.param('name'))
	});

	app.get('/directory/categories/:id/:name', function(req, res){
		res.redirect ('/directory#/categories/' + req.param('id') + '/' + req.param('name'))
	});

	app.get('/directory/categories/:id/:name/tag/:tag', function(req, res){
		res.redirect ('/directory#/categories/' + req.param('id') + '/' + req.param('name') + '/tag/' + req.param('tag'))
	});

	//search
	app.get('/directory/search/:term', function(req, res){
		res.redirect ('/directory#/search/' + req.param('term'))
	});

	app.get('/search', function(req, res){
		res.redirect ('/directory#/search/' + encodeURIComponent(req.query['q']))
	});

	app.get('/about', function(req, res){
		res.render('about', {title:'Sobre el directorio de Cachirulo Valley', user: req.session.user});
	});
	
	app.get('/', function(req, res){
		var params = {id_cat: 1, scope: {region:10, freelance: false}, sort: 'votes_'}
		module_users.GetUsers (redis, params, function(err, users){
			res.render('index', {layout:'layout_home', title: 'Directorio CachiruloValley', categories : [],  users:users.slice(0,12), user: req.session.user});
		});
	});
	
	app.get('/login', function(req, res){
		if (req.query['redirect']){
			req.session.redirect = req.query['redirect'];
		}

		if (!req.session.user){
			linkedin_client.getAccessToken(req, res, function (error, token) 
			{
			    if (error){
					console.error (error);
					res.redirect ('/')
					return;
				}
				req.session.token = token;

				function get_user_or_new_from_linkedin_data (user_linkedin, callback){
					var params = {linkedin_id : user_linkedin.id}
					module_users.GetUserByLinkedinId(redis, params, function (err, user_db){
						if (user_db){
							//user from database. make sure fields from linkedin are filled
							if (user_linkedin.publicProfileUrl) //update profile url
								user_db.linkedin_profile_url=user_linkedin.publicProfileUrl;

							if (user_linkedin.pictureUrl) //update pic
								user_db.image=user_linkedin.pictureUrl;

							if (user_linkedin.id) //linkedin_id
								user_db.linkedin_id=user_linkedin.id;

							callback (user_db);
						}
						else{
							//convert from linkedin user data type to our data type
							var user = {}
							user.id = null; //not in db yet 
							user.linkedin_id = user_linkedin.id;
							user.name = (user_linkedin.firstName || '') + ' ' + (user_linkedin.lastName || '');
							user.bio = user_linkedin.headline || '';
							user.image = user_linkedin.pictureUrl;
							user.location = user_linkedin.location.name;
							user.linkedin_profile_url = user_linkedin.publicProfileUrl || '';
							user.other_data = {};
							user.portfolio = [];
							callback (user);
						}
					});
				}

				linkedin_client.apiCall('GET', '/people/~:(' + linkedin_scope +')',
				{
					token: {
						oauth_token_secret: req.session.token.oauth_token_secret,
						oauth_token: req.session.token.oauth_token
					}
					, share: {
						visibility: {code: 'anyone'}
					}
				}
				, function (error, user_linkedin) {
					if (error){
						console.error (error)
						res.redirect ('/');
					}else{
						get_user_or_new_from_linkedin_data(user_linkedin, function (user){
							req.session.user = user;
							if (req.session.redirect){
								res.redirect(req.session.redirect);
								req.session.redirect = null;
							}
							else{
								res.redirect('/directory');
							}
						});
					}
				});
			});	
		}
		else{
			res.redirect('/');
		}
	});

	app.get('/directory', function(req, res){
		module_cats.GetCats (redis, {}, function (err, categories){
			module_tags.GetTags (redis, {}, function (err, tags){
				res.render('index_directory', {title: 'Directorio CachiruloValley', categories : categories, tags:tags,  users:[], user: req.session.user});
			});	
		});
	});

	app.post('/favorite', function(req, res){
		if (!req.session.user){
			common.renderJSON(req, res, {error: 'no session'}, 403)
			return;
		}
		var params = {userfav: {id: req.param('user_fav_id')}, user: req.session.user, favstatus: req.param('favstatus')};
		module_users.FavUser (redis, params , function (err, data){
			common.renderJSON(req, res, err || data, err ? 503 : 200, req.query["callback"])
		});
	});

	app.post('/vote', function(req, res){
		if (!req.session.user){
			common.renderJSON(req, res, {error: 'no session'}, 403)
			return;
		}
		var params = {uservoted: {id: req.param('user_voted_id')}, user: req.session.user, vote: req.param('vote')};
		module_users.VoteUser (redis, params , function (err, status){
			var data = err ? {error: err} : status
			if (err) console.error (err); //log
			common.renderJSON(req, res, data, err ? 503 : 200, req.query["callback"])
		});
	});

	app.get('/logout', function(req, res){
		req.session.user=null;
		res.redirect ('/');
	});

	var linkedin_scope = 'id,first-name,last-name,picture-url,location,headline,member-url-resources,site-standard-profile-request,public-profile-url'
	app.get('/editprofile', function (req,res){

		if (!config.registration_enabled){
			res.send ('En este momento el formulario de registro y modificación de perfil no está habilitado')
			return;
		}

		function render (user){
			module_cats.GetCats (redis, null, function (err, categories){
				res.render ('edit_profile', 
					{
						title: user ? 'Editar perfil': 'Creaar perfil', 
						error: null,
						regions : config.regions,
						validation_errors:[],
						categories_available : categories,
						number_portfolio_urls: config.number_portfolio_urls,
						success: req.flash('success'),
						layout: 'layout_profile',
						user: user
					}
				);	
			})
		}
		if (!req.session.user) { //at this point we may have or not user.id
			req.session.redirect = '/editprofile';
			res.redirect ('/login');
		}
		else{
			var user_to_edit_id = req.query['id'] || req.session.user.id;
			if (req.session.user.id != user_to_edit_id){
				//editing other user.. admin?
				if (!req.session.user.linkedin_id || !common.contains(config.admins, req.session.user.linkedin_id)){
 					res.writeHeader(403, {'Content-Type':'text/plain'});
					res.end ('access denied');

					return;
				}
			}
			
			module_users.GetUser(redis, {id:user_to_edit_id}, function get_user (err, user){
				if (!user){
					render(req.session.user) //new user
				}
				else{
					render (user);
				}
			});
		}
	});

	//edit or create profile POST
	app.post ('/editprofile', function (req,res){
		if (!config.registration_enabled){
			res.send ('En este momento el formulario de registro y modificación de perfil no está habilitado. Por favor vuelve en un ratico co!')
			return;
		}

		if (!req.session.user){ //at this point we may have or not user.id
			res.redirect ('/editprofile')
			return;
		}
		
		var user_to_edit_id = req.query['id'] || req.session.user.id;
		if (req.session.user.id != user_to_edit_id){
			//editing other user.. admin?
			if (!req.session.user.linkedin_id || !common.contains(config.admins, req.session.user.linkedin_id)){
				res.writeHeader(403, {'Content-Type':'text/plain'});
				res.end ('access denied');
				return;
			}
		}

		module_users.GetUser(redis, {id:user_to_edit_id}, function get_user (err, user){
			if (!user){
				//user doesn't exist in the database. Case of new user filling their profile.
				if (req.session.user.id != user_to_edit_id){
					res.writeHeader(404, {'Content-Type':'text/plain'});
					res.end ('user not found in the database');
					return;
				}
				else{
					//new user creating profile.
					user = req.session.user;
				}
			}
			else{
				if (req.session.user.id != user_to_edit_id){ //we are editing other people's profile.
					
				}
				else{ //editing my own profile.
					//set up to date data from linkedin login.
					user.image = req.session.user.image
					user.linkedin_profile_url = req.session.user.linkedin_profile_url
				}
			}
			
			user.name = req.param('name') || '';
			user.email = req.param('email') || '';
			user.bio = req.param('bio') || '';
			user.location = req.param('location') || '';
			user.region = req.param('region') || '';
			user.web = req.param('web') || '';
			user.twitter = (req.param('twitter') || '').replace('@','');
			user.github = req.param('github') || '';
			user.cats = req.param ('categories_available') || [];
			user.tags = req.param ('tags') ? req.param ('tags').split(',') : [];
			user.other_data =  {
					vc_partner : req.param ('vc_partner') || false,
					tech_partner : req.param ('tech_partner') || false,
					business_partner : req.param ('business_partner') || false,
					entrepreneur : req.param ('entrepreneur') || false,
					freelance : req.param ('freelance') || false,
					looking_for_contracts: req.param ('looking_for_contracts') || false
				}

			get_render_user (user);
		});
		
		function get_render_user(user){
			user.portfolio = []
			for (var i=0;i<config.number_portfolio_urls;i++){
				user.portfolio[i] = {url: req.param('portfolio_url'+i), descr: req.param('portfolio_descr'+i)};
			}

			//validation
			var validation_errors=[]
			var valid=true;

			//validation config
			var max_name = 50
			var max_bio=200	
			var min_bio=10;
			var cats_min = 1
			var cats_max = 3
			var tags_max = 15
			var tags_min = 3
			var tag_max_length = 25
			var max_portfolio_descr = 200
			var max_portfolio_url = 100
			var min_portfolio_descr = 5


			if (!user.name){
				validation_errors['name'] = 'Por favor introduce tu nombre';
				valid = false;
			}
			else if (user.name.length > max_name){
				validation_errors['name'] = 'Máximo número de carácteres: ' + max_name;
				valid = false;
			}

			//bio validation
			if (!user.bio || user.bio.length<min_bio){
				validation_errors['bio'] = 'Por favor introduce un texto descriptivo de más de ' + min_bio + ' caracteres';
				valid = false;
			}
			else if (user.bio.length>max_bio){
				validation_errors['bio'] = 'Máximo número de carácteres: '+ max_bio + '. Sobran ' + (user.bio.length-max_bio);
				valid = false;
			}

			//email validation
			if (!user.email){
				validation_errors['email'] = 'Por favor introduce tu email';
				valid = false;
			}
			else if (!common.validateEmail(user.email)){
				validation_errors['email'] = 'Por favor introduce un email válido';
				valid = false;
			}

			if (user.cats.length > cats_max){
				validation_errors['cats'] = 'Elige un máximo de ' + cats_max + ' categorías';
				valid = false
			}
			else if (user.cats.length < cats_min){
				validation_errors['cats'] = 'Elige al menos una categoría';
				valid = false
			}

			//tag validation
			if (user.tags.length < tags_min){
				validation_errors['tags'] = 'Por favor introduce al menos ' + tags_min + ' tags';
				valid = false
			}
			else if (user.tags.length > tags_max){
				validation_errors['tags'] = 'El número máximo de tags es ' + tags_max;
				valid = false
			}
			else {
				for (t=0;t<user.tags.length;t++){
					if (user.tags[t].length>tag_max_length){
						validation_errors['tags'] = 'Tag "' + user.tags[t] + '" inválido (' + user.tags[t].length + ' caracteres). El máximo número de caractéres para cada tag es ' + tag_max_length;
						valid = false
						break;
					}
				}
			}

			//region
			if (!user.region){
				validation_errors['region'] = 'Por favor seleccione su región';
				valid = false;
			}

			//github
			if (user.github){
				if (user.github.indexOf('github.com')>-1){
					validation_errors['github'] = 'Por favor introduce solamente tu usuario de github';
					valid = false;
				}
			}

			//twitter
			if (user.twitter){
				if (user.twitter.indexOf('twitter.com')>-1){
					validation_errors['twitter'] = 'Por favor introduce solamente tu usuario de twitter sin @';
					valid = false;
				}
			}

			//location
			if (!user.location){
				validation_errors['location'] = 'Por favor seleccione su ubicación';
				valid = false;
			}

			//portfolio validation
			for (var i=0,c=0;i<user.portfolio.length;i++){
				if (user.portfolio[i].url || user.portfolio[i].descr){
					if (!user.portfolio[i].url){
						validation_errors['portfolio_url' + i] = 'Por favor introduce una URL';
						valid = false;
					}
					else{ //got url
						if (!user.portfolio[i].descr){
							validation_errors['portfolio_descr' + i] = 'Por favor introduce una descripción';
							valid = false;
						}
						else{
							//got descr and url
							if (user.portfolio[i].url.length > max_portfolio_url){
								validation_errors['portfolio_url' + i] = 'URL demasiado larga';
								valid = false;
							}

							//check descr
							if (user.portfolio[i].descr.length > max_portfolio_descr){
								validation_errors['portfolio_descr' + i] = 'Descripción demasiado larga';
								valid = false;
							}
							else if (user.portfolio[i].descr.length < min_portfolio_descr){
								validation_errors['portfolio_descr' + i] = 'Descripción demasiado corta';
								valid = false;
							}
						}
					}
				}
			}
			
			function showErrors (user, validation_errors){
				module_cats.GetCats (redis, null, function (err, categories){
					res.render ('edit_profile', {
						title: 'Crear / editar profile',
						error: 'Ha ocurrido un error procesando el formulario. Por favor revisa los datos introducidos', 
						regions : config.regions,
						validation_errors : validation_errors,
						categories_available : categories,
						number_portfolio_urls: config. number_portfolio_urls,
						user: user,
						layout: 'layout_profile'
					});	
				});
			}

			if (!valid){
				showErrors(user, validation_errors);
			}
			else{
				//let's save!!
				//clean portfolio empty records:
				for (var i=0,c=0;i<user.portfolio.length;i++){
					if (!user.portfolio[i].url && !user.portfolio[i].descr){
						user.portfolio.splice(i,1);
						i--;
					}
				}

				//format
				if (user.web){
					if ((user.web.indexOf('http:')==-1) && (user.web.indexOf('https:')==-1))
						user.web = 'http://' + user.web;
				}
				
				module_users.SetUsers(redis, {users:[user]}, function (err, users_db){
					if (err)
						showErrors(user, validation_errors);
					else{
						if (!users_db[0]){
							console.error ('error saving user. user null')
							showErrors(user, validation_errors);
						}
						else{
							if (!req.session.user.id || (users_db[0].id == req.session.user.id))
								req.session.user = users_db[0]; //editing own profile

							req.flash ('success','¡Tus datos se han grabado correctamente!');
							res.redirect('/editprofile?id='+ users_db[0].id)
						}
					}
				});
			}	
		}

	});
	return app;
};

exports.getApp = getApp;