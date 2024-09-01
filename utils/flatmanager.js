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
      let textureUint32Array = new Uint32Array(textureImageObj.data.buffer);

      for (let i = 0; i < 4096; i++) {
        const index = dataView.getUint8(i);
        const pixelColor = this.palette[index];

        let packedPixel;
        if (ENDIAN) {
          packedPixel =
            (FULL_ALPHA << 24) |
            (pixelColor.blue << 16) |
            (pixelColor.green << 8) |
            pixelColor.red;
        } else {
          packedPixel =
            (pixelColor.red << 24) |
            (pixelColor.green << 16) |
            (pixelColor.blue << 8) |
            FULL_ALPHA;
        }

        textureUint32Array[i] = packedPixel;
      }
      this.flatPool.set(flatData[j].name, textureImageObj);
    }
  }
}
