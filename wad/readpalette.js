class ReadPalette {
  constructor(lumps) {
    const playpal = lumps.find((lump) => lump.name === "PLAYPAL");
    console.log(playpal);
  }
}
