class GameLogic {
  constructor(tickLength = 50) {
    this.lastTick = performance.now();
    this.lastRender = this.lastTick;
    this.tickLength = tickLength;
    this.totalTicks = 0;
    this.frameCount = 0;
  }

  calculateTicks(tFrame) {
    const nextTick = this.lastTick + this.tickLength;
    let numTicks = 0;

    if (tFrame > nextTick) {
      const timeSinceTick = tFrame - this.lastTick;
      numTicks = Math.floor(timeSinceTick / this.tickLength);
    }
    this.totalTicks += numTicks;
    this.frameCount++;

    return numTicks;
  }
}