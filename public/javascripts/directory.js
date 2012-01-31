var viewModel = {
	professionals: ko.observableArray(),
	profile: ko.observable(),
	tags: ko.observableArray(),
	filter: ko.observableArray(),
	tag_title: ko.observable(),
	tag_explanation: ko.observable()	
};

var tags_initial_offset = 0;

viewModel.tagslist = ko.dependentObservable(function() {
	var tags=[];
	var tags_list = this.tags();
	for (var i=0, c=tags_list.length;i<c;i++){
		tags.push ({name: tags_list[i], safe_name:encodeURIComponent(tags_list[i])});
	}
	return tags;
}, viewModel);


var last_query = null;
var loading = '<img class=loading alt="loading..." src="/images/menu-loading.gif" />'

function setFilterDisplay (initial_filter){
	var scope = getScope();

	if (scope.region==2){
		initial_filter.push({name: 'Región', value: 'Todos'});
	}
	else if (scope.region==1){
		initial_filter.push({name: 'Región', value: 'Nacional'});
	}
	else if (scope.region==0){
		initial_filter.push({name: 'Región', value: 'Aragonés'});
	}	

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
		scope.region=2
	}
	else if ($('#national_scope').is(':checked')){
		scope.region=1
	}
	else if ($('#regional_scope').is(':checked')){
		scope.region=0 //regional
	}
	else
		scope.region=2 //nothing selected

	return scope;
}

var directory = (function () {
	var dir = {}
	
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
	dir.load_profile = function (id_profile, container){
		$('ul#professionals li div.short').show();

		function render(data){
			viewModel.profile (data.user);
			viewModel.tags (data.user.tags);
			viewModel.tag_title ('⇐ sus tags');
			if (data.user.twitter){
				getTwTimeline(data.user.twitter, $('#tw_timeline'));
			}
			if (data.user.github){
				getGitHubProjects(data.user.github, $('#github_projects'));
			}
			$(document).trigger("directory.onProfileLoaded", data.user);
		}

		if (!container){ //thinking whatever issuing a request for a profile, or having them loaded in profiles list json.
			$.getJSON('api/users/byid', {id:id_profile}, function (data) {
				$('.profile').fadeIn();
				render(data);
			});
		}
		else{
			$('.profile').insertAfter($(container)).fadeIn();
			$(container).hide();

			var users = viewModel.professionals();
			for (i=0;i<users.length;i++){
				if (users[i].id == id_profile){
					render({user: users[i]});
					break;
				}
			}
		}
	}

	dir.load_professionals_by_tag = function (tag, callback){
		this.load_professionals({name:'Tag', url : '/api/users/bytag', id: tag}, function(err, data){
			viewModel.tag_title ('relacionado');
			viewModel.tag_explanation('tags relacionados con ' + tag)
			$(document).trigger("directory.onSelectedTagChanged", tag);
			if (callback)
				callback(err, data);
		});
	}

	dir.load_professionals_by_cat = function (idcat, callback){
		this.load_professionals({name:'Categoría', url : '/api/users/bycat', id: idcat}, function(err, data){
			$(document).trigger("directory.onSelectedCatChanged", data.cat);
			if (callback)
				callback(err, data);
		});
	}

	dir.load_professionals = function (query, callback){
		$(document).trigger("directory.onBeforeProfessionalListLoaded");
		$.getJSON(query.url, {id:query.id, q:query.q, scope : getScope(), sort: $('#sortingSelect').val()}, function (data) 
			{
				last_query=query;
				viewModel.professionals (data.users);
				viewModel.tag_title ('Especialidades');
				viewModel.tag_explanation('');
				if (data.tags){
					viewModel.tags (data.tags);
				}

				if (callback)
					callback(null, data);
			}
		);	
	}

	dir.search = function (term){
		$.address.value('/search/'+ encodeURIComponent(term));
		this.load_professionals({name:'Búsqueda', item : null, filterdisplay: term, url : '/api/search', q: term});
		$(document).trigger("directory.onSearch", term);
	}
	
	dir.set_content_by_hash = function (hash){
		if (hash.indexOf('/categories')==0){
			var idcat = hash.split ('/')[2];
			this.load_professionals_by_cat (idcat);
		}
		//user?
		else if (hash.indexOf('/user')==0){
			var id_profile = hash.split ('/')[2];
			this.load_profile(id_profile);
		}
		//tags?
		else if (hash.indexOf('/tags')==0) {
			var tag = decodeURIComponent(hash.split ('/')[2]);
			this.load_professionals_by_tag (tag);
		}
		//search
		else if (hash.indexOf('/search')==0){
			var search = decodeURIComponent(hash.split ('/')[2]);
			this.search (search, getScope());
		}
		else{
			$('ul#categories li a').first().click();
		}
	}
	    
	return dir;
}());

$(document).ready(function () {
		
	tags_initial_offset = $('.tags').offset();

	function set_display_professionals_list (){
		$('ul#professionals li div.short').show();
	}

	$(document).bind("directory.onBeforeProfessionalListLoaded",function(e){
		$('.profile').insertAfter($('body')).hide();
		$('.tags').offset({top: tags_initial_offset.top});
		scroll(0,0);
	});
		
		
	$(document).bind("directory.onProfileLoaded",function(e, user){
		var profile_offset = $('.profile').offset();
		$('.tags').offset({top:profile_offset.top});
		scroll(0,profile_offset.top-150);
	});

	$(document).bind("directory.onSearch",function(e, term){
		$('#searchBox').val(term); //just in case we came from url	
		$('ul#categories li, ul#tags li').removeClass('selected'); //deselect cat
	});
	
	$(document).bind("directory.onSelectedCatChanged",function(e, cat){
		set_display_professionals_list();

		var text = "";
		$('ul#categories li').removeClass('selected');
		$('ul#categories li a').each(function() {
			if ($(this).attr('idcat') == cat.id) {
				$(this).parent().addClass('selected');
			}
		});
		setFilterDisplay([{name: 'Categoría', value: cat.name}])
	});

	$(document).bind("directory.onFilterChanged",function(e){
		setFilterDisplay([viewModel.filter()[0]]); //keep the first element. the others will change depending on filter values
	});
	
	$(document).bind("directory.onSelectedTagChanged",function(e, tag){
		set_display_professionals_list();
		
		$('ul#tags li').removeClass('selected'); //remove selected from tags
		$('ul#categories li').removeClass('selected'); //remove selected from cats
		$('ul#tags ul li a').each(function() {
			if ($(this).attr('tag') == tag) {
				$(this).parent().addClass('selected');
			}
		});
		setFilterDisplay([{name: 'Tag', value: tag}])
	});
	
	//bootstrap tooltips
	$("[rel=popover]").popover({
		live:true,
		html:true,
		offset: 10
	})
	.click(function(e) {
		e.preventDefault()
	});
	
	$('#sortingSelect').change(function() {
		if (last_query){
			directory.load_professionals(last_query);
			$(document).trigger("directory.onSortingChanged");
		}		
	});
	
	$('div.filterBox input').click (function ()
	{
		if (last_query){
			directory.load_professionals(last_query);
			$(document).trigger("directory.onFilterChanged");
		}
	});

	$('a#what').live ('click', function(){
		$('.what').toggle('fade');
	});

	$('a.viewprofile').live ('click', function(){
		var id=$(this).attr('idProfile');
		directory.load_profile (id, $(this).closest('div.short'));
		return false;
	});

	$('span.voteBox a.vote').live ('click', function(){
		var id = $(this).attr('idProfile');
		var vote = $(this).attr('vote');
		 $.ajax({
				type: "POST",
				url: '/vote',
				data: { user_voted_id: id, vote : vote},
				success: function onSuccess(data, status){
					viewModel.profile(data.user);
					var users = viewModel.professionals();
					for(var i=0;i<users.length;i++){
						if (users[i].id==id){
							users[i] = data.user;
						}
					}
				},
	        	error: function onError(data, status){
					if (data.status==403){
						alert('Error, session expired of permission denied');
					}else {	
						alert('Error processing vote');
					}
				}
	    });
		//alert(id);
		return false;
	});

	$('div.tags ul li a').live ('click', function(){
		var tag=$(this).attr('tag');
		directory.load_professionals_by_tag (tag);
		return false;
	});
	
	$('ul#categories li a').live ('click', function(){
		var idcat=$(this).attr('idcat');
		directory.load_professionals_by_cat (idcat);
		return false;
	});
	
	$('#searchBox').click (function(){
		$(this).select();
	});
	
	$('#searchBox').keydown (function(e){
		var content=$('#searchBox').val();
		if ((e.keyCode=='13') || (e.keyCode=='32'))
		{
			directory.search(content);
		}
	});
	
	ko.applyBindings(viewModel);
	
	//deep linking	
	$.address.init(function(event) {
		var path=$.address.value();
		directory.set_content_by_hash(path);
	}).change(function(event) {
		//console.log (event)
		//directory.set_content_by_hash(window.location.hash);
	});
   
});

