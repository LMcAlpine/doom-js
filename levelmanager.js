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
}
