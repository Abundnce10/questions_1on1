var express = require("express"),
	app = express(),
	server = require("http").createServer(app),
	io = require("socket.io").listen(server),
	games = [],
	gameIds = 1;


server.listen(3000);

app.get("/", function(req, res) {
	res.sendfile(__dirname + "/index.html");
});

io.sockets.on("connection", function(socket) {

	console.log("connected to client");

	socket.on("new game", function(gameName, callback) {
		
		console.log(games);
		console.log(gameName);

		if (games.indexOf(gameName) !== -1) {
			callback(false);
		} else {
			
			console.log(games);

			games.push(gameName);
			callback({gameId: gameIds, gameName: gameName});
			gameIds += 1;
		}
	});


});
