class PatchNames {
  constructor(lumps, palette) {
    this.lumps = lumps;

    this.palette = palette.palettes[0];

    const pnamesLump = lumps.find((lump) => lump.name === "PNAMES");
    const names = this.parsePatchNames(pnamesLump);
    console.log(names);
    this.names = names;
  }

  parsePatchNames(patchNamesLump) {
    const dataView = new DataView(patchNamesLump.data);
    const numMapPatches = dataView.getInt32(0, true); // Read the number of patches
    const names = [];
    for (let i = 0; i < numMapPatches; i++) {
      const nameOffset = 4 + i * 8; // Calculate the offset for each name
      const name = String.fromCharCode(
        ...new Uint8Array(patchNamesLump.data.slice(nameOffset, nameOffset + 8))
      ).replace(/\0/g, "");
      names.push(name);
    }
    return names;
  }

  parsePatchHeader(patchName) {
    const patch = this.lumps.find((lump) => lump.name === patchName);
    const dataView = new DataView(patch.data);

    // Read header values
    const width = dataView.getUint16(0, true);
    const height = dataView.getUint16(2, true);
    const leftOffset = dataView.getInt16(4, true);
    const topOffset = dataView.getInt16(6, true);

    const columnOffsets = [];
    for (let i = 0; i < width; i++) {
      const columnOffset = dataView.getUint32(8 + i * 4, true);
      columnOffsets.push(columnOffset);
    }
    return {
      width,
      height,
      leftOffset,
      topOffset,
      columnOffsets,
    };
  }

  parsePatchColumns(columnOffsets, header, patchName) {
    const patch = this.lumps.find((lump) => lump.name === patchName);
    const dataView = new DataView(patch.data);

    const width = header.width;
    const columns = [];
    for (let i = 0; i < width; i++) {
      let offset = columnOffsets[i];
      const posts = [];

      while (true) {
        const topDelta = dataView.getUint8(offset++);
        if (topDelta === 0xff) {
          // End of column data
          break;
        }
        const length = dataView.getUint8(offset++);
        offset++; // Skip the unused padding byte

        // Read the pixel data for the post
        const data = new Uint8Array(patch.data.slice(offset, offset + length));
        posts.push({ topDelta, length, data });

        offset += length;
        offset++; // Skip the second unused padding byte after the pixel data
      }
      columns.push(posts);
    }

    return columns;
  }
}
