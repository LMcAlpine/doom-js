class LevelManager {
  constructor(levels) {
    const subsector = new Subsector(
      levels.subsectors,
      levels.segs,
      levels.vertices
    );
    this.bspTraversal = new BSPTraversal(levels, subsector);

    this.subsector = subsector;

    this.linedefs = levels.linedefs;
    this.vertices = levels.vertices;
    this.nodes = levels.nodes;
    console.log(this.nodes.length);
  }

  draw() {
    this.bspTraversal.traverseBSP(this.nodes.length - 1);
  }
}
