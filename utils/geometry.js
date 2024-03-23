class Geometry {
  constructor() {
    this.canvas = gameEngine.canvas;
    this.xToAngle = this.createLookupTable();
  }
  createLookupTable() {
    let xToAngle = [];

    for (let i = 0; i <= this.canvas.canvasWidth; i++) {
      const angle = radiansToDegrees(
        Math.atan((HALFWIDTH - i) / SCREENDISTANCE)
      );
      xToAngle.push(angle);
    }
    return xToAngle;
  }

  distanceToPoint(vertex) {

    let dx = Math.abs(gameEngine.player.x - vertex.x);
    let dy = Math.abs(gameEngine.player.y - vertex.y);

    // if (dy > dx) {
    //   let temp = dx;
    //   dx = dy;
    //   dy = temp;
    // }

    return Math.sqrt(
      (dx) ** 2 +
      (dy) ** 2
    );
  }

  scaleFromGlobalAngle(x, realWallNormalAngle, realWallDistance) {
    const xAngle = this.xToAngle[x];
    const num =
      SCREENDISTANCE *
      Math.cos(
        degreesToRadians(
          realWallNormalAngle - xAngle - gameEngine.player.direction
        )
      );
    const den = realWallDistance * Math.cos(degreesToRadians(xAngle));

    let scale = num / den;
    scale = Math.min(MAXSCALE, Math.max(MINSCALE, scale));
    return scale;
  }
}
