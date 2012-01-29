var express = require('express');
//var http_wrapper = require ('./lib/http_wrapper.js');
var config = require ('./config').values
var common = require ('./lib/common.js');
var api = require ('./api');

var module_cats = require("./lib/modules/cats.js")
var module_tags = require("./lib/modules/tags.js")
var module_users = require("./lib/modules/users.js")

var linkedin_client = require('linkedin-js')(
	config.LINKEDIN_API_KEY, 
	config.LINKEDIN_SECRET_KEY, 
	config.base_url + "/login"
)

var app = module.exports = express.createServer();

var _redis = require("redis")
var redis = _redis.createClient(config.server.database.port, config.server.database.host)
	
app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());

	var sessionManagementType = 1
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

app.get('/', function(req, res){
	var params = {scope: {region:2, freelance: false}}
	module_users.GetUsers (redis, params, function(err, users){
		res.render('index', {layout:'layout_home', title: 'Directorio CachiruloValley', categories : [],  users:users.slice(0,12), user: req.session.user});
	});
});

app.get('/login', function(req, res){
	if (!req.session.user){
		linkedin_client.getAccessToken(req, res, function (error, token) 
		{
		    if (error){
				res.redirect ('/')
				return;
			}
			req.session.token = token;
			
			function get_user_or_new_from_linkedin_data(user_linkedin, callback){
				var params = {linkedin_id : user_linkedin.linkedin_id}
				module_users.GetUserByLinkedinId(redis, params, function (err, user_db){
					if (user_db){
						callback (user_db);
					}
					else{
						//doesn't exist in the database yet
						//convert from linkedin user data type to our data type
						var user = {}
						user.linkedin_id = user_linkedin.id;
						user.name = user_linkedin.firstName + ' ' + user_linkedin.lastName;
						user.bio = user_linkedin.headline;
						user.image = user_linkedin.pictureUrl;
						user.location = user_linkedin.location.name;
						user.other_data = {};
						user.portfolio = {};
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
					console.log (error)
				}else{
					user_linkedin.linkedin_id = user_linkedin.id; //save id from linkedin in our linkedin_id property
					user_linkedin.id = null;
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

app.post('/vote', function(req, res){
	if (!req.session.user){
		common.renderJSON(req, res, {error: 'no session'}, 403)
		return;
	}
	var params = {uservoted: {id: req.param('user_voted_id')}, user: req.session.user, vote: req.param('vote'), logged_user: req.session.user};
	module_users.VoteUser (redis, params , function (err, status){
		if (err){
			common.renderJSON(req, res, err, 503, req.query["callback"])
		}
		else{
			common.renderJSON(req, res, status, 200, req.query["callback"])
		}
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


	
	if (!req.session.user){
		req.session.redirect = '/editprofile';
		res.redirect ('/login');
	}
	else{
		var params = {id : req.session.user.id}
		module_users.GetUserByLinkedinId(redis, params, function (err, user_db){
			if(user_db)
				render(user_db)
			else{
				render(req.session.user); //user is not recorded yet
			}
		});
	}
});

//edit or create profile POST
app.post ('/editprofile', function (req,res){
	if (!config.registration_enabled){
		res.send ('En este momento el formulario de registro y modificación de perfil no está habilitado')
		return;
	}
	
	if (!req.session.user){
		console.log ('user session not found')
		res.redirect ('/editprofile')
		return;
	}

	var user = {
		id : req.session.user.id,
		linkedin_id : req.session.user.linkedin_id,
		name : req.param('name') || '', 
		email : req.param('email') || '',
		bio : req.param('bio') || '',
		location : req.param('location') || '',
		region : req.param('region') || '',
		web : req.param('web') || '',
		image : req.session.user.image,
		twitter : (req.param('twitter') || '').replace('@',''),
		cats : req.param ('categories_available') || [],
		tags : req.param ('tags') ? req.param ('tags').split(',') : [], 
		other_data :  {
			vc_partner : req.param ('vc_partner') || false,
			tech_partner : req.param ('tech_partner') || false,
			business_partner : req.param ('business_partner') || false,
			entrepreneur : req.param ('entrepreneur') || false,
			freelance : req.param ('freelance') || false,
			looking_for_contracts: req.param ('looking_for_contracts') || false
		}
	}
	
	//console.log (user)

	user.portfolio=[]
	for (var i=0;i<5;i++){
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
		validation_errors['bio'] = 'Máximo número de carácteres: '+ max_bio;
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
		else{ //got url
			//max_portfolio_descr
			if (user.portfolio[i].descr.length>max_portfolio_descr){
				validation_errors['portfolio_descr' + i] = 'Descripción demasiado larga';
				valid = false;
			}
			else if (user.portfolio[i].descr.length<min_portfolio_descr){
				validation_errors['portfolio_descr' + i] = 'Descripción demasiado corta';
				valid = false;
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
				req.session.user = user_db
				req.flash ('success','¡Tus datos se han grabado correctamente!')
				res.redirect('/editprofile')
			}
		});
	}
});

process.on('SIGINT', function () {
	console.log();
	console.log('Stopping redis client');
	console.log('Bood bye');
	redis.quit();
	process.exit(0);
});