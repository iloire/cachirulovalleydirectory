var viewModel = {
	professionals: ko.observableArray(),
	profile: ko.observable(),
	tags: ko.observableArray(),
	filter: ko.observableArray()
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

function LoadProfile(id_profile, container){
	var use_ajax = false;
	$('ul#professionals li div.short').show();
	$('.profile').insertAfter($(container)).fadeIn();
	$('.tags').fadeIn();
	$(container).hide();

	if (use_ajax){ //thinking whatever issuing a request for a profile, or having them loaded in profiles list json.
		$.ajax({ url: 'api/users/byid', data: {id:id_profile}, dataType: 'jsonp', success: function (data) {
			viewModel.profile (data.user);
			viewModel.tags (data.user.tags);
		}
		});
	}
	else{
		var users = viewModel.professionals();
		for (i=0;i<users.length;i++){
			if (users[i].id == id_profile){
				viewModel.profile (users[i]);
				viewModel.tags (users[i].tags);
				var profile_offset = $('.profile').offset();
				$('.tags').offset({top:profile_offset.top});
				scroll(0,profile_offset.top-150);
				break;
			}
		}
	}
}

function set_display_professionals_list (){
	$('.profile').hide().insertAfter('body');
	$('ul#professionals li div.short').show();
	$('.professionals_list').fadeIn();	
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

var last_query = null;

function LoadProfessionals (query){
	if (query.item)
		$(query.item).append('<img class=loading src="/images/menu-loading.gif">');

	$.ajax({ url: query.url, data: {id:query.id, q:query.q, scope : getScope()}, dataType: 'jsonp', success: function (data) 
		{
			last_query=query;
			set_display_professionals_list();
			viewModel.professionals (data.users);
			if (data.tags){
				viewModel.tags (data.tags);
				$('.tags').fadeIn();
			}
			
			setFilterDisplay([{name: query.name, value: query.filterdisplay}]);
			$('.tags').offset({top: tags_initial_offset.top});
			scroll(0,0);
			$('.loading').remove();
		}
	});	
}

function LoadProfessionalsByTag(item, idtag){
	LoadProfessionals({name:'Tag', item : item, filterdisplay: item.text(), url : '/api/users/bytag', id: idtag});
}

function LoadProfessionalsByCat(item, idcat){
	LoadProfessionals({name:'Categoría', item : item, filterdisplay: item.text(), url : '/api/users/bycat', id: idcat});
}

function Search(term){
	$('#searchBox').val(term); //just in case we came from url	
	$('ul#categories li, ul#tags li').removeClass('selected'); //deselect cat
	LoadProfessionals({name:'Búsqueda', item : null, filterdisplay: term, url : '/api/search', q: term});
}

$(document).ready(function () {
	tags_initial_offset = $('.tags').offset();

	//bootstrap tooltips
	$("[rel=popover]").popover({
		live:true,
		html:true,
		offset: 10
	})
	.click(function(e) {
		e.preventDefault()
	});
	
	$('div.filterBox input').click (function ()
	{
		if (last_query)
			LoadProfessionals(last_query);
	});

	$('a#what').live ('click', function(){
		$('.what').toggle('fade');
	});

	$('a.viewprofile').live ('click', function(){
		var id=$(this).attr('idProfile');
		LoadProfile (id, $(this).closest('div.short'));
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
		$('.tags ul li').removeClass('selected'); //remove selected from tags
		$('ul#categories li').removeClass('selected'); //remove selected from cats

		var tag=$(this).attr('tag');
		$(this).parent().addClass('selected');

		LoadProfessionalsByTag ($(this),tag);
		return false;
	});
	
	$('ul#categories li a').live ('click', function(){
		$('ul#categories li').removeClass('selected'); //style
		$(this).parent().addClass('selected');
		var idcat=$(this).attr('idcat');
		LoadProfessionalsByCat ($(this), idcat);
		return false;
	});
	
	$('#searchBox').click (function(){
		$(this).select();
	});
	
	$('#searchBox').keydown (function(e){
		var content=$('#searchBox').val();
		if ((e.keyCode=='13') || (e.keyCode=='32'))
		{
			Search(content);
		}
	});
	
	ko.applyBindings(viewModel);
	
	//deep linking
	$.address.init(function(event) {
		var path=$.address.value();
		//cat?
		if (path.indexOf('/categories')==0){
			var idcat = path.split ('/')[2];
			$('ul#categories li a').each(function() {
				if ($(this).attr('idcat') == idcat) {
					$(this).click();
				}
			});
		}
		
		//tags?
		else if (path.indexOf('/tags')==0){
			var tag = decodeURIComponent(path.split ('/')[2]);
			$.ajax({ url: '/api/tags', data: {id:''}, dataType: 'jsonp', success: function (data) {
				viewModel.tags (data.tags);
				$('ul#tags li a').each(function() {
					if ($(this).attr('tag') == tag) {
						$(this).click();
					}
				});
				
			}});
		}
		//search
		else if (path.indexOf('/search')==0){
			var search = decodeURIComponent(path.split ('/')[2]);
			Search (search, getScope());
		}

		else{
			$('ul#categories li a').first().click();
		}
	}).change(function(event) {
		//$.address.title('[title].concat(names).join(' | ')');
	});
   
});

