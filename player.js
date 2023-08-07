class Player {
  constructor(location, { minX, minY }, { scaleX, scaleY }, game) {
    this.x = remapXToScreen(location.xPosition, minX, scaleX);
    this.y = remapYToScreen(location.yPosition, minY, scaleY);

    this.game = game;
  }
  update() {
    if (this.game.keys["w"] === true) {
      this.y -= 1;
    }
    if (this.game.keys["s"] === true) {
      this.y += 1;
    }
    if (this.game.keys["d"] === true) {
      this.x += 1;
    }
    if (this.game.keys["a"] === true) {
      this.x -= 1;
    }
  }
  draw(ctx) {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        ctx.putPixel(this.x + i, this.y + j, [255, 0, 0]);
      }
    }
  }
}
