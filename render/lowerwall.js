class LowerWall extends Wall {
  render() {
    console.log("rendering lower wall");

    if (this.drawLowerTexture) {
      mid = this.calculateMidLowerWall(pixlow, x);
      pixlow += pixlowstep;

      this.checkAndDrawLowerWall({
        lowerTextureAlt,
        mid,
        yh,
        inverseScale,
        textureColumn,
        textureWidthLower,
        textureHeightLower,
        textureDataLower,
        x,
        lightLevel,
      });
    } else if (this.markFloor) {
      this.lowerclip[x] = yh + 1;
    }
  }

  setDrawLowerTextureFlag(canDraw) {
    this.drawLowerTexture = canDraw;
  }
}
