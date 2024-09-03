class UpperWall extends Wall {
  constructor() {
    super();
    this.drawUpperTexture = false;
    this.markceiling = false;
  }
  render(wallData, context) {
    console.log("rendering upper wall");

    if (this.drawUpperTexture) {
      mid = this.calculateMidUpperWall(pixhigh, x);
      pixhigh += pixhighstep;
      this.checkAndDrawUpperWall({
        upperTextureAlt,
        yl,
        mid,
        inverseScale,
        textureColumn,
        textureWidthUpper,
        textureHeightUpper,
        textureDataUpper,
        x,
        lightLevel,
      });
    } else if (this.markceiling) {
      //this.upperclip[x] = yl - 1;

      context.updateUpperClip(x, yl - 1);
    }
  }

  calculateMidUpperWall(pixHigh, x) {
    return Math.min(pixHigh, this.lowerclip[x] - 1);
  }

  enableDrawing() {
    this.drawUpperTexture = true;
  }

  disableDrawing() {
    this.drawUpperTexture = false;
  }
}
