let app = require('express')();
let server = require('http').Server(app);
let io = require('socket.io')(server);
let usernamesToSocketsMap = new Map();
let socketsIdsToUsernamesMap = new Map();

server.listen(5000);

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/web/index.html');
});

io.on('connection', function (socket) {
	console.log('Someone wants to chat');

	socket.on('authenticate', function (data) {
		let username = data.username;

		usernamesToSocketsMap.set(username, socket);
		socketsIdsToUsernamesMap.set(socket.id, username);

		socket.emit('authenticated');
	});

	socket.on('send_message', function (data) {
		let messagesMatched = data.match(/\/pm ([A-z0-9]+) (.+)/);
		let author = socketsIdsToUsernamesMap.get(socket.id);

		if (messagesMatched)
		{
			let recipient = messagesMatched[1];
			let message = messagesMatched[2];

			if (usernamesToSocketsMap.has(recipient))
			{
				usernamesToSocketsMap.get(recipient).emit('new_private_message', {'message': message, 'author': author})
			}
			else
			{
				socket.emit('new_message', {'message': 'Recipient not found', 'author': 'system'});
			}
		}
		else
		{
			socket.broadcast.emit('new_message', {'message': data, 'author': author});
		}
	});
});
