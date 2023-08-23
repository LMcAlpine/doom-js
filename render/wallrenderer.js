class WallRenderer {
  constructor(colorGenerator, dependencies) {
    this.colorGenerator = colorGenerator;
    this.dependencies = dependencies;

    this.geometry = dependencies.geometry;

    this.solidsegs = dependencies.solidSegsManager.initializeSolidsegs();

    this.canvas = gameEngine.canvas;

    this.upperclip = new Array(this.canvas.canvasWidth);
    this.lowerclip = new Array(this.canvas.canvasWidth);

    this.palette = gameEngine.palette.palettes[0];

    this.cachedTextures = new Map();

    this.textures = gameEngine.textures.maptextures;

    this.texturesMap = new Map();
    this.textures.forEach((texture, index) => {
      this.texturesMap.set(texture.name, index);
    });

    this.lookupCache = new Map();

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

    // doors
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
    // let {
    //   rightSector,
    //   line,
    //   side,
    //   wallTexture,
    //   lightLevel,
    //   upperclip,
    //   lowerclip,
    //   ceilingTexture,
    //   floorTexture,
    // } = this.initializeWall(seg);

    const rightSector = seg.rightSector;
    const line = seg.linedef;
    const side = seg.linedef.rightSidedef;

    let upperclip = this.upperclip;
    let lowerclip = this.lowerclip;
    const wallTexture = seg.linedef.rightSidedef.middleTexture.toUpperCase();
    const ceilingTexture = rightSector.ceilingTexture;
    const floorTexture = rightSector.floorTexture;
    const lightLevel = rightSector.lightLevel;
    //--------------------------------//

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

    let realWallScale1 = this.geometry.scaleFromGlobalAngle(
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

    //-----------------------------------------------------------------//

    // const textures = gameEngine.textures.maptextures;

    // const indexOfName = this.textures.findIndex(
    //   (texture) => texture.name === wallTexture
    // );

    let indexOfName;
    if (this.lookupCache.has(wallTexture)) {
      indexOfName = this.lookupCache.get(wallTexture);
    } else if (!this.lookupCache.has(wallTexture)) {
      this.lookupCache.set(wallTexture, this.texturesMap.get(wallTexture));
      indexOfName = this.texturesMap.get(wallTexture);
    }

    let vTop;
    let middleTextureAlt;
    if (line.flag & 16) {
      vTop = rightSector.floorHeight + this.textures[indexOfName].height;
      middleTextureAlt = vTop - gameEngine.player.height;
    } else {
      middleTextureAlt = worldFrontZ1;
    }
    middleTextureAlt += side.yOffset;

    //horizontal alignment of textures
    let realWallOffset = hypotenuse * Math.sin(degreesToRadians(offsetAngle));
    realWallOffset += seg.offset + side.xOffset;

    let realWallCenterAngle = realWallNormalAngle - gameEngine.player.direction;

    // where on screen wall is drawn
    let wallY1 = HALFHEIGHT - worldFrontZ1 * realWallScale1;
    const wallY1Step = -realWallScaleStep * worldFrontZ1;

    let wallY2 = HALFHEIGHT - worldFrontZ2 * realWallScale1;
    const wallY2Step = -realWallScaleStep * worldFrontZ2;

    // let { worldFrontZ1, worldFrontZ2, wallY1, wallY1Step, wallY2, wallY2Step } =
    //   this.calculateWallInformation(rightSector, seg, xScreenV1, xScreenV2);
    // const color = this.colorGenerator.getColor(wallTexture, lightLevel);
    // which parts must be rendered
    const drawWall = side.middleTexture !== "-";
    const drawCeiling =
      worldFrontZ1 >= 0 || rightSector.ceilingTexture === "F_SKY1";
    const drawFloor = worldFrontZ2 < 0;

    let textureImage;
    let offscreenCtx;
    // cache the texture
    if (!this.cachedTextures.has(wallTexture)) {
      let result = this.drawTexture(indexOfName);
      textureImage = result.offscreenCanvas;
      offscreenCtx = result.offscreenCtx;
      this.cachedTextures.set(wallTexture, {
        textureImage,
        offscreenCtx,
      });
    } else {
      const cachedTexture = this.cachedTextures.get(wallTexture);
      offscreenCtx = cachedTexture.offscreenCtx;
      textureImage = cachedTexture.textureImage;
    }

    for (let x = xScreenV1; x <= xScreenV2; x++) {
      let drawWallY1 = Math.trunc(wallY1);
      let drawWallY2 = Math.trunc(wallY2);

      // draws ceiling above solid walls
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
          let angle = realWallCenterAngle - getXToAngle(x);
          let textureColumn =
            realWallDistance * Math.tan(degreesToRadians(angle)) -
            realWallOffset;
          let inverseScale = 1.0 / realWallScale1;

          this.canvas.drawWallCol(
            offscreenCtx,
            textureImage,
            textureColumn,
            x,
            wallY1,
            wallY2,
            middleTextureAlt,
            inverseScale,
            lightLevel
          );
          // this.drawLine(color, x, wallY1, wallY2);
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
      realWallScale1 += realWallScaleStep;
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
    const rightSector = seg.rightSector;
    const leftSector = seg.leftSector;
    const line = seg.linedef;
    const side = seg.linedef.rightSidedef;

    let upperclip = this.upperclip;
    let lowerclip = this.lowerclip;
    const upperWallTexture = side.upperTextureName.toUpperCase();
    const lowerWallTexture = side.lowerTextureName.toUpperCase();
    const ceilingTexture = rightSector.ceilingTexture;
    const floorTexture = rightSector.floorTexture;
    const lightLevel = rightSector.lightLevel;

    let worldFrontZ1 = rightSector.ceilingHeight - gameEngine.player.height;
    const worldBackZ1 = leftSector.ceilingHeight - gameEngine.player.height;
    const worldFrontZ2 = rightSector.floorHeight - gameEngine.player.height;
    const worldBackZ2 = leftSector.floorHeight - gameEngine.player.height;

    // sky hack
    if (
      rightSector.ceilingTexture === "F_SKY1" &&
      leftSector.ceilingTexture === "F_SKY1"
    ) {
      worldFrontZ1 = worldBackZ1;
    }

    let drawUpperWall;
    let drawCeiling;
    if (
      worldFrontZ1 !== worldBackZ1 ||
      rightSector.lightLevel !== leftSector.lightLevel ||
      rightSector.ceilingTexture !== leftSector.ceilingTexture
    ) {
      drawUpperWall =
        side.upperTextureName !== "-" && worldBackZ1 < worldFrontZ1;
      drawCeiling =
        worldFrontZ1 >= 0 || rightSector.ceilingTexture === "F_SKY1";
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

    let realWallScale1 = this.geometry.scaleFromGlobalAngle(
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

    // i need to get the texture information for the upper and lower wall

    // start with upper
    // so i have an array of the textures this.textures
    // i have the map of textures this.texturesMap which has the texture name and index of it in this.textures
    // so I can search the mapfor the texture name and then use the index to go into this.textures to get the texture info

    // I need to check the peg attributes for the upper texture
    // ie... is the upper texture unpegged?
    // if the upper unpegged flag is set on the linedef, then the upper texture begins at the higher ceiling and is drawn downwards

    let indexOfName;
    if (this.lookupCache.has(upperWallTexture) && upperWallTexture !== "-") {
      indexOfName = this.lookupCache.get(upperWallTexture);
    } else if (
      !this.lookupCache.has(upperWallTexture) &&
      upperWallTexture !== "-"
    ) {
      this.lookupCache.set(
        upperWallTexture,
        this.texturesMap.get(upperWallTexture)
      );
      indexOfName = this.texturesMap.get(upperWallTexture);
    }

    let indexOfNameLower;
    if (this.lookupCache.has(lowerWallTexture) && lowerWallTexture !== "-") {
      indexOfNameLower = this.lookupCache.get(lowerWallTexture);
    } else if (
      !this.lookupCache.has(lowerWallTexture) &&
      lowerWallTexture !== "-"
    ) {
      this.lookupCache.set(
        lowerWallTexture,
        this.texturesMap.get(lowerWallTexture)
      );
      indexOfNameLower = this.texturesMap.get(lowerWallTexture);
    }

    let topPoint;
    let upperTextureAlt;
    if (drawUpperWall) {
      // upper unpegged. want to start at top of ceiling
      if (line.flag & 8) {
        upperTextureAlt = worldFrontZ1;
      } else {
        topPoint = leftSector.ceilingHeight + this.textures[indexOfName].height;
        upperTextureAlt = topPoint - gameEngine.player.height;
      }
      upperTextureAlt += side.yOffset;
    }

    let lowerTextureAlt;
    if (drawLowerWall) {
      if (line.flag & 16) {
        lowerTextureAlt = worldFrontZ1;
      } else {
        lowerTextureAlt = worldBackZ2;
      }
      lowerTextureAlt += side.yOffset;
    }

    let segTextured = drawUpperWall || drawLowerWall;
    let realWallOffset;
    let realWallCenterAngle;

    if (segTextured) {
      realWallOffset = hypotenuse * Math.sin(degreesToRadians(offsetAngle));
      realWallOffset += seg.offset + side.xOffset;
      realWallCenterAngle = realWallNormalAngle - gameEngine.player.direction;
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

    let textureImage;
    let offscreenCtx;
    // cache the texture
    if (
      !this.cachedTextures.has(upperWallTexture) &&
      upperWallTexture !== "-"
    ) {
      let result = this.drawTexture(indexOfName);
      textureImage = result.offscreenCanvas;
      offscreenCtx = result.offscreenCtx;
      this.cachedTextures.set(upperWallTexture, {
        textureImage,
        offscreenCtx,
      });
    } else if (upperWallTexture !== "-") {
      const cachedTexture = this.cachedTextures.get(upperWallTexture);
      offscreenCtx = cachedTexture.offscreenCtx;
      textureImage = cachedTexture.textureImage;
    }

    // let indexOfNameLower;
    // if (this.lookupCache.has(lowerWallTexture) && lowerWallTexture !== "-") {
    //   indexOfNameLower = this.lookupCache.get(lowerWallTexture);
    // } else if (
    //   !this.lookupCache.has(lowerWallTexture) &&
    //   lowerWallTexture !== "-"
    // ) {
    //   this.lookupCache.set(
    //     lowerWallTexture,
    //     this.texturesMap.get(lowerWallTexture)
    //   );
    //   indexOfNameLower = this.texturesMap.get(lowerWallTexture);
    // }

    for (let x = xScreenV1; x <= xScreenV2; x++) {
      let drawWallY1 = Math.trunc(wallY1);
      let drawWallY2 = Math.trunc(wallY2);

      let angle;
      let textureColumn;
      let inverseScale;
      if (segTextured) {
        angle = realWallCenterAngle - getXToAngle(x);
        textureColumn =
          realWallDistance * Math.tan(degreesToRadians(angle)) - realWallOffset;
        inverseScale = 1 / realWallScale1;
      }

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
          //this.drawLine(upperWallTextureColor, x, wy1, wy2);

          this.canvas.drawWallCol(
            offscreenCtx,
            textureImage,
            textureColumn,
            x,
            wy1,
            wy2,
            upperTextureAlt,
            inverseScale,
            lightLevel
          );
        }

        if (upperclip[x] < wy2) {
          upperclip[x] = wy2;
        }
        portalY1 += portalY1Step;
      }
      // draw ceiling for adjoining sector?
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
          let textureImage;
          let offscreenCtx;
          // cache the texture
          if (
            !this.cachedTextures.has(lowerWallTexture) &&
            lowerWallTexture !== "-"
          ) {
            let result = this.drawTexture(indexOfNameLower);
            textureImage = result.offscreenCanvas;
            offscreenCtx = result.offscreenCtx;
            this.cachedTextures.set(lowerWallTexture, {
              textureImage,
              offscreenCtx,
            });
          } else if (lowerWallTexture !== "-") {
            const cachedTexture = this.cachedTextures.get(lowerWallTexture);
            offscreenCtx = cachedTexture.offscreenCtx;
            textureImage = cachedTexture.textureImage;
          }

          // this.drawLine(
          //   lowerWallTextureColor,
          //   x,
          //   Math.trunc(wy1),
          //   Math.trunc(wy2)
          // );

          this.canvas.drawWallCol(
            offscreenCtx,
            textureImage,
            textureColumn,
            x,
            wy1,
            wy2,
            lowerTextureAlt,
            inverseScale,
            lightLevel
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
      realWallScale1 += realWallScaleStep;
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

  drawPatch(
    columns,
    xStart,
    yStart,
    textureWidth,
    textureHeight,
    offscreenCtx,
    offscreenBuffer
  ) {
    const maxColumns = Math.min(columns.length, textureWidth - xStart);
    for (let i = 0; i < maxColumns; i++) {
      this.drawColumn(
        columns[i],
        xStart + i,
        yStart,
        textureHeight - yStart,
        offscreenCtx,
        offscreenBuffer
      );
    }
  }

  drawColumn(column, x, startY, maxHeight, offscreenCtx, offscreenBuffer) {
    const maxPosts = Math.min(column.length, maxHeight);
    for (let j = 0; j < maxPosts; j++) {
      this.drawPost(
        column[j],
        x,
        startY,
        maxHeight,
        offscreenCtx,
        offscreenBuffer
      );
    }
  }

  drawPost(post, x, startY, maxHeight, offscreenCtx, offscreenBuffer) {
    const columnData = offscreenCtx.getImageData(x, startY, 1, maxHeight);

    for (let k = 0; k < post.data.length; k++) {
      let pixel = post.data[k];
      const pixelDraw = this.palette[pixel];

      const pos = (post.topDelta + k) * 4;
      columnData.data[pos] = pixelDraw.red;
      columnData.data[pos + 1] = pixelDraw.green;
      columnData.data[pos + 2] = pixelDraw.blue;
      columnData.data[pos + 3] = 255; // Assuming full alpha
    }

    offscreenCtx.putImageData(columnData, x, startY);
  }

  drawTexture(indexOfName) {
    let offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.getContext("2d", { willReadFrequently: true });
    let offscreenCtx = offscreenCanvas.getContext("2d");

    offscreenCanvas.width = this.textures[indexOfName].width;
    offscreenCanvas.height = this.textures[indexOfName].height;
    let offscreenBuffer = offscreenCtx.createImageData(
      offscreenCanvas.width,
      offscreenCanvas.height
    );

    for (let j = 0; j < this.textures[indexOfName].patches.length; j++) {
      const patches = this.textures[indexOfName].patches;
      const xStart = this.textures[indexOfName].patches[j].originX;
      const yStart = this.textures[indexOfName].patches[j].originY;

      const header = gameEngine.patchNames.parsePatchHeader(
        gameEngine.patchNames.names[patches[j].patchNumber].toUpperCase()
      );

      const columns = gameEngine.patchNames.parsePatchColumns(
        header.columnOffsets,
        header,
        gameEngine.patchNames.names[patches[j].patchNumber].toUpperCase()
      );
      this.drawPatch(
        columns,
        xStart,
        yStart,
        this.textures[indexOfName].width,
        this.textures[indexOfName].height,
        offscreenCtx,
        offscreenBuffer
      );
    }

    return { offscreenCanvas, offscreenCtx };
  }
}
