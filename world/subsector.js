/** Representing a single Subsector during the traversal of the BSP tree. */
class Subsector {
  /**
   * Creates an instance of this Subsector
   * @param {Object} levelsData  - contains necessary level data.
   * @param {Object} segmentData - contains necessary data for the segments.
   * @param {WallRenderer} wallRenderer - modular component to handle rendering of walls.
   */
  constructor(levelsData, segmentData, wallRenderer, linkedSubsectors) {
    Object.assign(this, {
      subsectors: levelsData.subsectors,
      segs: segmentData.segs,
      vertices: levelsData.vertices,
      wallRenderer: wallRenderer,
      linkedSubsectors: linkedSubsectors,
    });
  }

  /**
   * Process the current subsector and process all segments in this subsector.
   * @param {number} subsectorID - ID of the current subsector.
   */
  handleSubsector(subsectorID) {
    //const subsector = this.subsectors[subsectorID];
    const subsector = this.linkedSubsectors[subsectorID];

    // check floor visibility
    if (subsector.sector.floorHeight < gameEngine.player.height) {
      floorPlane = this.wallRenderer.findPlane(
        subsector.sector.floorHeight,
        subsector.sector.floorTexture,
        subsector.sector.lightLevel
      );
    } else {
      floorPlane = null;
    }

    if (subsector.sector.ceilingHeight > gameEngine.player.height) {
      ceilingPlane = this.wallRenderer.findPlane(
        subsector.sector.ceilingHeight,
        subsector.sector.ceilingTexture,
        subsector.sector.lightLevel
      );
    }

    this.addSprites(subsector.sector);

    for (let i = 0; i < subsector.segCount; i++) {
      const seg = this.segs[subsector.firstSegNumber + i];

      const segStartVertex = seg.startVertex;
      const segEndVertex = seg.endVertex;
      const result = gameEngine.player.checkIfSegInFOV({
        vertex1: segStartVertex,
        vertex2: segEndVertex,
      });

      if (result.length !== 0) {
        const angleV1 = result[0];
        const angleV2 = result[1];

        this.wallRenderer.addWall(seg, angleV1, angleV2);
      }
    }
  }

  addSprites(sector) {
    // this doesn't seem to actually do anything
    if (sector.validCount === validCount) {
      return;
    }
    sector.validCount = validCount;

    let thing = sector.thingList;

    while (thing !== null) {
      this.projectSprite(thing);
      thing = thing.snext;
    }
  }

  projectSprite(thing) {
    let { tz, gxt, tr_x, gyt, tr_y } = this.computeDepth(thing);

    if (tz < 4) {
      return;
    }

    // scale factor for sprite width. How large it should appear on screen
    let xscale = HALFWIDTH / tz;

    let tx;
    ({ tx, gxt, gyt } = this.computeHorizontalOffset(gxt, tr_x, gyt, tr_y));

    if (!this.checkFOV(tx, tz)) {
      return;
    }

    let { lump, flip } = this.chooseSpriteLump(thing);

    let { x1, x2 } = this.computeScreenEdges(
      tx,
      xscale,
      gameEngine.spriteOffset[lump],
      gameEngine.spriteWidth[lump]
    );

    if (x1 > CANVASWIDTH) {
      return;
    }

    if (x2 < 0) {
      return;
    }

    let { clampedX1, clampedX2 } = this.clampEdges(x1, x2, CANVASWIDTH);
    if (clampedX1 > clampedX2) {
      return;
    }

    const textureMid =
      thing.z + gameEngine.spriteTopOffset[lump] - gameEngine.player.height;

    let vs = this.buildVisSprite(
      thing,
      lump,
      clampedX1,
      clampedX2,
      xscale,
      textureMid,
      flip
    );

    this.adjustStart(vs, x1);
    // vs.patch = lump;

    vissprites.push(vs);
  }

  adjustStart(vs, x1) {
    if (vs.x1 > x1) {
      vs.start += vs.xiscale * (vs.x1 - x1);
    }
  }

  buildVisSprite(thing, lump, x1, x2, xscale, textureMid, flip) {
    let vs = {
      mapObjectFlags: thing.flags,
      gx: thing.x,
      gy: thing.y,
      gz: thing.z,
      gzt: thing.z + gameEngine.spriteTopOffset[lump],
      x1,
      x2,
      scale: xscale,
      texture: lump,
      textureMid,
      flip,
    };
    // console.log(thing.z);
    // console.log(gameEngine.spriteTopOffset[lump]);
    if (gameEngine.spriteTopOffset[lump] === undefined) {
      console.log(thing.z);
    }

    if (flip) {
      vs.start = gameEngine.spriteWidth[lump] - 1;
      vs.xiscale = -(1 / xscale);
    } else {
      vs.start = 0;
      vs.xiscale = 1 / xscale;
    }
    return vs;
  }

  chooseSpriteLump(thing) {
    let spriteDef = theSprites.get(thing.sprite);
    // ... 32768... the fullbright frames. Just set to 0 for now...
    // 28 is the max frames
    if (thing.frame > 28) {
      thing.frame = 0;
    }
    let spriteFrame = spriteDef.spriteFrames[thing.frame];

    if (!spriteFrame.rotate) {
      // no rotation
      return { lump: spriteFrame.lump[0], flip: spriteFrame.flip[0] };
    }

    // there is a rotation
    const angleToThing = gameEngine.player.angleTowardsVertex(thing);
    const tempAngle = angleToThing.subtract(thing.angle);
    const rotation = Math.floor((tempAngle.add(45 / 2).angle / 45) % 8);
    // drawDebugText(5, 5, `Angle: ${tempAngle.angle.toFixed(2)} rot: ${rotation}`, [255,255,0]);

    return {
      lump: spriteFrame.lump[rotation],
      flip: spriteFrame.flip[rotation],
    };
  }

  clampEdges(x1, x2, screenWidth) {
    let clampedX1 = x1;
    let clampedX2 = x2;

    if (clampedX1 < 0) {
      clampedX1 = 0;
    }

    if (clampedX2 >= screenWidth) {
      clampedX2 = screenWidth - 1;
    }
    return { clampedX1, clampedX2 };
  }

  computeScreenEdges(tx, xscale, spriteOffset, spriteWidth) {
    // shift tx by spriteOffset
    let newTx = tx - spriteOffset;

    let x1 = Math.floor(HALFWIDTH + newTx * xscale);

    newTx += spriteWidth;

    let x2 = Math.floor(HALFWIDTH + newTx * xscale - 1);

    return { x1, x2 };
  }

  checkFOV(tx, tz) {
    // If the sprite is too far off to the side
    if (Math.abs(tx) > Math.abs(tz * 4)) {
      // outside FOV
      return false;
    }
    return true;
  }

  computeHorizontalOffset(gxt, tr_x, gyt, tr_y) {
    const angleRad = degreesToRadians(gameEngine.player.direction.angle);
    gxt = -(tr_x * Math.sin(angleRad));
    gyt = tr_y * Math.cos(angleRad);

    let tx = -(gyt + gxt);
    return { tx, gxt, gyt };
  }

  computeDepth(thing) {
    // Relative position
    const tr_x = thing.x - gameEngine.player.x;
    const tr_y = thing.y - gameEngine.player.y;

    const angleRad = degreesToRadians(gameEngine.player.direction.angle);

    const gxt = tr_x * Math.cos(angleRad);
    const gyt = -(tr_y * Math.sin(angleRad));

    // depth in screen space. How far the object is from the camera
    // In other words, how far the sprite is from the player
    let tz = gxt - gyt;
    return { tz, gxt, tr_x, gyt, tr_y };
  }
}
