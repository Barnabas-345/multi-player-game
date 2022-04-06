import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

//Variables Declaration
const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');
const mainPlayer = new Player({x: Math.floor(Math.random() * (canvas.width-10)),y: Math.floor(Math.random() * (canvas.height-10)),score: 0,id: getRandomId()})

var collectible
var direction = ""
var players = []
var ownrank = 0
const height = 10
const speed = 20
var canCatch = true
var emittedCollectible = false

//Loading images at initializationg for quicker operation later
var collectibleDrawingGold = new Image();
    collectibleDrawingGold.src = 'https://raw.githubusercontent.com/deeveraEnchongOfficial/Images_Upload/main/secure-real-time-multiplayer-game/gold-coin.png'; // can also be a remote URL e.g. http://
var collectibleDrawingSilver = new Image();
    collectibleDrawingSilver.src = 'https://raw.githubusercontent.com/deeveraEnchongOfficial/Images_Upload/main/secure-real-time-multiplayer-game/silver-coin.png'; // can also be a remote URL e.g. http://
var collectibleDrawingBronze = new Image();
    collectibleDrawingBronze.src = 'https://raw.githubusercontent.com/deeveraEnchongOfficial/Images_Upload/main/secure-real-time-multiplayer-game/bronze-coin.png'; // can also be a remote URL e.g. http://
var mainPlayerDrawing = new Image();
    mainPlayerDrawing.src = 'https://raw.githubusercontent.com/deeveraEnchongOfficial/Images_Upload/main/secure-real-time-multiplayer-game/other-player.png'
var otherPlayerDrawing = new Image();
    otherPlayerDrawing.src = ''

socket.emit('newPlayer', mainPlayer);


const render = (gameState) => {
    context.clearRect(0, 0, 640, 480);
    //Drawing collectible
    if(gameState.collectible){
        switch(gameState.collectible.value){
            case 1:
            context.drawImage(collectibleDrawingBronze, gameState.collectible.x, gameState.collectible.y)
            break;
            case 2:
            context.drawImage(collectibleDrawingSilver, gameState.collectible.x, gameState.collectible.y)
            break
            case 3:
            context.drawImage(collectibleDrawingGold, gameState.collectible.x, gameState.collectible.y)
            break;
            default:
                console.log("Collectible Exception Detected")
            break
        }
    }

    //Drawing players
    for (let player in gameState.players)
        if(gameState.players[player].id == mainPlayer.id)
            context.drawImage(mainPlayerDrawing, gameState.players[player].x, gameState.players[player].y)
        else
            context.drawImage(otherPlayerDrawing, gameState.players[player].x, gameState.players[player].y)

    //Drawing Rank
    context.font = "40pt Calibri";
    context.fillText(ownrank, 400, 50);
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
    }

socket.on("state", (gameState)=>{
    if(!gameState)
        return
    
    if(!gameState.collectible && gameState.lobbyLeader == mainPlayer.id && !emittedCollectible){//if no collectible, emit a new one
        socket.emit("newCollectible", new Collectible({x:getRandomInt(canvas.width-40),y: getRandomInt(canvas.height-40), value: getRandomInt(3)+1, id: getRandomId()}))
        emittedCollectible = true

        //Adding a delay to prevent firing new collectible twice in between completion of new collectible event
        setInterval(()=> {
            emittedCollectible = false}
            , 1000)
    }
    else
        collectible = gameState.collectible

    if(players.length)
        ownrank = mainPlayer.calculateRank(players)

    if(collectible)
        if(mainPlayer.collision(collectible) && canCatch){
            socket.emit("collectibleCaught", {id: mainPlayer.id, value: collectible.value})
            canCatch = false
            //Adding a delay to prevent firing collectible caught twice in between caught and event ran
            setInterval(()=> {
                canCatch = true}
                , 1000)
        }

    //Was faced with either reorganizing my players collection on server side as an array instead of a collection of object or implement a "patch"
    //to maintain my players array.  Opted for this as it makes sense for me at this time to keep a socket ID collection on server side.
    if(players.length != gameState.nbPlayers){ 
        players = []
        for (let player in gameState.players)
            players.push(gameState.players[player])
    }
    render(gameState)
})

const keyDownHandler = (e) => {

    if(e.keyCode == 39 && mainPlayer.x < 640)
        direction = "right"
    else if (e.keyCode == 37 && mainPlayer.x > 0)
        direction = "left"
    else if (e.keyCode == 38 && mainPlayer.y > 0)
        direction = "up"
    else if(e.keyCode == 40 && mainPlayer.y < 480- height)
    direction = "down"
    
    mainPlayer.movePlayer(direction,speed)
}

function getRandomId() {
    var letters = '0123456789ABCDEF';
    var str = '';
    for (var i = 0; i < 6; i++) {
      str += letters[Math.floor(Math.random() * 16)];
    }
    return str;
  }

setInterval(()=> {
    socket.emit("playerMoved", mainPlayer)}
    , 1000 /60)

document.addEventListener('keydown', keyDownHandler, false);