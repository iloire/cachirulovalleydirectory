var crypto = require('crypto')

function trim(s)
{
	var l=0; var r=s.length -1;
	while(l < s.length && s[l] == ' ')
	{	l++; }
	while(r > l && s[r] == ' ')
	{	r-=1;	}
	return s.substring(l, r+1);
}
exports.trim=trim;

function rnd (from, to){
	return Math.floor(Math.random()*(to-(from-1))) + from;
}
exports.rnd = rnd;

function validateEmail(email) {
	if (!email) return false;
	// Now validate the email format using Regex
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
	return re.test(email);
}
exports.validateEmail = validateEmail;

function contains(arr, obj) {
    var i = arr.length;
    while (i--) {
       if (arr[i] === obj) {
           return true;
       }
    }
    return false;
}
exports.contains = contains;

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

function removeUnwantedFields(obj){
	if (!obj) return null;
	
	if (!Array.isArray(obj)){
		return removeUnwantedFields([obj])[0];
	}
	else{
		for (var i=0, c=obj.length;i<c;i++){
			delete obj[i]['email']
			delete obj[i]['modified']
			delete obj[i]['creation_date']
			delete obj[i]['linkedin_id']
		}
		return obj;
	}
}
exports.removeUnwantedFields = removeUnwantedFields

function renderJSON (req, res, value, code, callbackname) {
	code = code || 200;
	var headers = {
		'Pragma': 'no-cache',
		'Cache-Control': 'no-cache',
		'Expires': 'Wed, 27 Aug 2008 18:00:00 GMT'
	}
	if (callbackname) { //jsonp
		headers['Content-type'] = 'application/javascript'
		res.writeHead(code, headers)
		res.end(callbackname+'('+JSON.stringify(value)+')');
	} else {
		headers['Content-type'] = 'application/json'
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