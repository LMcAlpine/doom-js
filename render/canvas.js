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

    this.screenImageData = this.ctx.createImageData(
      canvas.width,
      canvas.height
    );
    this.screenBuffer = new Uint32Array(this.screenImageData.data.buffer);

    this.ylookup = [];
    for (let i = 0; i < canvas.height; i++) {
      this.ylookup[i] = i * this.canvasWidth;
    }
  }

  clearCanvas() {
    this.screenBuffer.fill(0);
  }

  updateCanvas() {
    this.ctx.putImageData(this.screenImageData, 0, 0);
  }
}
