class SpriteManager {
  constructor(lumpData) {
    this.lumpData = lumpData;
  }

  getSprites(startMarker, endMarker) {
    const startIndex = this.getIndex(startMarker);
    const endIndex = this.getIndex(endMarker);

    return this.lumpData.slice(startIndex + 1, endIndex);
  }

  getIndex(marker) {
    return this.lumpData.findIndex((lump) => lump.name === marker);
  }
}
