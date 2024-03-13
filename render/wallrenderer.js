const RIGHT_ANGLE_DEGREES = 90;
const FULL_ALPHA = 255;

const UPPER_UNPEGGED = 8;
const LOWER_UNPEGGED = 16;

class WallRenderer {
  constructor(colorGenerator, dependencies) {
    this.colorGenerator = colorGenerator;
    this.dependencies = dependencies;

    this.geometry = dependencies.geometry;

    this.solidsegs = dependencies.solidSegsManager.initializeSolidsegs();

    this.canvas = gameEngine.canvas;
    // this.canvas = gameEngine.offscreenCanvas;

    this.upperclip = new Array(this.canvas.offScreenWidth);
    this.lowerclip = new Array(this.canvas.offScreenWidth);

    this.palette = gameEngine.palette.palettes[0];

    this.cachedTextures = new Map();

    this.textures = gameEngine.textures.maptextures;

    this.texturesMap = new Map();
    this.textures.forEach((texture, index) => {
      this.texturesMap.set(texture.name, index);
    });

    this.lookupCache = new Map();

    this.initClipHeights();

    this.flatManager = new Flats(gameEngine.lumpData);

    this.flatCache = new Map();

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
      this.clipSolidWalls(seg, xScreenV1, xScreenV2 - 1, angleV1, angleV2);
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
    // if (
    //   seg.rightSector.ceilingHeight !== seg.leftSector.ceilingHeight ||
    //   seg.rightSector.floorHeight !== seg.leftSector.floorHeight
    // ) {
    //   this.clipPortalWalls(seg, xScreenV1, xScreenV2 - 1, angleV1, angleV2);
    //   return;
    // }

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

  clipSolidWalls(seg, xScreenV1, xScreenV2, angleV1, angleV2) {
    // console.log(this.solidsegs);
    // if (this.solidsegs.length < 2) {
    //   traverseBSP = false;
    //   return;
    // }

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
    this.drawRemainingWallSegments(seg, xScreenV2, angleV1, totalSolidSegs);
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


    let indexOfName = this.calculateTextureIndex(wallTexture);

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

    let { textureImage, textureImageData } = this.cacheTexture(
      wallTexture,
      indexOfName
    );
    const textureData = textureImageData;


    //Instead of putting each column to the offScreenCanvas, I want to save all the columns and then put them on the canvas after the loop
    // I need to save each column data.....


    let columnsData = [];
    // wall segment 
    for (let x = xScreenV1; x <= xScreenV2; x++) {
      let drawWallY1 = Math.trunc(wallY1);
      let drawWallY2 = Math.trunc(wallY2);

      if (drawWall) {

        const wallY1 = Math.max(drawWallY1, upperclip[x]);
        const wallY2 = Math.min(drawWallY2, lowerclip[x]);
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

          // this.canvas.drawWallCol(
          //   offscreenCtx,
          //   entireTextureData,
          //   textureColumn,
          //   x,
          //   wallY1,
          //   wallY2,
          //   middleTextureAlt,
          //   inverseScale,
          //   lightLevel, textureImage.width, textureImage.height, xScreenV2 - xScreenV1, largeImageData, xScreenV1
          // );

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

          //this.drawLine(wallColor, x, wallY1, wallY2);
        }
      }

      // vertically move down
      wallY1 += wallY1Step;
      wallY2 += wallY2Step;
      realWallScale1 += realWallScaleStep;
    }
    // Want to draw all the columns at once here instead of individually. 
    //gameEngine.canvas.offScreenCtx.putImageData(largeImageData, xScreenV1, wallY1);


    const textureWidth = textureImage.width;
    const textureHeight = textureImage.height;
    let minColumnX = Infinity;
    let maxColumnX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    // Determine bounds
    columnsData.forEach(({ x, wallY1, wallY2 }) => {
      minColumnX = Math.min(minColumnX, x);
      maxColumnX = Math.max(maxColumnX, x);
      minY = Math.min(minY, wallY1);
      maxY = Math.max(maxY, wallY2);
    });

    if (maxColumnX - minColumnX <= 0 || maxY - minY <= 0) {
      // No valid drawing area, so skip drawing operations.
      return;
    }

    const imageData = new ImageData(maxColumnX - minColumnX + 1, maxY - minY + 1);
    const accumulatedImageData = imageData.data;

    const imageWidth = maxColumnX - minColumnX + 1;
    let texY;

    columnsData.forEach(({ x, wallY1, wallY2, textureColumn, textureAlt, inverseScale }) => {
      let textureY = textureAlt + (wallY1 - HALFHEIGHT) * inverseScale;
      // textureColumn = Math.trunc(textureColumn) % textureWidth;
      //wow this improved performance a lot
      textureColumn = Math.trunc(textureColumn) & (textureWidth - 1);

      for (let y = wallY1; y <= wallY2; y++) {


        if ((textureHeight & (textureHeight - 1)) === 0 && textureHeight !== 0) {
          texY = Math.trunc(textureY) & (textureHeight - 1);
        }
        else {
          texY = Math.trunc(textureY) % textureHeight;
        }



        const texPos = (texY * textureWidth + textureColumn) * 4;

        const idx = ((y - minY) * imageWidth + (x - minColumnX)) * 4;
        accumulatedImageData[idx] = textureData[texPos] * lightLevel;
        accumulatedImageData[idx + 1] = textureData[texPos + 1] * lightLevel;
        accumulatedImageData[idx + 2] = textureData[texPos + 2] * lightLevel;
        accumulatedImageData[idx + 3] = 255; // Full opacity

        textureY += inverseScale;
      }
    });

    gameEngine.canvas.offScreenCtx.putImageData(imageData, minColumnX, minY);

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

    let upperTextureIndex = this.calculateTextureIndex(upperWallTexture);
    let lowerTextureIndex = this.calculateTextureIndex(lowerWallTexture);

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

    let { offscreenCtx, textureImage } = this.cacheTexture(
      upperWallTexture,
      upperTextureIndex
    );

    let entireTextureData;
    if (upperWallTexture !== "-") {
      entireTextureData = offscreenCtx.getImageData(
        0,
        0,
        textureImage.width,
        textureImage.height
      ).data;
    }


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

        let upperWallY1 = Math.max(drawUpperWallY1, upperclip[x]);
        let upperWallY2 = Math.min(drawUpperWallY2, lowerclip[x]);
        if (upperWallY1 < upperWallY2) {
          this.canvas.drawWallCol(
            offscreenCtx,
            entireTextureData,
            textureColumn,
            x,
            upperWallY1,
            upperWallY2,
            upperTextureAlt,
            inverseScale,
            lightLevel, textureImage.width, textureImage.height
          );
        }

        if (upperclip[x] < upperWallY2) {
          upperclip[x] = upperWallY2;
        }
        portalY1 += portalY1Step;
      }
      // draw ceiling for adjoining sector?
      if (drawCeiling) {
        // let ceilingColor = this.colorGenerator.getColor(
        //   ceilingTexture,
        //   lightLevel
        // );
        let ceilingY1 = upperclip[x];
        let ceilingY2 = Math.min(drawWallY1, lowerclip[x]);
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

        if (upperclip[x] < ceilingY2) {
          upperclip[x] = ceilingY2;
        }
      }

      if (drawLowerWall) {
        if (drawFloor) {
          let floorColor = this.colorGenerator.getColor(
            floorTexture,
            lightLevel
          );
          let floorY1 = Math.max(drawWallY2, upperclip[x]);
          let floorY2 = lowerclip[x];

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
            this.drawLine(floorColor, x, floorY1, floorY2);
          }
        }
        let drawLowerWallY1 = Math.trunc(portalY2 - 1);
        let drawLowerWallY2 = Math.trunc(wallY2);

        let lowerWallY1 = Math.max(drawLowerWallY1, upperclip[x]);
        let lowerWallY2 = Math.min(drawLowerWallY2, lowerclip[x]);
        if (lowerWallY1 < lowerWallY2) {
          // cache texture



          let { offscreenCtx, textureImage } = this.cacheTexture(
            lowerWallTexture,
            lowerTextureIndex
          );

          const entireTextureData = offscreenCtx.getImageData(
            0,
            0,
            textureImage.width,
            textureImage.height
          ).data;

          this.canvas.drawWallCol(
            offscreenCtx,
            entireTextureData,
            textureColumn,
            x,
            lowerWallY1,
            lowerWallY2,
            lowerTextureAlt,
            inverseScale,
            lightLevel, textureImage.width, textureImage.height
          );
        }

        if (lowerclip[x] > lowerWallY1) {
          lowerclip[x] = lowerWallY1;
        }
        portalY2 += portalY2Step;
      }
      if (drawFloor) {
        let floorColor = this.colorGenerator.getColor(floorTexture, lightLevel);
        let floorY1 = Math.max(drawWallY2, upperclip[x]);
        let floorY2 = lowerclip[x];

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
          this.drawLine(floorColor, x, floorY1, floorY2);
        }

        if (lowerclip[x] > drawWallY2) {
          lowerclip[x] = floorY1;
        }
      }
      realWallScale1 += realWallScaleStep;
      wallY1 += wallY1Step;
      wallY2 += wallY2Step;
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

  cacheTexture(upperWallTexture, upperTextureIndex) {
    let textureImage;

    let textureImageData;
    // cache the texture
    if (
      !this.cachedTextures.has(upperWallTexture) &&
      upperWallTexture !== "-"
    ) {
      let result = this.drawTexture(upperTextureIndex);
      textureImage = result.offscreenCanvas;
      textureImageData = result.textureImageData;
      this.cachedTextures.set(upperWallTexture, {
        textureImage, textureImageData
      });
    } else if (upperWallTexture !== "-") {
      const cachedTexture = this.cachedTextures.get(upperWallTexture);
      textureImage = cachedTexture.textureImage;

      textureImageData = cachedTexture.textureImageData;

    }
    return { textureImage, textureImageData };
  }

  calculateTextureIndex(textureName) {
    let index;
    if (this.lookupCache.has(textureName) && textureName !== "-") {
      index = this.lookupCache.get(textureName);
    } else if (!this.lookupCache.has(textureName) && textureName !== "-") {
      this.lookupCache.set(textureName, this.texturesMap.get(textureName));
      index = this.texturesMap.get(textureName);
    }
    return index;
  }


  drawPatch(columns, xStart, yStart, textureWidth, textureImageData) {
    const maxColumns = Math.min(columns.length, textureWidth - xStart);

    for (let i = 0; i < maxColumns; i++) {
      const column = columns[i];
      for (let j = 0; j < column.length; j++) {
        const post = column[j];
        for (let k = 0; k < post.data.length; k++) {
          const pixel = post.data[k];
          const pixelDraw = this.palette[pixel];
          const x = xStart + i;
          const y = yStart + post.topDelta + k;
          const pos = (y * textureWidth + x) * 4;


          textureImageData[pos] = pixelDraw.red;
          textureImageData[pos + 1] = pixelDraw.green;
          textureImageData[pos + 2] = pixelDraw.blue;
          textureImageData[pos + 3] = FULL_ALPHA; // Assuming full alpha

        }
      }
    }
  }

  drawTexture(indexOfName) {


    let textureWidth = this.textures[indexOfName].width;
    let textureHeight = this.textures[indexOfName].height;
    const { offscreenCanvas, offscreenCtx } = this.createOffscreenCanvas(
      textureWidth,
      textureHeight
    );



    let textureImageObj = new ImageData(textureWidth, textureHeight);
    let textureImageData = textureImageObj.data;



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
      this.drawPatch(columns, xStart, yStart, textureWidth, textureImageData);
    }
    offscreenCtx.putImageData(textureImageObj, 0, 0);

    return { offscreenCanvas, offscreenCtx, textureImageData };
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


  drawLine(color, x, y1, y2) {
    this.canvas.offScreenCtx.strokeStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    this.canvas.offScreenCtx.beginPath();
    this.canvas.offScreenCtx.moveTo(x, y1);
    this.canvas.offScreenCtx.lineTo(x, y2);
    this.canvas.offScreenCtx.stroke();
  }

  createOffscreenCanvas(width = 64, height = 64) {
    let offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.getContext("2d", { willReadFrequently: true });
    let offscreenCtx = offscreenCanvas.getContext("2d");
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    return { offscreenCanvas, offscreenCtx };
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


}
