class FlatManager {
  constructor(lumps, palette) {
    this.palette = palette;

    let flats1 = this.getFlatData(lumps, "F1_START", "F1_END");
    let flats2 = this.getFlatData(lumps, "F2_START", "F2_END");

    this.flatPool = new Map();
    this.createFlat(flats1);
    this.createFlat(flats2);
  }

  getFlatData(lumps, startMarker, endMarker) {
    const startIndex = lumps.findIndex((lump) => lump.name === startMarker);
    const endIndex = lumps.findIndex((lump) => lump.name === endMarker);

    let flats = [];

    for (let i = startIndex + 1; i < endIndex; i++) {
      flats.push(lumps[i]);
    }
    return flats;
  }

  createFlat(flatData) {
    for (let j = 0; j < flatData.length; j++) {
      const dataView = new DataView(flatData[j].data);
      let textureImageObj = new ImageData(64, 64);

      for (let i = 0; i < 4096; i++) {
        const index = dataView.getUint8(i);
        const pixelColor = this.palette[index];

        const pixelIdx = i * 4;
        textureImageObj.data[pixelIdx] = pixelColor.red;
        textureImageObj.data[pixelIdx + 1] = pixelColor.green;
        textureImageObj.data[pixelIdx + 2] = pixelColor.blue;
        textureImageObj.data[pixelIdx + 3] = 255;
      }
      this.flatPool.set(flatData[j].name, textureImageObj);
    }
  }
}
