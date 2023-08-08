class Player {
  constructor(location, { minX, minY }, { scaleX, scaleY }, direction, fov) {
    this.x = remapXToScreen(location.xPosition, minX, scaleX);
    this.y = remapYToScreen(location.yPosition, minY, scaleY);

    this.direction = direction;
    this.fov = fov;
  }

  checkIfSegInFOV(seg) {
    const angleToV1 = this.angleTowardsVertex(seg.vertex1);
    const angleToV2 = this.angleTowardsVertex(seg.vertex2);
  }

  angleTowardsVertex(vertex) {
    const adjacent = vertex.x - this.x;
    const opposite = vertex.y - this.y;
    return Angle.radiansToDegrees(Math.atan2(opposite, adjacent));
  }

  update() {
    if (gameEngine.keys["w"] === true) {
      this.y -= 5;
    }
    if (gameEngine.keys["s"] === true) {
      this.y += 5;
    }
    if (gameEngine.keys["d"] === true) {
      this.x += 5;
    }
    if (gameEngine.keys["a"] === true) {
      this.x -= 5;
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
