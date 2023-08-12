class Subsector {
  constructor(subsectors, segs, vertices, sidedefObjects) {
    this.subsectors = subsectors;
    this.segs = segs;
    this.vertices = vertices;
    this.canvas = gameEngine.canvas;

    this.colors = new Map();
    for (let i = 0; i < sidedefObjects.length; i++) {
      if (!this.colors.has(sidedefObjects[i].middleTexture)) {
        this.colors.set(sidedefObjects[i].middleTexture, [
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
          Math.floor(Math.random() * 256),
        ]);
      }
    }

    this.solidsegs = this.initalizeSolidsegs();
  }

  handleSubsector(subsectorID) {
    const subsector = this.subsectors[subsectorID];

    const scaleData = calculateScale(this.vertices);

    for (let i = 0; i < subsector.segCount; i++) {
      const seg = this.segs[subsector.firstSegNumber + i];

      const segStartVertex = seg.startVertex;
      const segEndVertex = seg.endVertex;
      const result = gameEngine.player.checkIfSegInFOV({
        vertex1: segStartVertex,
        vertex2: segEndVertex,
      });

      if (result.length !== 0) {
        // not screen coordinates so not being drawn
        // this.canvas.drawLine(segStartVertex, segEndVertex, [
        //   Math.floor(Math.random() * 256),
        //   Math.floor(Math.random() * 256),
        //   Math.floor(Math.random() * 256),
        // ]);

        const angleV1 = result[0];
        const angleV2 = result[1];

        this.addWall(seg, angleV1, angleV2);
      }
    }
  }

  addWall(seg, angleV1, angleV2) {
    const xScreenV1 = this.angleToX(angleV1.angle);
    const xScreenV2 = this.angleToX(angleV2.angle);

    if (xScreenV1 === xScreenV2) {
      return;
    }
    if (seg.leftSector === null) {
      this.clipSolidWalls(seg, xScreenV1, xScreenV2, angleV1, angleV2);
      return;

      // this.canvas.drawLine({ x: xScreenV1, y: 0 }, { x: xScreenV1, y: 600 }, [
      //   Math.floor(Math.random() * 256),
      //   Math.floor(Math.random() * 256),
      //   Math.floor(Math.random() * 256),
      // ]);

      // this.canvas.drawLine({ x: xScreenV2, y: 0 }, { x: xScreenV2, y: 600 }, [
      //   Math.floor(Math.random() * 256),
      //   Math.floor(Math.random() * 256),
      //   Math.floor(Math.random() * 256),
      // ]);
    }
  }

  clipSolidWalls(seg, xScreenV1, xScreenV2, angleV1, angleV2) {
    if (this.solidsegs.length < 2) {
      return;
    }

    let totalSolidSegs = 0;
    while (this.solidsegs[totalSolidSegs].last < xScreenV1 - 1) {
      totalSolidSegs++;
    }

    if (xScreenV1 < this.solidsegs[totalSolidSegs].first) {
      if (xScreenV2 < this.solidsegs[totalSolidSegs].first - 1) {
        // draw wall
        this.drawWall(seg, xScreenV1, xScreenV2);
        this.solidsegs.splice(totalSolidSegs, 0, {
          first: xScreenV1,
          last: xScreenV2,
        });
        return;
      }

      //draw some other wall
      this.drawWall(seg, xScreenV1, this.solidsegs[totalSolidSegs].first - 1);
      this.solidsegs[totalSolidSegs].first = xScreenV1;
    }

    if (xScreenV2 <= this.solidsegs[totalSolidSegs].last) {
      return;
    }

    let next = totalSolidSegs;
    while (xScreenV2 >= this.solidsegs[next + 1].first - 1) {
      // draw wall
      this.drawWall(
        seg,
        this.solidsegs[next].last + 1,
        this.solidsegs[next + 1].first - 1
      );
      next++;

      if (xScreenV2 <= this.solidsegs[next].last) {
        this.solidsegs[totalSolidSegs].last = this.solidsegs[next].last;

        if (this.solidsegs[next] != this.solidsegs[totalSolidSegs]) {
          totalSolidSegs++;
          next++;
          this.solidsegs.splice(totalSolidSegs, next - totalSolidSegs);
        }
        return;
      }
    }

    // draw wall here
    this.drawWall(seg, this.solidsegs[next].last + 1, xScreenV2);
    this.solidsegs[totalSolidSegs].last = xScreenV2;

    if (this.solidsegs[next] !== this.solidsegs[totalSolidSegs]) {
      totalSolidSegs++;
      next++;
      this.solidsegs.splice(totalSolidSegs, next - totalSolidSegs);
    }
  }

  drawWall(seg, xScreenV1, xScreenV2) {
    const color = this.colors.get(seg.linedef.rightSidedef.middleTexture);

    for (let x = xScreenV1; x <= xScreenV2; x++) {
      this.canvas.drawLine(
        { x: x, y: 0 },
        { x: x, y: this.canvas.canvasHeight },
        color
      );
    }
  }

  angleToX(angle) {
    // const halfFOV = 90 / 2;
    // const tan = Math.ceil(Math.tan((halfFOV * Math.PI) / 180));
    // const distancePlayerToScreen = Math.floor(this.canvas.canvasWidth / tan);
    //  const distanceToScreen = distancePlayerToScreen;
    const distanceToScreen = this.canvas.canvasWidth / 2;
    const halfScreenWidth = this.canvas.canvasWidth / 2;

    let x = 0;
    if (angle > 90) {
      angle = new Angle(angle - 90);
      console.log(angle);
      console.log(Math.tan(angle * (Math.PI / 180)));
      console.log(Math.tan(angle * (Math.PI / 180)) * distanceToScreen);
      x =
        halfScreenWidth -
        Math.trunc(Math.tan(angle.angle * (Math.PI / 180)) * distanceToScreen);
    } else {
      angle = Angle.subtract(90, angle);
      x = Math.trunc(
        Math.tan(angle.angle * (Math.PI / 180)) * distanceToScreen
      );
      x += halfScreenWidth;
    }

    return x;
  }

  initalizeSolidsegs() {
    const solidsegs = [
      { first: Number.NEGATIVE_INFINITY, last: -1 },
      { first: this.canvas.canvasWidth, last: Number.POSITIVE_INFINITY },
    ];

    return solidsegs;
  }

  clearSolidsegs() {
    this.solidsegs = [
      { first: Number.NEGATIVE_INFINITY, last: -1 },
      { first: this.canvas.canvasWidth, last: Number.POSITIVE_INFINITY },
    ];
  }
}
