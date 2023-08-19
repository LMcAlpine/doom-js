class GameEngine {
  constructor(tickLength) {
    this.logic = new GameLogic(tickLength);

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
      this.mouse = getXandY(e);
    });

    this.ctx.canvas.addEventListener("click", (e) => {
      this.click = getXandY(e);
    });

    this.ctx.canvas.addEventListener("wheel", (e) => {
      e.preventDefault(); // Prevent Scrolling
      this.wheel = e;
    });

    this.ctx.canvas.addEventListener("contextmenu", (e) => {
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

  draw() {
    // clear the canvas each frame
    this.canvas.clearCanvas();

    // Draw latest things first
    for (let i = this.entities.length - 1; i >= 0; i--) {
      this.entities[i].draw(this.canvas, this);
    }

    this.levelManager.draw();

   // this.canvas.updateCanvas();
  }

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
  }

  loop() {
    // logic is updated first, then draw
    this.update();
    this.draw();
    this.stopMain = requestAnimationFrame(this.loop.bind(this));
  }
}
