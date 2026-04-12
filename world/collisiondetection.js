class CollisionDetection {
  constructor(linedefs, pointInSubsector) {
    this.linedefs = linedefs;
    this.pointInSubsector = pointInSubsector;
  }

  canMoveTo(currentX, currentY, newX, newY) {
    for (let i = 0; i < this.linedefs.length; i++) {
      // if (this.intersects(currentX, currentY, newX, newY, this.linedefs[i])) {
      //   return false;
      // }
      let linedef = this.linedefs[i];
      console.log(linedef.flag);
      if (linedef.flag & 0x0001 || linedef.flag & 0x0020) {
        if (this.isTooClose(newX, newY, linedef)) {
          return false;
        }
      }
    }
    if (this.isTooHigh(currentX, currentY, newX, newY)) {
      return false;
    }

    if (this.isTooSmall(currentX, currentY, newX, newY)) {
      return false;
    }
    return true;
  }

  isTooSmall(currentX, currentY, newX, newY) {
    const currentSubsector = this.pointInSubsector(currentX, currentY);
    const currentFloorHeight = currentSubsector.sector.floorHeight;

    const nextSubsector = this.pointInSubsector(newX, newY);
    const nextFloorHeight = nextSubsector.sector.floorHeight;

    const currentCeilingHeight = currentSubsector.sector.ceilingHeight;
    const nextCeilingHeight = nextSubsector.sector.ceilingHeight;

    const lowestCeiling = Math.min(currentCeilingHeight, nextCeilingHeight);
    const highestFloor = Math.max(currentFloorHeight, nextFloorHeight);

    if (lowestCeiling - highestFloor < 56) {
      return true;
    }
    return false;
  }

  isTooHigh(currentX, currentY, newX, newY) {
    const currentSubsector = this.pointInSubsector(currentX, currentY);
    const currentFloorHeight = currentSubsector.sector.floorHeight;

    const nextSubsector = this.pointInSubsector(newX, newY);
    const nextFloorHeight = nextSubsector.sector.floorHeight;
    console.log(currentSubsector, nextSubsector);
    console.log(nextFloorHeight - currentFloorHeight);
    console.log(currentX, currentY, newX, newY);
    if (nextFloorHeight - currentFloorHeight > 24) {
      return true;
    }

    return false;
  }

  closestPoint(newX, newY, linedef) {
    // (px-ax) * dx + (py-ay) * dy / (dx * dx + dy * dy)

    const dx = linedef.endVertex.x - linedef.startVertex.x;
    const dy = linedef.endVertex.y - linedef.startVertex.y;

    const ax = linedef.startVertex.x;
    const ay = linedef.startVertex.y;

    const num = (newX - ax) * dx + (newY - ay) * dy;
    const den = dx * dx + dy * dy;

    let t = num / den;
    t = Math.max(0, Math.min(1, t));

    const closestX = ax + t * dx;
    const closestY = ay + t * dy;

    return { closestX, closestY };
  }

  isTooClose(newX, newY, linedef) {
    let { closestX, closestY } = this.closestPoint(newX, newY, linedef);

    let distance = this.distanceToPoint(closestX, closestY, newX, newY);

    let radius = 16;
    if (distance < radius) {
      return true;
    }
    return false;
  }

  intersects(currentX, currentY, newX, newY, linedef) {
    // which side of the linedef the current player position is on
    const currentSide = this.crossProduct(
      currentX,
      currentY,
      linedef.startVertex,
      linedef.endVertex,
    );
    // which side of the linedef the new player position is on
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

  /**
   *
   * @param {*} x component of one point being tested
   * @param {*} y component of one point being tested
   * @param {*} vertex1 one endpoint of a line
   * @param {*} vertex2 one endpoint of a line
   * @returns
   */
  crossProduct(x, y, vertex1, vertex2) {
    const dx = x - vertex1.x;

    const dy = y - vertex1.y;

    const changeInX = vertex2.x - vertex1.x;
    const changeInY = vertex2.y - vertex1.y;

    const result = Math.round(dx * changeInY - dy * changeInX);

    return result <= 0;
  }
  distanceToPoint(closestX, closestY, newX, newY) {
    let dx = newX - closestX;
    let dy = newY - closestY;

    return Math.sqrt(dx ** 2 + dy ** 2);
  }
}
