const RIGHT_ANGLE_DEGREES = 90;
const FULL_ALPHA = 255;

const UPPER_UNPEGGED = 8;
const LOWER_UNPEGGED = 16;

class WallRenderer {
  constructor(colorGenerator, dependencies, textureManager, flatManager) {
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
    this.flatManager = flatManager;

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
    if (
      seg.leftSector.ceilingHeight <= seg.rightSector.floorHeight ||
      seg.leftSector.floorHeight >= seg.rightSector.ceilingHeight
    ) {
      this.clipSolidWalls(seg, xScreenV1, xScreenV2 - 1, angleV1, angleV2);
      return;
    }

    // // portal because there are height differences
    if (
      seg.rightSector.ceilingHeight !== seg.leftSector.ceilingHeight ||
      seg.rightSector.floorHeight !== seg.leftSector.floorHeight
    ) {
      this.clipPortalWalls(seg, xScreenV1, xScreenV2 - 1, angleV1, angleV2);
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

    this.clipPortalWalls(seg, xScreenV1, xScreenV2 - 1, angleV1, angleV2);


  }

  clipPortalWalls(seg, xScreenV1, xScreenV2, angleV1, angleV2) {
    let totalSolidSegs = this.getInitialSolidSegs(xScreenV1);

    if (xScreenV1 < this.solidsegs[totalSolidSegs].first) {
      if (xScreenV2 < this.solidsegs[totalSolidSegs].first - 1) {
        // draw wall
        // this.drawWall(seg, xScreenV1, xScreenV2);
        this.storeWallRange(seg, xScreenV1, xScreenV2);

        return;
      }

      //draw some other wall
      // this.drawWall(seg, xScreenV1, this.solidsegs[totalSolidSegs].first - 1);
      this.storeWallRange(seg, xScreenV1, this.solidsegs[totalSolidSegs].first - 1)
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
      // this.drawWall(
      //   seg,
      //   this.solidsegs[next].last + 1,
      //   this.solidsegs[next + 1].first - 1
      // );
      this.storeWallRange(seg, this.solidsegs[next].last + 1, this.solidsegs[next + 1].first - 1);
      next++;

      if (xScreenV2 <= this.solidsegs[next].last) {
        return;
      }
    }
    //   this.drawWall(seg, this.solidsegs[next].last + 1, xScreenV2);
    this.storeWallRange(seg, this.solidsegs[next].last + 1, xScreenV2);
  }

  clipSolidWalls(seg, xScreenV1, xScreenV2, angleV1) {


    let totalSolidSegs = this.getInitialSolidSegs(xScreenV1);

    if (xScreenV1 < this.solidsegs[totalSolidSegs].first) {
      if (xScreenV2 < this.solidsegs[totalSolidSegs].first - 1) {
        // draw wall
        // this.drawSolidWall(seg, xScreenV1, xScreenV2, angleV1);
        this.storeWallRange(seg, xScreenV1, xScreenV2);
        this.solidsegs.splice(totalSolidSegs, 0, {
          first: xScreenV1,
          last: xScreenV2,
        });
        return;
      }

      //draw some other wall
      // this.drawSolidWall(
      //   seg,
      //   xScreenV1,
      //   this.solidsegs[totalSolidSegs].first - 1,
      //   angleV1
      // );
      this.storeWallRange(seg, xScreenV1, this.solidsegs[totalSolidSegs].first - 1);
      this.solidsegs[totalSolidSegs].first = xScreenV1;
    }

    if (xScreenV2 <= this.solidsegs[totalSolidSegs].last) {
      return;
    }
    // this.drawRemainingWallSegments(seg, xScreenV2, angleV1, totalSolidSegs);
    let next = totalSolidSegs;
    while (xScreenV2 >= this.solidsegs[next + 1].first - 1) {
      // this.drawSolidWall(
      //   seg,
      //   this.solidsegs[next].last + 1,
      //   this.solidsegs[next + 1].first - 1,
      //   angleV1
      // );
      this.storeWallRange(seg, this.solidsegs[next].last + 1, this.solidsegs[next + 1].first - 1);
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
    // this.drawSolidWall(seg, this.solidsegs[next].last + 1, xScreenV2, angleV1);
    this.storeWallRange(seg, this.solidsegs[next].last + 1, xScreenV2);
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

    if (seg.leftSector !== null) {
      this.drawWall(seg, xScreenV1, xScreenV2, true);
      return;
    }


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
    const textureWidthFlat = 64;
    const textureHeightFlat = 64;

    // const texture1Lump = lumps.find((lump) => lump.name === "TEXTURE1");
    let textureImageObj = this.flatManager.flatPool.get(ceilingTexture);
    let textureImageObjFloor = this.flatManager.flatPool.get(floorTexture);
    for (let x = xScreenV1; x <= xScreenV2; x++) {
      let drawWallY1 = Math.floor(wallY1) - 1;
      let drawWallY2 = Math.floor(wallY2);

      if (drawCeiling) {







        let cy1 = this.upperclip[x] + 1;
        let cy2 = Math.min(drawWallY1 - 1, this.lowerclip[x] - 1);


        if (cy1 < cy2 && ceilingTexture !== "F_SKY1") {

          // function adjustColorComponent(color, lightLevel) {
          //   return Math.min(255, Math.floor(color * lightLevel));
          // }

          this.drawFlat(cy2, cy1, worldFrontZ1, x, textureWidthFlat, textureHeightFlat, textureImageObj, lightLevel);

        }

      }

      if (drawWall) {

        const wallY1 = Math.max(drawWallY1, this.upperclip[x] + 1);
        const wallY2 = Math.min(drawWallY2, this.lowerclip[x] - 1);
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

      if (drawFloor) {
        // const textureWidth = 64;
        // const textureHeight = 64;
        // function adjustColorComponent(color, lightLevel) {
        //   return Math.min(255, Math.floor(color * lightLevel));
        // }



        // const textureLump = gameEngine.lumpData.find(lump => lump.name === floorTexture);

        // const dataView = new DataView(textureLump.data);
        // let textureImageObj = new ImageData(64, 64);

        // for (let i = 0; i < 4096; i++) {
        //   const index = dataView.getUint8(i);
        //   const pixelColor = this.textureManager.palette[index];

        //   const pixelIdx = i * 4;
        //   textureImageObj.data[pixelIdx] = pixelColor.red;
        //   textureImageObj.data[pixelIdx + 1] = pixelColor.green;
        //   textureImageObj.data[pixelIdx + 2] = pixelColor.blue;
        //   textureImageObj.data[pixelIdx + 3] = 255;
        // }

        let floorY1 = Math.max(drawWallY2 + 1, this.upperclip[x] + 1);
        let floorY2 = this.lowerclip[x] - 1;



        if (floorY1 < floorY2) {


          this.drawFlat(floorY2, floorY1, worldFrontZ2, x, textureWidthFlat, textureHeightFlat, textureImageObjFloor, lightLevel);

          // imageData = new ImageData(1, floorY2 - floorY1 + 1);
          // const accumulatedImageData = imageData.data;

          // let playerDirectionX = Math.cos(
          //   degreesToRadians(gameEngine.player.direction)
          // );
          // let playerDirectionY = Math.sin(
          //   degreesToRadians(gameEngine.player.direction)
          // );
          // for (let i = floorY1; i <= floorY2; i++) {
          //   let z = (HALFWIDTH * worldFrontZ2) / (HALFHEIGHT - i);
          //   let px = playerDirectionX * z + gameEngine.player.x;
          //   let py = playerDirectionY * z + gameEngine.player.y;

          //   let leftX = -playerDirectionY * z + px;
          //   let leftY = playerDirectionX * z + py;
          //   let rightX = playerDirectionY * z + px;
          //   let rightY = -playerDirectionX * z + py;

          //   let dx = (rightX - leftX) / this.canvas.canvasWidth;
          //   let dy = (rightY - leftY) / this.canvas.canvasWidth;
          //   let tx = Math.floor(leftX + dx * x) & (textureWidth - 1);
          //   let ty = Math.floor(leftY + dy * x) & (textureHeight - 1);


          //   const texPos = (ty * textureWidth + tx) * 4;


          //   // Apply light level adjustment using the adjustColorComponent function
          //   accumulatedImageData[(i - floorY1) * 4] = adjustColorComponent(textureImageObj.data[texPos], lightLevel);
          //   accumulatedImageData[(i - floorY1) * 4 + 1] = adjustColorComponent(textureImageObj.data[texPos + 1], lightLevel);
          //   accumulatedImageData[(i - floorY1) * 4 + 2] = adjustColorComponent(textureImageObj.data[texPos + 2], lightLevel);
          //   accumulatedImageData[(i - floorY1) * 4 + 3] = 255; // Alpha channel
          // }

          // gameEngine.canvas.offScreenCtx.putImageData(imageData, x, floorY1);
        }
      }

      // vertically move down
      wallY1 += wallY1Step;
      wallY2 += wallY2Step;
      realWallScale1 += realWallScaleStep;
    }
    // columnsData.forEach(({ x, wallY1, wallY2, textureColumn, textureAlt, inverseScale }) => {
    //   // Highlighting the first row at wallY1
    //   gameEngine.canvas.offScreenCtx.fillStyle = 'green';
    //   gameEngine.canvas.offScreenCtx.fillRect(x, wallY1, 1, 1);

    //   // Highlighting the last row at wallY2
    //   gameEngine.canvas.offScreenCtx.fillRect(x, wallY2, 1, 1);
    // });
    this.drawSegmentWithTexture(columnsData, textureWidth, textureHeight, textureData, lightLevel);

  }


  drawFlat(y2, y1, worldFront, x, textureWidthFlat, textureHeightFlat, textureImageObj, lightLevel) {



    function adjustColorComponent(color, lightLevel) {
      return Math.min(255, Math.floor(color * lightLevel));
    }

    let imageData = new ImageData(1, y2 - y1 + 1);
    const accumulatedImageData = imageData.data;

    let playerDirectionX = Math.cos(
      degreesToRadians(gameEngine.player.direction.angle)
    );
    let playerDirectionY = Math.sin(
      degreesToRadians(gameEngine.player.direction.angle)
    );
    for (let i = y1; i <= y2; i++) {
      let z = (HALFWIDTH * worldFront) / (HALFHEIGHT - i);
      let px = playerDirectionX * z + gameEngine.player.x;
      let py = playerDirectionY * z + gameEngine.player.y;

      let leftX = -playerDirectionY * z + px;
      let leftY = playerDirectionX * z + py;
      let rightX = playerDirectionY * z + px;
      let rightY = -playerDirectionX * z + py;

      let dx = (rightX - leftX) / this.canvas.canvasWidth;
      let dy = (rightY - leftY) / this.canvas.canvasWidth;
      let tx = Math.floor(leftX + dx * x) & (textureWidthFlat - 1);
      let ty = Math.floor(leftY + dy * x) & (textureHeightFlat - 1);


      const texPos = (ty * textureWidthFlat + tx) * 4;


      // Apply light level adjustment using the adjustColorComponent function
      accumulatedImageData[(i - y1) * 4] = adjustColorComponent(textureImageObj.data[texPos], lightLevel);
      accumulatedImageData[(i - y1) * 4 + 1] = adjustColorComponent(textureImageObj.data[texPos + 1], lightLevel);
      accumulatedImageData[(i - y1) * 4 + 2] = adjustColorComponent(textureImageObj.data[texPos + 2], lightLevel);
      accumulatedImageData[(i - y1) * 4 + 3] = 255; // Alpha channel
    }

    gameEngine.canvas.offScreenCtx.putImageData(imageData, x, y1);

    // gameEngine.canvas.offScreenCtx.fillStyle = 'yellow';
    // gameEngine.canvas.offScreenCtx.fillRect(x, y1, 1, 1);

    // // Highlighting the last row at wallY2
    // gameEngine.canvas.offScreenCtx.fillRect(x, y2, 1, 1);
  }

  drawSegmentWithTexture(columnsData, textureWidth, textureHeight, textureData, lightLevel) {
    columnsData.forEach(({ x, wallY1, wallY2, textureColumn, textureAlt, inverseScale }) => {
      console.log(wallY1);
      console.log(wallY2);
      let imageData = new ImageData(1, wallY2 - wallY1 + 1);
      const accumulatedImageData = new Uint32Array(imageData.data.buffer);
      let textureY = textureAlt + (wallY1 - HALFHEIGHT) * inverseScale;
      textureColumn = Math.floor(textureColumn) & (textureWidth - 1);

      for (let y = 0; y < wallY2 - wallY1 + 1; y++) {
        let texY = isPowerOfTwo(textureHeight)
          ? Math.floor(textureY) & (textureHeight - 1)
          : Math.floor(textureY) % textureHeight;

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

  storeWallRange(seg, xScreenV1, xScreenV2) {

    function playerDistToScreen(screenWidth) {
      return screenWidth / 2.0 / Math.tan(degreesToRadians(45));
    }

    function screenToXView(x, screenWidth) {
      return Math.atan((screenWidth / 2.0 - x) / playerDistToScreen(screenWidth));
    }

    function scaleFromViewAngle(visangle, realWallNormalAngle, realWallDistance, viewangle, screenwidth) {


      let anglea = new Angle(RIGHT_ANGLE_DEGREES + (visangle - viewangle));
      let angleb = new Angle(RIGHT_ANGLE_DEGREES + (visangle - realWallNormalAngle));

      let sinea = Math.sin(degreesToRadians(anglea.angle));
      let sineb = Math.sin(degreesToRadians(angleb.angle));

      let p = screenwidth / 2.0;
      let num = p * sineb;
      let den = realWallDistance * sinea;
      return num / den;




      // const xAngle = this.xToAngle[x];
      // const num =
      //   SCREENDISTANCE *
      //   Math.cos(
      //     degreesToRadians(
      //       realWallNormalAngle - xAngle - gameEngine.player.direction
      //     )
      //   );
      // const den = realWallDistance * Math.cos(degreesToRadians(xAngle));

      // let scale = num / den;
      // scale = Math.min(MAXSCALE, Math.max(MINSCALE, scale));
      // return scale;
    }




    // let rightSector = seg.rightSector;
    // let leftSector = seg.leftSector;
    let line = seg.linedef;
    let side = seg.linedef.rightSidedef;

    // const realWallNormalAngle = seg.angle + RIGHT_ANGLE_DEGREES;
    // const offsetAngle =
    //   realWallNormalAngle - gameEngine.player.realWallAngle1.angle;

    // const hypotenuse = this.geometry.distanceToPoint(seg.startVertex);
    // const realWallDistance =
    //   hypotenuse * Math.cos(degreesToRadians(offsetAngle));

    // const realWallScale1 = this.geometry.scaleFromGlobalAngle(
    //   xScreenV1,
    //   realWallNormalAngle,
    //   realWallDistance
    // );
    // let scale2;
    // let realWallScaleStep = 0;
    // if (xScreenV1 < xScreenV2) {
    //   scale2 = this.geometry.scaleFromGlobalAngle(
    //     xScreenV2,
    //     realWallNormalAngle,
    //     realWallDistance
    //   );
    //   realWallScaleStep = (scale2 - realWallScale1) / (xScreenV2 - xScreenV1);
    // } else {
    //   scale2 = realWallScale1
    //   realWallScaleStep = 0;
    // }



    let realWallNormalAngle = new Angle(seg.angle + RIGHT_ANGLE_DEGREES).angle;
    let offsetAngle = new Angle(realWallNormalAngle - gameEngine.player.realWallAngle1.angle).angle;

    let distangle = new Angle(RIGHT_ANGLE_DEGREES - offsetAngle);
    let hypotenuse = this.geometry.distanceToPoint(seg.startVertex);

    //let realWallDistance = hypotenuse * Math.cos(degreesToRadians(offsetAngle));
    let realWallDistance = hypotenuse * Math.sin(degreesToRadians(distangle.angle));

    let t = screenToXView(xScreenV1, 640);

    let visangle = new Angle(gameEngine.player.direction.angle + radiansToDegrees(t)).angle;

    // let realWallScale1 = this.geometry.scaleFromGlobalAngle(
    //   xScreenV1,
    //   realWallNormalAngle,
    //   realWallDistance);

    let realWallScale1 = scaleFromViewAngle(visangle, realWallNormalAngle, realWallDistance, gameEngine.player.direction.angle, 640);

    visangle = new Angle(gameEngine.player.direction.angle + radiansToDegrees(screenToXView(xScreenV2, 640))).angle;

    let rwx = xScreenV1;
    let rwStopX = xScreenV2 + 1;

    let rwScaleStep;
    let scale2;
    if (xScreenV2 > xScreenV1) {
      // scale2 = this.geometry.scaleFromGlobalAngle(xScreenV2, realWallNormalAngle, realWallDistance);
      scale2 = scaleFromViewAngle(visangle, realWallNormalAngle, realWallDistance, gameEngine.player.direction.angle, 640);
      rwScaleStep = (scale2 - realWallScale1) / (xScreenV2 - xScreenV1);


    }
    else {
      scale2 = realWallScale1;
      rwScaleStep = 0;
    }
    let rightSector = seg.rightSector;
    // let leftSector = seg.leftSector;

    //world top
    let worldFrontZ1 = rightSector.ceilingHeight - gameEngine.player.height;
    // world bottom
    let worldFrontZ2 = rightSector.floorHeight - gameEngine.player.height;

    let midtexture = false;

    let upperWallTexture;
    let lowerWallTexture;
    let toptexture = false;
    let bottomtexture = false;

    let middleTextureAlt = 0;
    let upperTextureAlt = 0;
    let lowerTextureAlt = 0;


    let worldBackZ1;
    let worldBackZ2;

    let ceilingTexture = "-"
    let floorTexture = "-";
    if (!seg.leftSector) {
      this.markfloor = true;
      this.markceiling = true;

      const wallTexture = seg.linedef.rightSidedef.middleTexture.toUpperCase();
      midtexture = wallTexture !== "-";
      ceilingTexture = rightSector.ceilingTexture;
      floorTexture = rightSector.floorTexture;
      const lightLevel = rightSector.lightLevel;

      let indexOfName = this.textureManager.texturePool.get(wallTexture).textureIndex;

      let vTop;
      // let middleTextureAlt;
      if (line.flag & LOWER_UNPEGGED) {
        vTop = rightSector.floorHeight + this.textures[indexOfName].height - 1.0;
        middleTextureAlt = vTop - gameEngine.player.height;
      } else {
        middleTextureAlt = worldFrontZ1;
      }
      middleTextureAlt += side.yOffset;
    }
    else {
      const leftSector = seg.leftSector;

      // worldhigh
      worldBackZ1 = leftSector.ceilingHeight - gameEngine.player.height;


      //world low
      worldBackZ2 = leftSector.floorHeight - gameEngine.player.height;

      if (
        rightSector.ceilingTexture === "F_SKY1" &&
        leftSector.ceilingTexture === "F_SKY1"
      ) {
        worldFrontZ1 = worldBackZ1;
      }





      if (
        worldFrontZ2 !== worldBackZ2 ||
        rightSector.floorTexture !== leftSector.floorTexture ||
        rightSector.lightLevel !== leftSector.lightLevel
      ) {
        this.drawLowerWall =
          side.lowerTextureName !== "-" && worldBackZ2 > worldFrontZ2;
        this.drawFloor = worldFrontZ2 <= 0;
        this.markfloor = true;
      } else {
        this.drawLowerWall = false;
        this.drawFloor = false;
        this.markfloor = false;
      }



      if (

        worldFrontZ1 !== worldBackZ1 ||
        rightSector.lightLevel !== leftSector.lightLevel ||
        rightSector.ceilingTexture !== leftSector.ceilingTexture
      ) {
        this.drawUpperWall =
          side.upperTextureName !== "-" && worldBackZ1 < worldFrontZ1;
        this.drawCeiling =
          worldFrontZ1 >= 0 || rightSector.ceilingTexture === "F_SKY1";
        this.markceiling = true;
      } else {
        this.drawUpperWall = false;
        this.drawCeiling = false;
        this.markceiling = false;
      }


      if (leftSector.ceilingHeight <= rightSector.floorHeight || leftSector.floorHeight >= rightSector.ceilingHeight) {
        this.markceiling = true;
        this.markfloor = true;
      }

      upperWallTexture = side.upperTextureName.toUpperCase();
      lowerWallTexture = side.lowerTextureName.toUpperCase();

      let upperTextureIndex;
      if (upperWallTexture !== "-") {
        upperTextureIndex = this.textureManager.texturePool.get(upperWallTexture).textureIndex;
        // toptexture = true;
      }
      if (lowerWallTexture !== "-") {
        //  bottomtexture = true;
      }



      let topPoint;
      // let upperTextureAlt;

      // check this !!!
      if (worldBackZ1 < worldFrontZ1) {
        toptexture = upperWallTexture !== "-";
        if (line.flag & UPPER_UNPEGGED) {
          upperTextureAlt = worldFrontZ1;
        } else {
          topPoint = leftSector.ceilingHeight + this.textures[upperTextureIndex].height - 1.0;
          upperTextureAlt = topPoint - gameEngine.player.height;
        }
        // upperTextureAlt += side.yOffset;


      }

      // let lowerTextureAlt;
      if (worldBackZ2 > worldFrontZ2) {
        bottomtexture = lowerWallTexture !== "-";
        if (line.flag & LOWER_UNPEGGED) {
          lowerTextureAlt = worldFrontZ1;
        } else {
          lowerTextureAlt = worldBackZ2;
        }
        // lowerTextureAlt += side.yOffset;
      }

      upperTextureAlt += side.yOffset;
      lowerTextureAlt += side.yOffset;

      gameEngine.visplaneRenderer.lastopening += rwStopX - rwx;

    }



    let segTextured = false;
    if (midtexture || upperWallTexture || lowerWallTexture) {
      segTextured = true;
    }
    let realWallCenterAngle;
    let realWallOffset

    if (segTextured) {
      offsetAngle = new Angle(realWallNormalAngle - gameEngine.player.realWallAngle1.angle).angle;


      realWallOffset = hypotenuse * Math.sin(degreesToRadians(offsetAngle));
      // this line below fixed the door being misaligned in e1m2? but I did make a lot of changes besides this
      realWallOffset = -realWallOffset;
      realWallOffset += seg.offset + side.xOffset
      realWallCenterAngle = new Angle(gameEngine.player.direction.angle - realWallNormalAngle).angle;






      // realWallOffset = hypotenuse * Math.sin(degreesToRadians(offsetAngle));
      // realWallOffset += seg.offset + side.xOffset;
      // realWallCenterAngle = realWallNormalAngle - gameEngine.player.direction;
    }

    if (rightSector.floorHeight > gameEngine.player.height) {
      this.markfloor = false;
    }

    if (rightSector.ceilingHeight < gameEngine.player.height && rightSector.ceilingTexture !== "F_SKY1") {
      this.markceiling = false;
    }

    let wallY1 = HALFHEIGHT - worldFrontZ1 * realWallScale1;
    const wallY1Step = -rwScaleStep * worldFrontZ1;

    let wallY2 = HALFHEIGHT - worldFrontZ2 * realWallScale1;
    const wallY2Step = -rwScaleStep * worldFrontZ2;

    const lightLevel = rightSector.lightLevel;

    let pixhigh = 0;
    let pixhighstep = 0;

    let pixlow = 0;
    let pixlowstep = 0;
    if (seg.leftSector) {
      //  if (this.drawUpperWall) {
      if (worldBackZ1 > worldFrontZ2) {
        pixhigh = HALFHEIGHT - (worldBackZ1 * realWallScale1);
        pixhighstep = -(worldBackZ1 * rwScaleStep);
      }
      else {
        pixhigh = wallY2;
        pixhighstep = wallY2Step;
      }
      // }
      //  if (this.drawLowerWall) {
      if (worldBackZ2 < worldFrontZ1) {
        pixlow = HALFHEIGHT - (worldBackZ2 * realWallScale1);
        pixlowstep = -(worldBackZ2 * rwScaleStep);
      }
      else {
        pixlow = wallY1;
        pixlowstep = wallY1Step;
      }
      //  }


    }

    if (this.markceiling) {
      gameEngine.visplaneRenderer.ceilingplane = gameEngine.visplaneRenderer.checkPlane(rwx, rwStopX, gameEngine.visplaneRenderer.ceilingplane);
    }
    if (this.markfloor) {
      gameEngine.visplaneRenderer.floorplane = gameEngine.visplaneRenderer.checkPlane(rwx, rwStopX, gameEngine.visplaneRenderer.floorplane);
    }

    ceilingTexture = rightSector.ceilingTexture;
    floorTexture = rightSector.floorTexture;

    // if (seg.linedef.rightSidedef.middleTexture === "-") {
    //   return;
    // }
    this.renderSegLoop(seg, rwx, rwStopX, gameEngine.player.height, seg.linedef.rightSidedef.middleTexture.toUpperCase(), wallY1, wallY1Step, wallY2, wallY2Step, realWallDistance, segTextured, midtexture, middleTextureAlt, lightLevel, rwScaleStep, realWallCenterAngle, realWallOffset, realWallScale1, upperWallTexture, lowerWallTexture, pixhigh, pixhighstep, pixlow, pixlowstep, toptexture, bottomtexture, upperTextureAlt, lowerTextureAlt, ceilingTexture, worldFrontZ1, worldFrontZ2, floorTexture);

  }
  renderSegLoop(seg, xScreenV1, xScreenV2, viewHeight, wallTexture, wallY1, wallY1Step, wallY2, wallY2Step, realWallDistance, segTextured, midtexture, middleTextureAlt, lightLevel, rwScaleStep, realWallCenterAngle, realWallOffset, realWallScale1, upperWallTexture, lowerWallTexture, pixhigh, pixhighstep, pixlow, pixlowstep, toptexture, bottomtexture, upperTextureAlt, lowerTextureAlt, ceilingTexture, worldFrontZ1, worldFrontZ2, floorTexture) {
    function playerDistToScreen(screenWidth) {
      return screenWidth / 2.0 / Math.tan(degreesToRadians(45));
    }

    function screenToXView(x, screenWidth) {
      return Math.atan((screenWidth / 2.0 - x) / playerDistToScreen(screenWidth));
    }

    let textureWidthFlat = 64;
    let textureHeightFlat = 64;


    let textureWidth;
    let textureHeight;
    let textureData;
    if (wallTexture !== "-") {
      let r = this.textureManager.texturePool.get(wallTexture);
      textureWidth = r.textureWidth;
      textureHeight = r.textureHeight;
      textureData = r.textureImageData;
    }



    let columnsData = [];
    // wall segment 
    let { textureWidth: textureWidthUpper, textureHeight: textureHeightUpper, textureData: textureDataUpper } = this.textureManager.getTextureInfo(upperWallTexture);
    let { textureWidth: textureWidthLower, textureHeight: textureHeightLower, textureData: textureDataLower } = this.textureManager.getTextureInfo(lowerWallTexture);

    let upperColumns = [];
    let lowerColumns = [];


    // const texture1Lump = lumps.find((lump) => lump.name === "TEXTURE1");
    let textureImageObj = this.flatManager.flatPool.get(ceilingTexture);
    let textureImageObjFloor = this.flatManager.flatPool.get(floorTexture);
    for (let x = xScreenV1; x < xScreenV2; x++) {

      let yl = Math.floor(wallY1) + 1;
      if (yl < this.upperclip[x] + 1) {
        yl = this.upperclip[x] + 1;
      }
      let top;
      let bottom;

      let mid;
      if (this.markceiling) {
        top = this.upperclip[x] + 1;
        bottom = yl;

        if (bottom >= this.lowerclip[x]) {
          bottom = this.lowerclip[x] - 1;
        }

        let cy2 = Math.min(yl + 1, this.lowerclip[x] - 1);
        if (ceilingTexture !== "F_SKY1" && top < cy2) {
          this.drawFlat(Math.floor(cy2), Math.floor(top), worldFrontZ1, x, textureWidthFlat, textureHeightFlat, textureImageObj, lightLevel);
        }



        if (top < bottom) {
          let ceil = gameEngine.visplaneRenderer.ceilingplane;
          gameEngine.visplaneRenderer.visplanes[ceil].top[x] = Math.floor(top);
          gameEngine.visplaneRenderer.visplanes[ceil].bottom[x] = Math.floor(bottom);


        }
      }

      let yh = Math.floor(wallY2);
      if (yh >= this.lowerclip[x] - 1.0) {
        yh = this.lowerclip[x] - 1.0;
      }
      if (this.markfloor) {
        top = yh + 1;
        bottom = this.lowerclip[x] - 1;



        if (top <= this.upperclip[x]) {
          top = this.upperclip[x] + 1;
        }
        if (top <= bottom) {
          let floor = gameEngine.visplaneRenderer.floorplane;
          gameEngine.visplaneRenderer.visplanes[floor].top[x] = Math.floor(top);
          gameEngine.visplaneRenderer.visplanes[floor].bottom[x] = Math.floor(bottom);


          this.drawFlat(Math.floor(bottom), Math.floor(top), worldFrontZ2, x, textureWidthFlat, textureHeightFlat, textureImageObjFloor, lightLevel);


        }
      }



      let angle;
      let textureColumn;
      let inverseScale;
      if (segTextured) {
        angle = realWallCenterAngle + radiansToDegrees(screenToXView(x, 640));
        textureColumn = (realWallOffset - Math.tan(degreesToRadians(angle)) * realWallDistance);
        inverseScale = 1.0 / realWallScale1;
        // angle = this.realWallCenterAngle - getXToAngle(x);
        // textureColumn =
        //   realWallDistance * Math.tan(degreesToRadians(angle)) - this.realWallOffset;
        // inverseScale = 1 / this.rwScale;


        // let angle;
        // let textureColumn;
        // let inverseScale;

        // angle = realWallCenterAngle - getXToAngle(x);
        // textureColumn =
        //   realWallDistance * Math.tan(degreesToRadians(angle)) - realWallOffset;
        // inverseScale = 1 / realWallScale1;

      }



      if (midtexture) {


        // const wallY1 = Math.max(drawWallY1, this.upperclip[x]);
        // const wallY2 = Math.min(drawWallY2, this.lowerclip[x]);

        // const wallY1 = Math.max(drawWallY1, this.upperclip[x] + 1);
        // const wallY2 = Math.min(drawWallY2, this.lowerclip[x] - 1);
        if (yl < yh) {

          // let { textureColumn, inverseScale } =
          //   this.calculateTextureColAndScale(
          //     true,
          //     realWallCenterAngle,
          //     x,
          //     realWallDistance,
          //     realWallOffset,
          //     realWallScale1
          //   );

          let wallY1 = yl;
          let wallY2 = yh;
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

          // this.upperclip[x] = gameEngine.player.height;
          //  this.lowerclip[x] = -1;

          // columnsData.push({
          //   textureColumn,
          //   x,
          //   wallY1,
          //   wallY2,
          //   textureAlt: middleTextureAlt,
          //   inverseScale,
          //   lightLevel,
          //   startX: xScreenV1 // Store the starting X to calculate relative position
          // });
        }
      }
      else {
        if (toptexture) {
          mid = pixhigh;
          pixhigh += pixhighstep;

          if (mid >= this.lowerclip[x]) {
            mid = this.lowerclip[x] - 1;
          }

          if (mid > yl) {




            // yh for wally2 and not mid.... but why?
            // if (this.drawUpperWall) {
            upperColumns.push({ textureColumn, x, wallY1: yl, wallY2: Math.floor(mid), textureAlt: upperTextureAlt, inverseScale, lightLevel, startX: xScreenV1 })
            // gameEngine.canvas.offScreenCtx.strokeStyle = "red";
            // gameEngine.canvas.offScreenCtx.beginPath();
            // gameEngine.canvas.offScreenCtx.moveTo(x, yl);
            // gameEngine.canvas.offScreenCtx.lineTo(x, Math.floor(mid));
            // gameEngine.canvas.offScreenCtx.stroke();
            // }





            /// store column data for upper wall

            this.upperclip[x] = Math.floor(mid);
          }
          else {
            this.upperclip[x] = yl - 1;
          }


          // if (this.upperclip[x] < Math.floor(mid)) {
          //   this.upperclip[x] = Math.floor(mid);
          // }
          //this.upperclip[x] = Math.max(this.upperclip[x], Math.floor(mid));
        }
        else if (this.markceiling) {
          this.upperclip[x] = yl - 1;
        }

        if (bottomtexture) {


          mid = pixlow + 1;
          pixlow += pixlowstep;

          if (mid <= this.upperclip[x]) {
            mid = this.upperclip[x] + 1;
          }



          if (mid <= yh + 1) {
            // store bottom column data here
            // if (mid < yh) {
            lowerColumns.push({ textureColumn, x, wallY1: Math.floor(mid), wallY2: Math.floor(yh) + 1, textureAlt: lowerTextureAlt, inverseScale, lightLevel, startX: xScreenV1 });
            //  }



            this.lowerclip[x] = Math.floor(mid);
          } else {
            this.lowerclip[x] = yh + 1;
          }
        }
        else if (this.markfloor) {

          this.lowerclip[x] = yh + 1;
        }

      }

      // let drawWallY1 = Math.floor(wallY1) - 1;
      // let drawWallY2 = Math.floor(wallY2);





      // wallY1 = Math.max(drawWallY1, this.upperclip[x] + 1);
      // wallY2 = Math.min(drawWallY2, this.lowerclip[x] - 1);
      // if (wallY1 < wallY2) {

      //   let { textureColumn, inverseScale } =
      //     this.calculateTextureColAndScale(
      //       true,
      //       realWallCenterAngle,
      //       x,
      //       realWallDistance,
      //       realWallOffset,
      //       realWallScale1
      //     );

      //   columnsData.push({
      //     textureColumn,
      //     x,
      //     wallY1,
      //     wallY2,
      //     textureAlt: middleTextureAlt,
      //     inverseScale,
      //     lightLevel,
      //     startX: xScreenV1 // Store the starting X to calculate relative position
      //   });


      //}

      // vertically move down
      wallY1 += wallY1Step;
      wallY2 += wallY2Step;
      realWallScale1 += rwScaleStep;
    }
    if (midtexture) {
      this.drawSegmentWithTexture(columnsData, textureWidth, textureHeight, textureData, lightLevel);
    }

    if (toptexture) {

      // columnsData.forEach(({ x, wallY1, wallY2, textureColumn, textureAlt, inverseScale }) => {
      //   // Highlighting the first row at wallY1
      //   gameEngine.canvas.offScreenCtx.fillStyle = 'blue';
      //   gameEngine.canvas.offScreenCtx.fillRect(x, wallY1, 1, 1);

      //   // Highlighting the last row at wallY2
      //   gameEngine.canvas.offScreenCtx.fillRect(x, wallY2, 1, 1);
      // });

      this.drawSegmentWithTexture(upperColumns, textureWidthUpper, textureHeightUpper, textureDataUpper, lightLevel);

    }
    if (bottomtexture) {
      this.drawSegmentWithTexture(lowerColumns, textureWidthLower, textureHeightLower, textureDataLower, lightLevel);
    }




  }

  drawWall(seg, xScreenV1, xScreenV2, drawSolidWall = false) {
    // let {
    //   rightSector,
    //   leftSector,
    //   side,
    //   upperWallTexture,
    //   lowerWallTexture,
    //   floorTexture,
    //   line,
    //   ceilingTexture,
    //   lightLevel,
    //   upperclip,
    //   lowerclip,
    // } = this.portalWallProperties(seg);


    let rightSector = seg.rightSector;
    let leftSector = seg.leftSector;
    let line = seg.linedef;
    let side = seg.linedef.rightSidedef;


    let upperWallTexture = side.upperTextureName.toUpperCase();
    let lowerWallTexture = side.lowerTextureName.toUpperCase();
    let ceilingTexture = rightSector.ceilingTexture.toUpperCase();
    let floorTexture = rightSector.floorTexture.toUpperCase();
    let lightLevel = rightSector.lightLevel;

    // let {
    //   worldFrontZ1,
    //   worldFrontZ2,
    //   realWallScale1,
    //   realWallScaleStep,
    //   hypotenuse,
    //   realWallDistance,
    //   realWallNormalAngle,
    //   offsetAngle,
    // } = this.calculateWallInformation(rightSector, seg, xScreenV1, xScreenV2);


    // relative plane heights of right sector
    let worldFrontZ1 = rightSector.ceilingHeight - gameEngine.player.height;
    let worldFrontZ2 = rightSector.floorHeight - gameEngine.player.height;

    // scaling factor of left and right edges of wall range
    let realWallNormalAngle = seg.angle + RIGHT_ANGLE_DEGREES;
    let offsetAngle =
      realWallNormalAngle - gameEngine.player.realWallAngle1.angle;

    let hypotenuse = this.geometry.distanceToPoint(seg.startVertex);
    let realWallDistance =
      hypotenuse * Math.cos(degreesToRadians(offsetAngle));

    let realWallScale1 = this.geometry.scaleFromGlobalAngle(
      xScreenV1,
      realWallNormalAngle,
      realWallDistance
    );
    let scale2;
    let realWallScaleStep = 0;
    if (xScreenV1 < xScreenV2) {
      scale2 = this.geometry.scaleFromGlobalAngle(
        xScreenV2,
        realWallNormalAngle,
        realWallDistance
      );
      realWallScaleStep = (scale2 - realWallScale1) / (xScreenV2 - xScreenV1);
    } else {
      scale2 = realWallScale1
      realWallScaleStep = 0;
    }


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

    let wallY1 = HALFHEIGHT - worldFrontZ1 * realWallScale1;
    const wallY1Step = -realWallScaleStep * worldFrontZ1;

    let wallY2 = HALFHEIGHT - worldFrontZ2 * realWallScale1;
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

    let textureImageObj = this.flatManager.flatPool.get(ceilingTexture);
    let textureImageObjFloor = this.flatManager.flatPool.get(floorTexture);
    const textureWidthFlat = 64;
    const textureHeightFlat = 64;

    for (let x = xScreenV1; x <= xScreenV2; x++) {
      let drawWallY1 = Math.floor(wallY1) + 1;
      let drawWallY2 = Math.floor(wallY2);

      let { textureColumn, inverseScale } = this.calculateTextureColAndScale(
        segTextured,
        realWallCenterAngle,
        x,
        realWallDistance,
        realWallOffset,
        realWallScale1
      );

      if (drawUpperWall) {
        let drawUpperWallY1 = Math.floor(wallY1 - 1);
        let drawUpperWallY2 = Math.floor(portalY1);
        if (drawCeiling) {

          let cy1 = this.upperclip[x] + 1;
          let cy2 = Math.min(drawWallY1 - 1, this.lowerclip[x] - 1);

          if (cy1 < cy2 && ceilingTexture !== "F_SKY1") {

            this.drawFlat(cy2, cy1, worldFrontZ1, x, textureWidthFlat, textureHeightFlat, textureImageObj, lightLevel);
          }
        }

        let upperWallY1 = Math.max(drawUpperWallY1, this.upperclip[x] + 1);
        let upperWallY2 = Math.min(drawUpperWallY2, this.lowerclip[x] - 1);
        if (upperWallY1 < upperWallY2) {

          // let columnsData = [];
          // let lowerColumns = [];
          // columnsData.push({ textureColumn, x, wallY1: upperWallY1, wallY2: upperWallY2, textureAlt: upperTextureAlt, inverseScale, lightLevel, startX: xScreenV1 })
        }

        if (this.upperclip[x] < upperWallY2) {
          this.upperclip[x] = upperWallY2;
        }
        portalY1 += portalY1Step;
      }
      // draw ceiling for adjoining sector?
      if (drawCeiling) {

        let cy1 = this.upperclip[x] + 1;
        let cy2 = Math.min(drawWallY1 - 1, this.lowerclip[x] - 1);

        if (cy1 < cy2 && ceilingTexture !== "F_SKY1") {

          this.drawFlat(cy2, cy1, worldFrontZ1, x, textureWidthFlat, textureHeightFlat, textureImageObj, lightLevel);


          if (this.upperclip[x] < cy2) {
            this.upperclip[x] = cy2;
          }
        }
      }

      if (drawLowerWall) {
        if (drawFloor) {

          let floorY1 = Math.max(drawWallY2 + 1, this.upperclip[x] + 1);
          let floorY2 = this.lowerclip[x] - 1;

          if (floorY1 < floorY2) {
            this.drawFlat(floorY2, floorY1, worldFrontZ2, x, textureWidthFlat, textureHeightFlat, textureImageObjFloor, lightLevel);
          }
        }
        let drawLowerWallY1 = Math.floor(portalY2) - 1;
        let drawLowerWallY2 = Math.floor(wallY2);

        let lowerWallY1 = Math.max(drawLowerWallY1, this.upperclip[x] + 1);
        let lowerWallY2 = Math.min(drawLowerWallY2, this.lowerclip[x] - 1);
        if (lowerWallY1 < lowerWallY2) {


          lowerColumns.push({ textureColumn, x, wallY1: lowerWallY1, wallY2: lowerWallY2, textureAlt: lowerTextureAlt, inverseScale, lightLevel, startX: xScreenV1 })

        }

        if (this.lowerclip[x] > lowerWallY1) {
          this.lowerclip[x] = lowerWallY1;
        }
        portalY2 += portalY2Step;
      }
      if (drawFloor) {

        let floorY1 = Math.max(drawWallY2 + 1, this.upperclip[x] + 1);
        let floorY2 = this.lowerclip[x] - 1;

        if (floorY1 < floorY2) {

          let floorColor = this.colorGenerator.getColor(floorTexture, lightLevel);

          // let fy1 = Math.max(drawWallY2, upperclip[x]);
          // let fy2 = lowerclip[x];

          //this.drawLine(floorColor, x, floorY1, floorY2);
          this.drawFlat(floorY2, floorY1, worldFrontZ2, x, textureWidthFlat, textureHeightFlat, textureImageObjFloor, lightLevel);
        }

        if (this.lowerclip[x] > drawWallY2 + 1) {
          this.lowerclip[x] = floorY1;
        }
      }
      realWallScale1 += realWallScaleStep;
      wallY1 += wallY1Step;
      wallY2 += wallY2Step;
    }
    if (drawUpperWall) {
      // columnsData.forEach(({ x, wallY1, wallY2, textureColumn, textureAlt, inverseScale }) => {
      //   // Highlighting the first row at wallY1
      //   gameEngine.canvas.offScreenCtx.fillStyle = 'blue';
      //   gameEngine.canvas.offScreenCtx.fillRect(x, wallY1, 1, 1);

      //   // Highlighting the last row at wallY2
      //   gameEngine.canvas.offScreenCtx.fillRect(x, wallY2, 1, 1);
      // });

      this.drawSegmentWithTexture(columnsData, textureWidth, textureHeight, textureData, lightLevel);
    }
    if (drawLowerWall) {

      // const debugTextureData = new Uint32Array(textureDataLower.length);
      // debugTextureData.fill(0xff00ff00);


      this.drawSegmentWithTexture(lowerColumns, textureWidthLower, textureHeightLower, textureDataLower, lightLevel);

      // lowerColumns.forEach(({ x, wallY1, wallY2, textureColumn, textureAlt, inverseScale }) => {
      //   // Highlighting the first row at wallY1

      //   gameEngine.canvas.offScreenCtx.fillStyle = 'red';
      //   gameEngine.canvas.offScreenCtx.fillRect(x, wallY1, 1, 1);

      //   // Highlighting the last row at wallY2
      //   gameEngine.canvas.offScreenCtx.fillStyle = 'blue';
      //   gameEngine.canvas.offScreenCtx.fillRect(x, wallY2, 1, 1);
      // });


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
        portalY2 = HALFHEIGHT - worldBackZ2 * realWallScale1;
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
        portalY1 = Math.floor(HALFHEIGHT - worldBackZ1 * realWallScale1);
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
    let scale2;
    let realWallScaleStep = 0;
    if (xScreenV1 < xScreenV2) {
      scale2 = this.geometry.scaleFromGlobalAngle(
        xScreenV2,
        realWallNormalAngle,
        realWallDistance
      );
      realWallScaleStep = (scale2 - realWallScale1) / (xScreenV2 - xScreenV1);
    } else {
      scale2 = realWallScale1
      realWallScaleStep = 0;
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
    // this.canvas.offScreenCtx.strokeStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    this.canvas.offScreenCtx.strokeStyle = "blue";
    this.canvas.offScreenCtx.beginPath();
    this.canvas.offScreenCtx.moveTo(x, y1 - 25);
    this.canvas.offScreenCtx.lineTo(x, y1 - 10);
    this.canvas.offScreenCtx.stroke();
    this.canvas.offScreenCtx.strokeStyle = "white";
    this.canvas.offScreenCtx.moveTo(x, y1 - 1);

    this.canvas.offScreenCtx.lineTo(x, y2);
    this.canvas.offScreenCtx.stroke();
  }


}
