// Detect when things collide and handle the physics response
class CollisionSystem {
  constructor(walls) {
    this.walls = walls;

    // walls.forEach((linedef) => {
    //   const vertex1 = this.vertices[linedef.startVertex];
    //   const vertex2 = this.vertices[linedef.endVertex];

    //   // const drawX = remapXToScreen(vertex1.x, this.minX, this.scaleX);
    //   // const drawY = remapYToScreen(vertex1.y, this.minY, this.scaleY);

    //   // const drawX2 = remapXToScreen(vertex2.x, this.minX, this.scaleX);
    //   // const drawY2 = remapYToScreen(vertex2.y, this.minY, this.scaleY);
    //   // gameEngine.canvas.drawLine(drawX, drawY, drawX2, drawY2, [100, 30, 4]);
    // });
  }

  resolveMovement(entity, vertex1, vertex2) {
    // for (const wall of this.walls) {
    let wallPoints = {
      x1: vertex1.x,
      x2: vertex2.x,
      y1: vertex1.y,
      y2: vertex2.y,
    };

    if (this.checkCircleVsWall(entity.x, entity.y, entity.radius, wallPoints)) {
      gameEngine.player.x = gameEngine.player.prevX;
      gameEngine.player.y = gameEngine.player.prevY;
      // return;
      // }
    }
  }

  checkCircleVsWall(x, y, radius, wall) {
    const abx = wall.x2 - wall.x1;
    const aby = wall.y2 - wall.y1;

    const ab = { x: abx, y: aby };

    const apx = x - wall.x1;
    const apy = y - wall.y1;

    const ap = { x: apx, y: apy };

    const dotAP_AB = dot(ap, ab);

    const dotAB_AB = dot(ab, ab);

    let t = dotAP_AB / dotAB_AB;
    t = Math.max(0, Math.min(1, t));

    this.qx = wall.x1 + t * ab.x;
    this.qy = wall.y1 + t * ab.y;

    this.distance = Math.sqrt((x - this.qx) ** 2 + (y - this.qy) ** 2);

    return this.distance < radius;
  }
}
