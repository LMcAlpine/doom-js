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



  }



  storeWallRange(seg, xScreenV1, xScreenV2) {



    let line = seg.linedef;
    let side = seg.linedef.rightSidedef;


    let realWallNormalAngle = new Angle(seg.angle + RIGHT_ANGLE_DEGREES).angle;
    let offsetAngle = new Angle(realWallNormalAngle - gameEngine.player.realWallAngle1.angle).angle;

    let distangle = new Angle(RIGHT_ANGLE_DEGREES - offsetAngle);
    let hypotenuse = this.geometry.distanceToPoint(seg.startVertex);

    let realWallDistance = hypotenuse * Math.sin(degreesToRadians(distangle.angle));

    let t = screenToXView(xScreenV1, 640);

    let visangle = new Angle(gameEngine.player.direction.angle + radiansToDegrees(t)).angle;


    let realWallScale1 = scaleFromViewAngle(visangle, realWallNormalAngle, realWallDistance, gameEngine.player.direction.angle, 640);

    visangle = new Angle(gameEngine.player.direction.angle + radiansToDegrees(screenToXView(xScreenV2, 640))).angle;

    let rwx = xScreenV1;
    let rwStopX = xScreenV2 + 1;

    let rwScaleStep;
    let scale2;
    if (xScreenV2 > xScreenV1) {

      scale2 = scaleFromViewAngle(visangle, realWallNormalAngle, realWallDistance, gameEngine.player.direction.angle, 640);
      rwScaleStep = (scale2 - realWallScale1) / (xScreenV2 - xScreenV1);


    }
    else {
      scale2 = realWallScale1;
      rwScaleStep = 0;
    }
    let rightSector = seg.rightSector;


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
          console.log(upperTextureIndex);
          console.log(upperWallTexture);
          if (upperTextureIndex !== undefined) {
            topPoint = leftSector.ceilingHeight + this.textures[upperTextureIndex].height - 1.0;
            upperTextureAlt = topPoint - gameEngine.player.height;
          }

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

    ceilingTexture = rightSector.ceilingTexture;
    floorTexture = rightSector.floorTexture;

    this.renderSegLoop(seg, rwx, rwStopX, gameEngine.player.height, seg.linedef.rightSidedef.middleTexture.toUpperCase(), wallY1, wallY1Step, wallY2, wallY2Step, realWallDistance, segTextured, midtexture, middleTextureAlt, lightLevel, rwScaleStep, realWallCenterAngle, realWallOffset, realWallScale1, upperWallTexture, lowerWallTexture, pixhigh, pixhighstep, pixlow, pixlowstep, toptexture, bottomtexture, upperTextureAlt, lowerTextureAlt, ceilingTexture, worldFrontZ1, worldFrontZ2, floorTexture);

  }
  renderSegLoop(seg, xScreenV1, xScreenV2, viewHeight, wallTexture, wallY1, wallY1Step, wallY2, wallY2Step, realWallDistance, segTextured, midtexture, middleTextureAlt, lightLevel, rwScaleStep, realWallCenterAngle, realWallOffset, realWallScale1, upperWallTexture, lowerWallTexture, pixhigh, pixhighstep, pixlow, pixlowstep, toptexture, bottomtexture, upperTextureAlt, lowerTextureAlt, ceilingTexture, worldFrontZ1, worldFrontZ2, floorTexture) {


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

    let ceilingData = [];
    let floorData = [];


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
          // cy2 = Math.floor(cy2);
          // top = Math.floor(top);
          // ceilingData.push({ cy2, top, worldFrontZ1, x, textureWidthFlat, textureHeightFlat, textureImageObj, lightLevel });
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

          // bottom = Math.floor(bottom);
          // top = Math.floor(top);
          //floorData.push({ bottom, top, worldFrontZ2, x, textureWidthFlat, textureHeightFlat, textureImageObjFloor, lightLevel });
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

      }

      if (midtexture) {

        if (yl < yh) {

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

            upperColumns.push({ textureColumn, x, wallY1: yl, wallY2: Math.floor(mid), textureAlt: upperTextureAlt, inverseScale, lightLevel, startX: xScreenV1 })


            this.upperclip[x] = Math.floor(mid);
          }
          else {
            this.upperclip[x] = yl - 1;
          }


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

            lowerColumns.push({ textureColumn, x, wallY1: Math.floor(mid), wallY2: Math.floor(yh) + 1, textureAlt: lowerTextureAlt, inverseScale, lightLevel, startX: xScreenV1 });


            this.lowerclip[x] = Math.floor(mid);
          } else {
            this.lowerclip[x] = yh + 1;
          }
        }
        else if (this.markfloor) {

          this.lowerclip[x] = yh + 1;
        }

      }

      // vertically move down
      wallY1 += wallY1Step;
      wallY2 += wallY2Step;
      realWallScale1 += rwScaleStep;
    }

    // ceilingData.forEach(({ cy2, top, worldFrontZ1, x, textureWidthFlat, textureHeightFlat, textureImageObj, lightLevel }) => {
    //   this.drawFlat(cy2, top, worldFrontZ1, x, textureWidthFlat, textureHeightFlat, textureImageObj, lightLevel);

    // });

    // floorData.forEach(({ bottom, top, worldFrontZ2, x, textureWidthFlat, textureHeightFlat, textureImageObjFloor, lightLevel }) => {
    //   this.drawFlat(bottom, top, worldFrontZ2, x, textureWidthFlat, textureHeightFlat, textureImageObjFloor, lightLevel);
    // })



    if (midtexture) {
      this.drawSegmentWithTexture(columnsData, textureWidth, textureHeight, textureData, lightLevel);
    }

    if (toptexture) {



      this.drawSegmentWithTexture(upperColumns, textureWidthUpper, textureHeightUpper, textureDataUpper, lightLevel);

    }
    if (bottomtexture) {
      this.drawSegmentWithTexture(lowerColumns, textureWidthLower, textureHeightLower, textureDataLower, lightLevel);
    }




  }

}
