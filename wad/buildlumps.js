function buildSectors(sectors) {
  const sector = {};
  let sectorObjects = [];
  for (let i = 0; i < sectors.length; i++) {
    sector.floorHeight = sectors[i].floorHeight;
    sector.ceilingHeight = sectors[i].ceilingHeight;
    sector.floorTexture = sectors[i].floorTexture;
    sector.ceilingTexture = sectors[i].ceilingTexture;
    sector.lightLevel = sectors[i].lightLevel;
    sector.specialType = sectors[i].specialType;
    sector.tag = sectors[i].tag;
    const temp = Object.assign({}, sector);
    sectorObjects.push(temp);
  }
  return sectorObjects;
}

function buildLinedefs(linedefs, vertices, sidedefs) {
  const linedef = {};
  let linedefObjects = [];

  for (let i = 0; i < linedefs.length; i++) {
    linedef.startVertex = vertices[linedefs[i].startVertex];
    linedef.endVertex = vertices[linedefs[i].endVertex];
    linedef.flag = linedefs[i].flags;
    linedef.sectorTag = linedefs[i].sectorTag;

    if (linedefs[i].rightSidedef === -1) {
      linedef.rightSidedef = null;
    } else {
      linedef.rightSidedef = sidedefs[linedefs[i].rightSidedef];
    }

    if (linedefs[i].leftSidedef === -1) {
      linedef.leftSidedef = null;
    } else {
      linedef.leftSidedef = sidedefs[linedefs[i].leftSidedef];
    }
    const temp = Object.assign({}, linedef);
    linedefObjects.push(temp);
  }
  return linedefObjects;
}

function buildSegs(segs, vertices, linedefs) {
  const seg = {};
  let segObjects = [];
  for (let i = 0; i < segs.length; i++) {
    seg.startVertex = vertices[segs[i].startingVertexNumber];
    seg.endVertex = vertices[segs[i].endingVertexNumber];
    seg.angle = (segs[i].angle << 16) * 8.38190317e-8;
    seg.linedef = linedefs[segs[i].linedefNumber];
    seg.direction = segs[i].direction;
    seg.offset = (segs[i].offset << 16) / (1 << 16);

    let rightSidedef;
    let leftSidedef;

    if (seg.direction) {
      rightSidedef = seg.linedef.leftSidedef;
      leftSidedef = seg.linedef.rightSidedef;
    } else {
      rightSidedef = seg.linedef.rightSidedef;
      leftSidedef = seg.linedef.leftSidedef;
      //swap
    }

    // let rightSector = rightSidedef.sector;
    seg.rightSector = rightSidedef.sector;
    // two sided
    if (4 & seg.linedef.flag) {
      seg.leftSector = leftSidedef.sector;
    } else {
      seg.leftSector = null;
    }

    // special case where there is a right and left sector, and the rightSidedef is empty but shares the texture of the left
    if (seg.rightSector && seg.leftSector) {
      if (rightSidedef.upperTextureName === "-") {
        seg.linedef.rightSidedef.upperTextureName =
          leftSidedef.upperTextureName;
      }
      if (rightSidedef.lowerTextureName === "-") {
        seg.linedef.rightSidedef.lowerTextureName =
          leftSidedef.lowerTextureName;
      }
    }

    const temp = Object.assign({}, seg);
    segObjects.push(temp);
  }
  return segObjects;
}

function buildSidedefs(sidedefs, sectors) {
  const sidedef = {};
  let sidedefObjects = [];
  for (let i = 0; i < sidedefs.length; i++) {
    sidedef.xOffset = sidedefs[i].xOffset;
    sidedef.yOffset = sidedefs[i].yOffset;
    sidedef.upperTextureName = sidedefs[i].upperTextureName;
    sidedef.lowerTextureName = sidedefs[i].lowerTextureName;
    sidedef.middleTexture = sidedefs[i].middleTextureName;
    sidedef.sector = sectors[sidedefs[i].sector];

    const temp = Object.assign({}, sidedef);
    sidedefObjects.push(temp);
  }
  return sidedefObjects;
}
