class GameLogic {
  constructor(tickLength = 50) {
    this.lastTick = performance.now();
    this.lastRender = this.lastTick;
    this.tickLength = tickLength;
    this.totalTicks = 0;
    this.frameCount = 0;

    this.gameTime = 0;
    this.maxStep = 0.05;
    this.lastTimestamp = 0;

    this.ticks = [];
  }

  // calculateTicks(tFrame) {
  //   const nextTick = this.lastTick + this.tickLength;
  //   let numTicks = 0;

  //   if (tFrame > nextTick) {
  //     const timeSinceTick = tFrame - this.lastTick;
  //     numTicks = Math.floor(timeSinceTick / this.tickLength);
  //   }
  //   this.totalTicks += numTicks;
  //   this.frameCount++;

  //   return numTicks;
  // }

  tick() {
    const current = performance.now();
    const delta = (current - this.lastTimestamp) / 1000;
    this.lastTimestamp = current;

    const gameDelta = Math.min(delta, this.maxStep);
    this.gameTime += gameDelta;

    this.ticks.push(delta);
    let index = this.ticks.length - 1;
    let sum = 0;
    while (sum <= 1 && index >= 0) {
      sum += this.ticks[index--];
    }
    index++;

    this.ticks.splice(0, index);

    return gameDelta;
  }
}
