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
    return Math.sqrt(
      (gameEngine.player.x - vertex.x) ** 2 +
        (gameEngine.player.y - vertex.y) ** 2
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
