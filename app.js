var express = require("express"),
	app = express(),
	server = require("http").createServer(app),
	io = require("socket.io").listen(server),
	fs = require("fs"),
	questions = require("./questions.json"),
	names = [],
	games = {},
	players = 0,
	gameCounter = 0;


var questionCountdown = 3;


server.listen(process.env.PORT || 3000);

app.get("/", function(req, res) {
	res.sendfile(__dirname + "/index.html");
});


io.sockets.on("connection", function(socket) {

	if (players > 0) {
		io.sockets.emit("usage stats", players, gameCounter);
	}


	socket.on("new player", function(name) {

		players += 1;
		io.sockets.emit("usage stats", players, gameCounter);

		if (names.length > 0) {
			var opp = names.pop();
			console.log(name + ' vs. ' + opp.name)

			function clone(obj) {
			    if (null == obj || "object" != typeof obj) return obj;
			    var copy = obj.constructor();
			    for (var attr in obj) {
			        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
			    }
			    return copy;
			}

			var gameObj = {
				opponent1: opp,
				opponent2: {name: name, socket: socket},
				opponent1Score: '0',
				opponent2Score: '0',
				questions: clone(questions),
				currentQuestion: '',
				currentWrongs: 0
			};

			startGame(gameObj);
		} else {
			names.push({name: name, socket: socket});
			console.log('Waiting for another player');
			socket.emit('waiting for opponent');
		}
	});


	function startGame(gameObj) {

		gameCounter += 1;
		var gameKey = gameCounter.toString();

		console.log("gameCounter: " + gameCounter.toString());

		gameObj.currentQuestion = gameObj.questions.shift();

		games[gameKey] = gameObj;

		var one = gameObj.opponent1;
		var two = gameObj.opponent2;

		// create a room
		one.socket.join(gameKey);
		two.socket.join(gameKey);

		// pass name and opponent's name
		one.socket.emit("start game", one.name, two.name);
		two.socket.emit("start game", two.name, one.name);

		io.sockets.emit("usage stats", players, gameCounter);

		setTimeout(function() {
			io.sockets.in(gameKey).emit('new question', gameKey, games[gameKey].currentQuestion);
		}, questionCountdown * 1000);

		

	}

	socket.on("answer", function(gameKey, answer, userName) {

		var game = games[gameKey];
		var question = games[gameKey].currentQuestion;

		console.log(gameKey);
		console.log(answer);
		console.log(userName);
		console.log("found question")

		// correct answer?
		if (question.answer == answer) {

			console.log("right answer")
			
			// opponent1?
			if (game.opponent1.name == userName) {

				console.log("opponent1");

				game.opponent1Score = (parseInt(game.opponent1Score) + 1).toString();
				//io.sockets.in(gameKey).emit("question result", userName, questions[i], game.opponent1Score, game.opponent2Score);
				game.opponent1.socket.emit("question result", true, false, userName, question, game.opponent1Score, game.opponent2Score);
				game.opponent2.socket.emit("question result", false, true, userName, question, game.opponent2Score, game.opponent1Score);
				games[gameKey] = game;

				console.log("opponent1Score: " + game.opponent1Score.toString());
				console.log("opponent2Score: " + game.opponent2Score.toString());

				games[gameKey].currentQuestion = games[gameKey].questions.shift();
				if (games[gameKey].currentQuestion == undefined) {

					var winner = '';
					if (parseInt(game.opponent1Score) > parseInt(game.opponent2Score)) {
						winner = game.opponent1.name;
					} else if (parseInt(game.opponent1Score) > parseInt(game.opponent1Score)) {
						winner = game.opponent2.name;
					} else {
						winner = "Tie";
					}
					console.log("Winner: " + winner);
					setTimeout(function() {	
						io.sockets.in(gameKey).emit("end game", winner);
					}, questionCountdown * 1000);
					return;

				}

				io.sockets.in(gameKey).emit("prepare for next question", questionCountdown);
				setTimeout(function() {
					console.log("sending new question");
					games[gameKey].currentWrongs = 0;
					io.sockets.in(gameKey).emit('new question', gameKey, games[gameKey].currentQuestion);
				}, questionCountdown * 1000);

			} else {

				console.log("opponent2")

				game.opponent2Score = (parseInt(game.opponent2Score) + 1).toString();
				game.opponent2.socket.emit("question result", true, false, game.opponent2.name, question, game.opponent2Score, game.opponent1Score);
				game.opponent1.socket.emit("question result", false, true, game.opponent2.name, question, game.opponent1Score, game.opponent2Score);
				games[gameKey] = game;

				console.log("opponent1Score: " + game.opponent1Score.toString());
				console.log("opponent2Score: " + game.opponent2Score.toString());

				games[gameKey].currentQuestion = games[gameKey].questions.shift();
				if (games[gameKey].currentQuestion == undefined) {
					
					var winner = '';
					if (parseInt(game.opponent1Score) > parseInt(game.opponent2Score)) {
						winner = game.opponent1.name;
					} else if (parseInt(game.opponent1Score) > parseInt(game.opponent1Score)) {
						winner = game.opponent2.name;
					} else {
						winner = "Tie";
					}
					console.log("Winner: " + winner);
					setTimeout(function() {	
						io.sockets.in(gameKey).emit("end game", winner);
					}, questionCountdown * 1000);
					return;
					
				}

				io.sockets.in(gameKey).emit("prepare for next question", questionCountdown);
				setTimeout(function() {
					console.log("sending new question")
					games[gameKey].currentWrongs = 0;
					io.sockets.in(gameKey).emit('new question', gameKey, games[gameKey].currentQuestion);
				}, questionCountdown * 1000);

			}
		// wrong answer
		} else {

			console.log('wrong');
			console.log(games[gameKey].currentWrongs);
			
			games[gameKey].currentWrongs += 1;

			// both wrong answers?
			if (games[gameKey].currentWrongs == 2) {
				io.sockets.in(gameKey).emit("both wrong answers", gameKey, question);

				// wait seconds, send a new question
				games[gameKey].currentQuestion = games[gameKey].questions.shift();
				if (games[gameKey].currentQuestion == undefined) {

					var winner = '';
					if (parseInt(game.opponent1Score) > parseInt(game.opponent2Score)) {
						winner = game.opponent1.name;
					} else if (parseInt(game.opponent1Score) > parseInt(game.opponent1Score)) {
						winner = game.opponent2.name;
					} else {
						winner = "Tie";
					}
					console.log("Winner: " + winner);
					setTimeout(function() {	
						io.sockets.in(gameKey).emit("end game", winner);
					}, questionCountdown * 1000);
					return;

				}

				io.sockets.in(gameKey).emit("prepare for next question", questionCountdown);
				setTimeout(function() {
					console.log("sending new question");
					games[gameKey].currentWrongs = 0;
					io.sockets.in(gameKey).emit('new question', gameKey, games[gameKey].currentQuestion);
				}, questionCountdown * 1000);

			// one wrong answer
			} else {
				socket.emit("wrong");
			}
		}
	
	});


	socket.on("disconnect", function() {
		players -= 1;
		console.log("player left");
		io.sockets.emit("usage stats", players, gameCounter);
	})


});














