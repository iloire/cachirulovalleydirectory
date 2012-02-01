var crypto = require('crypto')

function validateEmail(email) {
	if (!email) return false;
	// Now validate the email format using Regex
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
	return re.test(email);
}
exports.validateEmail = validateEmail;

function sort (arr, property, desc){
	function sorter(aa,bb){
		var a = !desc ? aa : bb;
		var b = !desc ? bb : aa;
			
		if (typeof a[property] == "number") {
			return (a[property] - b[property]);
		} else {
			return ((a[property] < b[property]) ? -1 : ((a[property] > b[property]) ? 1 : 0));
		}
	}
	return arr.sort(sorter);
}
exports.sort=sort;

function get_unique_tags_by_users(users){
	var tags = []
	for(var u=0,l=users.length; u<l; u++){
		for (var t=0, tl=users[u].tags.length;t<tl; t++){ 
			var found=false;
			for (var i=0,il=tags.length;i<il; i++){
				if (tags[i].t==users[u].tags[t]){
					found=true;
					tags[i].n++;
				}
			}

			if (!found)
				tags.push ({t: users[u].tags[t], n: 1});
		}
	}
	return tags;
}
exports.get_unique_tags_by_users = get_unique_tags_by_users

function removeEmail(obj){
	if (obj.length==undefined){
		delete obj['email']
		return obj;
	}
	else{
		for (var i=0, c=obj.length;i<c;i++){
			delete obj[i]['email']
		}
		return obj;
	}
}
exports.removeEmail = removeEmail

function renderJSON (req, res, value, code, callbackname) {
	code = code || 200;
	var headers = {
		'Pragma': 'no-cache',
		'Cache-Control': 'no-cache',
		'Expires': 'Wed, 27 Aug 2008 18:00:00 GMT'
	}
	if (callbackname) { //jsonp
		headers['Content-type'] = 'application/javascript;charset=utf8'
		res.writeHead(code, headers)
		res.end(callbackname+'('+JSON.stringify(value)+')');
	} else {
		headers['Content-type'] = 'application/json;charset=utf8'
		res.writeHead(code, headers)
		res.end(JSON.stringify(value));
	}
}
exports.renderJSON = renderJSON

function uuid() {
	var date = new Date();
	return crypto.createHash('sha1').update('$%'+date.getTime()+'#'+Math.random()+'?¿').digest('hex');
}
exports.uuid = uuid