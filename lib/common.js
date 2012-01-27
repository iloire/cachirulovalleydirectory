var crypto = require('crypto')

function validateEmail(email) {
	if (!email) return false;
	// Now validate the email format using Regex
	var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
	return re.test(email);
}
exports.validateEmail = validateEmail;

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
	if (callbackname) {
		headers['Content-type'] = 'text/javascript;charset=utf8'
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