class SolidSegsManager {
  constructor() {
    this.canvas = gameEngine.canvas;
  }

  initializeSolidsegs() {
    const solidsegs = [
      { first: Number.NEGATIVE_INFINITY, last: -1 },
      { first: this.canvas.canvasWidth, last: Number.POSITIVE_INFINITY },
    ];

    return solidsegs;
  }

  clearSolidsegs(solidsegs) {
    solidsegs = [
      { first: Number.NEGATIVE_INFINITY, last: -1 },
      { first: this.canvas.canvasWidth, last: Number.POSITIVE_INFINITY },
    ];

    return solidsegs;
  }
}
