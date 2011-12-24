var viewModel = {
    professionals: ko.observableArray(),
    profile: ko.observable(),
    tags: ko.observableArray(),
    filter: ko.observable()
};

function hidePanels(){
	$('.professionals_list').hide();
	$('.profile').hide();
	$('.tags').hide();
}

function LoadProfile(id_profile){
	$('.professionals_list').hide();
	$('div.region_scope').hide();
	$.ajax({ url: 'api/users/byid', data: {id:id_profile}, dataType: 'jsonp', success: function (data) {
		$('.profile').fadeIn();
		$('.tags').fadeIn();
		viewModel.profile (data.user);
		viewModel.tags (data.user.tags);
	}
	});
}

function LoadProfessionalsByTag(idtag, region_scope){
	$('.profile').hide();
	$.ajax({ url: '/api/users/bytag', data: {id:idtag, region_scope : region_scope}, dataType: 'jsonp', success: function (data) {
		$('.professionals_list').fadeIn();
		$('div.region_scope').fadeIn();
		viewModel.professionals (data.users);
		viewModel.filter ('especialidad: ' + idtag)
	}
	});
}

function LoadProfessionalsByCat(idcat, region_scope){
	$('.profile').hide();
	$.ajax({ url: '/api/users/bycat', data: {id:idcat, region_scope : region_scope}, dataType: 'jsonp', success: function (data) {
		$('.professionals_list').fadeIn();
		$('div.region_scope').fadeIn();
		$('.tags').fadeIn();
		viewModel.professionals (data.users);
		viewModel.tags (data.tags);
		viewModel.filter ('categoría: ' + idcat)
	}
	});
}

function Search(term){
	$('#loading').fadeIn();
	$('ul#categories li').removeClass('selected'); //deselect cat
	hidePanels();
	$.ajax({ url: '/api/search', data: {q:term}, dataType: 'jsonp', success: function (data) {
		$('.professionals_list').fadeIn();
		viewModel.professionals (data.users)
		$('#loading').fadeOut();
		viewModel.filter ('búsqueda: ' + term)
	}
	});
}



$(document).ready(function () { 
	
	function getLocationScope(){ //returns 0=regional, 1=national, 2=worldwide
		if ($('#worldwide_scope').is(':checked')){
			return 2;
		}
		else if ($('#national_scope').is(':checked')){
			return 2;
		}
		return 0;
	}
	
	$('div.region_scope input').click (function ()
	{
		//one of the checkboxes changed
		console.log ('clicked checkbox scope')
		//identify cat link and click
		if ($('ul#categories li.selected a').length)
			$('ul#categories li.selected a').click();
		else
			$('ul#tags li.selected a').click();
	});
	
	$('a#what').live ('click', function(){
		$('.what').toggle('fade');
	});

	$('a.viewprofile').live ('click', function(){
		var id=$(this).attr('idProfile');
		LoadProfile (id);
		return false;
	});

	$('div.tags ul li a').live ('click', function(){
		$('.tags ul li').removeClass('selected'); //remove selected from tags
		$('ul#categories li').removeClass('selected'); //remove selected from cats

		var tag=$(this).attr('tag');
		$(this).parent().addClass('selected');

		LoadProfessionalsByTag (tag, getLocationScope());
		return false;
	});
	
	$('ul#categories li a').live ('click', function(){
		$('ul#categories li').removeClass('selected'); //style
		$(this).parent().addClass('selected');
		var idcat=$(this).attr('idcat');
		LoadProfessionalsByCat (idcat, getLocationScope());
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
});

