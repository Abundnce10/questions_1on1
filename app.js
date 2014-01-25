var express = require("express"),
	app = express(),
	server = require("http").createServer(app),
	io = require("socket.io").listen(server),
	names = [],
	games = {},
	gameCounter = 0;


var questions = [
	{
		questionId: 1,
		question: "How many fingers do humans have?",
		answer: 5,
		options: [3,4,5,6]
	},
	{
		questionId: 2,
		question: "How many days in a week?",
		answer: 7,
		options: [2, 5, 7, 9]
	},
	{
		questionId: 3,
		question: "What color is produced from red and green?",
		answer: "Blue",
		options: ["Blue", "Orange", "Yellow", "Pink"]
	}
];


server.listen(3000);

app.get("/", function(req, res) {
	res.sendfile(__dirname + "/index.html");
});

io.sockets.on("connection", function(socket) {

	socket.emit("usage stats", { names: names.length, games: games.length } );


	socket.on("new player", function(name) {

		if (names.length > 0) {
			var opp = names.pop();
			console.log(name + ' vs. ' + opp.name)

			var gameObj = {
				opponent1: opp,
				opponent2: {name: name, socket: socket},
				opponent1Score: '0',
				opponent2Score: '0',
				questions: questions
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



		setTimeout(function() {
			io.sockets.in(gameKey).emit('new question', gameKey, games[gameKey].currentQuestion);
		}, 3000);

		

	}

	socket.on("answer", function(gameKey, questionId, answer, userName) {

		var game = games[gameKey];
		var question = games[gameKey].currentQuestion;

		console.log(gameKey);
		console.log(questionId);
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
				game.opponent1.socket.emit("question result", userName, question, game.opponent1Score, game.opponent2Score);
				game.opponent2.socket.emit("question result", userName, question, game.opponent2Score, game.opponent1Score);
				games[gameKey] = game;

				games[gameKey].currentQuestion = games[gameKey].questions.shift();

				setTimeout(function() {
					console.log("sending new question")
					io.sockets.in(gameKey).emit('new question', gameKey, games[gameKey].currentQuestion);
				}, 4500);

			} else {

				console.log("opponent2")

				game.opponent2Score = (parseInt(game.opponent2Score) + 1).toString();
				game.opponent2.socket.emit("question result", game.opponent2.name, question, game.opponent2Score, game.opponent1Score);
				game.opponent1.socket.emit("question result", game.opponent2.name, question, game.opponent1Score, game.opponent2Score);
				games[gameKey] = game;

				games[gameKey].currentQuestion = games[gameKey].questions.shift();

				setTimeout(function() {
					console.log("sending new question")
					io.sockets.in(gameKey).emit('new question', gameKey, games[gameKey].currentQuestion);
				}, 4500);

			}
		// wrong answer
		} else {	
			socket.emit("wrong");
		}
	
	

	});




});














