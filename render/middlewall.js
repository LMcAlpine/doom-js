class MiddleWall extends Wall {
  constructor() {
    this.drawMiddleTexture = false;
  }
  render() {
    if (this.drawMiddleTexture) {
      this.drawColumn(
        wallData.middleTextureAlt,
        wallData.yl,
        wallData.yh,
        wallData.inverseScale,
        wallData.textureColumn,
        wallData.textureWidth,
        wallData.textureHeight,
        wallData.textureData,
        wallData.x,
        wallData.lightLevel
      );

      // this.upperclip[x] = CANVASHEIGHT;
      // this.lowerclip[x] = -1;
    }
  }

  setDrawWallSegmentFlag(canDraw) {
    this.drawMiddleTexture = canDraw;
  }
}
