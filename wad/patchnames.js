class PatchNames {
  constructor(lumps) {
    this.lumps = lumps;
    const pnamesLump = lumps.find((lump) => lump.name === "PNAMES");
    const names = this.parsePatchNames(pnamesLump);
    console.log(names);
    this.names = names;
    this.parsePatch(names[0]);
  }

  //   parsePatches(patchesLump) {
  //     const dataView = new DataView(patchesLump.data);
  //     const patchHeader = {
  //       width: dataView.getUint16(0, true),
  //       height: dataView.getUint16(2, true),
  //       leftOffset: dataView.getInt16(4, true),
  //       topOffset: dataView.getInt16(6, true),
  //       columnOffset: dataView.getUint32(8, true),
  //     };
  //   }

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

  parsePatch(patchName) {
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
      console.log(columnOffset);
      columnOffsets.push(columnOffset);
      // ... process column data using columnOffset ...
    }
    // should be equal to width of patch
    console.log(columnOffsets.length);

    // columns are divided into posts. Posts are lines of colored pixels going downward on the screen
    // const posts = [];
    // for (let i = 0; i < width; i++) {
    //   let offset = columnOffsets[i];
    //   while (true) {
    //     const topDelta = dataView.getUint8(offset);
    //     if (topDelta === 0xff) {
    //       // End of column data
    //       break;
    //     }
    //     offset++; // Move to the next byte
    //     const length = dataView.getUint8(offset);
    //     offset++; // Move to the next byte
    //     offset++; // Skip the padding byte

    //     // Read the pixel data for the post
    //     const data = new Uint8Array(patch.data.slice(offset, offset + length));
    //     console.log(data);

    //     posts.push(data);
    //     offset += length; // Move to the start of the next post or end of column
    //   }
    // }
  }
}
