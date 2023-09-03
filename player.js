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
   */
  constructor(location, { minX, minY }, { scaleX, scaleY }, fov, height) {
    this.location = location;
    this.x = location.xPosition;
    this.y = location.yPosition;

    // this.x = 1391.0860290527344;
    // this.y = -2502.269790649414;

    this.minX = minX;
    this.minY = minY;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    this.direction = location.direction;
    // this.direction = 0.26;

    this.fov = fov;

    this.height = height;

    this.realWallAngle1;

    this.zVel = 0;
  }

  /**
   *
   * Processing method to determine if this segment is in the field of view of the player.
   * @param {Object} seg - represents the current segment being processed.
   * @returns {Array} - containing the two angles to vertex1 and vertex2 of this segment.
   */
  checkIfSegInFOV(seg) {
    let angleToV1 = this.angleTowardsVertex(seg.vertex1);
    let angleToV2 = this.angleTowardsVertex(seg.vertex2);

    const span = Angle.subtract(angleToV1.angle, angleToV2.angle);

    if (span.angle >= 180) {
      return [];
    }

    this.realWallAngle1 = Object.assign({}, angleToV1);

    angleToV1 = Angle.subtract(angleToV1.angle, this.direction);
    angleToV2 = Angle.subtract(angleToV2.angle, this.direction);

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
  }

  /**
   * Method to update the state of the player for each frame.
   */
  update() {
    // console.log("x: " + this.x);
    // console.log("y ;" + this.y);
    // console.log("angle: " + this.direction);
    const multiplier = 550;
    const magRotation = 0.1875 * multiplier;

    const speed = 0.3 * gameEngine.clockTick;
    const rot = 0.12 * gameEngine.clockTick;

    const radians = (this.direction * Math.PI) / 180;
    const dx = Math.sin(radians);
    const dy = Math.cos(radians);

    if (gameEngine.keys["w"] === true) {
      this.x +=
        Math.cos((this.direction * Math.PI) / 180) *
        multiplier *
        gameEngine.clockTick;
      this.y +=
        Math.sin((this.direction * Math.PI) / 180) *
        multiplier *
        gameEngine.clockTick;
    }
    if (gameEngine.keys["s"] === true) {
      this.x -=
        Math.cos((this.direction * Math.PI) / 180) *
        multiplier *
        gameEngine.clockTick;
      this.y -=
        Math.sin((this.direction * Math.PI) / 180) *
        multiplier *
        gameEngine.clockTick;
    }
    if (gameEngine.keys["d"] === true) {
      this.x += dx * multiplier * gameEngine.clockTick;
      this.y -= dy * multiplier * gameEngine.clockTick;
    }
    if (gameEngine.keys["a"] === true) {
      this.x -= dx * multiplier * gameEngine.clockTick;
      this.y += dy * multiplier * gameEngine.clockTick;
    }

    if (gameEngine.keys["ArrowLeft"] === true) {
      this.direction += magRotation * gameEngine.clockTick;
    }
    if (gameEngine.keys["ArrowRight"] === true) {
      this.direction -= magRotation * gameEngine.clockTick;
    }

    this.height = gameEngine.levelManager.getPlayerSubsectorHeight() + 41;
    //   let floorHeight = gameEngine.levelManager.getPlayerSubsectorHeight();
    //   if (this.height < floorHeight + 41) {
    //     this.height += 0.4 * (floorHeight + 41 - this.height);
    //     this.zVel = 0;
    //   } else {
    //     this.zVel -= 0.9;
    //     this.height += Math.max(-15.0, this.zVel);
    //   }
  }

  /**
   * Method to draw
   * @param {Object} ctx - canvas context
   */
  draw(ctx) {}
}
