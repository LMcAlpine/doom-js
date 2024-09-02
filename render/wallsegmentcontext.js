// context
class WallSegmentContext {
  constructor(wallStrategy) {
    this.wallStrategy = wallStrategy;
  }

  renderWallSegment() {
    this.wallStrategy.render();
  }

  setWallStrategy(wallStrategy) {
    this.wallStrategy = wallStrategy;
  }
}
