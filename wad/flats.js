class Flats {
  constructor(lumps) {
    this.lumps = lumps;
  }

  findLump(name) {
    this.flats = this.lumps.find((lump) => lump.name === name);
    return this.flats;
  }
}
