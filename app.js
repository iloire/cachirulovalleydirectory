var express = require('express');
var app = module.exports = express.createServer();
var http_wrapper = require ('./lib/http_wrapper.js');
var config = require ('./config').values
var common = require ('./lib/common.js');

var module_cats = require("./lib/modules/cats.js")
var module_tags = require("./lib/modules/tags.js")
var module_users = require("./lib/modules/users.js")

var linkedin_client = require('linkedin-js')(config.LINKEDIN_API_KEY, config.LINKEDIN_SECRET_KEY, config.base_url + "/editprofile")

//redis
var _redis = require("redis")
var redis = _redis.createClient()

var port = parseInt(process.argv[2], 10) || 3000
	
app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());

	var sessionManagementType=1
	if (sessionManagementType==0){
		app.use(express.session({ secret: 'your secret here.. shhaahh' }));
	}
	else{
		var RedisStore = require('connect-redis')(express);
		app.use(express.session({ secret: "keyboard cat", store: new RedisStore }));
	}

	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function (){
  app.use(express.errorHandler()); 
});



/*REST*/
app.get('/api/tags', function(req, res){
	module_tags.GetTags (redis, {}, function (err, tags){
		res.send ( {tags:tags});
	});
});

app.get('/api/cats', function(req, res){
	module_cats.GetCats (redis, {}, function (err, tags){
		res.send ( {cats:tags});
	});
});

app.get('/api/tagsautocomplete', function(req, res){
	module_tags.GetTags (redis, {}, function (err, tags){
		res.send (tags.join('\n'))
		/*
		var tags_autocomplete = []
		for (var i=0;i<tags.length;i++){
			tags_autocomplete.push (tags[i])
		}
		res.send (tags_autocomplete.join('\n'))
		*/
	});
});

app.get('/api/users/bycat', function(req, res){
	var params = {id : req.query["id"], scope: req.query["scope"]}
	module_users.GetUsersByCat (redis, params, function (err, users){
		module_tags.GetTagsByCat(redis, params, function (err, tags){
			common.renderJSON(req, res, {users:users, tags: tags}, 200, req.query["callback"])
		});
	});
});

app.get('/api/users/bytag', function(req, res){
	var params = {id : req.query["id"], scope: req.query["scope"]}
	module_users.GetUsersByTag (redis, params, function (err, users) {
		common.renderJSON(req, res, {users:users}, 200, req.query["callback"])
	})
});

app.get('/api/users/byid', function(req, res){
	var params = {id : req.query["id"]}
	module_users.GetUser (redis, params, function (err, user){
		common.renderJSON(req, res, {user:user}, 200, req.query["callback"])
	})
});

app.get('/api/search', function(req, res){
	var params = {q : req.query["q"]}
	module_users.Search (redis, params, function (err, users){
		console.log (users)
		common.renderJSON(req, res, {users:users}, 200, req.query["callback"])
	})
});

/*END REST*/

/*MAIN*/
app.get('/', function(req, res){
	res.render('index', {layout:'layout_home', title: 'Home', categories : [],  users:[], user: req.session.user});
});

app.get('/directory', function(req, res){
	module_cats.GetCats (redis, null, function (err, categories){
		res.render('index_directory', {title: 'Home', categories : categories,  users:[], user: req.session.user});
	})
});

app.get('/login', function(req, res){
	res.redirect ('/auth/linkedin')
});

var linkedin_scope = 'id,first-name,last-name,picture-url,location,headline,member-url-resources,site-standard-profile-request,public-profile-url'
app.get('/editprofile', function (req,res){
		
	if (!config.registration_enabled){
		res.send ('En este momento el formulario de registro y modificación de perfil no está habilitado')
		return;
	}
	
	linkedin_client.getAccessToken(req, res, function (error, token) {
	    if (error){
			res.redirect ('/editprofile')
			return;
		}

		req.session.token = token;

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
				var params = {linkedin_id : user_linkedin.id}
				user_linkedin.name = user_linkedin.firstName + ' ' + user_linkedin.lastName;
				user_linkedin.bio = user_linkedin.headline;
				user_linkedin.image = user_linkedin.pictureUrl;
				user_linkedin.location = user_linkedin.location.name;
				user_linkedin.other_data = {}

				module_users.GetUserByLinkedinId(redis, params, function (err, user){
					req.session.user = user || user_linkedin
					module_cats.GetCats (redis, null, function (err, categories){
						res.render ('edit_profile', 
							{
								title: user ? 'Editar perfil': 'Creaar perfil', 
								error:null,
								regions : config.regions,
								validation_errors:[],
								categories_available : categories,
								success: req.flash('success'),
								user: user || user_linkedin
							}
						);	
					})
				});
		    }
		 );
		
	  });
});

//edit or create profile POST
app.post ('/editprofile', function (req,res){
	linkedin_client.apiCall('GET', '/people/~:(' + linkedin_scope + ')',
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
			
			var user = {
				linkedin_id : user_linkedin.id,
				linkedin_profile_url : user_linkedin.publicProfileUrl,
				name : req.param('name'), 
				email : req.param('email'),
				bio : req.param('bio'),
				location : req.param('location'),
				region : req.param('region'),
				web : req.param('web'),
				image : user_linkedin.pictureUrl,
				twitter : req.param('twitter'),
				cats : req.param ('categories_available') || [],
				tags : (req.param ('tags') || "").split(','),
				other_data :  {
					vc_partner : req.param ('vc_partner') || false,
					tech_partner : req.param ('tech_partner') || false,
					business_partner : req.param ('business_partner') || false,
					entrepreneur : req.param ('entrepreneur') || false,
					freelance : req.param ('freelance') || false,
					looking_for_contracts: req.param ('looking_for_contracts') || false
				}
			}

			//validation
			var validation_errors=[]
			var valid=true;

			//name validation
			var max_name = 50
			if (!user.name){
				validation_errors['name'] = 'Por favor introduce tu nombre';
				valid = false;
			}

			if (user.name.length > max_name){
				validation_errors['name'] = 'Máximo número de carácteres: ' + max_name;
				valid = false;
			}

			//bio validation
			if (!user.bio){
				validation_errors['bio'] = 'Por favor introduce un texto descriptivo';
				valid = false;
			}

			var max_bio=200
			if (user.bio.length>max_bio){
				validation_errors['bio'] = 'Máximo número de carácteres: '+ max_bio;
				valid = false;
			}

			//email validation
			if (!user.email){
				validation_errors['email'] = 'Por favor introduce tu email';
				valid = false;
			}

			if (!common.validateEmail(user.email)){
				validation_errors['email'] = 'Por favor introduce un email válido';
				valid = false;
			}


			//cat validation
			var cats_max = 3
			if (user.cats.length > cats_max){
				validation_errors['cats'] = 'Elige un máximo de ' + cats_max + ' categorías';
				valid = false
			}

			if (user.cats.length < 1){
				validation_errors['cats'] = 'Elige al menos una categoría';
				valid = false
			}


			//tag validation
			var tags_max = 15
			var tag_max_length = 25
			if (user.tags.length > tags_max){
				validation_errors['tags'] = 'El número máximo de tags es ' + tags_max;
				valid = false
			}
			
			for (t=0;t<user.tags.length;t++){
				if (user.tags[t].length>tag_max_length){
					validation_errors['tags'] = 'Tag "' + user.tags[t] + '" inválido (' + user.tags[t].length + ' caracteres). El máximo número de caractéres para cada tag es ' + tag_max_length;
					valid = false
					break;
				}
			}

			//region
			if (!user.region){
				validation_errors['region'] = 'Por favor seleccione su región';
				valid = false;
			}

			//location
			if (!user.location){
				validation_errors['location'] = 'Por favor seleccione su ubicación';
				valid = false;
			}

			function showErrors (user, validation_errors){
				module_cats.GetCats (redis, null, function (err, categories){
					res.render ('edit_profile', {
						title: 'Crear / editar profile', 
						error: 'Ha ocurrido un error procesando el formulario. Por favor revisa los datos introducidos', 
						regions : config.regions,
						validation_errors : validation_errors,
						categories_available : categories,
						user: user
					});	
				});
			}

			if (!valid){
				showErrors(user, validation_errors);
			}
			else{
				module_users.AddOrEditUser(redis, {user:user}, function (err, user_db){
					if (err)
						showErrors(user, validation_errors);
					else{
						req.flash ('success','¡Tus datos se han grabado correctamente!')
						res.redirect('/editprofile')
					}
				});
			}
	    }
	 );
});

app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

process.on('SIGINT', function () {
	console.log();
	console.log('Stopping redis client');
	console.log('Bood bye');
	redis.quit();
	process.exit(0);
});