/**
 * Represents an angle with utility methods for operations and conversions.
 */
class Angle {
  /**
   * Constructs an Angle instance.
   * @param {number} angle - The angle in degrees.
   */
  constructor(angle) {
    this.angle = this.normalizeAngle(angle);
  }
  /**
   * Normalizes the given angle to the range [0, 360).
   * @param {number} angle - The angle in degrees.
   * @returns {number} The normalized angle in degrees.
   */
  normalizeAngle(angle) {
    angle = angle % 360;
    if (angle < 0) {
      angle += 360;
    }
    return angle;
    // if (angle < 0) {
    //   angle += 2 * Math.PI;
    // }
    // else if (angle >= 2 * Math.PI) {
    //   angle -= 2.0 * Math.PI;
    // }
  }

  /**
   * Add another angle to the current angle and return a new Angle instance.
   * @param {number} otherAngle - The angle value to be added.
   * @returns {Angle} A new Angle instance representing the sum of the angles.
   */
  add(otherAngle) {
    return new Angle(this.angle + otherAngle);
  }

  /**
   * Static method to add two angles and return a new Angle instance.
   * @static
   * @param {number} angle1 - The first angle value.
   * @param {number} angle2 - The second angle value.
   * @returns {Angle} A new Angle instance representing the sum of the angles.
   */
  static add(angle1, angle2) {
    return new Angle(angle1 + angle2);
  }

  /**
   * Subtract another angle from the current angle and return a new Angle instance.
   * @param {number} otherAngle - The angle value to be subtracted.
   * @returns {Angle} A new Angle instance representing the difference of the angles.
   */
  subtract(otherAngle) {
    return new Angle(this.angle - otherAngle);
  }

  /**
   * Static method to subtract one angle from another and return a new Angle instance.
   * @static
   * @param {number} angle1 - The angle from which to subtract.
   * @param {number} angle2 - The angle to subtract.
   * @returns {Angle} A new Angle instance representing the difference of the angles.
   */
  static subtract(angle1, angle2) {
    return new Angle(angle1 - angle2);
  }

  /**
   * Negate the current angle and return a new Angle instance.
   * @returns {Angle} A new Angle instance representing the negated angle.
   */
  negateAngle() {
    return new Angle(360 - this.angle);
  }

  /**
   * Convert radians to degrees and return a new Angle instance.
   * @static
   * @param {number} angle - The angle value in radians.
   * @returns {Angle} A new Angle instance representing the angle in degrees.
   */
  static radiansToDegrees(angle) {
    return new Angle(angle * (180 / Math.PI));
  }
}
