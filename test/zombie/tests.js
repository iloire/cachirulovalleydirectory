var Browser = require("zombie");
var assert = require("assert");
var async = require("async");

function printCurrentTest() {
	console.log(arguments.callee.caller.name + " .............................. OK!");
}

browser = new Browser({debug:false})
var base_address = "http://localhost:3434";

var mocked_user = {
	linkedin_id: '555555',  //let's make up a user that doesn't exist
	name : 'mocked profile', 
	bio: 'im a mock object',
	email : 'mocked@object.com',
	web: 'mywebsite.com',
	twitter : 'mytwitteraccount',
	region : 2,
	location : 'my city, my state',
	other_data : {},
	portfolio : {}
};

exports.setup = function (app){
	//inject session in testing mode
	app.get('/injectsession', function(req, res){
		req.session.user = mocked_user;
		res.end();
	});
}
	
exports.tests = [
	function testHome (callback){
		printCurrentTest();
		browser.visit(base_address, function (err, browser) {
			assert.ok(browser.success);
			assert.ok(!browser.errors.length);
			browser.clickLink ('Entrar al directorio', function(e, browser, status){
				assert.ok (browser.success);
				assert.ok(!browser.errors.length);
				//directory page looks good if I came from link in home
				assert.equal(browser.queryAll("ul#categories li").length, 7);
				callback (null);
			});
		});
	}
	,
	function testDirectorioHome (callback){
		printCurrentTest();
		browser = new Browser()
		browser.visit(base_address + '/directory', function (err, browser) {
			browser.wait (function(err, browser){
				assert.ok(!err)
				assert.ok(browser.success);
				assert.ok(!browser.errors.length)
				//categories in place?
				assert.equal(browser.queryAll("ul#categories li").length, 7);

				//click in category
				browser.clickLink ('ul#categories li a:first', function(e, browser, status){
					assert.ok(!browser.errors.length)
					browser.wait (function (err, browser){
						assert.ok(browser.queryAll("ul#professionals li").length>5);
						assert.ok(browser.queryAll("ul#tags li").length>5);
						callback (null);
					});
				})
			})
		});	
	}
	,
	function testCreateProfilePage (callback){
		printCurrentTest();
		browser = new Browser()
		browser.visit(base_address + '/injectsession', function (err, browser) {
			assert.ok(!err)
			browser.visit(base_address + '/editprofile', function (err, browser) {
				assert.ok(!err)
				browser.wait (function(err, browser){
					assert.ok(!err)
					assert.ok(browser.success);
					assert.ok(!browser.errors.length)
					assert.equal (browser.query('[name=name]').value, mocked_user.name);
					assert.equal (browser.query('[name=email]').value, mocked_user.email);
					assert.equal (browser.query('[name=bio]').value, mocked_user.bio);
					assert.equal (browser.query('[name=web]').value, mocked_user.web);
					assert.equal (browser.query('[name=twitter]').value, mocked_user.twitter);
					assert.equal (browser.query('[name=region]').value, mocked_user.region);
					assert.equal (browser.query('[name=location]').value, mocked_user.location);
					callback(null)
				});
			});	
		});	
	}
	,
	function testEditProfilePage (callback){
		printCurrentTest();
		browser = new Browser()
		browser.visit(base_address + '/injectsession', function (err, browser) {
			browser.visit(base_address + '/editprofile', function (err, browser) {
				assert.ok(!err)
				assert.ok(browser.success);
				//console.log (browser.errors)
				assert.ok(!browser.errors.length);

				browser.wait (function(err, browser){
					assert.ok(!err)
					assert.ok(browser.success);
					assert.ok(!browser.errors.length);

					browser.
					fill("name", "").
					fill("email", "").
					fill("bio", "."). //seems to be a bug in zombie, if empty is entered in a textarea, doesn't behave as it should
					select("region","").
					fill("location","").
					pressButton("Guardar datos y crear / modificar perfil", function(err, browser) {
						assert.ok(!err)
						browser.wait(function(err, browser){
							assert.ok(!err)
							assert.ok(browser.success);
							assert.ok(!browser.errors.length);
							//console.log (browser.html('div.general'));
							assert.ok(browser.html('div.general').indexOf('Por favor introduce tu nombre')>-1);
							assert.ok(browser.html('div.general').indexOf('Por favor introduce tu email')>-1);
							assert.ok(browser.html('div.general').indexOf('Por favor introduce un texto descriptivo')>-1);
							assert.ok(browser.html('div.general').indexOf('Por favor seleccione su región')>-1);
							assert.ok(browser.html('div.general').indexOf('Por favor seleccione su ubicación')>-1);
							assert.ok(browser.html('div.cats').indexOf('Elige al menos una categoría')>-1);
							assert.ok(browser.html().indexOf('Por favor introduce al menos')>-1);

							browser.
							fill("name", 'new' + mocked_user.name).
							fill("email", 'new' + mocked_user.email).
							fill("bio", 'new' + mocked_user.bio).
							fill("web", 'new' + mocked_user.web).
							fill("twitter", 'new' + mocked_user.twitter).
							select("region", '2').
							fill("location", 'new' + mocked_user.location).
							check('categories_available').
							fill('tags','node.js, other, blabla, next, youu').
							pressButton("Guardar datos y crear / modificar perfil", function(err, browser) {
								assert.ok(!err)
								browser.wait(function(err, browser){
									assert.ok(!err)
									assert.ok(browser.success);
									//assert.ok(!browser.errors.length);

									assert.ok(browser.html('div.general').indexOf('Por favor introduce tu nombre')==-1);
									assert.ok(browser.html('div.general').indexOf('Por favor introduce tu email')==-1);
									assert.ok(browser.html('div.general').indexOf('Por favor introduce un texto descriptivo')==-1);
									assert.ok(browser.html('div.general').indexOf('Por favor seleccione su región')==-1);
									assert.ok(browser.html('div.general').indexOf('Por favor seleccione su ubicación')==-1);
									assert.ok(browser.html('div.cats').indexOf('Elige al menos una categoría')==-1);
									assert.ok(browser.html().indexOf('Por favor introduce al menos')==-1);
									
									callback(null);
								});
							});
						})
					})
				});
			});	
		});	
	}
]
