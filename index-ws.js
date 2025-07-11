const express = require('express');
const app = express();
const server = require('http').createServer();

process.setMaxListeners(0);

// Отслеживание активных соединений
const connections = new Set();

app.get('/', (req, res) => {
	res.sendFile('index.html', { root: __dirname });
});

server.on('request', app)

// Отслеживаем соединения
server.on('connection', (socket) => {
	connections.add(socket);
	socket.on('close', () => {
		connections.delete(socket);
	});
});

server.listen(3000, () => {
	console.log('Server is running on port 3000');
});

server.on('close', () => {
	console.log('closed')
})

process.on('SIGINT', () => {
	console.log('SIGINT 1')
	wss.clients.forEach((client) => {
		if (client.readyState === 1) { // WebSocket.OPEN = 1
			client.close(1000, 'Server shutting down');
		}
	});

	wss.close(() => {
		console.log('WebSocket server closed');

		// Устанавливаем таймаут для принудительного завершения
		const forceExit = setTimeout(() => {
			console.log('Force exit after timeout');
			process.exit(1);
		}, 3000);

		// Принудительно закрываем все активные соединения
		console.log(`Closing ${connections.size} active connections`);
		connections.forEach((socket) => {
			socket.destroy();
		});

		server.close(() => {
			console.log('SIGINT 2');
			clearTimeout(forceExit);
			shutdownDB();
		});
	});
})

// WebSocket server
const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
	const numClients = wss.clients.size;
	console.log('Clients connected', numClients);

	wss.broadcast(`Current visitors ${numClients}`);
	
	if (ws.readyState === 1) { // WebSocket.OPEN = 1
		ws.send('Welcome to my server');
	}

	db.run(`
		INSERT INTO visitors (count, time)
		VALUES (${numClients}, datetime('now'))	
	`);
	
	ws.on('close', function close() {
		const currentClients = wss.clients.size;
		wss.broadcast(`Current visitors ${currentClients}`);
		console.log('client disconnected')
	})
});

wss.broadcast = function broadcast(data) {
	wss.clients.forEach(function(client) {
		if (client.readyState === 1) { // WebSocket.OPEN = 1
			client.send(data);
		}
	})
}

// db
const sqlite = require('sqlite3');
const db = new sqlite.Database(':memory:');

db.serialize(() => {
	db.run(`
		CREATE TABLE visitors (
			count INTEGER,
			time TEXT
		)	
	`)
})

function getCounts(callback) {
	db.all("SELECT * FROM visitors", (err, rows) => {
		if (err) {
			console.error('Database error:', err);
		} else {
			rows.forEach(row => console.log(row));
		}
		if (callback) callback();
	})
}

function shutdownDB() {
	getCounts(() => {
		console.log('Shutting down db')
		db.close((err) => {
			if (err) {
				console.error('Error closing database:', err);
			}
			process.exit(0);
		});
	});
}