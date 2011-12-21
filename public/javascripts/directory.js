var viewModel = {
    professionals: ko.observableArray(),
    profile: ko.observable(),
    tags: ko.observableArray(),
    filter: ko.observable()
};

var server_root = '';

function hidePanels(){
	$('.professionals_list').hide();
	$('.profile').hide();
	$('.tags').hide();
}

function LoadProfile(id_profile){
	$('.professionals_list').hide();
	$.ajax({ url: 'api/users/byid', data: {id:id_profile}, dataType: 'jsonp', success: function (data) {
		$('.profile').fadeIn();
		viewModel.profile (data.user);
		viewModel.tags (data.user.tags);
	}
	});
}

function LoadProfessionalsByTag(idtag){
	$('.profile').hide();
	$.ajax({ url: '/api/users/bytag', data: {id:idtag}, dataType: 'jsonp', success: function (data) {
		$('.professionals_list').fadeIn();
		viewModel.professionals (data.users);
		viewModel.filter ('especialidad: ' + idtag)
	}
	});
}

function LoadProfessionalsByCat(idcat){
	$('.profile').hide();
	$.ajax({ url: '/api/users/bycat', data: {id:idcat}, dataType: 'jsonp', success: function (data) {
		$('.professionals_list').fadeIn();
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
	$('a#what').live ('click', function(){
		$('.what').toggle('fade');
	});

	$('a.viewprofile').live ('click', function(){
		var id=$(this).attr('idProfile');
		LoadProfile (id);
		return false;
	});

	$('a.searchBytag').live ('click', function(){
		var tag=$(this).attr('tag');
		LoadProfessionalsByTag (tag);
		return false;
	});
	
	$('ul#categories li a').live ('click', function(){
		//style
		$('ul#categories li').removeClass('selected');
		$(this).parent().addClass('selected');
		var idcat=$(this).attr('idcat');
		LoadProfessionalsByCat (idcat);
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

