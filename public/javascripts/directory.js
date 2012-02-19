var viewModel = {
	logged_user: ko.observable(),
	professionals: ko.observableArray(),
	tags: ko.observableArray(),
	cats: ko.observableArray(),
	filter: ko.observableArray(),

	bindprofessionals  : function (professionals){
		for (var p=0;p<professionals.length;p++){
			professionals[p].expanded = false;
		}
		this.professionals = ko.mapping.fromJS(professionals)
		ko.applyBindings(this);
	}
	,
	get_user_from_ViewModel : function (id){
		var users = this.professionals();
		for (var i=0,l=users.length;i<l;i++){
			if (users[i].id() == id){
				return users[i];
			}
		}
		return null;
	}
};

function log(str) {console.log (str)}

var tags_initial_offset = 0;

viewModel.tagslist = ko.dependentObservable(function() {
	var tags=[];
	if (this.tags()){
		var tags_list = this.tags();
		for (var i=0, c=tags_list.length;i<c;i++){
			tags.push ({name: tags_list[i].t || tags_list[i], safe_name:encodeURIComponent(tags_list[i].t || tags_list[i]), counter: tags_list[i].n || ''});
		}
	}
	return tags;
}, viewModel);

var last_query = null;
var loading = '<img class=loading alt="loading..." src="/images/menu-loading.gif" />'

function setFilterDisplay (initial_filter){
	var scope = getScope();

	initial_filter.push({name: 'Región', value: (scope.region==1000) ? 'Todas' : ((scope.region==100) ? 'España' : 'Aragón') });
	if (scope.freelance)
		initial_filter.push({name: 'Freelance', value: 'SI'});

	if (scope.entrepreneur)
		initial_filter.push({name: 'Emprendedor', value: 'SI'});

	viewModel.filter (initial_filter);
}

function getScope(){ 
	var scope = {}

	scope.freelance = ($('#freelance_scope').is(':checked')) ? true : false
	scope.entrepreneur = ($('#entrepreneur_scope').is(':checked')) ? true : false

	if ($('#worldwide_scope').is(':checked')){
		scope.region=1000
	}
	else if ($('#national_scope').is(':checked')){
		scope.region=100
	}
	else if ($('#regional_scope').is(':checked')){
		scope.region=10 //regional
	}
	else
		scope.region=1000 //nothing selected

	return scope;
}

function set_content_by_hash (hash, callback){

	var params = {};
	//pagination
	if ($.address.parameter('p')){
		params.from = $.address.parameter('p');
	}
	
	if (hash.indexOf('/search')==0){
		params.search = decodeURIComponent(hash.split ('/')[2]);
		$('#searchBox').val(params.search);
		directory.search(params, function (err, data, ui_status){
			$(document).trigger("directory.onProfessionalListChanged", ui_status);
			$(document).trigger("directory.onSearchCompleted", ui_status.search);
			
			if (callback) callback();
		});
	}
	else if (hash.indexOf('/user')==0){
		var id_profile = hash.split ('/')[2];
		var container = $('#profile' + id_profile);
		if (container.length){
			var user = viewModel.get_user_from_ViewModel(id_profile)
			if (user){
				renderProfile(user, function (err, data){
					$(document).trigger("directory.onProfileLoaded", user);
					if (callback) callback();
				});
			}
		}
		else{ //load directly
			directory.load_profile(id_profile, function (err, user){
				directory.load_data ({id_cat: user.cats[0], bindusers: false, bindtags:false}, function(err, data){
					viewModel.bindprofessionals([user]);
					renderProfile(viewModel.professionals()[0], function(err, data){
						$(document).trigger("directory.onProfileLoaded", user);	
						if (callback) callback();
					});
				});
			});
		}
	}
	else{
		var match_cat_tag = /\/categories\/(.*)\/(.*)\/tag\/(.*)/ 
		var match_cat = /\/categories\/(.*)\/(.*)/
		var match_tag = /\/tags\/(.*)/
		if (hash.match(match_cat_tag)){ //have both cat and tag
			var match = hash.match(match_cat_tag);
			params.id_cat = match[1];
			params.tag = decodeURIComponent(match[3]);
		}
		else if (hash.match(match_cat)){
			var match = hash.match(match_cat);
			params.id_cat = match[1];
			params.tag = null;
		}
		else if (hash.match(match_tag)){
			var match = hash.match(match_tag);
			params.tag = decodeURIComponent(match[1]);
		}
		else
			params.id_cat = 1;

		directory.load_data (params, function(err, data, ui_status){
			$(document).trigger("directory.onProfessionalListChanged", ui_status);
			if (callback) callback();
		});
	}
}

function getGitHubProjects(user, where){
	var cachekey = 'github ' + user;
	if ($('body').data(cachekey)) { //save in dom via data() jquery attribute
		$(where).html($('body').data(cachekey));
	}
	else{
		$(where).html(loading);
		$.getJSON('https://api.github.com/users/' + user + '/repos?callback=?', function(data){
			var own_projects=[]
			for(var i=0;i<data.data.length;i++){
				if (!data.data[i].fork)
					own_projects.push (data.data[i]);
			}
			
			//sort
			function sorter(a,b) { return b.watchers - a.watchers; }
			
			own_projects.sort(sorter);
			
			if (own_projects.length){
				var output="<ul>";
				for (var i=0, c=0 ;(c<5 && i<own_projects.length);i++){
						output = output + '<li><a title="watchers" target=_blank href="'+ own_projects[i].html_url + '/watchers">' + own_projects[i].watchers + '</a>' + ' / <a title="forks" target=_blank href="'+ own_projects[i].html_url + '/network">' + own_projects[i].forks + '</a>' + ' - <a target=_blank href="'+ own_projects[i].html_url + '">' + own_projects[i].name + '</a>: ' + own_projects[i].description + '</li>'; //todo
						c++;
				}
				output = output + "</ul>";
			}
			else{
				output = '<p>No se han encontrado proyectos propios públicos.</p>'
			}
			
			$(where).html(output);
			$('body').data(cachekey, output);
		});
	}
}

function replaceURLWithHTMLLinks(text) {
    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(exp,"<a target=_blank href='$1'>$1</a>"); 
}

function replaceTwText (text){
	return replaceURLWithHTMLLinks(text);
}

function getTwTimeline(user, where, callback){
	if ($('body').data(user)) { //save in dom via data() jquery attribute
		var cached_data=$('body').data(user);
		$(where).html(cached_data);
		$("abbr.timeago").timeago();
		if (callback)
			callback(null, cached_data);
	}
	else{
		$(where).html(loading);
		$.getJSON('http://twitter.com/status/user_timeline/'+ user +'.json?count=50&callback=?&exclude_replies=true&trim_user=true&include_rts=false', {cache:true}, function(data, status){
			//last tweets
			var output="<ul>";
			for (var i=0, c=0 ;(c<5 && i<data.length);i++){
				if (!data[i].in_reply_to_user_id){
					output = output + '<li><abbr class="timeago" title="' + data[i].created_at + '">' + data[i].created_at + '</abbr> ' + replaceTwText(data[i].text) + "</li>"; //todo
					c++;
				}
			}
			output = output + "</ul>";
			$(where).html(output);
			if (callback)
 				callback(null, output);
			$("abbr.timeago").timeago();
			$('body').data(user, output);
		});
	}
}

function renderProfile(user, callback){
	user.expanded(true);

	if (user.twitter)
		getTwTimeline(user.twitter(), $('#profile'+ user.id() + ' .tw_timeline'));

	if (user.github)
		getGitHubProjects(user.github(), $('#profile'+ user.id() + ' .github_projects'));
		
	if (callback)
		callback (null, user);
}

var directory = (function () {
	var dir = {}
	var ui_status = {id_cat:1, tag: '', cat:{}};
 	
	function post (url, params, callback){
		 $.ajax({
				type: "POST",
				url: url,
				data: params,
				success: function onSuccess(data, status){
					callback(null, data.user);
				},
	        	error: function onError(data, status){
					var error=''
					if (data.status==403){
						error = 'Error, session expired of permission denied';
					}else {	
						error = 'Error processing request';
					}
					alert(error);
					callback(error, null);
				}
	    });
	}
	
	//PUBLIC
	dir.load_profile = function (id_profile, callback){
		$.getJSON('api/users/byid', {id:id_profile}, function (data) {
			callback(null, data.user)
		});
	}

	dir.load_data = function (params, callback){
		if (!params) params={}

		if (params.id_cat || params.tag) params.search = null; //clean search
		if ((params.id_cat!=ui_status.id_cat || params.tag!=ui_status.tag) && !params.from)
			params.from = 0; //reset pagination

		for (var prop in ui_status) {
			if (params[prop]===undefined){
				params[prop] = ui_status[prop] || '';
			}
			else if (params[prop]===null){
				params[prop] = '';
			}
		}
		
		params.scope = getScope();

		$.getJSON(params.search ? '/api/search' : '/api/users', params, function (data) 
		{
			if (params.bindusers!==false){
				viewModel.bindprofessionals (data.users);
			}

			
			viewModel.logged_user (data.logged_user);
			
			if (data.tags && (params.bindusers!==false)){
				viewModel.tags (data.tags);
			}

			viewModel.cats (data.cats);

			ui_status = params;
			ui_status.pagination = data.pagination;
			
			if (data.cat)
				ui_status.cat = data.cat;

			if (callback)
				callback(null, data, ui_status);
		});	
	}
	
	dir.vote = function (params, callback){
		params.user_voted_id = params.id;
		post('/vote', params, callback);
	}
	
	dir.favorite = function (params, callback){
		params.user_fav_id = params.id;
		params.favstatus = params.favstatus;
		post('/favorite', params, callback);
	}

	dir.search = function (params, callback){
		this.load_data(params, callback);
	}
	
	return dir;
}());

$(document).ready(function () {
		
	tags_initial_offset = $('.tags').offset();

	//event binding ---
	$(document).bind("directory.onChangeSorting",function(e, sort){
		directory.load_data({sort:sort}, function (err, data, ui_status){
			$(document).trigger("directory.onProfessionalListChanged", ui_status);
		});
	});
	
	$(document).bind("directory.onChangeFilter",function(e, tag){
		directory.load_data({}, function (err, data, ui_status){
			$(document).trigger("directory.onProfessionalListChanged", ui_status);
		});
	});
	
	//when data is binded to list of professionals
	$(document).bind("directory.onProfessionalListChanged",function(e, ui_status){
		$('.tags').offset({top: tags_initial_offset.top}); //set tags back up
		scroll(0,0);

		$('ul#professionals li div.short').show();
		
		var full_link = ''
		var selected = [];
		if (ui_status.search){
			selected.push({name: 'Search', value: ui_status.search, type: 'primary tag'});
			full_link = '/search/' + encodeURIComponent(ui_status.search);
		}
		else{
			var link = '';
			if (ui_status.cat && ui_status.cat.id){
				var text = "";
				$('ul#categories li').removeClass('selected');
				$('ul#categories li a').each(function() {
					if ($(this).attr('idcat') == ui_status.cat.id) {
						$(this).parent().addClass('selected');
					}
				});
				link = "/categories/" + ui_status.cat.id + '/' + ui_status.cat.name;
				selected.push({name: 'Categoría', value: ui_status.cat.name, type: 'primary cat'});
			}

			full_link = link;

			$('ul#tags li').removeClass('selected'); //remove selected from tags
			$('ul#tags li a').each(function() {
				$(this).click (function () { return false; });

				$(this).attr('rel', "address:" + link + '/tag/' + encodeURIComponent($(this).text()));
				$(this).attr('href', '/directory' + link + '/tag/' + encodeURIComponent($(this).text()));
				if ($(this).attr('tag') == ui_status.tag) {
					$(this).parent().addClass('selected');
				}
			});

			if (ui_status.tag){
				selected.push({name: 'Tag', value: ui_status.tag, type: 'primary tag'});
				full_link += "/tag/" + encodeURIComponent(ui_status.tag);
			}
			
			$('#searchBox').val('');
		}

		//pagination
		var str = '';
		if (ui_status.pagination.total_records){
			str = '<span>Total registros: ' + ui_status.pagination.total_records + '</span>';
			if (ui_status.pagination.total > 1){
				var dot = false
				var limit = 4;
				var current = parseInt(ui_status.pagination.from,10);
				for (var i=0;i<ui_status.pagination.total;i++){
					if ((i==(current+limit))) dot=false;
					if ((i>ui_status.pagination.total-3) || (i<2) || (i>(current-limit)) && (i<(current+limit))){
							var link = full_link + "?p=" + i;
							link = " <a href=\"/directory" +  link + "\"" + ((ui_status.pagination.from == i) ? " class=selected " : '') + " rel=\"address:" + link + "\">" + (i+1) + "</a>"
							str = str + link
					}
					else{
						if (!dot){
							str = str + ' ... '
							dot=true;
						}
					}
				}
			}
		}
		else{
			str = '<span>Vaya, no hemos encontrado lo que intentabas buscar... :/ </span>';
		}
		
		$('#pagination').html(str);

		setFilterDisplay(selected);
	});

	//when profile loads	
	$(document).bind("directory.onProfileLoaded", function(e, user){

	});

	//when search is completed
	$(document).bind("directory.onSearchCompleted", function(e, term){
		$('ul#categories li, ul#tags li').removeClass('selected'); //deselect cat
	});

	$("[rel=popover]").popover({ live:true, html:true, offset: 10 }).click(function(e) { e.preventDefault() });
	
	$('#sortingSelect').change(function() {
		$(document).trigger("directory.onChangeSorting", $('#sortingSelect').val());
	});
	
	$('div.filterBox input').click (function ()
	{
		$(document).trigger("directory.onChangeFilter");
	});

	$('span.voteBox a.vote').live ('click', function(){
		var id = $(this).attr('idProfile');
		var params = {vote:$(this).attr('vote'), id: id};
		directory.vote(params, function(err, user_voted){
			if (!err){
				var user = viewModel.get_user_from_ViewModel(id);
				if (user){
					user.votes(user_voted.votes);
					user.voted(user_voted.voted);
				}
			}
		});
		return false;
	});

	$('a.fav').live ('click', function(){
		var id = $(this).attr('idProfile');		
		var params = {favstatus:$(this).attr('fav'), id:id};
		directory.favorite (params, function(err, user_fav){
			if (!err){
				var user = viewModel.get_user_from_ViewModel(id);
				if (user){
					user.favorite(user_fav.favorite);
				}
			}
		});
		return false;
	});

	$('a.login').live ('click', function(){
		$(this).html('Redirigiendo a login...')
		$(this).attr('href', $(this).attr('href') + '?redirect=/directory#' + $.address.value());
	});

	$('#searchBox').click (function(){ $(this).select(); });
	
	$('#searchBox').keydown (function(e){
		if ((e.keyCode=='13') || (e.keyCode=='32')){
			$.address.value('search/' + $('#searchBox').val());
		}
	});

	$.address.init(function(event) {
	
	}).change(function(event) {
		set_content_by_hash(event.path, function(){
			ko.applyBindings(viewModel);
		});
	});
   
});

