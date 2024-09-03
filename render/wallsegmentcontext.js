// context
class WallSegmentContext {
  constructor(wallStrategy) {
    this.wallStrategy = wallStrategy;
    this.data = { upperclip: [], lowerclip: [] };
  }

  renderWallSegment(wallData) {
    this.wallStrategy.render(wallData, this);
  }

  setWallStrategy(wallStrategy) {
    this.wallStrategy = wallStrategy;
  }

  updateUpperClip(x, value) {
    this.data.upperclip[x] = value;
  }

  updateLowerClip(x, value) {
    this.data.lowerclip[x] = value;
  }

  getUpperClip(x) {
    return this.data.upperclip[x];
  }

  getLowerClip(x) {
    return this.data.lowerclip[x];
  }
}
