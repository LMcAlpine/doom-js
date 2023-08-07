class GameEngine {
  constructor(canvasId, tickLength, levels) {
    this.canvas = new Canvas(canvasId);
    this.ctx = this.canvas.ctx;
    const subsector = new Subsector(
      levels.subsectors,
      levels.segs,
      levels.vertices,
      this.canvas
    );
    this.bspTraversal = new BSPTraversal(levels, subsector);

    this.logic = new GameLogic(tickLength);

    this.linedefs = levels.linedefs;
    this.vertices = levels.vertices;
    this.nodes = levels.nodes;
    console.log(this.nodes.length);

    this.entities = [];

    // Information on the input
    this.click = null;
    this.mouse = null;
    this.wheel = null;
    this.keys = {};
  }

  init() {
    this.startInput();
  }

  start() {
    this.loop(performance.now());
  }

  startInput() {
    const getXandY = (e) => ({
      x: e.clientX - this.ctx.canvas.getBoundingClientRect().left,
      y: e.clientY - this.ctx.canvas.getBoundingClientRect().top,
    });

    this.ctx.canvas.addEventListener("mousemove", (e) => {
      // if (this.options.debugging) {
      //   console.log("MOUSE_MOVE", getXandY(e));
      // }
      this.mouse = getXandY(e);
    });

    this.ctx.canvas.addEventListener("click", (e) => {
      // if (this.options.debugging) {
      //   console.log("CLICK", getXandY(e));
      // }
      this.click = getXandY(e);
    });

    this.ctx.canvas.addEventListener("wheel", (e) => {
      // if (this.options.debugging) {
      //   console.log("WHEEL", getXandY(e), e.wheelDelta);
      // }
      e.preventDefault(); // Prevent Scrolling
      this.wheel = e;
    });

    this.ctx.canvas.addEventListener("contextmenu", (e) => {
      // if (this.options.debugging) {
      //   console.log("RIGHT_CLICK", getXandY(e));
      // }
      e.preventDefault(); // Prevent Context Menu
      this.rightclick = getXandY(e);
    });

    this.ctx.canvas.addEventListener(
      "keydown",
      (event) => (this.keys[event.key] = true)
    );
    this.ctx.canvas.addEventListener(
      "keyup",
      (event) => (this.keys[event.key] = false)
    );
  }

  addEntity(entity) {
    this.entities.push(entity);
  }

  // clears canvas
  // calls draw methods...?
  draw() {
    // clear the canvas each frame
    this.canvas.clearCanvas();
    // draw world space...?
    this.canvas.drawLinedefs(this.linedefs, this.vertices);

    // then updatecanvas
    // this.canvas.updateCanvas();
    // then draw entities....?
    // Draw latest things first
    for (let i = this.entities.length - 1; i >= 0; i--) {
      this.entities[i].draw(this.canvas, this);
    }
    this.canvas.updateCanvas();
  }

  // updates logic...?
  update() {
    let entitiesCount = this.entities.length;

    for (let i = 0; i < entitiesCount; i++) {
      let entity = this.entities[i];

      if (!entity.removeFromWorld) {
        entity.update();
      }
    }

    for (let i = this.entities.length - 1; i >= 0; --i) {
      if (this.entities[i].removeFromWorld) {
        this.entities.splice(i, 1);
      }
    }

    this.bspTraversal.traverseBSP(this.nodes.length - 1);
  }

  loop(tFrame) {
    // logic is updated first, then draw
    this.update();
    this.draw();
    //this.logic.lastRender = tFrame;
    this.stopMain = requestAnimationFrame(this.loop.bind(this));
  }
}
