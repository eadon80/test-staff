const express = require('express');
const app = express();
const server = require('http').createServer();


app.get('/', (req, res) => {
	res.sendFile('index.html', { root: __dirname });
});

server.on('request', app)

server.listen(3000, () => {
	console.log('Server is running on port 3000');
});

// WebSocket server
const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
	const numClients = wss.clients.size;
	console.log('Clients connected', numClients);

	wss.broadcast(`Current visitors ${numClients}`);
	
	if (ws.readyState === ws.OPEN) {
		ws.send('Welcome to my server');
	}
	
	ws.on('close', function close() {
		wss.broadcast(`Current visitors ${numClients}`);
		console.log('client disconnected')
	})
});

wss.broadcast = function broadcast(data) {
	wss.clients.forEach(function(client) {
		client.send(data);
	})
}