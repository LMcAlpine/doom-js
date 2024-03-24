/** Representing a single Subsector during the traversal of the BSP tree. */
class Subsector {
  /**
   * Creates an instance of this Subsector
   * @param {Object} levelsData  - contains necessary level data.
   * @param {Object} segmentData - contains necessary data for the segments.
   * @param {WallRenderer} wallRenderer - modular component to handle rendering of walls.
   */
  constructor(levelsData, segmentData, wallRenderer) {
    Object.assign(this, {
      subsectors: levelsData.subsectors,
      segs: segmentData.segs,
      vertices: levelsData.vertices,
      wallRenderer: wallRenderer,
    });
  }

  /**
   * Process the current subsector and process all segments in this subsector.
   * @param {number} subsectorID - ID of the current subsector.
   */
  handleSubsector(subsectorID) {
    const subsector = this.subsectors[subsectorID];
    let sector = this.segs[subsector.firstSegNumber].rightSector;

    if (sector.floorHeight < gameEngine.player.height) {
      gameEngine.visplaneRenderer.floorplane = gameEngine.visplaneRenderer.findPlane(sector.floorHeight, sector.floorTexture, "F_SKY1", sector.lightLevel);
    }

    if (sector.ceilingHeight > gameEngine.player.height || sector.ceilingTexture === "F_SKY1") {
      gameEngine.visplaneRenderer.ceilingplane = gameEngine.visplaneRenderer.findPlane(sector.ceilingHeight, sector.ceilingTexture, "F_SKY_1", sector.lightLevel);
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
