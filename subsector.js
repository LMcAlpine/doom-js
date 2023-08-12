class Subsector {
  constructor(subsectors, segs, vertices, sidedefObjects) {
    this.subsectors = subsectors;
    this.segs = segs;
    this.vertices = vertices;
    this.canvas = gameEngine.canvas;

    this.xToAngle = this.createLookupTable();

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

    this.upperclip = [];
    this.lowerclip = [];
  }

  initClipHeights() {
    this.upperclip.fill(-1);
    this.lowerclip.fill(this.canvas.canvasHeight);
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
    //left sector == backsector
    //righ sector == front sector
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
        this.drawWall(seg, xScreenV1, xScreenV2, angleV1);
        this.solidsegs.splice(totalSolidSegs, 0, {
          first: xScreenV1,
          last: xScreenV2,
        });
        return;
      }

      //draw some other wall
      this.drawWall(
        seg,
        xScreenV1,
        this.solidsegs[totalSolidSegs].first - 1,
        angleV1
      );
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
        this.solidsegs[next + 1].first - 1,
        angleV1
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
    this.drawWall(seg, this.solidsegs[next].last + 1, xScreenV2, angleV1);
    this.solidsegs[totalSolidSegs].last = xScreenV2;

    if (this.solidsegs[next] !== this.solidsegs[totalSolidSegs]) {
      totalSolidSegs++;
      next++;
      this.solidsegs.splice(totalSolidSegs, next - totalSolidSegs);
    }
  }

  createLookupTable() {
    let xToAngle = [];

    for (let i = 0; i <= this.canvas.canvasWidth; i++) {
      const angle = radiansToDegrees(
        Math.atan((HALFWIDTH - i) / SCREENDISTANCE)
      );
      xToAngle.push(angle);
    }
    return xToAngle;
  }

  distanceToPoint(vertex) {
    // return Math.sqrt(Math.pow(this.xPos - vertex.x, 2) + Math.pow(this.yPos - vertex.y, 2));
    return Math.sqrt(
      (gameEngine.player.x - vertex.x) ** 2 +
        (gameEngine.player.y - vertex.y) ** 2
    );
  }

  scaleFromGlobalAngle(x, realWallNormalAngle, realWallDistance) {
    const xAngle = this.xToAngle[x];
    const num =
      SCREENDISTANCE *
      Math.cos(
        degreesToRadians(
          realWallNormalAngle - xAngle - gameEngine.player.direction
        )
      );
    const den = realWallDistance * Math.cos(degreesToRadians(xAngle));

    let scale = num / den;
    scale = Math.min(MAXSCALE, Math.max(MINSCALE, scale));
    return scale;
  }

  drawWall(seg, xScreenV1, xScreenV2, angleV1) {
    const rightSector = seg.rightSector;
    const line = seg.linedef;
    const side = seg.linedef.rightSidedef;

    let upperclip = this.upperclip;
    let lowerclip = this.lowerclip;
    const wallTexture = seg.linedef.rightSidedef.middleTexture;
    const ceilingTexture = rightSector.ceilingTexture;
    const floorTexture = rightSector.floorTexture;
    const lightLevel = rightSector.lightLevel;

    // relative plane heights of right sector
    const worldFrontZ1 = rightSector.ceilingHeight - gameEngine.player.height;
    const worldFrontZ2 = rightSector.floorHeight - gameEngine.player.height;

    // which parts must be rendered
    const drawWall = side.middleTexture !== "-";
    const drawCeiling = worldFrontZ1 > 0;
    const drawFloor = worldFrontZ2 < 0;

    // scaling factor of left and right edges of wall range
    const realWallNormalAngle = seg.angle + 90;
    const offsetAngle =
      realWallNormalAngle - gameEngine.player.realWallAngle1.angle;

    const hypotenuse = this.distanceToPoint(seg.startVertex);
    const realWallDistance =
      hypotenuse * Math.cos(degreesToRadians(offsetAngle));

    const realWallScale1 = this.scaleFromGlobalAngle(
      xScreenV1,
      realWallNormalAngle,
      realWallDistance
    );
    let realWallScaleStep = 0;
    if (xScreenV1 < xScreenV2) {
      const scale2 = this.scaleFromGlobalAngle(
        xScreenV2,
        realWallNormalAngle,
        realWallDistance
      );
      realWallScaleStep = (scale2 - realWallScale1) / (xScreenV2 - xScreenV1);
    }

    let wallY1 = HALFHEIGHT - worldFrontZ1 * realWallScale1;
    const wallY1Step = -realWallScaleStep * worldFrontZ1;

    let wallY2 = HALFHEIGHT - worldFrontZ2 * realWallScale1;
    const wallY2Step = -realWallScaleStep * worldFrontZ2;

    // const color = this.colors.get(seg.linedef.rightSidedef.middleTexture);
    const color = this.getColor(wallTexture, lightLevel);

    for (let x = xScreenV1; x <= xScreenV2; x++) {
      const drawWallY1 = wallY1 - 1;
      const drawWallY2 = wallY2;

      if (drawCeiling) {
      }

      if (drawWall) {
        // const wallY1 = Math.trunc(Math.max(drawWallY1, upperclip[x] + 1));
        // const wallY2 = Math.trunc(Math.min(drawWallY2, lowerclip[x] - 1));
        if (drawWallY1 < drawWallY2) {
          this.canvas.drawLine(
            { x: x, y: Math.round(drawWallY1) },
            { x: x, y: Math.round(drawWallY2) },
            color
          );
        }
      }

      if (drawFloor) {
      }

      wallY1 += wallY1Step;
      wallY2 += wallY2Step;
      // this.canvas.drawLine(
      //   { x: x, y: 0 },
      //   { x: x, y: this.canvas.canvasHeight },
      //   color
      // );
    }
  }

  angleToX(angle) {
    let x = 0;
    if (angle > 90) {
      angle = new Angle(angle - 90);

      x =
        HALFWIDTH -
        Math.trunc(Math.tan(degreesToRadians(angle.angle)) * SCREENDISTANCE);
    } else {
      angle = Angle.subtract(90, angle);
      x = Math.trunc(Math.tan(degreesToRadians(angle.angle)) * SCREENDISTANCE);
      x += HALFWIDTH;
    }
    return x;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32-bit integer
    }
    return hash;
  }

  seededRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  getRandomInt(min, max, seed) {
    return Math.floor(this.seededRandom(seed) * (max - min + 1)) + min;
  }

  getColor(tex, lightLevel) {
    const strLight = lightLevel.toString();
    const key = tex + strLight;

    if (!this.colors.has(key)) {
      const texId = this.simpleHash(tex);
      const l = lightLevel / 255;

      const rng = [50, 256];
      const color = [
        this.getRandomInt(...rng, texId) * l,
        this.getRandomInt(...rng, texId + 1) * l,
        this.getRandomInt(...rng, texId + 2) * l,
      ];

      this.colors.set(key, color);
    }

    return this.colors.get(key);
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
