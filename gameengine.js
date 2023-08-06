class GameEngine {
  constructor(canvasId, tickLength, levels) {
    this.canvas = new Canvas(canvasId);
    this.subsector = new Subsector();
    this.bspTraversal = new BSPTraversal(levels);

    this.logic = new GameLogic(tickLength);

    this.linedefs = levels.linedefs;
    this.vertices = levels.vertices;
    this.nodes = levels.nodes;
    console.log(this.nodes.length);
  }

  loop(tFrame) {
    this.canvas.clearCanvas();
    this.canvas.drawLinedefs(this.linedefs, this.vertices);
    this.bspTraversal.renderBSPNode(this.nodes.length - 1);
    this.canvas.updateCanvas();

    this.stopMain = requestAnimationFrame(this.loop.bind(this));
  }

  start() {
    this.loop(performance.now());
  }
}
