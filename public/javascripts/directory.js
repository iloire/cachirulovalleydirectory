var viewModel = {
	professionals: ko.observableArray(),
	profile: ko.observable(),
	tags: ko.observableArray(),
	filter: ko.observable()
};

var tags_initial_offset ;

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
				$('.tags').offset({top:profile_offset.top})
				break;
			}
		}
	}
}

function LoadProfessionalsByTag(idtag, scope){
	$.ajax({ url: '/api/users/bytag', data: {id:idtag, region_scope : scope.region}, dataType: 'jsonp', success: function (data) {
		$('.profile').hide().insertAfter('body');
		$('ul#professionals li div.short').show();
		$('.profile').hide();
		$('.professionals_list').fadeIn();
		viewModel.professionals (data.users);
		viewModel.filter ('especialidad: ' + idtag);
		$('.tags').offset({top: tags_initial_offset.top})

		}
	});
}

function LoadProfessionalsByCat(idcat, scope){
	$.ajax({ url: '/api/users/bycat', data: {id:idcat, scope : scope}, dataType: 'jsonp', success: function (data) {
		$('.profile').hide().insertAfter('body');	
		$('ul#professionals li div.short').show();
		$('.profile').hide();
		$('.professionals_list').fadeIn();
		$('.tags').fadeIn();
		viewModel.professionals (data.users);
		viewModel.tags (data.tags);
		viewModel.filter ('categoría: ' + idcat)
		$('.tags').offset({top: tags_initial_offset.top})
	}
	});
}

function Search(term){
	$('.profile').insertAfter('body');
	$('#loading').fadeIn();
	$('ul#categories li').removeClass('selected'); //deselect cat
	$('.profile').hide();
	$('.tags').hide();
	$.ajax({ url: '/api/search', data: {q:term}, dataType: 'jsonp', success: function (data) {
		$('.professionals_list').fadeIn();
		viewModel.professionals (data.users)
		$('#loading').fadeOut();
		viewModel.filter ('búsqueda: ' + term)
	}
	});
}

$(document).ready(function () { 
	
	tags_initial_offset = $('.tags').offset();
	console.log (tags_initial_offset)
	
	function getScope(){ 
		var scope = {}
		scope.freelance = ($('#freelance_scope').is(':checked')) ? true : false
		
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
	
	function reclick (){
		if ($('ul#categories li.selected a').length)
			$('ul#categories li.selected a').click();
		else
			$('ul#tags li.selected a').click();
	}
	
	$('div.region_scope input').click (function ()
	{
		reclick();
	});

	$('div.otherdata_scope input').click (function ()
	{
		reclick();
	});
	
	$('a#what').live ('click', function(){
		$('.what').toggle('fade');
	});

	$('a.viewprofile').live ('click', function(){
		var id=$(this).attr('idProfile');
		LoadProfile (id, $(this).closest('div.short'));
		return false;
	});

	$('div.tags ul li a').live ('click', function(){
		$('.tags ul li').removeClass('selected'); //remove selected from tags
		$('ul#categories li').removeClass('selected'); //remove selected from cats

		var tag=$(this).attr('tag');
		$(this).parent().addClass('selected');

		LoadProfessionalsByTag (tag, getScope());
		return false;
	});
	
	$('ul#categories li a').live ('click', function(){
		$('ul#categories li').removeClass('selected'); //style
		$(this).parent().addClass('selected');
		var idcat=$(this).attr('idcat');
		LoadProfessionalsByCat (idcat, getScope());
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
	
	//click on first link categories
	$('ul#categories li a').first().click();
});

