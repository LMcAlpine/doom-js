class Player {
  constructor(location, { minX, minY }, { scaleX, scaleY }, game) {
    this.x = remapXToScreen(location.xPosition, minX, scaleX);
    this.y = remapYToScreen(location.yPosition, minY, scaleY);

    this.game = game;
  }
  update() {
    // this.x += 5;
    // this.y += 5;

    console.log(this.game);
    if (this.game.keys["w"] === true) {
      console.log("here");
      this.y -= 1;
    }
    if (this.game.keys["s"] === true) {
      console.log("here");
      this.y += 1;
    }
    if (this.game.keys["d"] === true) {
      console.log("here");
      this.x += 1;
    }
    if (this.game.keys["a"] === true) {
      console.log("here");
      this.x -= 1;
    }

    // if (this.x > 800) {
    //   this.x = 0;
    //   this.y = 0;
    // }
    // if (this.y > 600) {
    //   this.y = 0;
    // }
    // console.log("updating player");
  }
  draw(ctx) {
    // ctx.fillStyle = "red";
    // ctx.fillRect(this.x, this.y, 10, 10);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        ctx.putPixel(this.x + i, this.y + j, [255, 0, 0]);
      }
    }
  }
}
