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
	name : 'mocked profile ' + new Date().getTime(), //make it unique per test 
	bio: 'im a mock object',
	email : 'mocked@object.com',
	web: 'mywebsite.com',
	twitter : 'mytwitteraccount',
	region : 2,
	location : 'my city, my state',
	other_data : { vc_partner:false, tech_partner: true, freelance:true },
	portfolio : [{url: 'wwooo.com', descr:'my wwooo.com web site :) '}]
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

						//click in tag
						browser.clickLink ('ul#tags li a:first', function(e, browser, status){
							assert.ok(!browser.errors.length)
							browser.wait (function (err, browser){
								assert.equal(browser.queryAll("ul#professionals li").length,3);
								callback (null);
							});
						})
					});
				})
			})
		});	
	}
	,
	/*
	function testTestLandingFromTag (callback){
		printCurrentTest();
		browser = new Browser()
		browser.location = base_address + '/directory#/tags/node.js';
			browser.wait (function(err, browser){
				assert.ok(!err)
				assert.ok(browser.success);
				assert.ok(!browser.errors.length)
				assert.equal(browser.queryAll("ul#professionals li").length,3);
				callback (null);
			})
	}
	,
	*/
	function testCreateProfilePage (callback){
		printCurrentTest();
		browser = new Browser()
		browser.visit(base_address + '/injectsession', function (err, browser) {
			assert.ok(!err)
			browser.visit(base_address + '/editprofile', function (err, browser) {
				assert.ok(!err)
				assert.ok(browser.success);
				browser.wait (function(err, browser){
					assert.ok(!err)
					assert.ok(browser.success);
					assert.ok(!browser.errors.length);
					//console.log(browser.html());
					assert.equal (browser.query('[name=name]').value, mocked_user.name);
					assert.equal (browser.query('[name=email]').value, mocked_user.email);
					assert.equal (browser.query('[name=bio]').value, mocked_user.bio);
					assert.equal (browser.query('[name=web]').value, mocked_user.web);
					assert.equal (browser.query('[name=twitter]').value, mocked_user.twitter);
					assert.equal (browser.query('[name=region]').value, mocked_user.region);
					assert.equal (browser.query('[name=location]').value, mocked_user.location);
					assert.equal (browser.query('[name=portfolio_url0]').value, mocked_user.portfolio[0].url);
					assert.equal (browser.query('[name=portfolio_descr0]').value, mocked_user.portfolio[0].descr);
					
					assert.equal (browser.query('[name=vc_partner]').checked, false);
					assert.equal (browser.query('[name=tech_partner]').checked, true);
					assert.equal (browser.query('[name=business_partner]').checked, false);
					assert.equal (browser.query('[name=entrepreneur]').checked, false);
					assert.equal (browser.query('[name=freelance]').checked, true);
					assert.equal (browser.query('[name=looking_for_contracts]').checked, false);
					
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
				assert.ok(!browser.errors.length);

				browser.wait (function(err, browser){
					assert.ok(!err)
					assert.ok(browser.success);
					assert.ok(!browser.errors.length);

					//fill empty data and test validation.
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

							var mocked_tags = 'node.js,other,blabla,next,youu'; //no spaces

							//fill all fields, and make sure everything is there if validation fails
							browser.
							fill("name", 'new' + mocked_user.name).
							fill("email", 'new' + mocked_user.email).
							fill("bio", 'new' + mocked_user.bio + Array(200).join('.')). //too big
							fill("web", 'new' + mocked_user.web).
							fill("twitter", 'new' + mocked_user.twitter).
							select("region", '0').
							fill("location", 'new' + mocked_user.location).
							check('categories_available').
							fill('tags', mocked_tags).
							check('vc_partner').
							check('tech_partner').
							check('business_partner').
							check('entrepreneur').
							check('freelance').
							check('looking_for_contracts').
							fill('portfolio_url0','myurl.com').
							fill('portfolio_descr0','myurl.com descr').

							pressButton("Guardar datos y crear / modificar perfil", function(err, browser) {
								assert.ok(!err)
								browser.wait(function(err, browser){
									assert.ok(!err)
									//console.log (browser.errors)
									assert.ok(browser.success);
									//assert.ok(!browser.errors.length);
									assert.ok(browser.html('div.general').indexOf('Máximo número de carácteres')>-1);
									assert.ok(browser.html().indexOf('Ha ocurrido un error, por favor revisa los datos introducidos')>-1);									

									//check data is bak ok
									assert.equal (browser.query('[name=name]').value, 'new'+ mocked_user.name);
									assert.equal (browser.query('[name=email]').value, 'new'+ mocked_user.email);
									assert.equal (browser.query('[name=web]').value, 'new'+ mocked_user.web);
									assert.equal (browser.query('[name=twitter]').value, 'new'+ mocked_user.twitter);
									assert.equal (browser.query('[name=region]').value, '0');
									assert.equal (browser.query('[name=location]').value, 'new'+ mocked_user.location);
									assert.equal (browser.query('[name=tags]').value, mocked_tags);

									assert.equal (browser.query('[name=vc_partner]').checked, true);
									assert.equal (browser.query('[name=tech_partner]').checked, true);
									assert.equal (browser.query('[name=business_partner]').checked, true);
									assert.equal (browser.query('[name=entrepreneur]').checked, true);
									assert.equal (browser.query('[name=freelance]').checked, true);
									assert.equal (browser.query('[name=looking_for_contracts]').checked, true);

									assert.equal (browser.query('[name=portfolio_url0]').value, 'myurl.com');
									assert.equal (browser.query('[name=portfolio_descr0]').value, 'myurl.com descr');
									
									browser.fill("bio", 'new' + mocked_user.bio). //too big
									
									pressButton("Guardar datos y crear / modificar perfil", function(err, browser) {
										assert.ok(!err)
										browser.wait(function(err, browser){
											assert.ok(!err)
											//console.log (browser.errors)
											assert.ok(browser.success);
											//assert.ok(!browser.errors.length);
											assert.ok(browser.html().indexOf('Tu perfil ha sido modificado satisfactoriamente')>-1)
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
								});
							});
						})
					})
				});
			});	
		});	
	}
	,
	function testVoteUser (callback){
		printCurrentTest();
		browser = new Browser()
		browser.visit(base_address + '/directory', function (err, browser) {
			browser.wait (function(err, browser){
				assert.ok(!err)
				assert.ok(browser.success);
				assert.ok(!browser.errors.length)

				//click in category
				browser.clickLink ('ul#categories li a:first', function(e, browser, status){
					assert.ok(!browser.errors.length)
					browser.wait (function (err, browser){
						assert.ok(browser.queryAll("ul#professionals li").length>5);
						//console.log (browser.html ('ul#professionals li div a:first'));
						browser.clickLink ('ul#professionals li div a:first', function(e, browser, status){
							assert.ok(!browser.errors.length)
							browser.wait (function (err, browser){
								assert.ok(!browser.errors.length)	
								//we should have div.profile filled. zombie's bug?
								//console.log (browser.html ('div.profile'));
								callback (null);
							});
						});
					});
				})
			})
		});	
	}
]
