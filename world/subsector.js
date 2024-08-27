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
      linkedSubsectors: linkedSubsectors
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
      floorPlane = this.wallRenderer.findPlane(subsector.sector.floorHeight, subsector.sector.floorTexture, subsector.sector.lightLevel);
    } else {
      floorPlane = null;
    }

    // if (subsector.sector.ceilingHeight > gameEngine.player.height) {
    //   ceilingPlane = this.wallRenderer.findPlane(subsector.sector.ceilingHeight, subsector.sector.ceilingTexture, subsector.sector.lightLevel);
    // }



    // check ceiling visibility

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
