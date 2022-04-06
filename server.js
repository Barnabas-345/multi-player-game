require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const socket = require('socket.io');
const nocache = require("nocache");
const helmet = require("helmet");
const cors = require('cors');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(helmet.noSniff());
app.use(helmet.xssFilter({}));
app.use(nocache());

//Enabling the use of CORS here breaks everything for some
app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(function (req, res, next) {
  res.setHeader( 'X-Powered-By', 'PHP 7.4.3' );
  next();
});

// Index page (static HTML) 
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

const io = socket(server)
const gameState = {
  players: {},
  lobbyLeader : ""
}

io.on('connection', (socket) => {
  console.log("Server: a user connected:", socket.id);

  socket.on("disconnect", ()=>{
    console.log("User Disconnected")
    if(gameState.players.length > 1)//If there are more players in there
      if(lobbyLeader == gameState.players[socket.id].id)//And the lobby leader quits
        lobbyLeader = gameState.players[0].id

    delete gameState.players[socket.id]
  })

  socket.on('newPlayer', (player)=>{
    console.log("Server : New joined the game!")
    gameState.players[socket.id] = player
    gameState.lobbyLeader = player.id
    console.log(gameState)
    })

    socket.on("playerMoved", (player) => { // update gameState.players array
      if(gameState.players[socket.id]){
        gameState.players[socket.id].x = player.x
        gameState.players[socket.id].y = player.y
      }
    })

    socket.on("newCollectible", (collectible) => { // update gameState.players array
      console.log("New Collectible")
      gameState.collectible = collectible
    })

    socket.on("collectibleCaught", (playerandcollectible) => { // update gameState.players array
      console.log("Collectible Caught")
      delete gameState.collectible//Destroy Collectible
      for (var player in gameState.players) { // Update scores
        if (gameState.players[player].id == playerandcollectible.id)
          gameState.players[player].score += playerandcollectible.value
          gameState.caughtLastCollectible = playerandcollectible.id
      }
      console.log(gameState.players)
    })
})

setInterval(() => {
  io.sockets.emit('state', gameState);
}, 1000/60);

module.exports = app; // For testing