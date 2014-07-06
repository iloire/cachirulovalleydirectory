/**
 * Usage:
 * $ node recover-from-s3 s3-item-key output.name
 */

var knox = require('knox');
var fs = require ('fs');

if (!process.env.AMAZON_KEY || !process.env.AMAZON_SECRET || !process.env.AMAZON_BACKUP_BUCKET || !process.env.AMAZON_BACKUP_ENDPOINT){
  return console.error('please define AWS credentials in env');
}

if (!process.argv[2]) {
  return console.error('missing argument');
}

var client = knox.createClient({
    key: process.env.AMAZON_KEY,
    secret: process.env.AMAZON_SECRET,
    bucket: process.env.AMAZON_BACKUP_BUCKET,
    endpoint: process.env.AMAZON_BACKUP_ENDPOINT
});

var buffer = '';
client.get(process.argv[2]).on('response', function(res){

  res.setEncoding('binary');

  res.on('data', function(chunk){
    buffer += chunk;
  });

  res.on('end', function(){
    fs.writeFile(process.argv[3] || 'output.bin', buffer, 'binary', function (err) {
      if (err) {
        console.error(err);
      }
    });
  });

}).end();