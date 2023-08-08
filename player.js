class Player {
  constructor(location, { minX, minY }, { scaleX, scaleY }, direction, fov) {
    // this.x2d = remapXToScreen(location.xPosition, minX, scaleX);
    // this.y2d = remapYToScreen(location.yPosition, minY, scaleY);
    this.location = location;
    this.x = location.xPosition;
    this.y = location.yPosition;

    this.minX = minX;
    this.minY = minY;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    this.direction = location.direction;
    this.fov = fov;
  }

  checkIfSegInFOV(seg) {
    let angleToV1 = this.angleTowardsVertex(seg.vertex1);
    let angleToV2 = this.angleTowardsVertex(seg.vertex2);

    const span = Angle.subtract(angleToV1.angle, angleToV2.angle);

    if (span.angle >= 180) {
      console.log("passing?");
      return false;
    }
    angleToV1 = Angle.subtract(angleToV1.angle, this.direction);
    angleToV2 = Angle.subtract(angleToV2.angle, this.direction);

    const halfFOV = 90 / 2;
    const v1Moved = angleToV1.add(halfFOV);
    if (v1Moved.angle > 90) {
      const v1MovedAngle = v1Moved.subtract(halfFOV);

      if (v1MovedAngle.angle >= span.angle) {
        return false;
      }
      angleToV1.angle = halfFOV;
    }

    const v2Moved = Angle.subtract(halfFOV - angleToV2.angle);

    if (v2Moved > 90) {
      angleToV2 = angleToV2.negateAngle();
    }
    angleToV1.angle += 90;
    angleToV2.angle += 90;

    return true;
  }

  angleTowardsVertex(vertex) {
    const adjacent = vertex.x - this.x;
    const opposite = vertex.y - this.y;
    return Angle.radiansToDegrees(Math.atan2(opposite, adjacent));
  }

  update() {
    if (gameEngine.keys["w"] === true) {
      this.y += 5;

      //  this.x2d -= 5;
    }
    if (gameEngine.keys["s"] === true) {
      this.y -= 5;
      //  this.y2d += 5;
    }
    if (gameEngine.keys["d"] === true) {
      this.x += 5;

      //  this.x2d += 5;
    }
    if (gameEngine.keys["a"] === true) {
      this.x -= 5;
      // this.x2d -= 5;
    }

    if (gameEngine.keys["ArrowLeft"] === true) {
      this.direction += 0.1875 * 4;
    }
    if (gameEngine.keys["ArrowRight"] === true) {
      this.direction -= 0.1875 * 4;
    }
  }

  draw(ctx) {
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        ctx.putPixel(
          remapXToScreen(this.x, this.minX, this.scaleX) + i,
          remapYToScreen(this.y, this.minY, this.scaleY) + j,
          [255, 0, 0]
        );
      }
    }
  }
}
