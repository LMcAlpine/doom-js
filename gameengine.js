class GameEngine {
  constructor(canvasId, tickLength, levels) {
    this.renderer = new Renderer(canvasId, 50, levels);
    this.logic = new GameLogic(tickLength);

    this.linedefs = levels.linedefs;
    this.vertices = levels.vertices;
    this.nodes = levels.nodes;
    console.log(this.nodes.length);
  }

  loop(tFrame) {
    // core loop
    this.stopMain = window.requestAnimationFrame(this.loop.bind(this));
    let numTicks = this.logic.calculateTicks(tFrame);
    this.logic.queueUpdates(numTicks);

    this.renderer.drawLinedefs(this.linedefs, this.vertices);
    this.renderer.renderBSPNode(this.nodes.length - 1);
    this.logic.lastRender = tFrame;
    //  console.log("looping");
  }

  start() {
    this.loop(performance.now());
  }
}
