# Head-to-Head Questions 

I wanted to get more familiar with the Socket.io library so I created a very simple trivia game that you play with another player.  The server opens a socket for each player, places them into the same room, and then distributes the question to both users at the same time.  The first to respond with the correct answer gets a point.

You can view a very simple, working example [here](http://peaceful-citadel-7847.herokuapp.com/) (only 3 questions).

### To Do:
- Improve overall design
- Refactor code within socket.on("answer")
- Pull questions from MongoDB using Mongoose
- Utilize [200,000+ historical Jeopardy questions](http://usareddit.com/r/datasets/comments/1uyd0t/200000_jeopardy_questions_in_a_json_file/)
- Use the [Web Speech API](http://updates.html5rocks.com/2013/01/Voice-Driven-Web-Apps-Introduction-to-the-Web-Speech-API) to handle spoken answers
- Handle when a user leaves in the middle of a game

