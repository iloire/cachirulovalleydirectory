var crypto = require('crypto')

exports.renderJSON = function (req, res, value, code, callbackname) {
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

exports.uuid = function() {
	var date = new Date();
	return crypto.createHash('sha1').update('$%'+date.getTime()+'#'+Math.random()+'?¿').digest('hex');
}