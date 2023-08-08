class Subsector {
  constructor(subsectors, segs, vertices) {
    this.subsectors = subsectors;
    this.segs = segs;
    this.vertices = vertices;
    this.canvas = gameEngine.canvas;
  }

  handleSubsector(subsectorID) {
    const subsector = this.subsectors[subsectorID];

    const scaleData = calculateScale(this.vertices);

    for (let i = 0; i < subsector.segCount; i++) {
      const seg = this.segs[subsector.firstSegNumber + i];

      const segStartVertex = this.vertices[seg.startingVertexNumber];
      const segEndVertex = this.vertices[seg.endingVertexNumber];
      const result = gameEngine.player.checkIfSegInFOV({
        vertex1: segStartVertex,
        vertex2: segEndVertex,
      });

      if (result) {
        const vertices = convertToScreenCoordinates(
          this.vertices,
          seg.startingVertexNumber,
          seg.endingVertexNumber,
          scaleData
        );
        const p1 = vertices.v1;
        const p2 = vertices.v2;
        this.canvas.drawLine(p1, p2, [
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
        ]);
      }
    }
  }
}
