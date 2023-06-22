class WADParser {
  constructor(arrayBuffer) {
    this.arrayBuffer = arrayBuffer;
  }

  async parse() {
    try {
      const header = this.parseHeader(this.arrayBuffer);
      const lumps = this.parseLumps(header, this.arrayBuffer);

      console.log(header);
      console.log(lumps);
      return lumps;
    } catch (error) {
      console.error("Error parsing WAD file:", error);
    }
  }

  parseHeader(arrayBuffer) {
    const dataView = new DataView(arrayBuffer);

    const header = {
      wadType: this.readString(dataView, 0, 4),
      numLumps: dataView.getInt32(4, true),
      lumpDirectoryOffset: dataView.getInt32(8, true),
    };

    if (header.wadType !== "IWAD" && header.wadType !== "PWAD") {
      throw new Error("Invalid WAD file.");
    }

    return header;
  }

  parseLumps(header, arrayBuffer) {
    const dataView = new DataView(arrayBuffer);
    const lumps = [];

    for (let i = 0; i < header.numLumps; i++) {
      const offset = header.lumpDirectoryOffset + i * 16;
      const lump = {
        filePos: dataView.getInt32(offset, true),
        size: dataView.getInt32(offset + 4, true),
        name: this.readString(dataView, offset + 8, 8),
      };
      // Add the lump data as an ArrayBuffer
      lump.data = arrayBuffer.slice(lump.filePos, lump.filePos + lump.size);

      lumps.push(lump);
    }
    return lumps;
  }

  readString(dataView, offset, maxLength) {
    let result = "";
    for (let i = 0; i < maxLength; i++) {
      const charCode = dataView.getUint8(offset + i);
      if (charCode === 0) {
        break;
      }
      result += String.fromCharCode(charCode);
    }
    return result;
  }
}
