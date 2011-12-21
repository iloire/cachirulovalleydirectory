var _redis = require("redis")
var redis = _redis.createClient()
var common = require ('../lib/common.js');

var Faker = require('Faker');

var module_cats = require("../lib/modules/cats.js")
var module_users = require("../lib/modules/users.js")
var module_tags = require("../lib/modules/tags.js")

var extrausers = 0

function $() { return Array.prototype.slice.call(arguments).join(':') }

/*default categories*/
var cats = [
			{name:'Programadores',descr:'Programadores descr'}, 
			{name:'Diseñadores',descr:'Diseñadores descr'},
			{name:'SEO',descr:'Especialistas en SEO y posicionamiento'},
			{name:'Marketing',descr:'Especialistas en Marketing'},
			{name:'Sistemas',descr:'Administradores de sistemas'},
			{name:'UX',descr:'Usabilidad y experiencia de usuario'},
			{name:'Inversores',descr:'Inversores, capital riesgo, business angels'},
			{name:'LSWC',descr:'Libre Software World Conference Zaragoza'},
			]

/*some dummy default users*/
var users = 
		[
			{	name:'Iván Loire',
				bio:'desarrollador de software y formador freelance, emprendedor, fotógrafo aficionado y trotamundos (2earth.org), en ese orden. O en orden inverso, déjame pensar..', 
				email: 'ivan@iloire.com', location: 'Zufaria, Zaragoza', 
				image: 'https://twimg0-a.akamaihd.net/profile_images/1180004088/bigorre_300_reasonably_small.jpg', 
				cats: [0,4],
				twitter : 'ivanloire',
				tags: ['c#','node.js', 'asp.net mvc3']
			},
			{
				name:'Alberto Gimeno',
				bio:'Entrepreneur and developer. Interested in mobile apps (iphone ipad) and high scalability (nodejs and redis). Creator of http://iosboilerplate.com', 
				email: 'gimenete@gmail.com', location: 'Zaragoza', 
				image: 'https://twimg0-a.akamaihd.net/profile_images/1174085383/_J106410_reasonably_small.JPG', 
				cats: [0,4],
				twitter : 'gimenete',
				tags: ['redis','node.js']
			},
			{
				name:'Pablo Jimeno',
				bio:'Project Manager de Sonicbyte. Aprendiz de Ruby, metodologías ágiles y UX. Aficionado a las ciencias y la música (guitarra), entre otras. http://sonicbyte.com/', 
				email: 'jimeno@gmail.com', location: 'Zaragoza', 
				image: 'https://twimg0-a.akamaihd.net/profile_images/1475799969/pablo-avatar_reasonably_small.png', 
				cats: [0,1],
				twitter : 'pablojimeno',
				tags: ['ror','ruby','linux']
			},
			{
				name:'Agustín Raluy',
				bio:'Part time dreamer.', 
				email: 'agustin@pordeciralgo.net', location: 'Zaragoza', 
				image: 'https://twimg0-a.akamaihd.net/profile_images/1360363459/eldisparate_agustin_reasonably_small.jpg', 
				cats: [2,3],
				twitter : 'pordeciralgo',
				tags: ['macosx','iOs','adsense']
			},
			{
				name:'Daniel Latorre',
				bio:'Developer! developer! developer! Jobsket.com co-founder. Beer lover. Pueblerino', 
				email: 'dani@danilat.com', location: 'Zaragoza', 
				image: 'https://twimg0-a.akamaihd.net/profile_images/1432570237/la_foto__1__reasonably_small.JPG', 
				cats: [0,4],
				twitter : 'dani_latorre',
				tags: ['groovy','java','mongo']
			},
			{
				name:'Guillermo Latorre',
				bio:'Probador de software y servicios web, :)', 
				email: 'blabla@blabla', location: 'Zaragoza', 
				image: 'https://twimg0-a.akamaihd.net/profile_images/1369467781/avatar-comic_reasonably_small.jpg', 
				cats: [0,2],
				twitter : 'superwillyfoc',
				tags: ['html','html5','wordpress']
			},
			{
				name:'Fernando Val',
				bio:'Diseñador.. y programador!', 
				email: 'blabla@blabla', location: 'Zaragoza', 
				image: 'https://twimg0-a.akamaihd.net/profile_images/1258768022/fer-avatar_reasonably_small.jpg', 
				cats: [0,1],
				twitter : 'aaromindo',
				tags: ['ror','photoshop','art']	
			}
		]

//some tags also
var tags = ['java','asp.net','photoshop','adobe illustrator', 'ec2', 'android', 'node.js']

var project_key = 'test'

function ClearDB (callback){
	redis.flushall();
	callback(null, 'db flushed')
}

function QuitDB (callback){
	redis.quit();
	callback(null, 'exit redis')
}

function PopulateCats(callback){
	var params = {cats:cats};
	module_cats.AddCategories (redis, params, function(err, data){
		callback(err,err ? null : 'cats populated')
	});
}

function PopulateTags(callback){	
	var params = {tags:tags}
	module_tags.AddTags (redis, params, function(err, data){
		callback(err,err ? null : 'tags populated')
	});
}

function GetJson (url, callback) {
	require('request')({uri: url}, function (error, response, body) {
		if (!error){ 
			try{
				var data = JSON.parse(body);
				callback(data);
				return;
			}
			catch (err){
				console.log('error parsing json data. status code:' + response.statusCode);
				callback({error: err});
			}
	 	}
		else{
			callback({error: error});
		}
	});
}

function ImportFromFile(callback){
	var fs = require('fs');
	fs.readFile("users.json", "utf8", function(err, data){
		if (!err){
			var users_from_file = JSON.parse(data);
			for (var i=0;i<users_from_file.length;i++){
				var user = users_from_file[i];
				user.cats = [8]; //hardcoded for lswc
				AssingCrazyCategory (user, user.bio);
				
				users.push (user);
			}
			callback (null, 'ok')
		}
		else{
			callback (err, null);
		}
	});
}


function AddUsersFromTwitter(callback){
	var hashtags=['lswc', 'lswc2011', 'express.js', 'node.js', 'linux', 'Nginx', 'opensource', 'joomla','Zimbra', 'money'];
	async.forEach(hashtags, AddUsersFromTwitterByKeyWord, function(err){
	   if (!err)
		 callback(null, 'ok')
	  else{
		callback (err, null)
		}
	});
}


function AssingCrazyCategory(user, text){
	//crazy random cat assignation
	if (text.indexOf (' node')>0)
		user.cats.push (1);

	if (text.indexOf (' seo')>0)
		user.cats.push (3);

	if ((text.indexOf (' inversi')>0) || (text.indexOf (' money')>0))
		user.cats.push (7);

	if ((text.indexOf (' backup')>0) || (text.indexOf (' script')>0))
		user.cats.push (5);

	if ((text.indexOf (' sinergia')>0) || (text.indexOf (' roi')>0))
		user.cats.push (4);
}

function AddUsersFromTwitterByKeyWord(hashtag, callback){
	var url = 'http://search.twitter.com/search.json?q=%23' + encodeURIComponent(hashtag) + '&rpp=100&include_entities=true&result_type=mixed';
	GetJson (url, function (data){	
		console.log ('fetching json from: ' + url)
		if (data.error){
			callback (data.error);
		}
		else{
			var time = new Date().getTime()
			
			for (var i=0;i<data.results.length;i++){ //TODO: avoid duplicates in users
				var result= data.results[i];
				var user = {}
				user.name = result.from_user;
				user.bio = result.text
				user.twitter = result.from_user;
				user.image = result.profile_image_url;
				user.creation_date = time;
				user.email = "";
				user.location = 'spain'
				user.cats = [8]; //lswc, hardcoded
			
				AssingCrazyCategory (user, result.text)

				user.tags = [hashtag];
		
				users.push (user);
				//console.log ('user ' + user.name + ' added from hashtag ' + hashtag)
			}
			callback (null);
		}
		
	})
}

function PopulateUsers(callback){
	var params = {users: users}
	module_users.AddUsers(redis, params, function (err, data){
		callback (err, err ? null : 'users populated');
	});
}

function AddExtraFakeUsers(callback){
	var time = new Date().getTime()
	for (i=0;i<extrausers;i++){
		var user = {}
		user.name = Faker.Name.findName();
		user.bio = "bio de " + user.name;
		user.twitter = user.name;
		user.image = 'http://lorempixum.com/output/people-q-c-60-60-6.jpg';
		user.creation_date = time;
		user.email = Faker.Internet.email();
		user.location = 'spain'
		user.cats = [6];
		user.tags = ['js', 'javascript'];
		
		users.push (user);
	}
	callback (null, 'extra users added')
}

/*main*/
var async = require ('async')

async.series([
	ClearDB,
	PopulateTags,
	PopulateCats,
	AddExtraFakeUsers,
	ImportFromFile,
	//AddUsersFromTwitter,
	PopulateUsers,
	QuitDB
],
function(err, results){
	if (err)
		console.log (err)
	else {
		console.log ('ok')
	}
	redis.quit;
});
