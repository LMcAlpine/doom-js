class Subsector {
  constructor(subsectors, segs, vertices, canvas) {
    this.subsectors = subsectors;
    this.segs = segs;
    this.vertices = vertices;
    this.canvas = canvas;

    this.segsToDraw = [];
    this.count = 0;
  }

  handleSubsector(subsectorID) {
    const subsector = this.subsectors[subsectorID];

    const scaleData = calculateScale(this.vertices);

    for (let i = 0; i < subsector.segCount; i++) {
      const seg = this.segs[subsector.firstSegNumber + i];
      this.segsToDraw.push(seg);
      this.count++;
      // console.log(seg);
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
    this.canvas.updateCanvas();
  }
}
