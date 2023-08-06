class GameEngine {
  constructor(canvasId, tickLength, levels) {
    this.renderer = new Renderer(canvasId, 50, levels);
    this.logic = new GameLogic(tickLength);

    this.linedefs = levels.linedefs;
    this.vertices = levels.vertices;
    this.nodes = levels.nodes;
    console.log(this.nodes.length);

    this.x = 0;
    this.y = 0;
  }

  // loop(tFrame) {
  //   // core loop
  //   // this is clearing
  //   this.renderer.clearCanvas();

  //   let numTicks = this.logic.calculateTicks(tFrame);
  //   this.logic.queueUpdates(numTicks);

  //   this.renderer.drawLinedefs(this.linedefs, this.vertices);

  //   //this.renderer.renderBSPNode(this.nodes.length - 1);

  //   // Log the data in backCanvasBuffer
  //   console.log("back canvas buffer before swap:");
  //   console.log(this.renderer.backCanvasBuffer.data);
  //   console.log("canvas buffer before swap:");
  //   console.log(this.renderer.canvasBuffer.data);
  //   this.renderer.swapBuffers();

  //   console.log("back canvas buffer after swap:");
  //   console.log(this.renderer.backCanvasBuffer.data);
  //   // Log the data in canvasBuffer
  //   console.log("canvas buffer after swap:");
  //   console.log(this.renderer.canvasBuffer.data);
  //   this.renderer.updateCanvas();
  //   this.renderer.x += 20;
  //   this.renderer.y += 20;

  //   this.logic.lastRender = tFrame;

  //   this.stopMain = requestAnimationFrame(this.loop.bind(this));
  // }

  loop(tFrame) {
    // Clear only the bounding boxes
    this.renderer.clearBoundingBoxes();
    this.renderer.clearCanvas();
    //  this.renderer.updateCanvas();
    // let numTicks = this.logic.calculateTicks(tFrame);
    // this.logic.queueUpdates(numTicks);
    // this.renderer.drawLine(
    //   { x: this.x, y: this.y },
    //   { x: 300, y: 105 },
    //   [0, 255, 255]
    // );

    // this.renderer.drawBox(
    //   this.x,
    //   this.y,
    //   this.x * 2,
    //   this.y * 2,
    //   [0, 255, 255]
    // );

    // this.renderer.updateCanvas();
    this.renderer.drawLinedefs(this.linedefs, this.vertices);

    // well i have verified items are now being cleared on the screen, now how do I animate the bounding box search for the players?
    this.renderer.renderBSPNode(this.nodes.length - 1);
    // //  this.renderer.swapBuffers();

    this.renderer.updateCanvas();
    // this.logic.lastRender = tFrame;
    // this.renderer.ctx.strokeStyle = "white";
    // this.renderer.ctx.beginPath();
    // this.renderer.ctx.moveTo(50, 50);
    // this.renderer.ctx.lineTo(150, 150);
    // this.renderer.ctx.stroke();
    this.renderer.ctx.fillStyle = "blue";
    this.renderer.ctx.fillRect(this.x, this.y, 100, 100);
    this.x += 5;
    this.y += 5;
    this.stopMain = requestAnimationFrame(this.loop.bind(this));
  }

  // updateVisitedNodes(nodeID) {
  //   this.visitedNodes.push(nodeID);
  // }

  start() {
    this.loop(performance.now());
  }
}
