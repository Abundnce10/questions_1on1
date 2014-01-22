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

	function updateGames() {
		io.sockets.emit("update games", games.map( function(g) { return g.gameName } ))
	};

	updateGames();

	socket.on("new game", function(gameName) {
		games.push({gameId: gameIds, gameName: gameName});
		gameIds += 1;
		updateGames();
	});


});
