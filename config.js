exports.values = {
	version: '0.2.11',
	server : {
		production : {
			database : { port: 1212, host : '127.0.0.1', db: 'cachirulo' },
			session_database : { port: 1212, host : '127.0.0.1', db: 'cachirulo' }
		},
		test : {
			database : { port: 1213, host : '127.0.0.1', db: 'test' }
		}
	},
	min_tags_count_to_show : 2, //minimum ammount of tags to show
	default_page_size: 15,
	admins: ['HWHfu0v9eX'],
	number_portfolio_urls : 5,
	base_url : 'http://localhost:3000',
	project_key: 'CachiruloValleyDirectory', //redis prefix
	LINKEDIN_API_KEY : process.env.LINKEDIN_API_KEY,
	LINKEDIN_SECRET_KEY : process.env.LINKEDIN_SECRET_KEY,
	registration_enabled : true,
	suggested_tags : [
						'java', 'php','asp.net', 'node.js', 'asp.net mvc', 'c#', //programming
						'photoshop','illustrator', 'UX', 'business intelligence', 'web design', 'banners'  //design
					],
	regions : [
		//0-10: local
		//11-100: national
		//101-1000: worlwide
		{name: 'Zaragoza', value: 0},
		{name: 'Huesca', value: 1},
		{name: 'Teruel', value: 2},
		{name: '--', value: null},
		{name: 'Resto de España', value: 100},
		/*
		{name: 'Álaba', value: '10'},
		{name: 'Albacete', value: '11'},
		{name: 'Alicante', value: '12'},
		{name: 'Almería', value: '13'},
		{name: 'Asturias', value: '14'},
		{name: 'Ávila', value: '15'},
		{name: 'Badajoz', value: '16'},
		{name: 'Barcelona', value: '17'},
		{name: 'Burgos', value: '18'},
		...
		*/		
		{name: '--', value: null},
		{name: 'Fuera de España', value: 1000},
		
	]
}