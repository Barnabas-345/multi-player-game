class Player {
  constructor({x, y, score, id}) {
    this.x = x
    this.y = y
    this.score = score
    this.id = id
    this.offset = 25 // depends on the size of the image used when initializing
  }

  movePlayer(dir, speed) {
    switch(dir){
      case "right":
        this.x += speed
        break
      case "left":
        this.x -= speed
        break
      case "up":
        this.y -= speed
        break
      case "down":
        this.y += speed
        break
    }
  }

  collision(item) {
    if(this.x < item.x + this.offset &&
      this.x > item.x - this.offset &&
      this.y < item.y + this.offset &&
      this.y > item.y - this.offset)
      return true
    else
      return false
  }

  //Return current rank given an array of players
  calculateRank(arr) {
    var organizedArr = arr.sort((a, b) => parseFloat(a.score) - parseFloat(b.score));
    return "Rank: " + (organizedArr.length-organizedArr.findIndex(player => player.id ===this.id)).toString() + '/' + organizedArr.length.toString() ;
  }
}

export default Player;