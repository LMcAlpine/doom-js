/**
 * The LevelParser class is used to parse level data from a set of WAD file lumps.
 */
class LevelParser {
  /**
   * Create a new level parser.
   * @param {Array} lumps - The raw data lumps from the WAD file.
   */
  constructor(lumps) {
    this.lumps = lumps;
  }

  /**
   * Parse a specific level from the WAD file.
   * @param {string} levelName - The name of the level to parse.
   * @return {Object} The parsed level data, containing vertices and linedefs.
   * @throws {Error} If the level is not found in the WAD file.
   */
  parse(levelName) {
    // Find the level's start index in the lumps array
    const levelStartIndex = this.lumps.findIndex(
      (lump) => lump.name === levelName
    );
    if (levelStartIndex === -1) {
      throw new Error(`Level ${levelName} not found in WAD file.`);
    }

    // Extract just the lumps for this level
    const levelLumps = this.lumps.slice(levelStartIndex, levelStartIndex + 10); // 10 is usually the number of lumps for a level

    // Parse the vertices, linedefs, etc. from the level lumps
    const verticesLump = levelLumps.find((lump) => lump.name === "VERTEXES");
    const vertices = this.parseVertices(verticesLump);

    const linedefsLump = levelLumps.find((lump) => lump.name === "LINEDEFS");
    const linedefs = this.parseLinedefs(linedefsLump);

    const sidedefsLump = levelLumps.find((lump) => lump.name === "SIDEDEFS");
    const sidedefs = this.parseSidedefs(sidedefsLump);

    const nodesLump = levelLumps.find((lump) => lump.name === "NODES");
    const nodes = this.parseNodes(nodesLump);

    const subsectorsLump = levelLumps.find((lump) => lump.name === "SSECTORS");
    const subsectors = this.parseSubsectors(subsectorsLump);

    const segsLump = levelLumps.find((lump) => lump.name === "SEGS");
    const segs = this.parseSegs(segsLump);

    const sectorsLump = levelLumps.find((lump) => lump.name === "SECTORS");
    const sectors = this.parseSectors(sectorsLump);

    const thingsLump = levelLumps.find((lump) => lump.name === "THINGS");
    const things = this.parseThings(thingsLump);

    // const pnamesLump = levelLumps.find((lump) => lump.name === "PNAMES");
    // const names = this.parsePatchNames(pnamesLump);

    return {
      vertices,
      linedefs,
      sidedefs,
      nodes,
      subsectors,
      segs,
      sectors,
      things,
    };
  }

  /**
   * Parses a vertices lump from the WAD file into an array of vertices.
   *
   * @param {Object} verticesLump - The lump of the WAD file containing vertices data.
   * Each vertex is represented by 4 bytes (two 16-bit signed integers for X and Y coordinates).
   * @returns {Array} vertices - An array of vertex objects, where each vertex object has 'x' and 'y' properties.
   */
  parseVertices(verticesLump) {
    const dataView = new DataView(verticesLump.data);
    const vertices = [];

    for (let i = 0; i < verticesLump.size; i += 4) {
      const x = dataView.getInt16(i, true);
      const y = dataView.getInt16(i + 2, true);
      vertices.push({ x, y });
    }

    return vertices;
  }

  /**
   * Parses linedef lumps data from a WAD file
   *
   *   Each linedef object represents a wall segment in the map.
   *   A linedef is a 14-byte structure containing the following fields:
   *    startVertex: {number} - The index of the start vertex. This defines one end of the linedef.
   *    endVertex: {number} - The index of the end vertex. This defines the other end of the linedef.
   *    flags: {number} - Flags that determine the properties of the linedef such as blocking player, blocking projectiles etc.
   *    specialType: {number} - The type of special effect activated by the linedef, e.g., door or lift action.
   *    sectorTag: {number} - The tag of the sector that the linedef might activate with its special effect.
   *    rightSidedef: {number} - The index of the right sidedef which gives details about the textures on the right side of the line.
   *    leftSidedef: {number} - The index of the left sidedef which gives details about the textures on the left side of the line.
   *
   *   This function reads these fields for each linedef and returns an array of linedefs.
   *
   * @param {Object} linedefsLump - The linedefs lump data to parse
   * @returns {Array} An array of linedef objects, each containing startVertex, endVertex, flags, specialType, sectorTag, rightSidedef, and leftSidedef.
   */

  parseLinedefs(linedefsLump) {
    const dataView = new DataView(linedefsLump.data);
    const linedefs = [];

    for (let i = 0; i < linedefsLump.size; i += 14) {
      const startVertex = dataView.getInt16(i, true);
      const endVertex = dataView.getInt16(i + 2, true);
      const flags = dataView.getInt16(i + 4, true);
      const specialType = dataView.getInt16(i + 6, true);
      const sectorTag = dataView.getInt16(i + 8, true);
      const rightSidedef = dataView.getInt16(i + 10, true);
      const leftSidedef = dataView.getInt16(i + 12, true);

      linedefs.push({
        startVertex,
        endVertex,
        flags,
        specialType,
        sectorTag,
        rightSidedef,
        leftSidedef,
      });
    }
    return linedefs;
  }

  /**
   * Parses sidedef lumps data from a WAD file into a more friendly format.
   *
   * Each sidedef in Doom contains data for wall segments.
   * A sidedef is a 30-byte structure containing the following fields:
   *    xOffset: {number} - The X offset (originally a 16-bit signed integer).
   *    yOffset: {number} - The Y offset (originally a 16-bit signed integer).
   *    upperTextureName: {string} - The name of the upper texture (originally 8 bytes).
   *    lowerTextureName: {string} - The name of the lower texture (originally 8 bytes).
   *    middleTextureName: {string} - The name of the middle texture (originally 8 bytes).
   *    sector: {number} - The sector (originally a 16-bit signed integer).
   *
   * This function reads these fields for each sidedef and returns an array of sidedefs.
   *
   * @param {Object} sidedefsLump - The sidedefs lump data to parse.
   * @returns {Array} An array of sidedef objects, each containing xOffset, yOffset, upperTextureName, lowerTextureName, middleTextureName, and sector properties.
   */
  parseSidedefs(sidedefsLump) {
    const dataView = new DataView(sidedefsLump.data);
    const sidedefs = [];
    const textDecoder = new TextDecoder('utf-8');

    for (let i = 0; i < sidedefsLump.size; i += 30) {
      const xOffset = dataView.getInt16(i, true);
      const yOffset = dataView.getInt16(i + 2, true);

      // const upperTextureName = String.fromCharCode(
      //   ...new Uint8Array(sidedefsLump.data.slice(i + 4, i + 12))
      // ).replace(/\u0000/g, ""); // Remove null characters

      const rawName = new Uint8Array(sidedefsLump.data.slice(i + 4, i + 12));
      const nullIndex = rawName.indexOf(0);  // Find the first null byte
      const validData = nullIndex >= 0 ? rawName.slice(0, nullIndex) : rawName;
      const upperTextureName = textDecoder.decode(validData).trim();




      const lowerTextureName = String.fromCharCode(
        ...new Uint8Array(sidedefsLump.data.slice(i + 12, i + 20))
      ).replace(/\u0000/g, ""); // Remove null characters

      const middleTextureName = String.fromCharCode(
        ...new Uint8Array(sidedefsLump.data.slice(i + 20, i + 28))
      ).replace(/\u0000/g, ""); // Remove null characters

      const sector = dataView.getInt16(i + 28, true);

      sidedefs.push({
        xOffset,
        yOffset,
        upperTextureName,
        lowerTextureName,
        middleTextureName,
        sector,
      });
    }
    return sidedefs;
  }

  /**
   * Parses nodes lumps data from a WAD file.
   *
   * Nodes lump is a component of a level and constitutes a binary space partition of the level.
   * A node is a 28-byte structure containing the following fields:
   *    partitionLineX: - The x coordinate of partition line start.
   *    partitionLineY: - The y coordinate of partition line start.
   *    changeInX: - The change in x from start to end of partition line.
   *    changeInY: - The change in y from start to end of partition line.
   *    rightBoundingBox: - The right bounding box which describes a rectangle of the area covered by the right child.
   *    leftBoundingBox: - The left bounding box which describes a rectangle of the area covered by the left child.
   *    rightChild: - The right child area of the node, may be another node (subnode) or subsector.
   *    leftChild: - The left child area of the node, may be another node (subnode) or subsector.
   *
   * @param {Object} nodesLump - The nodes lump data to parse.
   * @returns {Array} An array of node objects, each containing, partitionLineX, partitionLineY, changeInX, changeInY, rightBoundingBox, leftBoundingBox, rightChild, and leftChild.
   */

  parseNodes(nodesLump) {
    const dataView = new DataView(nodesLump.data);
    const nodes = [];

    for (let i = 0; i < nodesLump.size; i += 28) {
      const partitionLineX = dataView.getInt16(i, true);
      const partitionLineY = dataView.getInt16(i + 2, true);
      const changeInX = dataView.getInt16(i + 4, true);
      const changeInY = dataView.getInt16(i + 6, true);
      const rightBoundingBox = {
        top: dataView.getInt16(i + 8, true),
        bottom: dataView.getInt16(i + 10, true),
        left: dataView.getInt16(i + 12, true),
        right: dataView.getInt16(i + 14, true),
      };
      const leftBoundingBox = {
        top: dataView.getInt16(i + 16, true),
        bottom: dataView.getInt16(i + 18, true),
        left: dataView.getInt16(i + 20, true),
        right: dataView.getInt16(i + 22, true),
      };
      const rightChild = dataView.getInt16(i + 24, true);
      const leftChild = dataView.getInt16(i + 26, true);

      nodes.push({
        partitionLineX,
        partitionLineY,
        changeInX,
        changeInY,
        rightBoundingBox,
        leftBoundingBox,
        rightChild,
        leftChild,
      });
    }
    return nodes;
  }

  /**
   * Parses subsectors lump data from a WAD file.
   *
   * Subsector is a WAD lump that is a component of a level.
   *
   * A subsector is a range of seg (linedef segment) numbers. The segs form part or all of a single sector.
   * Each subsector is construced so that depending on the player location within a specific subsector, any part of a eeg will not block the view of any other seg in a subsector
   *
   *  A subsector is a 4-byte structure containing the following fields:
   *    segCount - the number of segs in this subsector. The number of segs to process
   *    firstSegNumber - the index that points to the first seg (line segment) of this subsector in an array of segs
   *
   * @param {Object} subsectorsLump - The subsectors lump data to parse.
   * @returns {Array} An array of subsector objects, each containing segCount and firstSegNumber
   */

  parseSubsectors(subsectorsLump) {
    const dataView = new DataView(subsectorsLump.data);
    const subsectors = [];

    for (let i = 0; i < subsectorsLump.size; i += 4) {
      const segCount = dataView.getInt16(i, true);
      const firstSegNumber = dataView.getInt16(i + 2, true);

      subsectors.push({ segCount, firstSegNumber });
    }
    return subsectors;
  }

  /**
   *
   * Parses segs lump data from a WAD file.
   *
   * Segs are segments of linedefs, and they describe the portion of a linedef that borders the subsector that the seg belongs to.
   *
   * The seg entries are referenced from the subsector entries, which are referenced from the nodes lump.
   *
   *  - startingVertexNumber - index into the vertexes lump
   *  - endingVertexNumber - index into the vertexes lump
   *  - angle - used to calculate the direction the seg faces
   *  - linedefNumber - index into the linedef that this segment is part of
   *  - direction - the side of the linedef that this segment represents (0 for right or front, 1 for left or back)
   *  - offset - distance along linedef to the start of seg
   *
   *
   * @param {Object} segsLump
   * @returns {Array} An array of seg objects
   */

  parseSegs(segsLump) {
    const dataView = new DataView(segsLump.data);
    const segs = [];

    for (let i = 0; i < segsLump.size; i += 12) {
      const startingVertexNumber = dataView.getInt16(i, true);
      const endingVertexNumber = dataView.getInt16(i + 2, true);
      const angle = dataView.getInt16(i + 4, true);
      const linedefNumber = dataView.getInt16(i + 6, true);
      const direction = dataView.getInt16(i + 8, true);
      const offset = dataView.getInt16(i + 10, true);

      segs.push({
        startingVertexNumber,
        endingVertexNumber,
        angle,
        linedefNumber,
        direction,
        offset,
      });
    }

    return segs;
  }

  /**
   * Parses sectors lump data from a WAD file.
   *
   * Sectors are areas within a Doom level, usually rooms or parts of rooms.
   *
   * @param {Object} sectorsLump - The sectors lump data to parse.
   * @returns {Array} An array of sector objects, each containing floorHeight, ceilingHeight, floorTexture, ceilingTexture, lightLevel, specialType, and tag.
   */
  parseSectors(sectorsLump) {
    const dataView = new DataView(sectorsLump.data);
    const sectors = [];

    for (let i = 0; i < sectorsLump.size; i += 26) {
      const floorHeight = dataView.getInt16(i, true);
      const ceilingHeight = dataView.getInt16(i + 2, true);
      const floorTexture = String.fromCharCode(
        ...new Uint8Array(sectorsLump.data.slice(i + 4, i + 12))
      ).replace(/\0/g, "");
      const ceilingTexture = String.fromCharCode(
        ...new Uint8Array(sectorsLump.data.slice(i + 12, i + 20))
      ).replace(/\0/g, "");

      const lightLevel = dataView.getInt16(i + 20, true);
      const specialType = dataView.getInt16(i + 22, true);
      const tag = dataView.getInt16(i + 24, true);

      sectors.push({
        floorHeight,
        ceilingHeight,
        floorTexture,
        ceilingTexture,
        lightLevel,
        specialType,
        tag,
      });
    }
    return sectors;
  }

  parseThings(thingsLump) {
    const dataView = new DataView(thingsLump.data);
    const things = [];

    for (let i = 0; i < thingsLump.size; i += 10) {
      const xPosition = dataView.getInt16(i, true);
      const yPosition = dataView.getInt16(i + 2, true);
      const direction = dataView.getInt16(i + 4, true);
      const type = dataView.getInt16(i + 6, true);
      const flag = dataView.getInt16(i + 8, true);

      things.push({ xPosition, yPosition, direction, type, flag });
    }
    return things;
  }
}
