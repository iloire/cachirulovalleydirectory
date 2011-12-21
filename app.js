var express = require('express');
var app = module.exports = express.createServer();
var http_wrapper = require ('./lib/http_wrapper.js');
var config = require ('./config').values
var common = require ('./lib/common.js');

var module_cats = require("./lib/modules/cats.js")
var module_tags = require("./lib/modules/tags.js")
var module_users = require("./lib/modules/users.js")

//auth
var passport = require('passport')
var LinkedInStrategy = require('passport-linkedin').Strategy;

//redis
var _redis = require("redis")
var redis = _redis.createClient()

var port = parseInt(process.argv[2], 10) || 3000
	
// Configuration
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new LinkedInStrategy({
    consumerKey: config.LINKEDIN_API_KEY,
    consumerSecret: config.LINKEDIN_SECRET_KEY,
    callbackURL: config.base_url + ":" + port + "/auth/linkedin/callback"
  },
  function(token, tokenSecret, profile, done) {
     //User.findOrCreate({ linkedinId: profile.id }, function (err, user) {
		return done(null, profile);
    //});
  }
));

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here.. shhhh' }));

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/auth/linkedin')
}

app.get('/auth/linkedin',
  passport.authenticate('linkedin'),
  function(req, res){
    // The request will be redirected to LinkedIn for authentication, so this
    // function will not be called.
});

app.get('/auth/linkedin/callback', 
  passport.authenticate('linkedin', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
});


app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function (){
  app.use(express.errorHandler()); 
});



/*REST*/
app.get('/api/users/bycat', function(req, res){
	var params = {id : req.query["id"]}
	module_users.GetUsersByCat (redis, params, function (err, users){
		module_tags.GetTagsByCat(redis, params, function (err, tags){
			common.renderJSON(req, res, {users:users, tags: tags}, 200, req.query["callback"])
		});
	});
});

app.get('/api/users/bytag', function(req, res){
	var params = {id : req.query["id"]}
	module_users.GetUsersByTag (redis, params, function (err, users){
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
		common.renderJSON(req, res, {users:users}, 200, req.query["callback"])
	})
});

/*END REST*/

/*MAIN*/
app.get('/', function(req, res){
	module_cats.GetCats (redis, null, function (err, categories){
		res.render('index', {title: 'Home', categories : categories,  users:[], logged_user: req.user});
	})
});

app.get('/login', function(req, res){
	res.redirect ('/auth/linkedin')
});

app.get('/editprofile', ensureAuthenticated, function (req,res){ 
	res.render ('edit_profile', {title: 'Edit profile', logged_user: req.user});
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