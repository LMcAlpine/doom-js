class LevelParser {
  constructor(lumps) {
    this.lumps = lumps;
  }
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

    // ...Parse other map components like linedefs, sidedefs, sectors, things, etc.

    return { vertices /*, other map components... */ };
  }

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

  parseSidedefs() {}

  parseNodes() {}

  parseSubsectors() {}

  parseSegs() {}

  parseSectors() {}
}
