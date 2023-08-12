class Player {
  constructor(location, { minX, minY }, { scaleX, scaleY }, fov, height) {
    this.location = location;
    this.x = location.xPosition;
    this.y = location.yPosition;

    this.minX = minX;
    this.minY = minY;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    this.direction = location.direction;
    //  this.direction = -26.25;
    this.fov = fov;

    this.height = height;

    this.realWallAngle1;
  }

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

  angleTowardsVertex(vertex) {
    const adjacent = vertex.x - this.x;
    const opposite = vertex.y - this.y;
    return Angle.radiansToDegrees(Math.atan2(opposite, adjacent));
  }

  update() {
    const multiplier = 10;
    const magRotation = 0.1875 * multiplier;

    const radians = (this.direction * Math.PI) / 180;
    const dx = Math.sin(radians);
    const dy = Math.cos(radians);

    if (gameEngine.keys["w"] === true) {
      this.x += Math.cos((this.direction * Math.PI) / 180) * multiplier;
      this.y += Math.sin((this.direction * Math.PI) / 180) * multiplier;
    }
    if (gameEngine.keys["s"] === true) {
      this.x -= Math.cos((this.direction * Math.PI) / 180) * multiplier;
      this.y -= Math.sin((this.direction * Math.PI) / 180) * multiplier;
    }
    if (gameEngine.keys["d"] === true) {
      this.x += dx * multiplier;
      this.y -= dy * multiplier;
    }
    if (gameEngine.keys["a"] === true) {
      this.x -= dx * multiplier;
      this.y += dy * multiplier;
    }

    if (gameEngine.keys["ArrowLeft"] === true) {
      this.direction += magRotation;
    }
    if (gameEngine.keys["ArrowRight"] === true) {
      this.direction -= magRotation;
    }
  }

  draw(ctx) {
    // for (let i = 0; i < 3; i++) {
    //   for (let j = 0; j < 3; j++) {
    //     ctx.putPixel(
    //       remapXToScreen(this.x, this.minX, this.scaleX) + i,
    //       remapYToScreen(this.y, this.minY, this.scaleY) + j,
    //       [255, 0, 0]
    //     );
    //   }
    // }
  }
}
