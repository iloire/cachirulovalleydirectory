var common = require ('../../lib/common');
var Faker = require('Faker');
var module_cats = require("../../lib/modules/cats")
var module_users = require("../../lib/modules/users")
var module_tags = require("../../lib/modules/tags")
var config = require ('../../config').values;

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
				linkedin_id: 'xxxxxxxx',
				web: 'http://iosboilerplate.com',
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
				linkedin_id: 'wqerwqerweqr',
				web: 'http://sonicbyte.com',
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
				linkedin_id: '234234wer',
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
				linkedin_id: 'qwerdffs',
				twitter : 'dani_latorre',
				web: 'http://danilat.com',
				github: 'danilat',
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
				linkedin_id: 'wrasdfsdf',
				twitter : 'superwillyfoc',
				web: 'http://hachemuda.com',
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
				web: 'http://www.fernandoval.es/',
				tags: ['ror','photoshop','art', 'html5', 'css3'],
				other_data : {tech_partner : true, entrepreneur: true, freelance: false},
				portfolio : []
			},
			{
				name:'Mamen Pradel',
				bio:'Diseño visual y de interacción', 
				email: '', 
				location: 'Zaragoza', region : '100',
				image: 'https://twimg0-a.akamaihd.net/profile_images/1490167269/mamen-1sm2_reasonably_small.jpg', 
				cats: [2],
				linkedin_id: 'asdf23423',
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
				location: 'Zaragoza', region : '100',
				image: 'https://twimg0-a.akamaihd.net/profile_images/1367128454/22b7cfa2-5033-447e-91d7-3f9410575ccf_reasonably_small.png',
				cats: [1,2],
				linkedin_id: 'asdfs234234',
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
				location: 'Zaragoza', region : '100',
				image: 'https://twimg0-a.akamaihd.net/profile_images/1318250314/santi_reasonably_small.jpg',
				cats: [1,2],
				linkedin_id: 'asdf234234',
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
				location: 'Zaragoza', region : '100',
				image: 'https://twimg0-a.akamaihd.net/profile_images/1727230211/06D6365D-D90E-4AA1-B60A-AC19EB8B1A4A_reasonably_small', 
				cats: [1,2],
				linkedin_id: '234324wafsdf',
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
				location: 'Zaragoza', region : '0',
				image: 'https://twimg0-a.akamaihd.net/profile_images/1509955857/ACEA7CF2-8880-4848-B8BA-DAF8BEC0F702_reasonably_small',
				cats: [1,2],
				linkedin_id: '2344sfasdf',
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
				user.linkedin_id = common.rnd (2000,100000);
				user.bio = 'My bio in latin: atque laborum voluptatem minima ut dicta dolore rerum rerum soluta voluptatem ea repellendus eos cumque excepturi qui occaecati molestiae quis earum dolor commodi atque vitae'; //Faker.Lorem.paragraphs(1)
				user.twitter = 'twitter';
				user.web = 'http://' + Faker.Internet.domainName();
				user.image = config.base_url + '/images/avatar' + common.rnd(0,5)  + '.jpg';
				user.creation_date = time;
				user.email = Faker.Internet.email();
				user.location = Faker.Address.city();
				user.region = (i>7) ? 1000 : ((i>8) ? 100 : 0);
				user.cats = cats_db[c].id;
				user.tags = ['js', 'javascript', 'customtag' + (i + " ").substring(0,1)];
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
	module_users.SetUsers(redis, params, function (err, users_db){
		console.log (users_db.length + ' users populated');
		callback (null, null);
	});
}

function RandomVotes (callback){
	var params = {uservoted: {id: 7}, vote: 1, user:{id:1}}
	module_users.VoteUser(redis, params, function(err, data){
		console.log('random votes ok');
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
