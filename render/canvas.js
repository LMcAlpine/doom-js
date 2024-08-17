class Canvas {
  constructor(canvasID) {
    const canvas = document.getElementById(canvasID);
    this.ctx = canvas.getContext("2d");

    this.canvasBuffer = this.ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
    this.canvasPitch = this.canvasBuffer.width * 4;
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;

    // offscreen

    this.offScreenCanvas = document.createElement("canvas");
    this.offScreenCanvas.width = canvas.width; // Set offscreen canvas width to match main canvas
    this.offScreenCanvas.height = canvas.height; // Set offscreen canvas height to match main canvas

    // OMG THIS DOESN'T SET THE OFFSCREEN CANVAS WIDTH... AHHHHHHH
    // I was making a wrong assumption that it somehow was setting the width to the offscreen canvas.
    this.offScreenWidth = 640;
    this.offScreenHeight = 400;
    this.offScreenCtx = this.offScreenCanvas.getContext("2d");
    //  this.offScreenCtx = this.ctx;

    // this.offScreenBuffer = this.offscreenCtx.getImageData(0, 0, this.offscreenWidth, this.offScreenHeight);

    this.screenImageData = this.ctx.createImageData(
      canvas.width,
      canvas.height
    );
    // this.framebuffer = new Uint32Array(canvas.width * canvas.height);
    this.screenBuffer = new Uint32Array(this.screenImageData.data.buffer);
  }

  clearCanvas() {
    // this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    // this.offScreenCtx.clearRect(
    //   0,
    //   0,
    //   this.offScreenWidth,
    //   this.offScreenHeight
    // );
    this.screenBuffer.fill(0);
  }

  updateCanvas() {


    this.ctx.putImageData(this.screenImageData, 0, 0);
    //  this.ctx.drawImage(this.offScreenCanvas, 0, 0);
  }
}
