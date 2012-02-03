var common = require ('../../lib/common.js');
var Faker = require('Faker');

var module_cats = require("../../lib/modules/cats.js")
var module_users = require("../../lib/modules/users.js")
var module_tags = require("../../lib/modules/tags.js")

var redis 

var extra_users_for_each_cat = 10

function $() { return Array.prototype.slice.call(arguments).join(':') }

/*default categories*/
var cats = [
			{name:'Programadores',descr:'Desarrolladores de software'}, 
			{name:'Diseñadores',descr:'Diseñadores, identidad visual, branding.'},
			{name:'SEO',descr:'Especialistas en SEO y posicionamiento'},
			{name:'Marketing',descr:'Especialistas en Marketing'},
			{name:'Sistemas',descr:'Administradores de sistemas'},
			{name:'UX',descr:'Usabilidad y experiencia de usuario'},
			{name:'Negocio',descr:'Personas de negocio, inversores, etc.'},
			]

/*some dummy default users*/
var users = 
		[
			{	name:'Iván Loire',
				bio:'desarrollador de software y formador freelance, emprendedor, fotógrafo aficionado y trotamundos (2earth.org), en ese orden. O en orden inverso, déjame pensar..', 
				email: 'ivan@iloire.com', 
				location: 'Zufaria, Zaragoza', region : '0',
				image: 'https://twimg0-a.akamaihd.net/profile_images/1180004088/bigorre_300_reasonably_small.jpg', 
				cats: [1,5],
				linkedin_id: 'HWHfu0v9eX',
				twitter : 'ivanloire',
				github : 'iloire',
				web: 'http://www.iloire.com',
				tags: ['c#','node.js', 'asp.net mvc3', '.net', 'redis'],
				other_data : {tech_partner: true, entrepreneur: true, freelance: true, looking_for_contracts: true},
				portfolio : [{url:'http://iloire.com', descr:'Portfolio'},{url:'http://letsnode.com', descr:'Node.js related blog'}]
			},
			{
				name:'Alberto Gimeno',
				bio:'Entrepreneur and developer. Interested in mobile apps (iphone ipad) and high scalability (nodejs and redis). Creator of http://iosboilerplate.com', 
				email: '', 
				location: 'Zaragoza', region : '0',
				image: 'https://twimg0-a.akamaihd.net/profile_images/1174085383/_J106410_reasonably_small.JPG', 
				cats: [1,5],
				linkedin_id: '',
				twitter : 'gimenete',
				github : 'gimenete',
				tags: ['redis','node.js', 'iOS'],
				other_data : {tech_partner : true, entrepreneur: true, freelance: true},
				portfolio : []
			},
			{
				name:'Pablo Jimeno',
				bio:'Project Manager de Sonicbyte. Aprendiz de Ruby, metodologías ágiles y UX. Aficionado a las ciencias y la música (guitarra), entre otras. http://sonicbyte.com/', 
				email: '', 
				location: 'Zaragoza', region : '100',
				image: 'https://twimg0-a.akamaihd.net/profile_images/1475799969/pablo-avatar_reasonably_small.png', 
				cats: [1,2],
				linkedin_id: '',
				twitter : 'pablojimeno',
				tags: ['ror','ruby','linux', 'html5'],
				other_data : {tech_partner : true, entrepreneur: true, freelance: true},
				portfolio : []
			},
			{
				name:'Agustín Raluy',
				bio:'Part time dreamer.', 
				email: '', 
				location: 'Zaragoza', region : '0',
				image: 'https://twimg0-a.akamaihd.net/profile_images/1360363459/eldisparate_agustin_reasonably_small.jpg', 
				cats: [3,4],
				linkedin_id: '',
				twitter : 'pordeciralgo',
				tags: ['macosx','iOs','adsense','marketing online'],
				other_data : {tech_partner : true, entrepreneur: true, freelance: true},
				portfolio : []
			},
			{
				name:'Daniel Latorre',
				bio:'Developer! developer! developer! Jobsket.com co-founder. Beer lover. Pueblerino', 
				email: '', 
				location: 'Zaragoza', region : '0',
				image: 'https://twimg0-a.akamaihd.net/profile_images/1432570237/la_foto__1__reasonably_small.JPG', 
				cats: [1,4],
				linkedin_id: '',
				twitter : 'dani_latorre',
				tags: ['groovy','java','mongo'],
				other_data : {tech_partner : true, entrepreneur: true, freelance: true},
				portfolio : []
			},
			{
				name:'Guillermo Latorre',
				bio:'Probador de software y servicios web, :)', 
				email: '', 
				location: 'Zaragoza', region : '0',
				image: 'https://twimg0-a.akamaihd.net/profile_images/1369467781/avatar-comic_reasonably_small.jpg', 
				cats: [1,3,4],
				linkedin_id: '',
				twitter : 'superwillyfoc',
				tags: ['html','html5','wordpress'],
				other_data : {tech_partner : true, entrepreneur: true, freelance: true},
				portfolio : []
			},
			{
				name:'Fernando Val',
				bio:'Diseñador.. y programador!', 
				email: '', 
				location: 'Zaragoza', region : '0',
				image: 'https://twimg0-a.akamaihd.net/profile_images/1258768022/fer-avatar_reasonably_small.jpg', 
				cats: [1,2],
				linkedin_id: 'M90XVN4Qk9',
				twitter : 'aaromnido',
				tags: ['ror','photoshop','art', 'html5', 'css3'],
				other_data : {tech_partner : true, entrepreneur: true, freelance: false},
				portfolio : []
			},
			{
				name:'Mamen Pradel',
				bio:'Diseño visual y de interacción', 
				email: '', 
				location: 'Zaragoza', region : '10',
				image: 'https://twimg0-a.akamaihd.net/profile_images/1490167269/mamen-1sm2_reasonably_small.jpg', 
				cats: [2],
				linkedin_id: '',
				twitter : 'pensieve',
				tags: ['photoshop','art', 'html5'],
				other_data : {freelance: false},
				portfolio : []
			}
			,
			{
				name:'Eduardo Izquiero',
				bio:'Desarrollador web (Java, .Net) y móvil, creando mis primeras aplicaciones Android, y conociendo otras como Ruby, Grails. Algo hay que hacer.', 
				email: '', 
				location: 'Zaragoza', region : '10',
				image: 'https://twimg0-a.akamaihd.net/profile_images/1367128454/22b7cfa2-5033-447e-91d7-3f9410575ccf_reasonably_small.png',
				cats: [1,2],
				linkedin_id: '',
				twitter : 'SirMartinPiribi',
				tags: ['grails','java', '.net', 'Android', 'adsense'],
				other_data : {freelance: false},
				portfolio : []
			}
			,
			{
				name:'Santiago Magaña',
				bio:'Quien volviendo a hacer el camino viejo aprende el nuevo, puede considerarse un maestro.', 
				email: '', 
				location: 'Zaragoza', region : '10',
				image: 'https://twimg0-a.akamaihd.net/profile_images/1318250314/santi_reasonably_small.jpg',
				cats: [1,2],
				linkedin_id: '',
				twitter : 'Shantydroid',
				tags: ['.NET','iOS', '.net'],
				other_data : {freelance: false},
				portfolio : []
			}
			,
			{
				name:'David Olmos',
				bio:'Java & iOS developer (iPhone - iPad). Desarrollador de cosicas como @FarmaZGZ, infoZaragoza o @DivisasApp. Desarrollador en @cuentica', 
				email: '', 
				location: 'Zaragoza', region : '10',
				image: 'https://twimg0-a.akamaihd.net/profile_images/1727230211/06D6365D-D90E-4AA1-B60A-AC19EB8B1A4A_reasonably_small', 
				cats: [1,2],
				linkedin_id: '',
				web: 'http://www.davidolmos.com',
				twitter : 'olmeras',
				tags: ['iOS'],
				other_data : {freelance: false},
				portfolio : []
			}
			,
			{
				name:'Héctor Rodríguez',
				bio:'iOS and Java developer. Learning Node', 
				email: '', 
				location: 'Zaragoza', region : '10',
				image: 'https://twimg0-a.akamaihd.net/profile_images/1509955857/ACEA7CF2-8880-4848-B8BA-DAF8BEC0F702_reasonably_small',
				cats: [1,2],
				linkedin_id: '',
				web: 'http://bit.ly/rPFL8H',
				twitter : 'torhector',
				tags: ['iOS','Node.js'],
				other_data : {freelance: false},
				portfolio : []
			}
		]

//some tags also
var default_tags = ['java','asp.net','photoshop','adobe illustrator', 'ec2', 'android', 'node.js']

var project_key = 'test'

function ClearDB (callback){
	redis.flushall();
	console.log ('db flushed')	
	callback(null, null)
}

function PopulateCats(callback){
	var params = {cats:cats};
	module_cats.AddCategories (redis, params, function(err, data){
		console.log ('cats populated')
		callback(err, null)
	});
}

function CheckCats(callback){
	var params = {cats:cats};
	module_cats.GetCats (redis, params, function(err, cats_db){
		if (cats.length!=cats_db.length)
			throw 'Error checking on cats db..'

		for (var i=0;i<cats_db.length;i++){
			if (cats[i].name!=cats_db[i].name)
				throw 'Error checking names on cats db..'
		}
		callback(err, 'cats are ok')
	});
}

function AddExtraFakeUsers(callback){
	var time = new Date().getTime()
	module_cats.GetCats (redis, {}, function(err, cats_db){	
		var counter = 0;
		for (var c=0;c<cats_db.length;c++){
			for (var i=0;i<extra_users_for_each_cat;i++){
				var user = {}
				user.name = Faker.Name.findName();
				user.linkedin_id ='';
				user.bio = "This is a fake profile. Most of bla bla, bla bla bla bla of bla bla bla bla, right?" + user.name;
				user.twitter = 'twitter';
				user.web = 'blabla' + i + '.com';
				user.image = 'http://lorempixel.com/output/people-q-c-80-80-7.jpg';
				user.creation_date = time;
				user.email = Faker.Internet.email();
				user.location = 'spain'
				user.region = 1000;
				user.cats = cats_db[c].id;
				user.tags = ['js', 'javascript', 'customtag' + i];
				user.other_data = {freelance: (Math.random() > 0.7), entrepreneur : (Math.random()>0.8)}
				users.push (user);
				counter++;
			}
		}
		console.log (counter + ' extra users added')
		callback (null, null)
	});
}

function PopulateUsers(callback){
	var params = {users: users}
	module_users.AddUsers(redis, params, function (err, users_db){
		console.log (users_db.length + ' users populated');
		callback (null, null);
	});
}

function RandomVotes (callback){
	var params = {uservoted: {id: 7}, vote: 1, user:{id:1}}
	module_users.VoteUser(redis, params, function(err, data){
		console.log('random votes created');
		callback(err, null);
	})
}

/*main*/
var async = require ('async');
var scripts = [
	ClearDB,
	PopulateCats,
	CheckCats,
	AddExtraFakeUsers,
	PopulateUsers,
	RandomVotes
]

function rebuild_database (redis_instance, callback){
	redis = redis_instance;
	async.series(scripts, function(err, results){
		callback (null, results);
	});
}
exports.rebuild_database=rebuild_database;
