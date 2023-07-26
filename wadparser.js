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

    // Print the bytes for numLumps
    for (let i = 0; i < 4; i++) {
      console.log("numLumps byte", i, ":", dataView.getUint8(4 + i));
    }

    // Print the bytes for lumpDirectoryOffset
    for (let i = 0; i < 4; i++) {
      console.log("lumpDirectoryOffset byte", i, ":", dataView.getUint8(8 + i));
    }

    if (header.wadType !== "IWAD" && header.wadType !== "PWAD") {
      throw new Error("Invalid WAD file.");
    }

    return header;
  }

  parseLumps(header, arrayBuffer) {
    const dataView = new DataView(arrayBuffer);
    const lumps = [];
    const directoryEntryLength = 16; // 16 bytes. Each entry in the directory is 16 bytes.

    for (let i = 0; i < header.numLumps; i++) {
      const offset = header.lumpDirectoryOffset + i * directoryEntryLength;
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
