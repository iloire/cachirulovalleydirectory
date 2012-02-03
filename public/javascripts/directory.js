var viewModel = {
	professionals: ko.observableArray(),
	profile: ko.observable(),
	tags: ko.observableArray(),
	cats: ko.observableArray(),
	filter: ko.observableArray(),
	tag_title: ko.observable(),
	tag_explanation: ko.observable()	
};

var tags_initial_offset = 0;

viewModel.tagslist = ko.dependentObservable(function() {
	var tags=[];
	var tags_list = this.tags();
	for (var i=0, c=tags_list.length;i<c;i++){
		tags.push ({name: tags_list[i].t || tags_list[i], safe_name:encodeURIComponent(tags_list[i].t || tags_list[i]), counter: tags_list[i].n || ''});
	}
	return tags;
}, viewModel);

viewModel.professionals_count = ko.dependentObservable(function() {
	return this.professionals().length;
}, viewModel);


var last_query = null;
var loading = '<img class=loading alt="loading..." src="/images/menu-loading.gif" />'

function setFilterDisplay (initial_filter){
	var scope = getScope();

	initial_filter.push({name: 'Región', value: (scope.region==1000) ? 'Todos' : ((scope.region==100) ? 'Nacional' : 'Aragonés') });
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

function set_content_by_hash (hash){
	if (hash.indexOf('/categories')==0){
		var id_cat = hash.split ('/')[2];
		directory.load_data ({id_cat:id_cat});
	}
	//user?
	else if (hash.indexOf('/user')==0){
		var id_profile = hash.split ('/')[2];
		directory.load_profile(id_profile, function (err, user){
			$('.profile').fadeIn();
			$(document).trigger("directory.onProfileLoaded", user);
			directory.load_data ({id_cat:1});
		});
	}
	//tags?
	else if (hash.indexOf('/tags')==0) {
		var tag = decodeURIComponent(hash.split ('/')[2]);
		directory.load_data ({tag:tag});
	}
	//search
	else if (hash.indexOf('/search')==0){
		var search = decodeURIComponent(hash.split ('/')[2]);
		$('#searchBox').val(term);
		directory.search (search);
	}
	else{
		directory.load_data ({id_cat:1});
	}
}


var directory = (function () {
	var dir = {}
	var ui_status = {id_cat:1, tag: '', cat:{}};
	
	//PRIVATE
	function replaceURLWithHTMLLinks(text) {
	    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
	    return text.replace(exp,"<a target=_blank href='$1'>$1</a>"); 
	}

	function replaceTwText (text){
		return replaceURLWithHTMLLinks(text);
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
							output = output + '<li>'+ own_projects[i].watchers + ' / ' +  own_projects[i].forks + ': <a target=_blank href="'+ own_projects[i].html_url + '">' + own_projects[i].name + '</a>: ' + own_projects[i].description + '</li>'; //todo
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
	
	function getTwTimeline(user, where){
		if ($('body').data(user)) { //save in dom via data() jquery attribute
			$(where).html($('body').data(user));
			$("abbr.timeago").timeago();
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
				$("abbr.timeago").timeago();
				$('body').data(user, output);
			});
		}
	}

	//PUBLIC
	dir.load_profile = function (id_profile, callback){
		function render(data){
			viewModel.profile (data.user);
			viewModel.tags (data.user.tags);
			viewModel.tag_title ('⇐ sus tags');
			viewModel.tag_explanation('Arriba se muestran los tags de este usuario. Puedes clicar en ellos para acceder a perfiles similares');
			
			if (data.user.twitter)
				getTwTimeline(data.user.twitter, $('#tw_timeline'));

			if (data.user.github)
				getGitHubProjects(data.user.github, $('#github_projects'));
			
			callback(null, data.user);
			//$(document).trigger("directory.onProfileLoaded", data.user);
		}

		var users = viewModel.professionals();
		var found = false;
		for (i=0;i<users.length;i++){
			if (users[i].id == id_profile){
				render({user: users[i]});
				break;
			}
		}

		if (!found){ 
			$.getJSON('api/users/byid', {id:id_profile}, function (data) {
				render(data);
			});
		}
	}

	dir.load_data = function (params, callback){
		if (!params) params={}

		if (params.id_cat || params.tag) params.search = null;

		for (var prop in ui_status) {
			if (params[prop]===undefined){
				params[prop] = ui_status[prop] || '';
			}
			else if (params[prop]===null){
				params[prop] = '';
			}
		}
		
		params.scope = getScope();
	
		$(document).trigger("directory.onBeforeProfessionalListLoaded");
		
		$.getJSON(params.search ? '/api/search' : '/api/users', params, function (data) 
		{
			viewModel.professionals (data.users);
			viewModel.tag_title ('Especialidades');
			viewModel.tag_explanation('');
			
			if (!params.tag && data.tags)
				viewModel.tags (data.tags);

			viewModel.cats (data.cats);

			ui_status = params;
			
			if (data.cat)
				ui_status.cat = data.cat;
			
			if (params.search)
				$(document).trigger("directory.onSearchCompleted", params.search);
				
			$(document).trigger("directory.onProfessionalListChanged", ui_status);
			
			if (callback)
				callback(null, data);
		});	
	}
	
	dir.vote = function (params, callback){
		 $.ajax({
				type: "POST",
				url: '/vote',
				data: { user_voted_id: params.id, vote : params.vote},
				success: function onSuccess(data, status){
					viewModel.profile(data.user);
					var users = viewModel.professionals();
					for(var i=0;i<users.length;i++){
						if (users[i].id==params.id){
							users[i] = data.user;
							callback(null, data_user);
						}
					}
				},
	        	error: function onError(data, status){
					var error=''
					if (data.status==403){
						error = 'Error, session expired of permission denied';
					}else {	
						error = 'Error processing vote';
					}
					alert(error);
					callback(error, null);
				}
	    });
	}
	
	dir.search = function (term){
		$.address.value('/search/'+ encodeURIComponent(term));
		this.load_data({search: term});
	}
	
	return dir;
}());

$(document).ready(function () {
		
	tags_initial_offset = $('.tags').offset();

	//event binding

	$(document).bind("directory.onChangeSorting",function(e, sort){
		directory.load_data({sort:sort});
	});
	
	$(document).bind("directory.onChangeFilter",function(e, tag){
		directory.load_data();
	});
	
	$(document).bind("directory.onProfessionalListChanged",function(e, ui_status){

		$('ul#professionals li div.short').show();
		
		var selected = [];
		
		if (ui_status.search){
			selected.push({name: 'Search', value: ui_status.search, type: 'primary tag'});
		}
		else{
			if (ui_status.cat && ui_status.cat.id){
				var text = "";
				$('ul#categories li').removeClass('selected');
				$('ul#categories li a').each(function() {
					if ($(this).attr('idcat') == ui_status.cat.id) {
						$(this).parent().addClass('selected');
					}
				});
				selected.push({name: 'Categoría', value: ui_status.cat.name, type: 'primary cat'});
			}

			if (ui_status.tag){
				$('ul#tags li').removeClass('selected'); //remove selected from tags
				$('ul#tags li a').each(function() {
					if ($(this).attr('tag') == ui_status.tag) {
						$(this).parent().addClass('selected');
					}
				});
				selected.push({name: 'Tag', value: ui_status.tag, type: 'primary tag'});
			}

			$('#searchBox').val('');
		}
		
		setFilterDisplay(selected);
	});
	
	$(document).bind("directory.onBeforeProfessionalListLoaded",function(e){
		$('.profile').insertAfter($('body')).hide();
		$('.tags').offset({top: tags_initial_offset.top});
		scroll(0,0);
	});
	
	$(document).bind("directory.onLoadProfile",function(e, id){
		//directory.load_profile (id, $(this).closest('div.short'));
	});
	
	$(document).bind("directory.onProfileLoaded",function(e, user){
		var profile_offset = $('.profile').offset();
		$('.tags').offset({top:profile_offset.top});
		scroll(0,profile_offset.top-150);
	});

	$(document).bind("directory.onSearchCompleted",function(e, term){
		$('ul#categories li, ul#tags li').removeClass('selected'); //deselect cat
	});

	
	//controls
	$("[rel=popover]").popover({ live:true, html:true, offset: 10 }).click(function(e) { e.preventDefault() });
	
	$('#sortingSelect').change(function() {
		$(document).trigger("directory.onChangeSorting", $('#sortingSelect').val());
	});
	
	$('div.filterBox input').click (function ()
	{
		$(document).trigger("directory.onChangeFilter");
	});

	$('a#what').live ('click', function(){
		$('.what').toggle('fade');
	});

	$('a.viewprofile').live ('click', function(){
		$('ul#professionals li div.short').show();
		var container = $(this).closest('div.short')
		$(container).hide();
		$('.profile').insertAfter($(container)).fadeIn();

		directory.load_profile ($(this).attr('idProfile'), function(err, user){
			$(document).trigger("directory.onProfileLoaded", user);
		})
		return false;
	});

	$('span.voteBox a.vote').live ('click', function(){
		var params = {vote:$(this).attr('vote'), id:$(this).attr('idProfile')};
		directory.vote(params);
		return false;
	});

	$('span.voteBox a.login').live ('click', function(){
		$(this).html('Redirigiendo a login...')
	});

	$('ul#tags li a').live ('click', function(){
		directory.load_data({tag:$(this).attr('tag')});
		return false;
	});
	
	$('ul#categories li a').live ('click', function(){
		directory.load_data({id_cat:$(this).attr('idcat'), tag: null});
		return false;
	});
	
	$('#searchBox').click (function(){ $(this).select(); });
	
	$('#searchBox').keydown (function(e){
		var content=$('#searchBox').val();
		if ((e.keyCode=='13') || (e.keyCode=='32'))
			directory.search(content);
	});
	
	ko.applyBindings(viewModel);
	
	//deep linking	
	$.address.init(function(event) {
		var path=$.address.value();
		set_content_by_hash(path);
	}).change(function(event) {
		//console.log (event)
		//directory.set_content_by_hash(window.location.hash);
	});
   
});

