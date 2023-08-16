class WallRenderer {
  constructor(colorGenerator, dependencies) {
    this.colorGenerator = colorGenerator;
    this.dependencies = dependencies;

    this.geometry = dependencies.geometry;

    this.solidsegs = dependencies.solidSegsManager.initializeSolidsegs();

    this.canvas = gameEngine.canvas;

    this.upperclip = new Array(this.canvas.canvasWidth);
    this.lowerclip = new Array(this.canvas.canvasWidth);

    this.initClipHeights();
  }

  /**
   * initialize the clip arrays
   */
  initClipHeights() {
    this.upperclip.fill(-1);
    this.lowerclip.fill(this.canvas.canvasHeight);
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

    // if (
    //   seg.leftSector.ceilingHeight <= seg.rightSector.floorHeight ||
    //   seg.leftSector.floorHeight >= seg.rightSector.ceilingHeight
    // ) {
    //   this.clipSolidWalls(seg, xScreenV1, xScreenV2, angleV1, angleV2);
    // }

    // portal because there are height differences
    if (
      seg.rightSector.ceilingHeight !== seg.leftSector.ceilingHeight ||
      seg.rightSector.floorHeight !== seg.leftSector.floorHeight
    ) {
      this.clipPortalWalls(seg, xScreenV1, xScreenV2, angleV1, angleV2);
      return;
    }

    if (
      seg.rightSector.ceilingTexture === seg.leftSector.ceilingTexture &&
      seg.leftSector.floorTexture === seg.rightSector.floorTexture &&
      seg.leftSector.lightLevel === seg.rightSector.lightLevel &&
      seg.linedef.rightSidedef.middleTexture === "-"
    ) {
      return;
    }

    this.clipPortalWalls(seg, xScreenV1, xScreenV2, angleV1, angleV2);
  }

  updateCeilingFloor(
    seg,
    leftSectorCeiling,
    rightSectorCeiling,
    leftSectorFloor,
    rightSectorFloor
  ) {
    let updateFloor = false;
    let updateCeiling = false;
    if (seg.leftSector !== null) {
      updateFloor = true;
      updateCeiling = true;
      return { updateFloor, updateCeiling };
    }

    updateCeiling = leftSectorCeiling !== rightSectorCeiling;
    updateFloor = leftSectorFloor !== rightSectorFloor;

    if (
      seg.leftSector.ceilingHeight <= seg.rightSector.floorHeight ||
      seg.leftSector.floorHeight >= seg.rightSector.ceilingHeight
    ) {
      updateCeiling = true;
      updateFloor = true;
    }

    if (seg.rightSector.ceilingHeight <= gameEngine.player.height) {
      updateCeiling = false;
    }
    if (seg.rightSector.floorHeight >= gameEngine.player.height) {
      updateFloor = false;
    }

    return { updateFloor, updateCeiling };
  }

  clipPortalWalls(seg, xScreenV1, xScreenV2, angleV1, angleV2) {
    let totalSolidSegs = 0;
    while (this.solidsegs[totalSolidSegs].last < xScreenV1 - 1) {
      totalSolidSegs++;
    }

    if (xScreenV1 < this.solidsegs[totalSolidSegs].first) {
      if (xScreenV2 < this.solidsegs[totalSolidSegs].first - 1) {
        // draw wall
        this.drawWall(seg, xScreenV1, xScreenV2, angleV1);

        return;
      }

      //draw some other wall
      this.drawWall(
        seg,
        xScreenV1,
        this.solidsegs[totalSolidSegs].first - 1,
        angleV1
      );
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
        return;
      }
    }

    // draw wall here
    this.drawWall(seg, this.solidsegs[next].last + 1, xScreenV2, angleV1);
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
        this.drawSolidWall(seg, xScreenV1, xScreenV2, angleV1);
        this.solidsegs.splice(totalSolidSegs, 0, {
          first: xScreenV1,
          last: xScreenV2,
        });
        return;
      }

      //draw some other wall
      this.drawSolidWall(
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
      this.drawSolidWall(
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
    this.drawSolidWall(seg, this.solidsegs[next].last + 1, xScreenV2, angleV1);
    this.solidsegs[totalSolidSegs].last = xScreenV2;

    if (this.solidsegs[next] !== this.solidsegs[totalSolidSegs]) {
      totalSolidSegs++;
      next++;
      this.solidsegs.splice(totalSolidSegs, next - totalSolidSegs);
    }
  }

  drawSolidWall(seg, xScreenV1, xScreenV2, angleV1) {
    let {
      rightSector,
      line,
      side,
      wallTexture,
      lightLevel,
      upperclip,
      lowerclip,
      ceilingTexture,
      floorTexture,
    } = this.initializeWall(seg);

    let { worldFrontZ1, worldFrontZ2, wallY1, wallY1Step, wallY2, wallY2Step } =
      this.calculateWallInformation(rightSector, seg, xScreenV1, xScreenV2);

    const color = this.colorGenerator.getColor(wallTexture, lightLevel);

    // which parts must be rendered
    const drawWall = side.middleTexture !== "-";
    const drawCeiling = worldFrontZ1 > 0;
    const drawFloor = worldFrontZ2 < 0;

    for (let x = xScreenV1; x <= xScreenV2; x++) {
      let drawWallY1 = wallY1;
      let drawWallY2 = wallY2;

      if (drawWallY1 <= upperclip[x]) {
        drawWallY1 = upperclip[x];
      }
      if (drawWallY2 >= lowerclip[x]) {
        drawWallY2 = lowerclip[x];
      }

      if (drawWallY1 > drawWallY2) {
        drawWallY1 += wallY1Step;
        drawWallY2 += wallY2Step;
        continue;
      }

      this.drawCeiling(
        drawCeiling,
        ceilingTexture,
        lightLevel,
        upperclip,
        x,
        drawWallY1,
        lowerclip
      );

      if (drawFloor) {
        let floorColor = this.colorGenerator.getColor(floorTexture, lightLevel);
        let fy1 = Math.max(drawWallY2, upperclip[x]);
        let fy2 = lowerclip[x];

        this.drawLine(floorColor, x, fy1, fy2);
      }

      if (drawWall) {
        const wallY1 = Math.max(drawWallY1, upperclip[x]);
        const wallY2 = Math.min(drawWallY2, lowerclip[x]);

        if (drawWallY1 < drawWallY2) {
          this.drawLine(color, x, wallY1, wallY2);

          upperclip[x] = this.canvas.canvasHeight;
          lowerclip[x] = -1;
        }
      }

      wallY1 += wallY1Step;
      wallY2 += wallY2Step;
    }
  }

  calculateWallInformation(rightSector, seg, xScreenV1, xScreenV2) {
    // relative plane heights of right sector
    const worldFrontZ1 = rightSector.ceilingHeight - gameEngine.player.height;
    const worldFrontZ2 = rightSector.floorHeight - gameEngine.player.height;

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

    return {
      worldFrontZ1,
      worldFrontZ2,
      wallY1,
      wallY1Step,
      wallY2,
      wallY2Step,
      realWallScale1,
      realWallScaleStep,
    };
  }

  drawFloor(
    drawFloor,
    floorTexture,
    lightLevel,
    upperclip,
    x,
    drawWallY2,
    lowerclip
  ) {
    if (drawFloor) {
      let floorColor = this.colorGenerator.getColor(floorTexture, lightLevel);

      let fy1 = Math.max(drawWallY2, upperclip[x]);
      let fy2 = lowerclip[x];

      this.drawLine(floorColor, x, fy1, fy2);
    }
  }

  drawCeiling(
    drawCeiling,
    ceilingTexture,
    lightLevel,
    upperclip,
    x,
    drawWallY1,
    lowerclip
  ) {
    if (drawCeiling) {
      let ceilingColor = this.colorGenerator.getColor(
        ceilingTexture,
        lightLevel
      );
      let cy1 = upperclip[x];
      let cy2 = Math.min(drawWallY1, lowerclip[x]);

      this.drawLine(ceilingColor, x, cy1, cy2);
    }
  }

  drawLine(color, x, y1, y2) {
    this.canvas.ctx.strokeStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    this.canvas.ctx.beginPath();
    this.canvas.ctx.moveTo(x, y1);
    this.canvas.ctx.lineTo(x, y2);
    this.canvas.ctx.stroke();
  }

  drawWall(seg, xScreenV1, xScreenV2, angleV1) {
    let {
      rightSector,
      line,
      side,
      wallTexture,
      lightLevel,
      upperclip,
      lowerclip,
      ceilingTexture,
      floorTexture,
    } = this.initializeWall(seg);

    let {
      worldFrontZ1,
      worldFrontZ2,
      wallY1,
      wallY1Step,
      wallY2,
      wallY2Step,
      realWallScale1,
      realWallScaleStep,
    } = this.calculateWallInformation(rightSector, seg, xScreenV1, xScreenV2);

    const color = this.colorGenerator.getColor(wallTexture, lightLevel);

    // which parts must be rendered
    const drawWall = side.middleTexture !== "-";
    const drawCeiling = worldFrontZ1 > 0;
    const drawFloor = worldFrontZ2 < 0;

    let updateFloor;
    let updateCeiling;
    let drawUpperWall = false;
    let drawLowerWall = false;

    let lowerWallStep;
    let lowerWallHeight;

    let upperWallStep;
    let upperWallHeight;

    let lightLevelLeft;
    let drawCeilingLeft = false;
    let drawFloorLeft = false;

    if (seg.leftSector) {
      lightLevelLeft = seg.leftSector.lightLevel;

      let leftSectorCeiling =
        seg.leftSector.ceilingHeight - gameEngine.player.height;
      let leftSectorFloor =
        seg.leftSector.floorHeight - gameEngine.player.height;

      drawCeilingLeft = leftSectorCeiling > 0;
      drawFloorLeft = leftSectorFloor < 0;

      let result = this.updateCeilingFloor(
        seg,
        leftSectorCeiling,
        worldFrontZ1,
        leftSectorFloor,
        worldFrontZ2
      );

      updateFloor = result.updateFloor;
      updateCeiling = result.updateCeiling;

      if (leftSectorCeiling < worldFrontZ1) {
        drawUpperWall = true;
        upperWallStep = -(leftSectorCeiling * realWallScaleStep);
        upperWallHeight = Math.round(
          HALFHEIGHT - leftSectorCeiling * realWallScale1
        );
      }

      // lower part
      if (leftSectorFloor > worldFrontZ2) {
        drawLowerWall = true;
        lowerWallStep = -(leftSectorFloor * realWallScaleStep);
        lowerWallHeight = Math.round(
          HALFHEIGHT - leftSectorFloor * realWallScale1
        );
      }
    }

    for (let x = xScreenV1; x <= xScreenV2; x++) {
      let drawWallY1 = wallY1;
      let drawWallY2 = wallY2;

      if (drawWallY1 <= upperclip[x] + 1) {
        drawWallY1 = upperclip[x] + 1;
      }
      if (drawWallY2 >= lowerclip[x]) {
        drawWallY2 = lowerclip[x] - 1;
      }

      if (drawWallY1 > drawWallY2) {
        drawWallY1 += wallY1Step;
        drawWallY2 += wallY2Step;
        continue;
      }

      if (seg.leftSector) {
        let uppertexture;
        let theLightLevel;
        let lowertexture;
        if (!seg.direction) {
          uppertexture = seg.linedef.leftSidedef.upperTextureName;
          lowertexture = seg.linedef.leftSidedef.lowerTextureName;
          theLightLevel = lightLevelLeft;
        } else {
          uppertexture = seg.linedef.rightSidedef.upperTextureName;
          lowertexture = seg.linedef.rightSidedef.lowerTextureName;
          theLightLevel = lightLevel;
        }

        let color = this.colorGenerator.getColor(uppertexture, theLightLevel);

        let resultUpper = this.drawUpperWall(
          drawUpperWall,
          upperWallHeight,
          upperWallStep,
          lowerclip,
          x,
          drawWallY1,
          upperclip,
          updateCeiling,
          color,
          drawCeiling,
          ceilingTexture,
          lightLevel
        );

        lowerclip = resultUpper.lowerclip;
        upperclip = resultUpper.upperclip;

        upperWallHeight = resultUpper.upperWallHeight;

        color = this.colorGenerator.getColor(lowertexture, theLightLevel);

        let resultLower = this.drawLowerWall(
          drawLowerWall,
          lowerWallHeight,
          lowerWallStep,
          upperclip,
          x,
          drawWallY2,
          lowerclip,
          updateFloor,
          color,
          drawFloor,
          floorTexture,
          lightLevel
        );

        lowerWallHeight = resultLower.lowerWallHeight;

        lowerclip = resultLower.lowerclip;
        upperclip = resultLower.upperclip;
      }

      wallY1 += wallY1Step;
      wallY2 += wallY2Step;
    }
  }

  initializeWall(seg) {
    const rightSector = seg.rightSector;
    const line = seg.linedef;
    const side = seg.linedef.rightSidedef;

    let upperclip = this.upperclip;
    let lowerclip = this.lowerclip;
    const wallTexture = seg.linedef.rightSidedef.middleTexture;
    const ceilingTexture = rightSector.ceilingTexture;
    const floorTexture = rightSector.floorTexture;
    const lightLevel = rightSector.lightLevel;
    return {
      rightSector,
      line,
      side,
      wallTexture,
      lightLevel,
      upperclip,
      lowerclip,
      ceilingTexture,
      floorTexture,
    };
  }

  drawLowerWall(
    drawLowerWall,
    lowerWallHeight,
    lowerWallStep,
    upperclip,
    x,
    drawWallY2,
    lowerclip,
    updateFloor,
    color,
    drawFloor,
    floorTexture,
    lightLevel
  ) {
    const drawFloorLogic = () => {
      this.drawFloor(
        drawFloor,
        floorTexture,
        lightLevel,
        upperclip,
        x,
        drawWallY2,
        lowerclip
      );
      lowerclip[x] = drawWallY2 + 1;
    };

    if (drawLowerWall) {
      drawFloorLogic();

      let lowerHeight = lowerWallHeight;
      lowerWallHeight += lowerWallStep;
      lowerHeight = Math.max(lowerHeight, upperclip[x] + 1);

      if (lowerHeight <= drawWallY2) {
        this.drawLine(color, x, lowerHeight, drawWallY2);

        lowerclip[x] = lowerHeight;
      }
    } else if (updateFloor) {
      drawFloorLogic();
    }

    return { upperclip, lowerclip, lowerWallHeight };
  }

  drawUpperWall(
    drawUpperWall,
    upperWallHeight,
    upperWallStep,
    lowerclip,
    x,
    drawWallY1,
    upperclip,
    updateCeiling,
    color,
    drawCeiling,
    ceilingTexture,
    lightLevel
  ) {
    // Common logic for drawing ceiling
    const drawCeilingLogic = () => {
      this.drawCeiling(
        drawCeiling,
        ceilingTexture,
        lightLevel,
        upperclip,
        x,
        drawWallY1,
        lowerclip
      );
      upperclip[x] = drawWallY1 - 1;
    };

    // If drawUpperWall is true, execute the related logic
    if (drawUpperWall) {
      drawCeilingLogic();

      let upperheight = upperWallHeight;
      upperWallHeight += upperWallStep;
      upperheight = Math.min(upperheight, lowerclip[x] - 1);

      if (upperheight >= drawWallY1) {
        this.drawLine(color, x, drawWallY1, upperheight);
        upperclip[x] = upperheight;
      }
    }
    // If updateCeiling is true and drawUpperWall isn't, execute the related logic
    else if (updateCeiling) {
      drawCeilingLogic();
    }

    return { upperclip, lowerclip, upperWallHeight };
  }
}
