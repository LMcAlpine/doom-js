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

    this.upperclip = new Array(CANVASWIDTH);
    this.lowerclip = new Array(CANVASWIDTH);
    this.screenHeightArray = new Array(CANVASWIDTH);
    this.screenHeightArray.fill(CANVASHEIGHT);
    this.negativeOneArray = new Array(CANVASWIDTH);
    this.negativeOneArray.fill(-1);

    this.textures = gameEngine.textures.maptextures;

    this.initClipHeights();

    this.textureManager = textureManager;
    this.flatManager = flatManager;

    this.visplanes = [];
    this.drawSegments = [];
    this.masked = [];
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

  clearDrawSegs() {
    this.drawSegments = [];
  }

  addWall(seg, angleV1, angleV2) {
    const xScreenV1 = angleToX(angleV1.angle);
    const xScreenV2 = angleToX(angleV2.angle);

    if (xScreenV1 === xScreenV2) {
      return;
    }

    const segType = this.determineSegType(seg);

    if (segType === "skip") return;

    if (segType === "solid") this.clipSolidWalls(seg, xScreenV1, xScreenV2 - 1);

    if (segType === "portal")
      this.clipPortalWalls(seg, xScreenV1, xScreenV2 - 1);
  }

  determineSegType(seg) {
    //left sector == backsector
    //right sector == front sector
    if (seg.leftSector === null) {
      return "solid";
    }

    // doors
    if (
      seg.leftSector.ceilingHeight <= seg.rightSector.floorHeight ||
      seg.leftSector.floorHeight >= seg.rightSector.ceilingHeight
    ) {
      return "solid";
    }

    //portal because there are height differences
    if (
      seg.rightSector.ceilingHeight !== seg.leftSector.ceilingHeight ||
      seg.rightSector.floorHeight !== seg.leftSector.floorHeight
    ) {
      return "portal";
    }

    if (
      seg.rightSector.ceilingTexture === seg.leftSector.ceilingTexture &&
      seg.leftSector.floorTexture === seg.rightSector.floorTexture &&
      seg.leftSector.lightLevel === seg.rightSector.lightLevel &&
      seg.linedef.rightSidedef.middleTexture === "-"
    ) {
      return "skip";
    }

    return "portal";
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
    //  let side = seg.linedef.rightSidedef;
    let side = seg.sidedef; // sidedef not rightSidedef. Fixes the flipped textures.

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

    // needs to get reset for each seg else data stays from one seg to another
    drawSeg_O = { x1: 0, x2: 0 };

    drawSeg_O.x1 = xScreenV1;
    drawSeg_O.x2 = xScreenV2;
    // drawSeg_O.currentLine = line;
    // needs to be the seg not the linedef. Segs can be different directions than the linedef.
    // the world map in the editor does not always represent the same direction as a seg.
    // the editor map shows linedefs not segs.
    drawSeg_O.currentLine = seg;

    drawSeg_O.sidedef = side; // store the sidedef

    drawSeg_O.scale1 = realWallScale1;
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
      drawSeg_O.scale2 = scale2;
      drawSeg_O.scaleStep = rwScaleStep;
    } else {
      scale2 = realWallScale1;
      rwScaleStep = 0;
      drawSeg_O.scale2 = scale2;
      drawSeg_O.scaleStep = rwScaleStep;
    }
    let rightSector = seg.rightSector;

    let worldFrontZ1 = rightSector.ceilingHeight - gameEngine.player.height; // world top
    let worldFrontZ2 = rightSector.floorHeight - gameEngine.player.height; // world bottom

    let midTexture = false;
    let topTexture = false;
    let bottomTexture = false;
    let maskedTexture = false;

    drawSeg_O.maskedTextureCol = null;

    let upperWallTexture;
    let lowerWallTexture;

    let middleTextureAlt = 0;
    let upperTextureAlt = 0;
    let lowerTextureAlt = 0;

    let worldBackZ1;
    let worldBackZ2;
    const wallTexture = seg.linedef.rightSidedef.middleTexture.toUpperCase();
    midTexture = wallTexture !== "-";

    if (!seg.leftSector) {
      this.markfloor = true;
      this.markceiling = true;

      // const wallTexture = seg.linedef.rightSidedef.middleTexture.toUpperCase();
      // midTexture = wallTexture !== "-";
      ceilingTexture = rightSector.ceilingTexture;
      floorTexture = rightSector.floorTexture;

      let indexOfName =
        wallTexture !== "-"
          ? this.textureManager.texturePool.get(wallTexture).textureIndex
          : -1;

      let vTop;
      if (line.flag & LOWER_UNPEGGED) {
        vTop =
          rightSector.floorHeight + this.textures[indexOfName].height - 1.0;
        middleTextureAlt = vTop - gameEngine.player.height;
      } else {
        middleTextureAlt = worldFrontZ1;
      }
      middleTextureAlt += side.yOffset;

      drawSeg_O.spriteTopClip = this.screenHeightArray;
      drawSeg_O.spriteBottomClip = this.negativeOneArray;
      drawSeg_O.silhouette = SIL_BOTH;
      drawSeg_O.bsilheight = Number.MAX_SAFE_INTEGER;
      drawSeg_O.tsilheight = Number.MIN_SAFE_INTEGER;
    } else {
      // two sided line
      drawSeg_O.spriteTopClip = null;
      drawSeg_O.spriteBottomClip = null;
      drawSeg_O.silhouette = 0;

      const leftSector = seg.leftSector;

      if (rightSector.floorHeight > leftSector.floorHeight) {
        drawSeg_O.silhouette = SIL_BOTTOM;
        drawSeg_O.bsilheight = rightSector.floorHeight;
      } else if (leftSector.floorHeight > gameEngine.player.height) {
        drawSeg_O.silhouette = SIL_BOTTOM;
        drawSeg_O.bsilheight = Number.MAX_SAFE_INTEGER;
      }

      if (rightSector.ceilingHeight < leftSector.ceilingHeight) {
        drawSeg_O.silhouette |= SIL_TOP;
        drawSeg_O.tsilheight = rightSector.ceilingHeight;
      } else if (leftSector.ceilingHeight < gameEngine.player.height) {
        drawSeg_O.silhouette |= SIL_TOP;
        drawSeg_O.tsilheight = Number.MIN_SAFE_INTEGER;
      }

      if (leftSector.ceilingHeight <= rightSector.floorHeight) {
        drawSeg_O.spriteBottomClip = this.negativeOneArray;
        drawSeg_O.bsilheight = Number.MAX_SAFE_INTEGER;
        drawSeg_O.silhouette |= SIL_BOTTOM;
      }
      if (leftSector.floorHeight >= rightSector.ceilingHeight) {
        drawSeg_O.spriteTopClip = this.screenHeightArray;
        drawSeg_O.tsilheight = Number.MIN_SAFE_INTEGER;
        drawSeg_O.silhouette |= SIL_TOP;
      }

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
      }

      let topPoint;

      if (worldBackZ1 < worldFrontZ1) {
        topTexture = upperWallTexture !== "-";
        if (line.flag & UPPER_UNPEGGED) {
          upperTextureAlt = worldFrontZ1;
        } else {
          // console.log(upperTextureIndex);
          // console.log(upperWallTexture);
          if (upperTextureIndex !== undefined) {
            topPoint =
              leftSector.ceilingHeight +
              this.textures[upperTextureIndex].height -
              1.0;
            upperTextureAlt = topPoint - gameEngine.player.height;
          }
        }
      }

      if (worldBackZ2 > worldFrontZ2) {
        bottomTexture = lowerWallTexture !== "-";
        if (line.flag & LOWER_UNPEGGED) {
          lowerTextureAlt = worldFrontZ1;
        } else {
          lowerTextureAlt = worldBackZ2;
        }
      }

      upperTextureAlt += side.yOffset;
      lowerTextureAlt += side.yOffset;

      if (midTexture) {
        maskedTexture = true;
        // let maskedtexturecol = [];
        drawSeg_O.maskedTextureCol = [];
      }
    }

    // outside the else

    let segTextured = false;
    if (midTexture || upperWallTexture || lowerWallTexture || maskedTexture) {
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

    if (
      rightSector.ceilingHeight < gameEngine.player.height &&
      rightSector.ceilingTexture !== "F_SKY1"
    ) {
      this.markceiling = false;
    }

    if (
      !midTexture &&
      !topTexture &&
      !bottomTexture &&
      !this.markfloor &&
      !this.markceiling &&
      !maskedTexture
    ) {
      return;
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
      if (worldBackZ1 > worldFrontZ2) {
        pixhigh = HALFHEIGHT - worldBackZ1 * realWallScale1;
        pixhighstep = -(worldBackZ1 * rwScaleStep);
      } else {
        pixhigh = wallY2;
        pixhighstep = wallY2Step;
      }

      if (worldBackZ2 < worldFrontZ1) {
        pixlow = HALFHEIGHT - worldBackZ2 * realWallScale1;
        pixlowstep = -(worldBackZ2 * rwScaleStep);
      } else {
        pixlow = wallY1;
        pixlowstep = wallY1Step;
      }
    }

    if (this.markceiling) {
      ceilingPlane = this.checkPlane(ceilingPlane, xScreenV1, xScreenV2);
    }
    if (this.markfloor) {
      floorPlane = this.checkPlane(floorPlane, xScreenV1, xScreenV2);
    }

    ceilingTexture = rightSector.ceilingTexture;
    floorTexture = rightSector.floorTexture;

    let point1 = { xScreenV1: rwx, wallY1, wallY1Step };
    let point2 = { xScreenV2: rwStopX, wallY2, wallY2Step };

    let middleWall = {
      wallTexture: seg.linedef.rightSidedef.middleTexture.toUpperCase(),
      middleTextureAlt,
    };
    let upperWall = { upperWallTexture, upperTextureAlt };
    let lowerWall = { lowerWallTexture, lowerTextureAlt };
    let wallRenderingProperties = {
      realWallDistance: perpendicularDistance,
      realWallCenterAngle,
      realWallOffset,
      realWallScale1,
      rwScaleStep,
    };
    let pixHighProperties = { pixhigh, pixhighstep };
    let pixLowProperties = { pixlow, pixlowstep };
    let drawWallState = {
      midtexture: midTexture,
      toptexture: topTexture,
      bottomtexture: bottomTexture,
      maskedTexture,
    };
    let worldFrontZValues = { worldFrontZ1, worldFrontZ2 };

    this.renderSegLoop(
      point1,
      point2,
      middleWall,
      upperWall,
      lowerWall,
      wallRenderingProperties,
      pixHighProperties,
      pixLowProperties,
      drawWallState,
      worldFrontZValues,
      segTextured,
      lightLevel,
      drawSeg_O
    );
    if (
      (drawSeg_O.silhouette & SIL_TOP || maskedTexture) &&
      drawSeg_O.spriteTopClip === null
    ) {
      // drawSeg_O.spriteTopClip = this.upperclip.slice(rwx, rwStopX + 1);

      drawSeg_O.spriteTopClip = [...this.upperclip];
    }
    if (
      (drawSeg_O.silhouette & SIL_BOTTOM || maskedTexture) &&
      drawSeg_O.spriteBottomClip === null
    ) {
      drawSeg_O.spriteBottomClip = [...this.lowerclip];
    }

    if (maskedTexture && !(drawSeg_O.silhouette & SIL_TOP)) {
      drawSeg_O.silhouette |= SIL_TOP;
      drawSeg_O.tsilheight = Number.MIN_SAFE_INTEGER;
    }
    if (maskedTexture && !(drawSeg_O.silhouette & SIL_BOTTOM)) {
      drawSeg_O.silhouette |= SIL_BOTTOM;
      drawSeg_O.bsilheight = Number.MAX_SAFE_INTEGER;
    }
    drawSeg_O.point1 = point1;
    drawSeg_O.point2 = point2;
    drawSeg_O.seg = seg;
    this.drawSegments.push(Object.assign({}, drawSeg_O));
  }
  renderSegLoop(
    point1,
    point2,
    middleWall,
    upperWall,
    lowerWall,
    wallRenderingProperties,
    pixHighProperties,
    pixLowProperties,
    drawWallState,
    worldFrontZValues,
    segTextured,
    lightLevel,
    drawSeg_O
  ) {
    let { wallTexture, middleTextureAlt } = middleWall;
    let { upperWallTexture, upperTextureAlt } = upperWall;
    let { lowerWallTexture, lowerTextureAlt } = lowerWall;
    let { xScreenV1, wallY1, wallY1Step } = point1;
    let { xScreenV2, wallY2, wallY2Step } = point2;
    let {
      realWallDistance,
      realWallCenterAngle,
      realWallOffset,
      realWallScale1,
      rwScaleStep,
    } = wallRenderingProperties;
    let { pixhigh, pixhighstep } = pixHighProperties;
    let { pixlow, pixlowstep } = pixLowProperties;
    let { worldFrontZ1, worldFrontZ2 } = worldFrontZValues;
    let { midtexture, toptexture, bottomtexture, maskedTexture } =
      drawWallState;

    let {
      textureWidth: textureWidth,
      textureHeight: textureHeight,
      textureData: textureData,
    } = this.textureManager.getTextureInfo(wallTexture);

    // wall segment
    let {
      textureWidth: textureWidthUpper,
      textureHeight: textureHeightUpper,
      textureData: textureDataUpper,
    } = this.textureManager.getTextureInfo(upperWallTexture);
    let {
      textureWidth: textureWidthLower,
      textureHeight: textureHeightLower,
      textureData: textureDataLower,
    } = this.textureManager.getTextureInfo(lowerWallTexture);

    let mid;

    if (maskedTexture) {
      this.masked.push({
        middleTextureAlt,
        wallY1,
        wallY2,
        textureWidth,
        textureHeight,
        textureData,
        xScreenV1,
        xScreenV2,
        lightLevel,
        realWallDistance,
        realWallCenterAngle,
        realWallOffset,
        realWallScale1,
        rwScaleStep,
        segTextured,
        wallY1Step,
        wallY2Step,
      });
    }

    for (let x = xScreenV1; x < xScreenV2; x++) {
      let yl = Math.max(Math.floor(wallY1) + 1, this.upperclip[x] + 1);
      let yh = Math.min(Math.floor(wallY2), this.lowerclip[x] - 1);
      // let yh = Math.min(Math.floor(wallY2), this.lowerclip[x]);

      this.processCeiling(yl, x, worldFrontZ1);
      this.processFloor(yh, x, worldFrontZ2);

      let { textureColumn, inverseScale } = this.calculateTextureParams({
        realWallCenterAngle,
        realWallOffset,
        realWallDistance,
        realWallScale1,
        x,
        segTextured,
      });

      if (!maskedTexture) {
        this.checkAndDrawMiddleWall(midtexture, {
          middleTextureAlt,
          yl,
          yh,
          inverseScale,
          textureColumn,
          textureWidth,
          textureHeight,
          textureData,
          x,
          lightLevel,
        });
      }

      // else {
      //   this.masked.push({
      //     middleTextureAlt,
      //     yl,
      //     yh,
      //     inverseScale,
      //     textureColumn,
      //     textureWidth,
      //     textureHeight,
      //     textureData,
      //     x,
      //     lightLevel,
      //   });
      // }

      if (toptexture) {
        mid = this.calculateMidUpperWall(pixhigh, x);
        pixhigh += pixhighstep;
        this.checkAndDrawUpperWall({
          upperTextureAlt,
          yl,
          mid,
          inverseScale,
          textureColumn,
          textureWidthUpper,
          textureHeightUpper,
          textureDataUpper,
          x,
          lightLevel,
        });
      } else if (this.markceiling) {
        this.upperclip[x] = yl - 1;
      }

      if (bottomtexture) {
        mid = this.calculateMidLowerWall(pixlow, x);
        pixlow += pixlowstep;

        this.checkAndDrawLowerWall({
          lowerTextureAlt,
          mid,
          yh,
          inverseScale,
          textureColumn,
          textureWidthLower,
          textureHeightLower,
          textureDataLower,
          x,
          lightLevel,
        });
      } else if (this.markfloor) {
        this.lowerclip[x] = yh + 1;
      }

      if (maskedTexture) {
        drawSeg_O.maskedTextureCol[x] = textureColumn;
      }

      // vertically move down
      wallY1 += wallY1Step;
      wallY2 += wallY2Step;
      realWallScale1 += rwScaleStep;
    }
  }

  processVisplaneProperties(top, bottom, x, worldFront, plane) {
    if (top <= bottom) {
      plane.top[x] = top;
      plane.bottom[x] = bottom;
      plane.worldFront = worldFront;
    }
  }

  processFloor(yh, x, worldFront) {
    let top;
    let bottom;
    if (this.markfloor) {
      top = Math.max(yh + 1, this.upperclip[x] + 1);
      bottom = this.lowerclip[x] - 1;
      this.processVisplaneProperties(top, bottom, x, worldFront, floorPlane);
    }
  }

  processCeiling(yl, x, worldFront) {
    let top;
    let bottom;
    if (this.markceiling) {
      top = this.upperclip[x] + 1;
      bottom = Math.min(yl, this.lowerclip[x] - 1);
      this.processVisplaneProperties(top, bottom, x, worldFront, ceilingPlane);
    }
  }

  calculateTextureParams(wallInfo) {
    let angle;
    let textureColumn;
    let inverseScale;
    let tanTest;
    let productTest;
    if (wallInfo.segTextured) {
      angle =
        wallInfo.realWallCenterAngle +
        radiansToDegrees(screenToXView(wallInfo.x, CANVASWIDTH));
      tanTest = Math.tan(degreesToRadians(angle));
      productTest = tanTest * wallInfo.realWallDistance;

      textureColumn = Math.floor(
        wallInfo.realWallOffset -
          Math.tan(degreesToRadians(angle)) * wallInfo.realWallDistance
      );

      inverseScale = 1.0 / wallInfo.realWallScale1;
    }

    return { textureColumn, inverseScale };
  }

  calculateMidUpperWall(pixhigh, x) {
    return Math.min(pixhigh, this.lowerclip[x] - 1);
  }

  calculateMidLowerWall(pixlow, x) {
    return Math.max(pixlow + 1, this.upperclip[x] + 1);
  }

  checkAndDrawMiddleWall(midtexture, wallData) {
    if (midtexture) {
      this.drawColumn(
        wallData.middleTextureAlt,
        wallData.yl,
        wallData.yh,
        wallData.inverseScale,
        wallData.textureColumn,
        wallData.textureWidth,
        wallData.textureHeight,
        wallData.textureData,
        wallData.x,
        wallData.lightLevel
      );

      this.upperclip[wallData.x] = CANVASHEIGHT;
      this.lowerclip[wallData.x] = -1;
    }
  }

  checkAndDrawUpperWall(wallData) {
    if (wallData.mid < wallData.yl) {
      this.upperclip[wallData.x] = wallData.yl - 1;
      return;
    }

    this.drawColumn(
      wallData.upperTextureAlt,
      wallData.yl,
      Math.floor(wallData.mid),
      wallData.inverseScale,
      wallData.textureColumn,
      wallData.textureWidthUpper,
      wallData.textureHeightUpper,
      wallData.textureDataUpper,
      wallData.x,
      wallData.lightLevel
    );

    this.upperclip[wallData.x] = Math.floor(wallData.mid);
  }

  checkAndDrawLowerWall(wallData) {
    if (wallData.mid > wallData.yh + 1) {
      this.lowerclip[wallData.x] = wallData.yh + 1;
      return;
    }

    // mid becoming less than 0. Look into this
    this.drawColumn(
      wallData.lowerTextureAlt,
      Math.abs(Math.floor(wallData.mid)),
      Math.floor(wallData.yh) + 1,
      wallData.inverseScale,
      wallData.textureColumn,
      wallData.textureWidthLower,
      wallData.textureHeightLower,
      wallData.textureDataLower,
      wallData.x,
      wallData.lightLevel
    );

    this.lowerclip[wallData.x] = Math.floor(wallData.mid);
  }

  getTexture(textureName) {
    let { textureWidth, textureHeight, textureData } =
      this.textureManager.getTextureInfo(textureName);
    return { textureWidth, textureHeight, textureData };
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
      // const alpha = (pixelValue >> 24) & 0xff;

      // if (alpha === 0) {
      //   dest += CANVASWIDTH;
      //   textureY += inverseScale;
      //   continue;
      // }

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
