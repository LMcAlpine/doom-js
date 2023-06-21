class LevelParser {
  constructor(lumps) {
    this.lumps = lumps;
  }
  parse() {
    // Parse the vertices from the VERTEXES lump
    const verticesLump = this.lumps.find((lump) => lump.name === "VERTEXES");
    const vertices = this.parseVertices(verticesLump);

    console.log(vertices);

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

  parseLinedefs() {}

  parseSidedefs() {}

  parseNodes() {}

  parseSubsectors() {}

  parseSegs() {}

  parseSectors() {}
}
