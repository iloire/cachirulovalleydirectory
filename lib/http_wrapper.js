/*GET data in json format*/
exports.Get = function (url, req, callback) {
	var request = require('request')
	request({uri: url}, function (error, response, body) {
		if (error){
			callback({error:error}, 500);
		}
		else{
			var objData
			try{
				objData=JSON.parse(body)
			}
			catch (err){
				//throw err
				var errormsg= "Error on service GET request. Error parsing data to json " + err + ". Data with syntax problem: " + body + ", url:" + url
				callback({ error: errormsg }, 500);
				return
			}
			callback(objData, response.statusCode);
		}
	});
}