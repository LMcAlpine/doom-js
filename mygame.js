var MyGame = {};

/*
 * Starting with the semicolon is in case whatever line of code above this example
 * relied on automatic semicolon insertion (ASI). The browser could accidentally
 * think this whole example continues from the previous line. The leading semicolon
 * marks the beginning of our new line if the previous one was not empty or terminated.
 *
 * Let us also assume that MyGame is previously defined.
 *
 * MyGame.lastRender keeps track of the last provided requestAnimationFrame timestamp.
 * MyGame.lastTick keeps track of the last update time. Always increments by tickLength.
 * MyGame.tickLength is how frequently the game state updates. It is 20 Hz (50ms) here.
 *
 * timeSinceTick is the time between requestAnimationFrame callback and last update.
 * numTicks is how many updates should have happened between these two rendered frames.
 *
 * render() is passed tFrame because it is assumed that the render method will calculate
 *          how long it has been since the most recently passed update tick for
 *          extrapolation (purely cosmetic for fast devices). It draws the scene.
 *
 * update() calculates the game state as of a given point in time. It should always
 *          increment by tickLength. It is the authority for game state. It is passed
 *          the DOMHighResTimeStamp for the time it represents (which, again, is always
 *          last update + MyGame.tickLength unless a pause feature is added, etc.)
 *
 * setInitialState() Performs whatever tasks are leftover before the main loop must run.
 *                   It is just a generic example function that you might have added.
 */
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
let canvasBuffer = ctx.getImageData(0, 0, canvas.width, canvas.height);
let canvasPitch = canvasBuffer.width * 4;

function putPixel(x, y, color) {
  // x = canvas.width / 2 + x;
  // y = canvas.height / 2 - y - 1;
  x = Math.round(x); // Round the x-coordinate to the nearest integer
  y = Math.round(y); // Round the y-coordinate to the nearest integer

  if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
    return;
  }

  let offset = 4 * x + canvasPitch * y;
  canvasBuffer.data[offset++] = color[0];
  canvasBuffer.data[offset++] = color[1];
  canvasBuffer.data[offset++] = color[2];
  canvasBuffer.data[offset++] = 255; // Alpha = 255 (full opacity)
}

let updateCanvas = function () {
  ctx.putImageData(canvasBuffer, 0, 0);
};

//main loop
(() => {
  let totalTicks = 0;
  let frameCount = 0;

  function main(tFrame) {
    MyGame.stopMain = window.requestAnimationFrame(main);
    const nextTick = MyGame.lastTick + MyGame.tickLength;
    //  console.log("next tick " + nextTick);
    let numTicks = 0;

    // If tFrame < nextTick then 0 ticks need to be updated (0 is default for numTicks).
    // If tFrame = nextTick then 1 tick needs to be updated (and so forth).
    // Note: As we mention in summary, you should keep track of how large numTicks is.
    // If it is large, then either your game was asleep, or the machine cannot keep up.
    if (tFrame > nextTick) {
      const timeSinceTick = tFrame - MyGame.lastTick;
      numTicks = Math.floor(timeSinceTick / MyGame.tickLength);
      //   console.log(numTicks);
    }
    totalTicks += numTicks;
    frameCount++;

    if (frameCount % 60 === 0) {
      // Calculate average every 60 frames (adjust as needed)
      const averageTicks = totalTicks / frameCount;
      // console.log("Average numTicks per frame: " + averageTicks);
    }

    queueUpdates(numTicks);
    render(tFrame);
    MyGame.lastRender = tFrame;
  }

  function queueUpdates(numTicks) {
    for (let i = 0; i < numTicks; i++) {
      MyGame.lastTick += MyGame.tickLength; // Now lastTick is this tick.
      update(MyGame.lastTick);
    }
  }

  function update(lastTick) {
    //  console.log("lastTick " + lastTick);
  }

  function render(frame) {
    //  console.log(frame);
    // Calculate the time since the last render
    //const timeElapsed = frame - MyGame.lastRender;

    // Update the game scene based on the time elapsed
    // This can include animations, physics calculations, and updating object positions.

    let color = [190, 0, 210];

    // updateCanvas();

    // Draw game elements, backgrounds, player characters, etc.

    // Update MyGame.lastRender to keep track of the last rendered frame
    //  MyGame.lastRender = frame;
  }

  MyGame.lastTick = performance.now();
  MyGame.lastRender = MyGame.lastTick; // Pretend the first draw was on first update.
  MyGame.tickLength = 50; // This sets your simulation to run at 20Hz (50ms)

  setInitialState();

  function setInitialState() {
    console.log("running");
  }

  main(performance.now()); // Start the cycle
})();
