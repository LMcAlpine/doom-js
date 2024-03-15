const RIGHT_ANGLE_DEGREES = 90;
const FULL_ALPHA = 255;

const UPPER_UNPEGGED = 8;
const LOWER_UNPEGGED = 16;

class WallRenderer {
  constructor(colorGenerator, dependencies, textureManager) {
    this.colorGenerator = colorGenerator;
    this.dependencies = dependencies;

    this.geometry = dependencies.geometry;

    this.solidsegs = dependencies.solidSegsManager.initializeSolidsegs();

    this.canvas = gameEngine.canvas;
    // this.canvas = gameEngine.offscreenCanvas;

    this.upperclip = new Array(this.canvas.offScreenWidth);
    this.lowerclip = new Array(this.canvas.offScreenWidth);


    this.textures = gameEngine.textures.maptextures;

    this.initClipHeights();


    this.textureManager = textureManager;

  }

  /**
   * initialize the clip arrays
   */
  initClipHeights() {
    this.upperclip.fill(-1);
    this.lowerclip.fill(this.canvas.offScreenHeight);
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
      this.clipSolidWalls(seg, xScreenV1, xScreenV2 - 1, angleV1);
      return;
    }

    // // doors
    // if (
    //   seg.leftSector.ceilingHeight <= seg.rightSector.floorHeight ||
    //   seg.leftSector.floorHeight >= seg.rightSector.ceilingHeight
    // ) {
    //   this.clipSolidWalls(seg, xScreenV1, xScreenV2 - 1, angleV1, angleV2);
    //   return;
    // }

    // // portal because there are height differences
    if (
      seg.rightSector.ceilingHeight !== seg.leftSector.ceilingHeight ||
      seg.rightSector.floorHeight !== seg.leftSector.floorHeight
    ) {
      this.clipPortalWalls(seg, xScreenV1, xScreenV2 - 1, angleV1, angleV2);
      return;
    }

    // if (
    //   seg.rightSector.ceilingTexture === seg.leftSector.ceilingTexture &&
    //   seg.leftSector.floorTexture === seg.rightSector.floorTexture &&
    //   seg.leftSector.lightLevel === seg.rightSector.lightLevel &&
    //   seg.linedef.rightSidedef.middleTexture === "-"
    // ) {
    //   return;
    // }

    // this.clipPortalWalls(seg, xScreenV1, xScreenV2 - 1, angleV1, angleV2);


  }

  clipPortalWalls(seg, xScreenV1, xScreenV2, angleV1, angleV2) {
    let totalSolidSegs = this.getInitialSolidSegs(xScreenV1);

    if (xScreenV1 < this.solidsegs[totalSolidSegs].first) {
      if (xScreenV2 < this.solidsegs[totalSolidSegs].first - 1) {
        // draw wall
        this.drawWall(seg, xScreenV1, xScreenV2);

        return;
      }

      //draw some other wall
      this.drawWall(seg, xScreenV1, this.solidsegs[totalSolidSegs].first - 1);
    }

    if (xScreenV2 <= this.solidsegs[totalSolidSegs].last) {
      return;
    }

    this.drawRemainingPortalSegments(seg, xScreenV2, angleV1, totalSolidSegs);
  }

  drawRemainingPortalSegments(seg, xScreenV2, angleV1, totalSolidSegs) {
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
        return;
      }
    }
    this.drawWall(seg, this.solidsegs[next].last + 1, xScreenV2);
  }

  clipSolidWalls(seg, xScreenV1, xScreenV2, angleV1) {


    let totalSolidSegs = this.getInitialSolidSegs(xScreenV1);

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
    // this.drawRemainingWallSegments(seg, xScreenV2, angleV1, totalSolidSegs);
    let next = totalSolidSegs;
    while (xScreenV2 >= this.solidsegs[next + 1].first - 1) {
      this.drawSolidWall(
        seg,
        this.solidsegs[next].last + 1,
        this.solidsegs[next + 1].first - 1,
        angleV1
      );
      next++;

      if (xScreenV2 <= this.solidsegs[next].last) {
        this.solidsegs[totalSolidSegs].last = this.solidsegs[next].last;
        if (this.solidsegs[next] !== this.solidsegs[totalSolidSegs]) {
          totalSolidSegs++;
          next++;
          this.solidsegs.splice(totalSolidSegs, next - totalSolidSegs);
        }
        return;
      }
    }
    this.drawSolidWall(seg, this.solidsegs[next].last + 1, xScreenV2, angleV1);
    this.solidsegs[totalSolidSegs].last = xScreenV2;

    if (this.solidsegs[next] !== this.solidsegs[totalSolidSegs]) {
      totalSolidSegs++;
      next++;
      this.solidsegs.splice(totalSolidSegs, next - totalSolidSegs);
    }
  }

  drawRemainingWallSegments(seg, xScreenV2, angleV1, totalSolidSegs) {
    let next = totalSolidSegs;
    while (xScreenV2 >= this.solidsegs[next + 1].first - 1) {
      this.drawSolidWall(
        seg,
        this.solidsegs[next].last + 1,
        this.solidsegs[next + 1].first - 1,
        angleV1
      );
      next++;

      if (xScreenV2 <= this.solidsegs[next].last) {
        this.solidsegs[totalSolidSegs].last = this.solidsegs[next].last;
        if (this.solidsegs[next] !== this.solidsegs[totalSolidSegs]) {
          totalSolidSegs++;
          next++;
          this.solidsegs.splice(totalSolidSegs, next - totalSolidSegs);
        }
        return;
      }
    }
    this.drawSolidWall(seg, this.solidsegs[next].last + 1, xScreenV2, angleV1);
    this.solidsegs[totalSolidSegs].last = xScreenV2;

    if (this.solidsegs[next] !== this.solidsegs[totalSolidSegs]) {
      totalSolidSegs++;
      next++;
      this.solidsegs.splice(totalSolidSegs, next - totalSolidSegs);
    }
  }

  getInitialSolidSegs(xScreenV1) {
    let totalSolidSegs = 0;
    while (this.solidsegs[totalSolidSegs].last < xScreenV1 - 1) {
      totalSolidSegs++;
    }
    return totalSolidSegs;
  }


  drawSolidWall(seg, xScreenV1, xScreenV2) {
    // if (seg.leftSector !== null) {
    //   this.drawWall(seg, xScreenV1, xScreenV2, true);
    //   return;
    // }


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
      realWallScale1,
      realWallScaleStep,
      hypotenuse,
      realWallDistance,
      realWallNormalAngle,
      offsetAngle,
    } = this.calculateWallInformation(rightSector, seg, xScreenV1, xScreenV2);

    //-----------------------------------------------------------------//

    let indexOfName = this.textureManager.texturePool.get(wallTexture).textureIndex;

    let middleTextureAlt = this.pegMiddleWall(
      line,
      rightSector,
      indexOfName,
      worldFrontZ1,
      side
    );
    //horizontal alignment of textures
    let realWallOffset = hypotenuse * Math.sin(degreesToRadians(offsetAngle));
    realWallOffset += seg.offset + side.xOffset;

    let realWallCenterAngle = realWallNormalAngle - gameEngine.player.direction;


    // where on screen wall is drawn
    let wallY1 = HALFHEIGHT - worldFrontZ1 * realWallScale1;
    const wallY1Step = -realWallScaleStep * worldFrontZ1;

    let wallY2 = HALFHEIGHT - worldFrontZ2 * realWallScale1;
    const wallY2Step = -realWallScaleStep * worldFrontZ2;

    // which parts must be rendered
    const { drawCeiling, drawWall, drawFloor } = this.checkDraw(
      side,
      worldFrontZ1,
      rightSector,
      worldFrontZ2
    );

    let r = this.textureManager.texturePool.get(wallTexture);
    let textureWidth = r.textureWidth;
    let textureHeight = r.textureHeight;
    let textureData = r.textureImageData;


    let columnsData = [];
    // wall segment 
    for (let x = xScreenV1; x <= xScreenV2; x++) {
      let drawWallY1 = Math.trunc(wallY1);
      let drawWallY2 = Math.trunc(wallY2);

      if (drawWall) {

        const wallY1 = Math.max(drawWallY1, this.upperclip[x] + 1);
        const wallY2 = Math.min(drawWallY2, this.lowerclip[x]);
        if (wallY1 < wallY2) {

          let { textureColumn, inverseScale } =
            this.calculateTextureColAndScale(
              true,
              realWallCenterAngle,
              x,
              realWallDistance,
              realWallOffset,
              realWallScale1
            );

          columnsData.push({
            textureColumn,
            x,
            wallY1,
            wallY2,
            textureAlt: middleTextureAlt,
            inverseScale,
            lightLevel,
            startX: xScreenV1 // Store the starting X to calculate relative position
          });


        }
      }

      // vertically move down
      wallY1 += wallY1Step;
      wallY2 += wallY2Step;
      realWallScale1 += realWallScaleStep;
    }

    this.drawSegmentWithTexture(columnsData, textureWidth, textureHeight, textureData, lightLevel);

  }


  drawSegmentWithTexture(columnsData, textureWidth, textureHeight, textureData, lightLevel) {
    columnsData.forEach(({ x, wallY1, wallY2, textureColumn, textureAlt, inverseScale }) => {
      let imageData = new ImageData(1, wallY2 - wallY1 + 1);
      const accumulatedImageData = new Uint32Array(imageData.data.buffer);
      let textureY = textureAlt + (wallY1 - HALFHEIGHT) * inverseScale;
      textureColumn = Math.trunc(textureColumn) & (textureWidth - 1);

      for (let y = 0; y < wallY2 - wallY1 + 1; y++) {
        let texY = isPowerOfTwo(textureHeight)
          ? Math.trunc(textureY) & (textureHeight - 1)
          : Math.trunc(textureY) % textureHeight;

        const texPos = texY * textureWidth + textureColumn;
        let pixelValue = textureData[texPos];

        // Assuming textureData is a Uint32Array of packed ABGR values (common for little-endian architectures)
        // Unpack ABGR components
        let alpha = pixelValue >>> 24;
        let blue = (pixelValue >> 16) & 0xFF;
        let green = (pixelValue >> 8) & 0xFF;
        let red = pixelValue & 0xFF;

        // Apply light level to RGB components
        red = adjustColorComponent(red, lightLevel);
        green = adjustColorComponent(green, lightLevel);
        blue = adjustColorComponent(blue, lightLevel);

        // Repack the ABGR components into a Uint32 value
        accumulatedImageData[y] = (alpha << 24) | (blue << 16) | (green << 8) | red;

        textureY += inverseScale;
      }

      gameEngine.canvas.offScreenCtx.putImageData(imageData, x, wallY1);
    });

    function isPowerOfTwo(number) {
      return (number & (number - 1)) === 0;
    }

    function adjustColorComponent(component, lightLevel) {
      return Math.min(255, Math.max(0, Math.floor(component * lightLevel)));

    }

  }

  pegMiddleWall(line, rightSector, indexOfName, worldFrontZ1, side) {
    let vTop;
    let middleTextureAlt;
    if (line.flag & LOWER_UNPEGGED) {
      vTop = rightSector.floorHeight + this.textures[indexOfName].height;
      middleTextureAlt = vTop - gameEngine.player.height;
    } else {
      middleTextureAlt = worldFrontZ1;
    }
    middleTextureAlt += side.yOffset;
    return middleTextureAlt;
  }

  calculateTextureColAndScale(
    segTextured,
    realWallCenterAngle,
    x,
    realWallDistance,
    realWallOffset,
    realWallScale1
  ) {
    let angle;
    let textureColumn;
    let inverseScale;
    if (segTextured) {
      angle = realWallCenterAngle - getXToAngle(x);
      textureColumn =
        realWallDistance * Math.tan(degreesToRadians(angle)) - realWallOffset;
      inverseScale = 1 / realWallScale1;
    }
    return { textureColumn, inverseScale };
  }

  drawWall(seg, xScreenV1, xScreenV2, drawSolidWall = false) {
    let {
      rightSector,
      leftSector,
      side,
      upperWallTexture,
      lowerWallTexture,
      floorTexture,
      line,
      ceilingTexture,
      lightLevel,
      upperclip,
      lowerclip,
    } = this.portalWallProperties(seg);

    let {
      worldFrontZ1,
      worldFrontZ2,
      realWallScale1,
      realWallScaleStep,
      hypotenuse,
      realWallDistance,
      realWallNormalAngle,
      offsetAngle,
    } = this.calculateWallInformation(rightSector, seg, xScreenV1, xScreenV2);

    let { worldBackZ1, worldBackZ2 } = this.calculateLeftSectorZ(leftSector);

    // sky hack
    worldFrontZ1 = this.handleSkyHack(
      rightSector,
      leftSector,
      worldFrontZ1,
      worldBackZ1
    );

    let { drawUpperWall, drawCeiling } = this.checkDrawCeilingUpperWall(
      worldFrontZ1,
      worldBackZ1,
      rightSector,
      leftSector,
      side,
      drawSolidWall
    );

    let { drawLowerWall, drawFloor } = this.checkDrawFloorLowerWall(
      worldFrontZ2,
      worldBackZ2,
      rightSector,
      leftSector,
      side,
      drawSolidWall
    );

    // if (
    //   drawSolidWall ||
    //   worldFrontZ2 !== worldBackZ2 ||
    //   rightSector.floorTexture !== leftSector.floorTexture ||
    //   rightSector.lightLevel !== leftSector.lightLevel
    // ) {
    //   drawLowerWall =
    //     side.lowerTextureName !== "-" && worldBackZ2 > worldFrontZ1;
    //   drawFloor = worldFrontZ2 <= 0;
    // } else {
    //   drawLowerWall = false;
    //   drawFloor = false;
    // }

    // Nothing to draw
    if (!drawUpperWall && !drawCeiling && !drawLowerWall && !drawFloor) {
      return;
    }

    // let indexOfName = this.textureManager.texturePool.get(wallTexture).textureIndex;

    // let upperTextureIndex = this.calculateTextureIndex(upperWallTexture);
    // let lowerTextureIndex = this.calculateTextureIndex(lowerWallTexture);
    let upperTextureIndex;
    if (upperWallTexture !== "-") {
      upperTextureIndex = this.textureManager.texturePool.get(upperWallTexture).textureIndex;
    }

    //let lowerTextureIndex = this.textureManager.texturePool.get(lowerWallTexture).textureIndex;

    let topPoint;
    let upperTextureAlt;
    if (drawUpperWall) {
      // upper unpegged. want to start at top of ceiling
      ({ upperTextureAlt, topPoint } = this.pegUpperWall(
        line,
        upperTextureAlt,
        worldFrontZ1,
        topPoint,
        leftSector,
        upperTextureIndex,
        side
      ));
    }

    let lowerTextureAlt;
    if (drawLowerWall) {
      lowerTextureAlt = this.pegLowerWall(
        line,
        lowerTextureAlt,
        worldFrontZ1,
        worldBackZ2,
        side
      );
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

    let { portalY1, portalY1Step } = this.calculateUpperPortal(
      drawUpperWall,
      worldBackZ1,
      worldFrontZ2,
      realWallScale1,
      realWallScaleStep,
      wallY2,
      wallY2Step
    );

    let { portalY2, portalY2Step } = this.calculateLowerPortal(
      drawLowerWall,
      worldBackZ2,
      worldFrontZ1,
      realWallScale1,
      realWallScaleStep,
      wallY1,
      wallY1Step
    );

    let { textureWidth, textureHeight, textureData } = this.textureManager.getTextureInfo(upperWallTexture);
    let { textureWidth: textureWidthLower, textureHeight: textureHeightLower, textureData: textureDataLower } = this.textureManager.getTextureInfo(lowerWallTexture);

    let columnsData = [];
    let lowerColumns = [];


    for (let x = xScreenV1; x <= xScreenV2; x++) {
      let drawWallY1 = Math.trunc(wallY1);
      let drawWallY2 = Math.trunc(wallY2);

      let { textureColumn, inverseScale } = this.calculateTextureColAndScale(
        segTextured,
        realWallCenterAngle,
        x,
        realWallDistance,
        realWallOffset,
        realWallScale1
      );

      if (drawUpperWall) {
        let drawUpperWallY1 = Math.trunc(wallY1 - 1);
        let drawUpperWallY2 = Math.trunc(portalY1);
        // if (drawCeiling) {
        //   let ceilingY1 = upperclip[x];
        //   let ceilingY2 = Math.min(drawWallY1, lowerclip[x]);

        //   if (ceilingY1 < ceilingY2) {
        //     let { offscreenCtx, flat } = this.cacheFlat(ceilingTexture);
        //     //this.drawLine(ceilingColor, x, ceilingY1, ceilingY2);
        //     gameEngine.canvas.drawFlatToScreen(
        //       offscreenCtx,
        //       ceilingTexture,
        //       x,
        //       ceilingY1,
        //       ceilingY2,
        //       lightLevel,
        //       worldFrontZ1
        //     );
        //   }
        // }

        let upperWallY1 = Math.max(drawUpperWallY1, this.upperclip[x] + 1);
        let upperWallY2 = Math.min(drawUpperWallY2, this.lowerclip[x]);
        if (upperWallY1 < upperWallY2) {
          // this.canvas.drawWallCol(
          //   offscreenCtx,
          //   entireTextureData,
          //   textureColumn,
          //   x,
          //   upperWallY1,
          //   upperWallY2,
          //   upperTextureAlt,
          //   inverseScale,
          //   lightLevel, textureImage.width, textureImage.height
          // );
          columnsData.push({ textureColumn, x, wallY1: upperWallY1, wallY2: upperWallY2, textureAlt: upperTextureAlt, inverseScale, lightLevel, startX: xScreenV1 })
        }

        if (this.upperclip[x] < upperWallY2) {
          this.upperclip[x] = upperWallY2;
        }
        portalY1 += portalY1Step;
      }
      // draw ceiling for adjoining sector?
      if (drawCeiling) {
        // let ceilingColor = this.colorGenerator.getColor(
        //   ceilingTexture,
        //   lightLevel
        // );
        let ceilingY1 = this.upperclip[x];
        let ceilingY2 = Math.min(drawWallY1, this.lowerclip[x]);
        if (ceilingY1 < ceilingY2) {
          //let { offscreenCtx, flat } = this.cacheFlat(ceilingTexture);
          //this.drawLine(ceilingColor, x, ceilingY1, ceilingY2);
          // gameEngine.canvas.drawFlatToScreen(
          //   offscreenCtx,
          //   ceilingTexture,
          //   x,
          //   ceilingY1,
          //   ceilingY2,
          //   lightLevel,
          //   worldFrontZ1
          // );
        }

        if (this.upperclip[x] < ceilingY2) {
          this.upperclip[x] = ceilingY2;
        }
      }

      if (drawLowerWall) {
        if (drawFloor) {
          // let floorColor = this.colorGenerator.getColor(
          //   floorTexture,
          //   lightLevel
          // );
          let floorY1 = Math.max(drawWallY2, this.upperclip[x]);
          let floorY2 = this.lowerclip[x];

          if (floorY1 < floorY2) {
            // let { offscreenCtx, flat } = this.cacheFlat(floorTexture);
            // gameEngine.canvas.drawFlatToScreen(
            //   offscreenCtx,
            //   floorTexture,
            //   x,
            //   floorY1,
            //   floorY2,
            //   lightLevel,
            //   worldFrontZ1
            // );
            // this.drawLine(floorColor, x, floorY1, floorY2);
          }
        }
        let drawLowerWallY1 = Math.trunc(portalY2 - 1);
        let drawLowerWallY2 = Math.trunc(wallY2);

        let lowerWallY1 = Math.max(drawLowerWallY1, this.upperclip[x]);
        let lowerWallY2 = Math.min(drawLowerWallY2, this.lowerclip[x]);
        if (lowerWallY1 < lowerWallY2) {
          // cache texture



          // let { offscreenCtx, textureImage } = this.cacheTexture(
          //   lowerWallTexture,
          //   lowerTextureIndex
          // );

          // const entireTextureData = offscreenCtx.getImageData(
          //   0,
          //   0,
          //   textureImage.width,
          //   textureImage.height
          // ).data;

          // this.canvas.drawWallCol(
          //   offscreenCtx,
          //   entireTextureData,
          //   textureColumn,
          //   x,
          //   lowerWallY1,
          //   lowerWallY2,
          //   lowerTextureAlt,
          //   inverseScale,
          //   lightLevel, textureImage.width, textureImage.height
          // );
          lowerColumns.push({ textureColumn, x, wallY1: lowerWallY1, wallY2: lowerWallY2, textureAlt: lowerTextureAlt, inverseScale, lightLevel, startX: xScreenV1 })

        }

        if (this.lowerclip[x] > lowerWallY1) {
          this.lowerclip[x] = lowerWallY1;
        }
        portalY2 += portalY2Step;
      }
      if (drawFloor) {
        // let floorColor = this.colorGenerator.getColor(floorTexture, lightLevel);
        let floorY1 = Math.max(drawWallY2, this.upperclip[x]);
        let floorY2 = this.lowerclip[x];

        if (floorY1 < floorY2) {
          // let { offscreenCtx, flat } = this.cacheFlat(floorTexture);
          // gameEngine.canvas.drawFlatToScreen(
          //   offscreenCtx,
          //   floorTexture,
          //   x,
          //   floorY1,
          //   floorY2,
          //   lightLevel,
          //   worldFrontZ1
          // );
          //this.drawLine(floorColor, x, floorY1, floorY2);
        }

        if (this.lowerclip[x] > drawWallY2) {
          this.lowerclip[x] = floorY1;
        }
      }
      realWallScale1 += realWallScaleStep;
      wallY1 += wallY1Step;
      wallY2 += wallY2Step;
    }
    if (drawUpperWall) {

      this.drawSegmentWithTexture(columnsData, textureWidth, textureHeight, textureData, lightLevel);
    }
    if (drawLowerWall) {
      this.drawSegmentWithTexture(lowerColumns, textureWidthLower, textureHeightLower, textureDataLower, lightLevel);

    }

  }

  calculateLowerPortal(
    drawLowerWall,
    worldBackZ2,
    worldFrontZ1,
    realWallScale1,
    realWallScaleStep,
    wallY1,
    wallY1Step
  ) {
    let portalY2;
    let portalY2Step;
    if (drawLowerWall) {
      if (worldBackZ2 < worldFrontZ1) {
        portalY2 = Math.trunc(HALFHEIGHT - worldBackZ2 * realWallScale1);
        portalY2Step = -realWallScaleStep * worldBackZ2;
      } else {
        portalY2 = wallY1;
        portalY2Step = wallY1Step;
      }
    }
    return { portalY2, portalY2Step };
  }

  calculateUpperPortal(
    drawUpperWall,
    worldBackZ1,
    worldFrontZ2,
    realWallScale1,
    realWallScaleStep,
    wallY2,
    wallY2Step
  ) {
    let portalY1;
    let portalY1Step;

    if (drawUpperWall) {
      if (worldBackZ1 > worldFrontZ2) {
        portalY1 = Math.trunc(HALFHEIGHT - worldBackZ1 * realWallScale1);
        portalY1Step = -realWallScaleStep * worldBackZ1;
      } else {
        portalY1 = wallY2;
        portalY1Step = wallY2Step;
      }
    }
    return { portalY1, portalY1Step };
  }

  pegLowerWall(line, lowerTextureAlt, worldFrontZ1, worldBackZ2, side) {
    if (line.flag & LOWER_UNPEGGED) {
      lowerTextureAlt = worldFrontZ1;
    } else {
      lowerTextureAlt = worldBackZ2;
    }
    lowerTextureAlt += side.yOffset;
    return lowerTextureAlt;
  }

  pegUpperWall(
    line,
    upperTextureAlt,
    worldFrontZ1,
    topPoint,
    leftSector,
    upperTextureIndex,
    side
  ) {
    if (line.flag & UPPER_UNPEGGED) {
      upperTextureAlt = worldFrontZ1;
    } else {
      topPoint =
        leftSector.ceilingHeight + this.textures[upperTextureIndex].height;
      upperTextureAlt = topPoint - gameEngine.player.height;
    }
    upperTextureAlt += side.yOffset;
    return { upperTextureAlt, topPoint };
  }

  checkDrawFloorLowerWall(
    worldFrontZ2,
    worldBackZ2,
    rightSector,
    leftSector,
    side,
    drawSolidWall
  ) {
    let drawLowerWall;
    let drawFloor;
    if (
      drawSolidWall ||
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
    return { drawLowerWall, drawFloor };
  }

  checkDrawCeilingUpperWall(
    worldFrontZ1,
    worldBackZ1,
    rightSector,
    leftSector,
    side,
    drawSolidWall
  ) {
    let drawUpperWall;
    let drawCeiling;
    if (
      drawSolidWall ||
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
    return { drawUpperWall, drawCeiling };
  }

  handleSkyHack(rightSector, leftSector, worldFrontZ1, worldBackZ1) {
    if (
      rightSector.ceilingTexture === "F_SKY1" &&
      leftSector.ceilingTexture === "F_SKY1"
    ) {
      worldFrontZ1 = worldBackZ1;
    }
    return worldFrontZ1;
  }

  calculateLeftSectorZ(leftSector) {
    const worldBackZ1 = leftSector.ceilingHeight - gameEngine.player.height;

    const worldBackZ2 = leftSector.floorHeight - gameEngine.player.height;
    return { worldBackZ1, worldBackZ2 };
  }

  portalWallProperties(seg) {
    const rightSector = seg.rightSector;
    const leftSector = seg.leftSector;
    const line = seg.linedef;
    const side = seg.linedef.rightSidedef;

    let upperclip = this.upperclip;
    let lowerclip = this.lowerclip;
    const upperWallTexture = side.upperTextureName.toUpperCase();
    const lowerWallTexture = side.lowerTextureName.toUpperCase();
    const ceilingTexture = rightSector.ceilingTexture.toUpperCase();
    const floorTexture = rightSector.floorTexture.toUpperCase();
    const lightLevel = rightSector.lightLevel;
    return {
      rightSector,
      leftSector,
      side,
      upperWallTexture,
      lowerWallTexture,
      floorTexture,
      line,
      ceilingTexture,
      lightLevel,
      upperclip,
      lowerclip,
    };
  }

  checkDraw(side, worldFrontZ1, rightSector, worldFrontZ2) {
    const drawWall = side.middleTexture !== "-";
    const drawCeiling =
      worldFrontZ1 >= 0 || rightSector.ceilingTexture === "F_SKY1";
    const drawFloor = worldFrontZ2 < 0;
    return { drawCeiling, drawWall, drawFloor };
  }

  calculateWallInformation(rightSector, seg, xScreenV1, xScreenV2) {
    // relative plane heights of right sector
    const worldFrontZ1 = rightSector.ceilingHeight - gameEngine.player.height;
    const worldFrontZ2 = rightSector.floorHeight - gameEngine.player.height;

    // scaling factor of left and right edges of wall range
    const realWallNormalAngle = seg.angle + RIGHT_ANGLE_DEGREES;
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

    return {
      worldFrontZ1,
      worldFrontZ2,
      realWallScale1,
      realWallScaleStep,
      hypotenuse,
      realWallDistance,
      realWallNormalAngle,
      offsetAngle,
    };
  }




  initializeWall(seg) {
    const rightSector = seg.rightSector;
    const line = seg.linedef;
    const side = seg.linedef.rightSidedef;

    let upperclip = this.upperclip;
    let lowerclip = this.lowerclip;
    const wallTexture = seg.linedef.rightSidedef.middleTexture.toUpperCase();
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


  drawLine(color, x, y1, y2) {
    this.canvas.offScreenCtx.strokeStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    this.canvas.offScreenCtx.beginPath();
    this.canvas.offScreenCtx.moveTo(x, y1);
    this.canvas.offScreenCtx.lineTo(x, y2);
    this.canvas.offScreenCtx.stroke();
  }


}
