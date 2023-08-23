class ReadPalette {
  constructor(lumps) {
    const playpal = lumps.find((lump) => lump.name === "PLAYPAL");
    console.log(playpal);

    const dataView = new DataView(playpal.data);
    const numPalettes = 14;
    const numColors = 256;
    const bytesPerColor = 3;
    this.palettes = []; // To store all palettes

    for (let i = 0; i < numPalettes; i++) {
      const palette = [];
      for (let j = 0; j < numColors; j++) {
        const offset = (i * numColors + j) * bytesPerColor;
        const red = dataView.getUint8(offset);
        const green = dataView.getUint8(offset + 1);
        const blue = dataView.getUint8(offset + 2);
        palette.push({ red, green, blue });
      }
      this.palettes.push(palette);
    }
  }
}
