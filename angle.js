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
    return new Angle(this.angle + otherAngle);
  }

  static add(angle1,angle2) {
    return new Angle(angle1 + angle2);
  }

  subtract(otherAngle) {
    return new Angle(this.angle - otherAngle);
  }

  static subtract(angle1, angle2) {
    return new Angle(angle1 - angle2);
  }

  negateAngle() {
    return new Angle(360 - this.angle);
  }

  static radiansToDegrees(angle) {
    return new Angle(angle * (180 / Math.PI));
  }
}
