class Angle {
  constructor(angle) {
    this.angle = this.normalizeAngle(angle);
  }

  normalizeAngle(angle) {
    angle = angle % 360;
    if (angle < 0) {
      angle += 360;
    }
    return angle;
  }

  add(otherAngle) {
    return new Angle(this.angle + otherAngle.angle);
  }

  subtract(otherAngle) {
    return new Angle(this.angle - otherAngle.angle);
  }

  negateAngle() {
    return new Angle(360 - this.angle);
  }

  static radiansToDegrees(angle) {
    return new Angle(angle * (180 / Math.PI));
  }
}
