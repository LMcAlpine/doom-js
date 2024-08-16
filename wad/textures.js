const MAPTEXTUREHEADERLENGTH = 22; // in bytes
const MAPPATCHSTRUCTURELENGTH = 10; // in bytes

class Textures {
  constructor(lumps) {
    const texture1Lump = lumps.find((lump) => lump.name === "TEXTURE1");
    this.maptextures = this.parseTextureHeader(texture1Lump);
  }

  parseTextureHeader(textureLump) {
    const dataView = new DataView(textureLump.data);
    // read 4 bytes starting at 0 which is an integer holding the number of map textures
    const numtextures = dataView.getInt32(0, true);
    const offsets = new Int32Array(
      textureLump.data.slice(4, 4 + 4 * numtextures)
    ); // add 4 to 4 * numtextures to account for the slice starting from index 4

    console.log(offsets);
    const maptextures = [];
    // offsets to the map textures
    for (let offset of offsets) {
      const texture = this.parseMapTexture(textureLump.data.slice(offset));

      maptextures.push(texture);
    }
    return maptextures;
  }

  parseMapTexture(data) {
    const dataView = new DataView(data);
    const name = String.fromCharCode(
      ...new Uint8Array(data.slice(0, 8))
    ).replace(/\0/g, "");

    const masked = dataView.getInt32(8, true);
    const width = dataView.getInt16(12, true);
    const height = dataView.getInt16(14, true);
    const patchCount = dataView.getInt16(20, true);

    const patches = [];
    for (let i = 0; i < patchCount; i++) {
      patches.push(
        this.parseMapPatch(
          data.slice(MAPTEXTUREHEADERLENGTH + i * MAPPATCHSTRUCTURELENGTH)
        )
      );
    }
    const texture = { name, masked, width, height, patches };
    return texture;
  }

  parseMapPatch(data) {
    const dataView = new DataView(data);
    const originX = dataView.getInt16(0, true);
    const originY = dataView.getInt16(2, true);
    const patchNumber = dataView.getInt16(4, true);

    const patch = { originX, originY, patchNumber };
    return patch;
  }
}
