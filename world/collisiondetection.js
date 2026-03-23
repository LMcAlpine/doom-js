class CollisionDetection {
  constructor(linedefs) {
    this.linedefs = linedefs;
  }

  canMoveTo(currentX, currentY, newX, newY) {
    for (let i = 0; i < this.linedefs.length; i++) {
      if (this.intersects(currentX, currentY, newX, newY, this.linedefs[i])) {
        return false;
      }
    }
    return true;
  }

  intersects(currentX, currentY, newX, newY, linedef) {
    const currentSide = this.crossProduct(
      currentX,
      currentY,
      linedef.startVertex,
      linedef.endVertex,
    );
    const newSide = this.crossProduct(
      newX,
      newY,
      linedef.startVertex,
      linedef.endVertex,
    );

    const vertex1 = { x: currentX, y: currentY };
    const vertex2 = { x: newX, y: newY };

    const wallCurrentSide = this.crossProduct(
      linedef.startVertex.x,
      linedef.startVertex.y,
      vertex1,
      vertex2,
    );

    const wallNewSide = this.crossProduct(
      linedef.endVertex.x,
      linedef.endVertex.y,
      vertex1,
      vertex2,
    );

    if (currentSide !== newSide && wallCurrentSide !== wallNewSide) {
      return true;
    }

    return false;
  }

  crossProduct(x, y, vertex1, vertex2) {
    const dx = x - vertex1.x;

    const dy = y - vertex1.y;

    const changeInX = vertex2.x - vertex1.x;
    const changeInY = vertex2.y - vertex1.y;

    const result = Math.round(dx * changeInY - dy * changeInX);

    return result <= 0;
  }
}
