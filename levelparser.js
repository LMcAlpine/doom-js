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

    console.log(vertices);

    const linedefsLump = levelLumps.find((lump) => lump.name === "LINEDEFS");
    const linedefs = this.parseLinedefs(linedefsLump);

    console.log(linedefs);

    const sidedefsLump = levelLumps.find((lump) => lump.name === "SIDEDEFS");
    const sidedefs = this.parseSidedefs(sidedefsLump);

    console.log(sidedefs);

    const nodesLump = levelLumps.find((lump) => lump.name === "NODES");
    const nodes = this.parseNodes(nodesLump);

    console.log(nodes);

    return { vertices, linedefs, sidedefs, nodes };
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

    for (let i = 0; i < sidedefsLump.size; i += 30) {
      const xOffset = dataView.getInt16(i, true);
      const yOffset = dataView.getInt16(i + 2, true);
      const upperTextureName = dataView.getInt16(i + 4, true);
      const lowerTextureName = dataView.getInt16(i + 6, true);
      const middleTextureName = dataView.getInt16(i + 8, true);
      const sector = dataView.getInt16(i + 10, true);

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
      const rightBoundingBox = dataView.getInt16(i + 8, true);
      const leftBoundingBox = dataView.getInt16(i + 10, true);
      const rightChild = dataView.getInt16(i + 12, true);
      const leftChild = dataView.getInt16(i + 14, true);

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

  parseSubsectors() {}

  parseSegs() {}

  parseSectors() {}
}
