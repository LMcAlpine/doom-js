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
    if (
      seg.startVertex.x === -640 &&
      seg.startVertex.y === -3296 &&
      seg.endVertex.x === -640 &&
      seg.endVertex.y === -3168
    ) {
      console.log("heree");
    }

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
      let drawWallY1 = Math.trunc(wallY1);
      let drawWallY2 = Math.trunc(wallY2);

      this.drawCeiling(
        drawCeiling,
        ceilingTexture,
        lightLevel,
        upperclip,
        x,
        drawWallY1,
        lowerclip
      );

      if (drawWall) {
        const wallY1 = Math.max(drawWallY1, upperclip[x]);
        const wallY2 = Math.min(drawWallY2, lowerclip[x]);
        if (wallY1 < wallY2) {
          this.drawLine(color, x, wallY1, wallY2);
        }
      }

      if (drawFloor) {
        let floorColor = this.colorGenerator.getColor(floorTexture, lightLevel);
        let fy1 = Math.max(drawWallY2, upperclip[x]);
        let fy2 = lowerclip[x];
        if (fy1 < fy2) {
          this.drawLine(floorColor, x, fy1, fy2);
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
      if (cy1 < cy2) {
        this.drawLine(ceilingColor, x, cy1, cy2);
      }
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
    if (seg.rightSector.ceilingTexture === "F_SKY1") {
      console.log("here");
    }

    const rightSector = seg.rightSector;
    const leftSector = seg.leftSector;
    const line = seg.linedef;
    const side = seg.linedef.rightSidedef;

    let upperclip = this.upperclip;
    let lowerclip = this.lowerclip;
    const upperWallTexture = side.upperTextureName;
    const lowerWallTexture = side.lowerTextureName;
    const ceilingTexture = rightSector.ceilingTexture;
    const floorTexture = rightSector.floorTexture;
    const lightLevel = rightSector.lightLevel;

    let worldFrontZ1 = rightSector.ceilingHeight - gameEngine.player.height;
    const worldBackZ1 = leftSector.ceilingHeight - gameEngine.player.height;
    const worldFrontZ2 = rightSector.floorHeight - gameEngine.player.height;
    const worldBackZ2 = leftSector.floorHeight - gameEngine.player.height;

    // if (
    //   rightSector.ceilingTexture === "F_SKY1" &&
    //   leftSector.ceilingTexture === "F_SKY1"
    // ) {
    //   worldFrontZ1 = worldBackZ1;
    // }

    let drawUpperWall;
    let drawCeiling;
    if (
      worldFrontZ1 !== worldBackZ1 ||
      rightSector.lightLevel !== leftSector.lightLevel ||
      rightSector.ceilingTexture !== leftSector.ceilingTexture
    ) {
      drawUpperWall =
        side.upperTextureName !== "-" && worldBackZ1 < worldFrontZ1;
      drawCeiling = worldFrontZ1 >= 0;
    } else {
      drawUpperWall = false;
      drawCeiling = false;
    }

    let drawLowerWall;
    let drawFloor;
    if (
      worldFrontZ2 !== worldBackZ2 ||
      rightSector.floorTexture !== leftSector.floorTexture ||
      rightSector.lightLevel !== leftSector.lightLevel
    ) {
      drawLowerWall =
        side.lowerTextureName !== "-" && worldBackZ2 > worldFrontZ2;
      drawFloor = worldFrontZ2 <= 0;
    } else {
      drawLowerWall = false;
      drawFloor = false;
    }

    if (!drawUpperWall && !drawCeiling && !drawLowerWall && !drawFloor) {
      return;
    }

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
    } else {
      realWallScaleStep = 0;
    }

    let wallY1 = Math.trunc(HALFHEIGHT - worldFrontZ1 * realWallScale1);
    const wallY1Step = -realWallScaleStep * worldFrontZ1;

    let wallY2 = Math.trunc(HALFHEIGHT - worldFrontZ2 * realWallScale1);
    const wallY2Step = -realWallScaleStep * worldFrontZ2;

    //const color = this.colorGenerator.getColor(wallTexture, lightLevel);

    let portalY1;
    let portalY1Step;

    let portalY2;
    let portalY2Step;
    if (drawUpperWall) {
      if (worldBackZ1 > worldFrontZ2) {
        portalY1 = Math.trunc(HALFHEIGHT - worldBackZ1 * realWallScale1);
        portalY1Step = -realWallScaleStep * worldBackZ1;
      } else {
        portalY1 = wallY2;
        portalY1Step = wallY2Step;
      }
    }

    if (drawLowerWall) {
      if (worldBackZ2 < worldFrontZ1) {
        portalY2 = Math.trunc(HALFHEIGHT - worldBackZ2 * realWallScale1);
        portalY2Step = -realWallScaleStep * worldBackZ2;
      } else {
        portalY2 = wallY1;
        portalY2Step = wallY1Step;
      }
    }

    for (let x = xScreenV1; x <= xScreenV2; x++) {
      let drawWallY1 = Math.trunc(wallY1);
      let drawWallY2 = Math.trunc(wallY2);

      if (drawUpperWall) {
        let drawUpperWallY1 = Math.trunc(wallY1 - 1);
        let drawUpperWallY2 = Math.trunc(portalY1);
        if (drawCeiling) {
          let ceilingColor = this.colorGenerator.getColor(
            ceilingTexture,
            lightLevel
          );
          let cy1 = upperclip[x];
          let cy2 = Math.min(drawWallY1, lowerclip[x]);

          if (cy1 < cy2) {
            this.drawLine(ceilingColor, x, cy1, cy2);
          }
        }

        let upperWallTextureColor = this.colorGenerator.getColor(
          upperWallTexture,
          lightLevel
        );
        let wy1 = Math.max(drawUpperWallY1, upperclip[x]);
        let wy2 = Math.min(drawUpperWallY2, lowerclip[x]);
        if (wy1 < wy2) {
          this.drawLine(upperWallTextureColor, x, wy1, wy2);
        }

        if (upperclip[x] < wy2) {
          upperclip[x] = wy2;
        }
        portalY1 += portalY1Step;
      }
      if (drawCeiling) {
        let ceilingColor = this.colorGenerator.getColor(
          ceilingTexture,
          lightLevel
        );
        let cy1 = upperclip[x];
        let cy2 = Math.min(drawWallY1, lowerclip[x]);
        if (cy1 < cy2) {
          this.drawLine(ceilingColor, x, cy1, cy2);
        }

        if (upperclip[x] < cy2) {
          upperclip[x] = cy2;
        }
      }

      if (drawLowerWall) {
        if (drawFloor) {
          let floorColor = this.colorGenerator.getColor(
            floorTexture,
            lightLevel
          );
          let fy1 = Math.max(drawWallY2, upperclip[x]);
          let fy2 = lowerclip[x];

          if (fy1 < fy2) {
            this.drawLine(floorColor, x, fy1, fy2);
          }
        }
        let drawLowerWallY1 = Math.trunc(portalY2 - 1);
        let drawLowerWallY2 = Math.trunc(wallY2);

        let lowerWallTextureColor = this.colorGenerator.getColor(
          lowerWallTexture,
          lightLevel
        );
        let wy1 = Math.max(drawLowerWallY1, upperclip[x]);
        let wy2 = Math.min(drawLowerWallY2, lowerclip[x]);
        if (wy1 < wy2) {
          this.drawLine(
            lowerWallTextureColor,
            x,
            Math.trunc(wy1),
            Math.trunc(wy2)
          );
        }

        if (lowerclip[x] > wy1) {
          lowerclip[x] = wy1;
        }
        portalY2 += portalY2Step;
      }
      if (drawFloor) {
        let floorColor = this.colorGenerator.getColor(floorTexture, lightLevel);
        let fy1 = Math.max(drawWallY2, upperclip[x]);
        let fy2 = lowerclip[x];

        if (fy1 < fy2) {
          this.drawLine(floorColor, x, fy1, fy2);
        }

        if (lowerclip[x] > drawWallY2) {
          lowerclip[x] = fy1;
        }
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
      // drawFloorLogic();

      let lowerHeight = lowerWallHeight;
      //  lowerWallHeight += lowerWallStep;
      lowerHeight = Math.max(lowerHeight, upperclip[x] + 1);

      if (lowerHeight <= drawWallY2) {
        //  this.drawLine(color, x, lowerHeight, drawWallY2);
        lowerclip[x] = lowerHeight;
      }
    } else if (updateFloor) {
      //drawFloorLogic();
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
      if (ceilingTexture === "F_SKY1") {
        console.log("bhere");
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
      upperclip[x] = drawWallY1 - 1;
    };

    // If drawUpperWall is true, execute the related logic
    if (drawUpperWall) {
      drawCeilingLogic();

      let upperheight = upperWallHeight;
      upperWallHeight += upperWallStep;
      upperheight = Math.min(upperheight, lowerclip[x] - 1);

      if (upperheight >= drawWallY1) {
        // this.drawLine([255, 50, 25], x, drawWallY1, upperheight);
        // upperclip[x] = upperheight;
      }
    }
    // If updateCeiling is true and drawUpperWall isn't, execute the related logic
    else if (updateCeiling) {
      //drawCeilingLogic();
    }

    return { upperclip, lowerclip, upperWallHeight };
  }
}
