/**
 * Class representation of the player.
 */
class Player {
  /**
   * Construct an instance of the player.
   * @param {Object} location - the initial location of the player in the world.
   * @param {Object} param1  - minX and minY values for vertices to draw 2D map.
   * @param {Object} param2  - scaleX and scaleY values to scale vertices for 2D map.
   * @param {number} fov - the field of view for the player.
   * @param {number} height - the world height of the player.
   * @param {Object.<string, boolean>} keys - keyboard state index by key name.
   * @param {CollisionDetection} collisionDetector - checks movement and interaction collisions.
   * @param {Function} pointInSubsector - finds the subsector containing the given map coordinates.
   */
  constructor(
    location,
    { minX, minY },
    { scaleX, scaleY },
    fov,
    height,
    keys,
    collisionDetector,
    pointInSubsector,
  ) {
    this.location = location;
    this.x = location.xPosition;
    this.y = location.yPosition;

    // this.x = 3255;
    // this.y = -4254;

    this.minX = minX;
    this.minY = minY;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    this.direction = new Angle(location.direction);
    // this.direction = new Angle(178);
    //this.direction = new Angle(45);

    this.fov = fov;

    this.height = height;

    this.realWallAngle1;

    this.zVel = 0;

    this.door = null;

    this.keys = keys;
    this.collisionDetector = collisionDetector;
    this.pointInSubsector = pointInSubsector;
  }

  /**
   *
   * Processing method to determine if this segment is in the field of view of the player.
   * @param {Object} vertices - represents the current vertices being processed.
   * @returns {Array} - containing the two angles to vertex1 and vertex2 of this segment.
   */
  checkIfSegInFOV(vertices) {
    let angleToV1 = this.angleTowardsVertex(vertices.vertex1);
    let angleToV2 = this.angleTowardsVertex(vertices.vertex2);

    const span = Angle.subtract(angleToV1.angle, angleToV2.angle);

    if (span.angle >= 180) {
      return [];
    }

    this.realWallAngle1 = Object.assign({}, angleToV1);

    angleToV1 = Angle.subtract(angleToV1.angle, this.direction.angle);
    angleToV2 = Angle.subtract(angleToV2.angle, this.direction.angle);

    const halfFOV = new Angle(45);
    const v1Moved = angleToV1.add(halfFOV.angle);
    if (v1Moved.angle > 90) {
      const v1MovedAngle = v1Moved.subtract(90);

      if (v1MovedAngle.angle >= span.angle) {
        return [];
      }
      angleToV1.angle = halfFOV.angle;
    }

    const v2Moved = Angle.subtract(halfFOV.angle, angleToV2.angle);

    if (v2Moved.angle > 90) {
      angleToV2 = halfFOV.negateAngle();
    }

    angleToV1 = angleToV1.add(90);
    angleToV2 = angleToV2.add(90);

    return [angleToV1, angleToV2];
  }

  /**
   * Method to calculate the angle towards this vertex.
   * @param {Object} vertex - vertex to process.
   * @returns {Angle} - angle from the player location to vertex in degrees.
   */
  angleTowardsVertex(vertex) {
    const adjacent = vertex.x - this.x;
    const opposite = vertex.y - this.y;
    return Angle.radiansToDegrees(Math.atan2(opposite, adjacent));
    // let t = Math.atan2(opposite, adjacent);
    // let r = parseFloat(t.toFixed(7))
    // return new Angle(parseFloat(t.toFixed(7)));
  }

  /**
   * Updates the player for the current frame.
   * @param {number} clockTick - elapsed time since the previous frame, in seconds.
   */
  update(clockTick) {
    // console.log("x: " + this.x);
    // console.log("y ;" + this.y);
    // console.log("angle: " + this.direction.angle);
    const multiplier = 550;
    const magRotation = 0.1875 * multiplier;

    const radians = (this.direction.angle * Math.PI) / 180;
    const dx = Math.sin(radians);
    const dy = Math.cos(radians);
    let newX = this.x;
    let newY = this.y;

    this.rayX = this.x + Math.cos(radians) * 64;
    this.rayY = this.y + Math.sin(radians) * 64;

    if (this.keys["e"] === true) {
      this.door = this.collisionDetector.canInteract(
        this.x,
        this.y,
        this.rayX,
        this.rayY,
      );
      console.log(this.door);
    }

    if (this.door) {
      // console.log(door.leftSidedef.sector, door.rightSidedef.sector);

      if (
        this.door.leftSidedef.sector.ceilingHeight <=
        this.door.rightSidedef.sector.ceilingHeight
      ) {
        this.door.leftSidedef.sector.ceilingHeight += 128 * clockTick;
      }
      // door.leftSidedef.sector.ceilingHeight =
      //   door.rightSidedef.sector.ceilingHeight;
    }

    if (this.keys["w"] === true) {
      newX +=
        Math.cos((this.direction.angle * Math.PI) / 180) *
        multiplier *
        clockTick;

      newY +=
        Math.sin((this.direction.angle * Math.PI) / 180) *
        multiplier *
        clockTick;
      if (this.collisionDetector.canMoveTo(this.x, this.y, newX, newY)) {
        this.x = newX;
        this.y = newY;
        this.height = this.getPlayerSubsectorHeight() + 41;
      }
    }
    if (this.keys["s"] === true) {
      newX -=
        Math.cos((this.direction.angle * Math.PI) / 180) *
        multiplier *
        clockTick;
      newY -=
        Math.sin((this.direction.angle * Math.PI) / 180) *
        multiplier *
        clockTick;
      if (this.collisionDetector.canMoveTo(this.x, this.y, newX, newY)) {
        this.x = newX;
        this.y = newY;
        this.height = this.getPlayerSubsectorHeight() + 41;
      }
    }
    if (this.keys["d"] === true) {
      newX += dx * multiplier * clockTick;
      newY -= dy * multiplier * clockTick;
      if (this.collisionDetector.canMoveTo(this.x, this.y, newX, newY)) {
        this.x = newX;
        this.y = newY;
        this.height = this.getPlayerSubsectorHeight() + 41;
      }
    }
    if (this.keys["a"] === true) {
      newX -= dx * multiplier * clockTick;
      newY += dy * multiplier * clockTick;
      if (this.collisionDetector.canMoveTo(this.x, this.y, newX, newY)) {
        this.x = newX;
        this.y = newY;
        this.height = this.getPlayerSubsectorHeight() + 41;
      }
    }

    if (this.keys["ArrowLeft"] === true) {
      // this.direction += magRotation * gameEngine.clockTick;
      this.direction = this.direction.add(magRotation * clockTick);
    }
    if (this.keys["ArrowRight"] === true) {
      //this.direction -= magRotation * gameEngine.clockTick;
      this.direction = this.direction.subtract(magRotation * clockTick);
    }

    // if (Math.abs(gameEngine.levelManager.getPlayerSubsectorHeight - 41) < 24) {
    //   this.height = gameEngine.levelManager.getPlayerSubsectorHeight() + 41;
    // }

    // let nextSubsector = gameEngine.levelManager.pointInSubsector(newX, newY);

    // // let seg = gameEngine.levelManager.segs[nextSubsector.firstSegNumber];
    // // let nextFloorHeight = seg.rightSector.floorHeight;
    // let nextFloorHeight = nextSubsector.sector.floorHeight;

    // if (
    //   Math.abs(
    //     nextFloorHeight - gameEngine.levelManager.getPlayerSubsectorHeight(),
    //   ) < 24
    // ) {
    //   this.height = gameEngine.levelManager.getPlayerSubsectorHeight() + 41;
    // }

    // if (
    //   nextFloorHeight -
    //     gameEngine.levelManager.pointInSubsector(this.x, this.y).sector
    //       .floorHeight <
    //   24
    // ) {
    // }

    //   let floorHeight = gameEngine.levelManager.getPlayerSubsectorHeight();
    //   if (this.height < floorHeight + 41) {
    //     this.height += 0.4 * (floorHeight + 41 - this.height);
    //     this.zVel = 0;
    //   } else {
    //     this.zVel -= 0.9;
    //     this.height += Math.max(-15.0, this.zVel);
    //   }
  }

  getPlayerSubsectorHeight() {
    const currentSubsector = this.pointInSubsector(this.x, this.y);
    const currentFloorHeight = currentSubsector.sector.floorHeight;
    return currentFloorHeight;
  }

  /**
   * Method to draw
   * @param {Object} ctx - canvas context
   */
  draw(ctx) {}
}
