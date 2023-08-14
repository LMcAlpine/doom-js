/**
 * A class for parsing raw binary data from the WAD.
 */
class WADParser {
  /**
   * Creates a new instance of the WADParser class.
   * @param {ArrayBuffer} arrayBuffer - The ArrayBuffer object representing the raw binary data to be parsed.
   */
  constructor(arrayBuffer) {
    this.arrayBuffer = arrayBuffer;
  }

  /**
   * Parses the WAD file to extract its lumps.
   *
   * This method first parses the header of the WAD file and then uses the header information
   * to parse and extract all the lumps present in the WAD file.
   * @async
   *
   * @returns {Array} An array containing all the lumps of the WAD file. Each lump is an object with details specific to the lump type.
   */
  async parse() {
    try {
      const header = this.parseHeader(this.arrayBuffer);
      const lumps = this.parseLumps(header, this.arrayBuffer);

      return lumps;
    } catch (error) {
      console.error("Error parsing WAD file:", error);
    }
  }

  /**
   * Parses the header information of a WAD file.
   *
   * @param {ArrayBuffer} arrayBuffer - The ArrayBuffer object representing the raw binary data to be parsed.
   * @returns {Object} An object which represents the header of the WAD file.
   */
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

  /**
   * Parses the lumps of a WAD file using the header information and arrayBuffer data.
   *
   * @param {Object} header - the header object representing the wad type, number of lumps, and data directory for the lumps.
   * @param {ArrayBuffer} arrayBuffer - The ArrayBuffer object representing the raw binary data to be parsed.
   * @returns {Array} returns an array containing all the lumps in this WAD file.
   */
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

  /**
   * Reads a string from the specified DataView object.
   *
   * @param {DataView} dataView - The DataView object containing the data to read.
   * @param {number} offset - The offset within the DataView where the string starts.
   * @param {number} maxLength - The maximum length of the string to read.
   * @returns {string} The read string.
   */
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
