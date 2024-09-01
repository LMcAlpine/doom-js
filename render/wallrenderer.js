const RIGHT_ANGLE_DEGREES = 90;
const FULL_ALPHA = 255;

const UPPER_UNPEGGED = 8;
const LOWER_UNPEGGED = 16;

let drawSeg_O = { x1: 0, x2: 0 };
let ceilingTexture = "-";
let floorTexture = "-";

class WallRenderer {
  constructor(colorGenerator, dependencies, textureManager, flatManager) {
    this.colorGenerator = colorGenerator;
    this.dependencies = dependencies;

    this.geometry = dependencies.geometry;

    this.solidsegs = dependencies.solidSegsManager.initializeSolidsegs();

    this.canvas = gameEngine.canvas;
    // this.canvas = gameEngine.offscreenCanvas;

    this.upperclip = new Array(CANVASWIDTH);
    this.lowerclip = new Array(CANVASWIDTH);

    this.textures = gameEngine.textures.maptextures;

    this.initClipHeights();

    this.textureManager = textureManager;
    this.flatManager = flatManager;

    // this.visplanes = new Map();
    // this.visplanesArray = [];

    this.visplanes = [];
  }

  /**
   * initialize the clip arrays
   */
  initClipHeights() {
    this.upperclip.fill(-1);
    this.lowerclip.fill(CANVASHEIGHT);
  }

  clearVisplanes() {
    this.visplanes = [];
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
      this.clipSolidWalls(seg, xScreenV1, xScreenV2 - 1);
      return;
    }

    // // doors
    if (
      seg.leftSector.ceilingHeight <= seg.rightSector.floorHeight ||
      seg.leftSector.floorHeight >= seg.rightSector.ceilingHeight
    ) {
      this.clipSolidWalls(seg, xScreenV1, xScreenV2 - 1);
      return;
    }

    // // portal because there are height differences
    if (
      seg.rightSector.ceilingHeight !== seg.leftSector.ceilingHeight ||
      seg.rightSector.floorHeight !== seg.leftSector.floorHeight
    ) {
      this.clipPortalWalls(seg, xScreenV1, xScreenV2 - 1);
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

    this.clipPortalWalls(seg, xScreenV1, xScreenV2 - 1);
  }

  clipPortalWalls(seg, xScreenV1, xScreenV2) {
    let totalSolidSegs = this.getInitialSolidSegs(xScreenV1);

    if (xScreenV1 < this.solidsegs[totalSolidSegs].first) {
      if (xScreenV2 < this.solidsegs[totalSolidSegs].first - 1) {
        // draw wall
        this.storeWallRange(seg, xScreenV1, xScreenV2);

        return;
      }

      //draw some other wall
      this.storeWallRange(
        seg,
        xScreenV1,
        this.solidsegs[totalSolidSegs].first - 1
      );
    }

    if (xScreenV2 <= this.solidsegs[totalSolidSegs].last) {
      return;
    }

    let next = totalSolidSegs;
    while (xScreenV2 >= this.solidsegs[next + 1].first - 1) {
      // draw wall
      this.storeWallRange(
        seg,
        this.solidsegs[next].last + 1,
        this.solidsegs[next + 1].first - 1
      );
      next++;

      if (xScreenV2 <= this.solidsegs[next].last) {
        return;
      }
    }
    this.storeWallRange(seg, this.solidsegs[next].last + 1, xScreenV2);
  }

  clipSolidWalls(seg, xScreenV1, xScreenV2) {
    let totalSolidSegs = this.getInitialSolidSegs(xScreenV1);

    if (xScreenV1 < this.solidsegs[totalSolidSegs].first) {
      if (xScreenV2 < this.solidsegs[totalSolidSegs].first - 1) {
        // draw wall
        this.storeWallRange(seg, xScreenV1, xScreenV2);
        this.solidsegs.splice(totalSolidSegs, 0, {
          first: xScreenV1,
          last: xScreenV2,
        });
        return;
      }

      //draw some other wall
      this.storeWallRange(
        seg,
        xScreenV1,
        this.solidsegs[totalSolidSegs].first - 1
      );
      this.solidsegs[totalSolidSegs].first = xScreenV1;
    }

    if (xScreenV2 <= this.solidsegs[totalSolidSegs].last) {
      return;
    }
    let next = totalSolidSegs;
    while (xScreenV2 >= this.solidsegs[next + 1].first - 1) {
      this.storeWallRange(
        seg,
        this.solidsegs[next].last + 1,
        this.solidsegs[next + 1].first - 1
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
    this.storeWallRange(seg, this.solidsegs[next].last + 1, xScreenV2);
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

  storeWallRange(seg, xScreenV1, xScreenV2) {
    let line = seg.linedef;
    let side = seg.linedef.rightSidedef;

    // Taking the angle of the seg in the worldspace and adding 90 degrees to it
    // this results in a perpendicular line (the normal)
    let perpendicularWallAngle = new Angle(seg.angle + RIGHT_ANGLE_DEGREES)
      .angle;
    // The difference between the angle of the perpendicular line and the angle from the player to the first vertex of the seg
    // how much rotation needs to occur to go from the angle to v1 to the angle of the perpendicular line
    // inner angle of the right triangle (and in my opinion is the angle at the bottom right of the triangle)
    let angleToPerpendicular = new Angle(
      perpendicularWallAngle - gameEngine.player.realWallAngle1.angle
    ).angle;
    // the missing angle in the right triangle (in my opinion the top left of the right triangle)
    // The reason I think this angle is the top left is because of the sin calculation.
    let complementaryAngle = new Angle(
      RIGHT_ANGLE_DEGREES - angleToPerpendicular
    );
    // the distance from the player to v1
    let distanceToVertex = this.geometry.distanceToPoint(seg.startVertex);

    // the opposite side of complementaryAngle
    // sin(theta) = opp/hyp
    // sin(theta) * hyp = opp
    // this is the length of the perpendicular (normal) line from the seg (or infinite extended line) to the player
    // If complementaryAngle was at the bottom right of the triangle then the perpendicularDistance would be its adjacent.
    // That is why I think this angle is at the top left of the triangle because the opposite side of the angle is the perpendicularDistance
    // we are trying to find.
    let perpendicularDistance =
      distanceToVertex * Math.sin(degreesToRadians(complementaryAngle.angle));

    // let t = screenToXView(xScreenV1, 640);

    let visangle = new Angle(
      gameEngine.player.direction.angle +
      radiansToDegrees(screenToXView(xScreenV1, canvasWidth))
    ).angle;

    let realWallScale1 = scaleFromViewAngle(
      visangle,
      perpendicularWallAngle,
      perpendicularDistance,
      gameEngine.player.direction.angle,
      canvasWidth
    );

    visangle = new Angle(
      gameEngine.player.direction.angle +
      radiansToDegrees(screenToXView(xScreenV2, canvasWidth))
    ).angle;

    drawSeg_O.x1 = xScreenV1;
    drawSeg_O.x2 = xScreenV2;
    drawSeg_O.currentLine = line;
    let rwx = xScreenV1;
    let rwStopX = xScreenV2 + 1;

    let rwScaleStep;
    let scale2;
    if (xScreenV2 > xScreenV1) {
      scale2 = scaleFromViewAngle(
        visangle,
        perpendicularWallAngle,
        perpendicularDistance,
        gameEngine.player.direction.angle,
        canvasWidth
      );
      rwScaleStep = (scale2 - realWallScale1) / (xScreenV2 - xScreenV1);
    } else {
      scale2 = realWallScale1;
      rwScaleStep = 0;
    }
    let rightSector = seg.rightSector;

    let worldFrontZ1 = rightSector.ceilingHeight - gameEngine.player.height; // world top
    let worldFrontZ2 = rightSector.floorHeight - gameEngine.player.height; // world bottom

    let midTexture = false;
    let topTexture = false;
    let bottomTexture = false;

    let upperWallTexture;
    let lowerWallTexture;

    let middleTextureAlt = 0;
    let upperTextureAlt = 0;
    let lowerTextureAlt = 0;

    let worldBackZ1;
    let worldBackZ2;

    if (!seg.leftSector) {
      this.markfloor = true;
      this.markceiling = true;

      const wallTexture = seg.linedef.rightSidedef.middleTexture.toUpperCase();
      midTexture = wallTexture !== "-";
      ceilingTexture = rightSector.ceilingTexture;
      floorTexture = rightSector.floorTexture;
      const lightLevel = rightSector.lightLevel;

      let indexOfName =
        this.textureManager.texturePool.get(wallTexture).textureIndex;

      let vTop;
      // let middleTextureAlt;
      if (line.flag & LOWER_UNPEGGED) {
        vTop =
          rightSector.floorHeight + this.textures[indexOfName].height - 1.0;
        middleTextureAlt = vTop - gameEngine.player.height;
      } else {
        middleTextureAlt = worldFrontZ1;
      }
      middleTextureAlt += side.yOffset;
    } else {
      // two sided line

      const leftSector = seg.leftSector;

      // worldhigh
      worldBackZ1 = leftSector.ceilingHeight - gameEngine.player.height;

      //world low
      worldBackZ2 = leftSector.floorHeight - gameEngine.player.height;

      // look into fixing this
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

      if (
        leftSector.ceilingHeight <= rightSector.floorHeight ||
        leftSector.floorHeight >= rightSector.ceilingHeight
      ) {
        this.markceiling = true;
        this.markfloor = true;
      }

      upperWallTexture = side.upperTextureName.toUpperCase();
      lowerWallTexture = side.lowerTextureName.toUpperCase();

      let upperTextureIndex;
      if (upperWallTexture !== "-") {
        upperTextureIndex =
          this.textureManager.texturePool.get(upperWallTexture).textureIndex;
        // toptexture = true;
      }
      if (lowerWallTexture !== "-") {
        //  bottomtexture = true;
      }

      let topPoint;
      // let upperTextureAlt;

      // check this !!!
      if (worldBackZ1 < worldFrontZ1) {
        topTexture = upperWallTexture !== "-";
        if (line.flag & UPPER_UNPEGGED) {
          upperTextureAlt = worldFrontZ1;
        } else {
          console.log(upperTextureIndex);
          console.log(upperWallTexture);
          if (upperTextureIndex !== undefined) {
            topPoint =
              leftSector.ceilingHeight +
              this.textures[upperTextureIndex].height -
              1.0;
            upperTextureAlt = topPoint - gameEngine.player.height;
          }
        }
        // upperTextureAlt += side.yOffset;
      }

      // let lowerTextureAlt;
      if (worldBackZ2 > worldFrontZ2) {
        bottomTexture = lowerWallTexture !== "-";
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

    // outside the else

    let segTextured = false;
    if (midTexture || upperWallTexture || lowerWallTexture) {
      segTextured = true;
    }
    let realWallCenterAngle;
    let realWallOffset;

    if (segTextured) {
      angleToPerpendicular = new Angle(
        perpendicularWallAngle - gameEngine.player.realWallAngle1.angle
      ).angle;

      realWallOffset =
        distanceToVertex * Math.sin(degreesToRadians(angleToPerpendicular));
      // this line below fixed the door being misaligned in e1m2? but I did make a lot of changes besides this
      realWallOffset = -realWallOffset;
      realWallOffset += seg.offset + side.xOffset;
      realWallCenterAngle = new Angle(
        gameEngine.player.direction.angle - perpendicularWallAngle
      ).angle;
    }

    // need to calculate light table

    if (rightSector.floorHeight > gameEngine.player.height) {
      this.markfloor = false;
    }

    // need to fix the sky check
    if (
      rightSector.ceilingHeight < gameEngine.player.height &&
      rightSector.ceilingTexture !== "F_SKY1"
    ) {
      this.markceiling = false;
    }

    // stepping values for texture edges
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
        pixhigh = HALFHEIGHT - worldBackZ1 * realWallScale1;
        pixhighstep = -(worldBackZ1 * rwScaleStep);
      } else {
        pixhigh = wallY2;
        pixhighstep = wallY2Step;
      }
      // }
      //  if (this.drawLowerWall) {
      if (worldBackZ2 < worldFrontZ1) {
        pixlow = HALFHEIGHT - worldBackZ2 * realWallScale1;
        pixlowstep = -(worldBackZ2 * rwScaleStep);
      } else {
        pixlow = wallY1;
        pixlowstep = wallY1Step;
      }
      //  }
    }

    // render planes here?
    if (this.markceiling) {
      ceilingPlane = this.checkPlane(ceilingPlane, xScreenV1, xScreenV2);
    }
    if (this.markfloor) {
      floorPlane = this.checkPlane(floorPlane, xScreenV1, xScreenV2);
    }

    ceilingTexture = rightSector.ceilingTexture;
    floorTexture = rightSector.floorTexture;

    this.renderSegLoop(
      rwx,
      rwStopX,
      seg.linedef.rightSidedef.middleTexture.toUpperCase(),
      wallY1,
      wallY1Step,
      wallY2,
      wallY2Step,
      perpendicularDistance,
      segTextured,
      midTexture,
      middleTextureAlt,
      lightLevel,
      rwScaleStep,
      realWallCenterAngle,
      realWallOffset,
      realWallScale1,
      upperWallTexture,
      lowerWallTexture,
      pixhigh,
      pixhighstep,
      pixlow,
      pixlowstep,
      topTexture,
      bottomTexture,
      upperTextureAlt,
      lowerTextureAlt,
      worldFrontZ1,
      worldFrontZ2
    );
  }
  renderSegLoop(
    xScreenV1,
    xScreenV2,
    wallTexture,
    wallY1,
    wallY1Step,
    wallY2,
    wallY2Step,
    realWallDistance,
    segTextured,
    midtexture,
    middleTextureAlt,
    lightLevel,
    rwScaleStep,
    realWallCenterAngle,
    realWallOffset,
    realWallScale1,
    upperWallTexture,
    lowerWallTexture,
    pixhigh,
    pixhighstep,
    pixlow,
    pixlowstep,
    toptexture,
    bottomtexture,
    upperTextureAlt,
    lowerTextureAlt,
    worldFrontZ1,
    worldFrontZ2
  ) {

    let {
      textureWidth: textureWidth,
      textureHeight: textureHeight,
      textureData: textureData,
    } = this.textureManager.getTextureInfo(wallTexture);



    // wall segment
    // high level of abstraction
    let {
      textureWidth: textureWidthUpper,
      textureHeight: textureHeightUpper,
      textureData: textureDataUpper,
    } = this.textureManager.getTextureInfo(upperWallTexture);
    // high level of abstraction
    let {
      textureWidth: textureWidthLower,
      textureHeight: textureHeightLower,
      textureData: textureDataLower,
    } = this.textureManager.getTextureInfo(lowerWallTexture);

    // my goal with renderSegLoop is to render a segment
    // but it is doing multiple things
    // it is checking if textures exist, 
    // it is grabbing texture data
    // it is calculating wall coordinates,
    // it is setting boundaries
    // it is calculating angles, textureColumn, and scale
    // it is making calls to drawColumn
    // it has nested if and else statements
    // it is incrementing coordinates and scale

    // rendering a seg is directly drawing a column, not setting data or setting boundaries, not iterating over the screen coordinates

    // TO render a seg, we check to see what type of seg this is, and if so we draw the seg
    // but if im checking the type of seg, im not really doing the actual rendering?
    // seems like you could just make the call to drawColumn. Not sure



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

        if (top <= bottom) {
          // ceilingplane

          ceilingPlane.top[x] = top;
          ceilingPlane.bottom[x] = bottom;
          ceilingPlane.worldFront = worldFrontZ1;
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
          // set floorplane here

          floorPlane.top[x] = top;
          floorPlane.bottom[x] = bottom + 1;
          floorPlane.worldFront = worldFrontZ2;
        }
      }

      let angle;
      let textureColumn;
      let inverseScale;
      if (segTextured) {
        angle =
          realWallCenterAngle + radiansToDegrees(screenToXView(x, CANVASWIDTH));
        textureColumn =
          realWallOffset - Math.tan(degreesToRadians(angle)) * realWallDistance;
        inverseScale = 1.0 / realWallScale1;

        // dc
        // colormap
        // x
        // iscale
      }

      if (midtexture) {
        // if (yl < yh) {
        let wallY1 = yl;
        let wallY2 = yh;

        this.drawColumn(
          middleTextureAlt,
          wallY1,
          wallY2,
          inverseScale,
          textureColumn,
          textureWidth,
          textureHeight,
          textureData,
          x,
          lightLevel
        );

        // this.upperclip[x] = CANVASHEIGHT;
        // this.lowerclip[x] = -1;

        //  }
      } else {
        if (toptexture) {
          mid = pixhigh;
          pixhigh += pixhighstep;

          if (mid >= this.lowerclip[x]) {
            mid = this.lowerclip[x] - 1;
          }

          if (mid > yl) {
            this.drawColumn(
              upperTextureAlt,
              yl,
              Math.floor(mid),
              inverseScale,
              textureColumn,
              textureWidthUpper,
              textureHeightUpper,
              textureDataUpper,
              x,
              lightLevel
            );

            this.upperclip[x] = Math.floor(mid);
          } else {
            this.upperclip[x] = yl - 1;
          }
        } else if (this.markceiling) {
          this.upperclip[x] = yl - 1;
        }

        if (bottomtexture) {
          mid = pixlow + 1;
          pixlow += pixlowstep;

          if (mid <= this.upperclip[x]) {
            mid = this.upperclip[x] + 1;
          }

          if (mid <= yh + 1) {
            // mid becoming less than 0. Look into this
            this.drawColumn(
              lowerTextureAlt,
              Math.abs(Math.floor(mid)),
              Math.floor(yh) + 1,
              inverseScale,
              textureColumn,
              textureWidthLower,
              textureHeightLower,
              textureDataLower,
              x,
              lightLevel
            );

            this.lowerclip[x] = Math.floor(mid);
          } else {
            this.lowerclip[x] = yh + 1;
          }
        } else if (this.markfloor) {
          this.lowerclip[x] = yh + 1;
        }
      }

      // vertically move down
      wallY1 += wallY1Step;
      wallY2 += wallY2Step;
      realWallScale1 += rwScaleStep;
    }
  }

  findPlane(height, textureName, lightLevel) {
    if (textureName === "F_SKY1") {
      height = 0;
      lightLevel = 0;
    }

    // Search for an existing visplane with matching properties
    for (let plane of this.visplanes) {
      if (
        plane.height === height &&
        plane.textureName === textureName &&
        plane.lightLevel === lightLevel
      ) {
        return plane; // Return the existing visplane
      }
    }

    // Generate a consistent color for this visplane based on its properties
    const color = generateColorForVisplane(height, textureName, lightLevel);

    // If no existing visplane is found, create a new one
    const newPlane = {
      height: height,
      textureName: textureName,
      lightLevel: lightLevel,
      minX: CANVASWIDTH,
      maxX: -1,
      top: new Array(CANVASWIDTH).fill(Number.MAX_VALUE),
      bottom: new Array(CANVASWIDTH).fill(0),
      color: color, // Assign the consistent color to the visplane
    };

    // Add the new visplane to the array
    this.visplanes.push(newPlane);

    return newPlane;
  }

  checkPlane(plane, x1, x2) {
    let intersectLow;
    let intersectHigh;
    let unionLow;
    let unionHigh;
    let i;

    if (x1 < plane.minX) {
      intersectLow = plane.minX;
      unionLow = x1;
    } else {
      unionLow = plane.minX;
      intersectLow = x1;
    }

    if (x2 > plane.maxX) {
      intersectHigh = plane.maxX;
      unionHigh = x2;
    } else {
      unionHigh = plane.maxX;
      intersectHigh = x2;
    }

    for (i = intersectLow; i <= intersectHigh; i++) {
      if (plane.top[i] !== 0xff) {
        break;
      }
    }

    if (i > intersectHigh) {
      plane.minX = unionLow;
      plane.maxX = unionHigh;
      return plane; // Return the updated plane
    }

    // Generate a consistent color for this visplane based on its properties
    const color = plane.color;

    // Create a new visplane if needed
    const newPlane = {
      height: plane.height,
      textureName: plane.textureName,
      lightLevel: plane.lightLevel,
      minX: x1,
      maxX: x2,
      top: new Array(CANVASWIDTH).fill(Number.MAX_VALUE),
      bottom: new Array(CANVASWIDTH).fill(0),
      color: color,
    };

    // Add the new visplane to the array
    this.visplanes.push(newPlane);

    return newPlane;
  }

  drawColumn(
    textureAlt,
    wallY1,
    wallY2,
    inverseScale,
    textureColumn,
    textureWidth,
    textureHeight,
    textureData,
    x,
    lightLevel
  ) {
    textureColumn = Math.floor(textureColumn) & (textureWidth - 1);
    const screenBuffer = this.canvas.screenBuffer;

    let dest = this.canvas.ylookup[wallY1] + x;
    let textureY = textureAlt + (wallY1 - HALFHEIGHT) * inverseScale;

    for (let y = wallY1; y <= wallY2; y++) {
      let texY = isPowerOfTwo(textureHeight)
        ? Math.floor(textureY) & (textureHeight - 1)
        : Math.floor(textureY) % textureHeight;

      const texPos = texY * textureWidth + textureColumn;
      let pixelValue = textureData[texPos];

      // Apply light level
      const alpha = pixelValue >> 24;
      const blue = adjustColorComponent((pixelValue >> 16) & 0xff, lightLevel);
      const green = adjustColorComponent((pixelValue >> 8) & 0xff, lightLevel);
      const red = adjustColorComponent(pixelValue & 0xff, lightLevel);

      screenBuffer[dest] = (alpha << 24) | (blue << 16) | (green << 8) | red;

      dest += CANVASWIDTH;
      textureY += inverseScale;
    }
  }
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return hash;
}

function generateColorForVisplane(height, textureName, lightLevel) {
  const key = `${height}_${textureName}_${lightLevel}`;
  const hash = hashCode(key);

  // Use the hash to generate a consistent color
  const color = ((hash & 0xffffff) << 8) | 0xff; // Use only the lower 24 bits and ensure full opacity
  return color;
}
