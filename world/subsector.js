class Subsector {
  constructor(levelsData, segmentData, wallRenderer) {
    Object.assign(this, {
      subsectors: levelsData.subsectors,
      segs: segmentData.segs,
      vertices: levelsData.vertices,
      wallRenderer: wallRenderer,
    });

    this.upperclip = [];
    this.lowerclip = [];
  }

  initClipHeights() {
    this.upperclip.fill(-1);
    this.lowerclip.fill(this.canvas.canvasHeight);
  }

  handleSubsector(subsectorID) {
    const subsector = this.subsectors[subsectorID];

    for (let i = 0; i < subsector.segCount; i++) {
      const seg = this.segs[subsector.firstSegNumber + i];

      const segStartVertex = seg.startVertex;
      const segEndVertex = seg.endVertex;
      const result = gameEngine.player.checkIfSegInFOV({
        vertex1: segStartVertex,
        vertex2: segEndVertex,
      });

      if (result.length !== 0) {
        const angleV1 = result[0];
        const angleV2 = result[1];

        this.wallRenderer.addWall(seg, angleV1, angleV2);
      }
    }
  }
}
