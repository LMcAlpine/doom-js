class WallRenderer {
  constructor(colorGenerator, dependencies) {
    this.colorGenerator = colorGenerator;
    this.dependencies = dependencies;

    this.geometry = dependencies.geometry;

    this.solidsegs = dependencies.solidSegsManager.initializeSolidsegs();

    this.canvas = gameEngine.canvas;
  }

  addWall(seg, angleV1, angleV2) {
    const xScreenV1 = angleToX(angleV1.angle);
    const xScreenV2 = angleToX(angleV2.angle);

    if (xScreenV1 === xScreenV2) {
      return;
    }
    //left sector == backsector
    //right sector == front sector
    if (seg.leftSector === null) {
      this.clipSolidWalls(seg, xScreenV1, xScreenV2, angleV1, angleV2);
      return;
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

    const hypotenuse = this.geometry.distanceToPoint(seg.startVertex);
    const realWallDistance =
      hypotenuse * Math.cos(degreesToRadians(offsetAngle));

    const realWallScale1 = this.geometry.scaleFromGlobalAngle(
      xScreenV1,
      realWallNormalAngle,
      realWallDistance
    );
    let realWallScaleStep = 0;
    if (xScreenV1 < xScreenV2) {
      const scale2 = this.geometry.scaleFromGlobalAngle(
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

    const color = this.colorGenerator.getColor(wallTexture, lightLevel);

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
    }
  }
}
