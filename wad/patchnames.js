class PatchNames {
  constructor(lumps, palette) {
    this.lumps = lumps;

    this.palette = gameEngine.palette.palettes[0];
    // this.palette = palette;
    const pnamesLump = lumps.find((lump) => lump.name === "PNAMES");
    const names = this.parsePatchNames(pnamesLump);
    console.log(names);
    this.names = names;
    this.parsePatch(names[5]);
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
      columnOffsets.push(columnOffset);
    }

    const columns = [];
    for (let i = 0; i < width; i++) {
      let offset = columnOffsets[i];
      const posts = [];

      const topDelta = dataView.getUint8(offset++);
      if (topDelta === 255) {
        // End of column data
        continue;
      }
      const length = dataView.getUint8(offset++);
      offset++; // Skip the padding byte

      // Read the pixel data for the post
      const data = new Uint8Array(patch.data.slice(offset, offset + length));
      posts.push({ topDelta, length, data });
      offset += length; // Move to the start of the next post or end of column

      columns.push(posts);
    }
    const startX = 0; // x-coordinate where you want to start drawing the patch
    const startY = 0; // y-coordinate where you want to start drawing the patch

    let ctx = gameEngine.ctx;

    for (let i = 0; i < columns.length; i++) {
      let column = columns[i];
      for (let j = 0; j < column.length; j++) {
        let post = column[j];
        if (post.topDelta === 255) {
          continue;
        }
        for (let k = 0; k < post.length; k++) {
          let pixel = post.data[k];
          const pixelDraw = this.palette[pixel];
          ctx.fillStyle = `rgb(${pixelDraw.red}, ${pixelDraw.green}, ${pixelDraw.blue})`;
          ctx.fillRect(startX + i, startY + post.topDelta + k, 1, 1);
        }
      }
    }

    return columns;
  }
}
