var express = require('express');
var app = module.exports = express.createServer();
var http_wrapper = require ('./lib/http_wrapper.js');
var config = require ('./config').values
var common = require ('./lib/common.js');
var api = require ('./api');

var module_cats = require("./lib/modules/cats.js")
var module_tags = require("./lib/modules/tags.js")
var module_users = require("./lib/modules/users.js")

var linkedin_client = require('linkedin-js')(config.LINKEDIN_API_KEY, config.LINKEDIN_SECRET_KEY, config.base_url + "/editprofile")

//redis
var _redis = require("redis")
var redis = _redis.createClient(config.server.database.port, config.server.database.host)

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

//REST
api.configure(app, redis, module_users, module_cats, module_tags);

/*MAIN*/
app.get('/', function(req, res){
	var params = {scope: {region:2, freelance: false}}
	module_users.GetUsers (redis, params, function(err, users){
		res.render('index', {layout:'layout_home', title: 'Directorio CachiruloValley', categories : [],  users:users.slice(0,12), user: req.session.user});
	});
});

app.get('/search', function(req, res){
	res.redirect ('/directory#/search/' + encodeURIComponent(req.query['q']))
});

app.get('/directory', function(req, res){
	module_cats.GetCats (redis, {}, function (err, categories){
		module_tags.GetTags (redis, {}, function (err, tags){
			res.render('index_directory', {title: 'Directorio CachiruloValley', categories : categories, tags:tags,  users:[], user: req.session.user});
		});	
	});
});

app.get('/login', function(req, res){
	res.redirect ('/auth/linkedin')
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
		if (!user.portfolio){
			user.portfolio = [];
		}
		
		module_cats.GetCats (redis, null, function (err, categories){
			res.render ('edit_profile', 
				{
					title: user ? 'Editar perfil': 'Creaar perfil', 
					error:null,
					regions : config.regions,
					validation_errors:[],
					categories_available : categories,
					success: req.flash('success'),
					layout: 'layout_profile',
					user: user
				}
			);	
		})
	}

	function load_and_render(user_linkedin){
		var params = {linkedin_id : user_linkedin.id}
		module_users.GetUserByLinkedinId(redis, params, function (err, user_db){
			if (user_db){
				req.session.user = user_db;
				render (user_db);
			}
			else{
				var user = {}
				user.name = user_linkedin.firstName + ' ' + user_linkedin.lastName;
				user.bio = user_linkedin.headline;
				user.image = user_linkedin.pictureUrl;
				user.location = user_linkedin.location.name;
				user.other_data = {};
				req.session.user = user;
				render (user);
			}
		});
	}
	
	if (!req.session.user){
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
					load_and_render(user_linkedin);
			    }
			 );

		  });	
	}
	else{
		console.log (req.session.user)
		render(req.session.user)
	}
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
			if (error){
				console.log (error)
				res.end ('error contacting linkedin oauth provider. please try again (sorry!)')
			}
			else{
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
			
				user.portfolio=[]
				for (var i=0;i<5;i++){
					user.portfolio[i] = {url: req.param('portfolio_url'+i), descr: req.param('portfolio_descr'+i)};
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
			
				//portfolio validation
				for (var i=0;i<user.portfolio.length;i++){
					if (!user.portfolio[i].url){
						user.portfolio.splice(i,1);
						i--;
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
							user: user,
							layout: 'layout_profile'
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
	    }
	 );
});

app.setMaxListeners(1000)
app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

process.on('SIGINT', function () {
	console.log();
	console.log('Stopping redis client');
	console.log('Bood bye');
	redis.quit();
	process.exit(0);
});