const http = require('http');

http.createServer(function(req, res) {
	res.write("on the way to being a full stack");
	res.end();

}).listen(3000);

console.log('Server started');
