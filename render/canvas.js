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
    this.offScreenCtx = this.ctx;

    // this.offScreenBuffer = this.offscreenCtx.getImageData(0, 0, this.offscreenWidth, this.offScreenHeight);

  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.offScreenCtx.clearRect(0, 0, this.offScreenWidth, this.offScreenHeight);

  }

  drawWallCol(
    offscreenCtx,
    entireTextureData,
    textureColumn,
    x,
    y1,
    y2,
    textureAlt,
    invScale,
    lightLevel, textureWidth, textureHeight, wallWidth, largeImageData, startX
  ) {
    if (y1 < y2) {


      textureColumn = Math.trunc(textureColumn) % textureWidth;



      let textureY = textureAlt + (y1 - HALFHEIGHT) * invScale;

      for (let i = 0; i < y2; i++) {

        const texY = Math.trunc(textureY) % textureHeight;
        const texPos = (texY * textureWidth + textureColumn) * 4;

        let index = (i * wallWidth + (x - startX)) * 4;
        largeImageData.data[index] = entireTextureData[texPos] * lightLevel;
        largeImageData.data[index + 1] = entireTextureData[texPos + 1] * lightLevel;
        largeImageData.data[index + 2] = entireTextureData[texPos + 2] * lightLevel;
        largeImageData.data[index + 3] = 255;

        textureY += invScale;
      }

    }
  }


  updateCanvas() {

    this.ctx.drawImage(this.offScreenCanvas, 0, 0);
  }

}
