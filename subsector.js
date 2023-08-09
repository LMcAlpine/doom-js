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

      if (result.length !== 0) {
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

        const angleV1 = result[0];
        const angleV2 = result[1];

        this.addWall(seg, angleV1, angleV2);
      }
    }
  }

  addWall(seg, angleV1, angleV2) {
    const xScreenV1 = this.angleToX(angleV1.angle);
    const xScreenV2 = this.angleToX(angleV2.angle);

    this.canvas.drawLine({ x: xScreenV1, y: 0 }, { x: xScreenV1, y: 600 }, [
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
    ]);

    this.canvas.drawLine({ x: xScreenV2, y: 0 }, { x: xScreenV2, y: 600 }, [
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
    ]);
  }

  angleToX(angle) {
    const distanceToScreen = this.canvas.canvasWidth / 2;
    const halfScreenWidth = this.canvas.canvasWidth / 2;

    let x = 0;
    if (angle > 90) {
      angle -= 90;
      x =
        halfScreenWidth -
        Math.trunc(Math.tan(angle * (Math.PI / 180)) * distanceToScreen);
    } else {
      angle = 90 - angle;
      x = Math.trunc(Math.tan(angle * (Math.PI / 180)) * distanceToScreen);
      x += halfScreenWidth;
    }

    return x;
  }
}
