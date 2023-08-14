class LevelManager {
  constructor(levels, data) {
    const colorGenerator = new ColorGenerator(data.sidedefObjects);

    const wallRendererDependencies = {
      solidSegsManager: new SolidSegsManager(),
      geometry: new Geometry(),
    };

    this.wallRenderer = new WallRenderer(
      colorGenerator,
      wallRendererDependencies
    );

    this.solidSegsManager = wallRendererDependencies.solidSegsManager;

    const levelsData = {
      subsectors: levels.subsectors,
      vertices: levels.vertices,
    };

    const segmentData = {
      segs: data.segObjects,
      sidedefs: data.sidedefObjects,
    };

    const subsector = new Subsector(levelsData, segmentData, this.wallRenderer);
    this.bspTraversal = new BSPTraversal(levels, subsector);

    this.subsector = subsector;

    this.segs = data.segObjects;
    this.subsectors = levels.subsectors;
    this.linedefs = levels.linedefs;
    this.vertices = levels.vertices;
    this.nodes = levels.nodes;

  }

  draw() {
    this.wallRenderer.solidsegs = this.solidSegsManager.clearSolidsegs(
      this.wallRenderer.solidsegs
    );
    //this.subsector.initClipHeights();
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