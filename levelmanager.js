class LevelManager {
  constructor(levels, data) {
    const subsector = new Subsector(
      levels.subsectors,
      data.segObjects,
      levels.vertices,
      data.sidedefObjects
    );
    this.bspTraversal = new BSPTraversal(levels, subsector);

    this.subsector = subsector;

    this.segs = data.segObjects;
    this.subsectors = levels.subsectors;
    this.linedefs = levels.linedefs;
    this.vertices = levels.vertices;
    this.nodes = levels.nodes;
    console.log(this.nodes.length);
  }

  draw() {
    console.log(gameEngine.player.direction);
    console.log(this.subsector.solidsegs);
    this.subsector.clearSolidsegs();
    this.subsector.initClipHeights();
    this.bspTraversal.traverseBSP(this.nodes.length - 1);
  }

  getPlayerSubsectorHeight() {
    let subsectorID = this.nodes.length - 1;

    while (!this.bspTraversal.isSubsector(subsectorID)) {
      let isOnLeft = this.bspTraversal.isPointOnLeftSide(
        gameEngine.player.x,
        gameEngine.player.y,
        this.nodes[subsectorID]
      );
      if (isOnLeft) {
        subsectorID = this.nodes[subsectorID].leftChild;
      } else {
        subsectorID = this.nodes[subsectorID].rightChild;
      }
    }
    let subsector =
      this.subsectors[this.bspTraversal.getSubsector(subsectorID)];
    let seg = this.segs[subsector.firstSegNumber];
    return seg.rightSector.floorHeight;
  }
}
