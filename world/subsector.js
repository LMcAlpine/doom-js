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

    // add sprites

    let thing = subsector.sector.thingList;

    while (thing !== undefined) {
      let tr_x = thing.x - gameEngine.player.x;
      let tr_y = thing.y - gameEngine.player.y;

      let gxt =
        tr_x * Math.cos(degreesToRadians(gameEngine.player.direction.angle));
      let gyt = -(
        tr_y * Math.sin(degreesToRadians(gameEngine.player.direction.angle))
      );

      let tz = gxt - gyt;

      if (tz < 4) {
        break;
      }

      let xscale = HALFWIDTH / tz;

      gxt = -(
        tr_x * Math.sin(degreesToRadians(gameEngine.player.direction.angle))
      );
      gyt =
        tr_y * Math.cos(degreesToRadians(gameEngine.player.direction.angle));

      let tx = -(gyt + gxt);

      if (Math.abs(tx) > Math.abs(tz)) {
        break;
      }

      let spriteDef = theSprites[thing.sprite];

      let spriteFrame = spriteDef.spriteFrames[thing.frame];

      let angle;
      let lump;
      let rotation;
      let flip;
      if (spriteFrame.rotate) {
        angle = gameEngine.player.angleTowardsVertex(thing);
        let tempAngle = angle.subtract(thing.angle);
        rotation = Math.floor(((tempAngle.add(45 / 2).angle * 9) / 45) % 8);
        lump = spriteFrame.lump[rotation];
        flip = spriteFrame.flip[rotation];

        //lump = spriteFrame.lump[rotation];
      }

      tx -= gameEngine.spriteOffset[lump];

      let x1 = Math.floor(HALFWIDTH + tx * xscale);

      if (x1 > CANVASWIDTH) {
        break;
      }
      tx += gameEngine.spriteWidth[lump];

      let x2 = Math.floor(HALFWIDTH + tx * xscale - 1);

      if (x2 < 0) {
        break;
      }

      // continue back here

      thing = thing.snext;
    }

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
}
