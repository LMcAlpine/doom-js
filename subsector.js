class Subsector {
  constructor(subsectors, segs, vertices, canvas) {
    this.subsectors = subsectors;
    this.segs = segs;
    this.vertices = vertices;
    this.canvas = canvas;
  }

  handleSubsector(subsectorID) {
    const subsector = this.subsectors[subsectorID];

    // console.log("Rendering subsector....");
    // console.log(subsector);
    //const scaleData = calculateScale(this.vertices);

    for (let i = 0; i < subsector.segCount; i++) {
      const seg = this.segs[subsector.firstSegNumber];
      // console.log(seg);
      //   const vertices = convertToScreenCoordinates(
      //     this.vertices,
      //     seg.startingVertexNumber,
      //     seg.endingVertexNumber,
      //     scaleData
      //   );
      //   const p1 = vertices.v1;
      //   const p2 = vertices.v2;
      //   this.canvas.drawLine(p1, p2, [255, 95, 31]);
    }
    //     this.canvas.updateCanvas();
  }
}
