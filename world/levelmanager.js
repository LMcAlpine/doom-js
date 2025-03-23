class LevelManager {
  constructor(levels, data, textureManager, flatManager) {
    const colorGenerator = new ColorGenerator(data.sidedefObjects);

    const wallRendererDependencies = {
      solidSegsManager: new SolidSegsManager(),
      geometry: new Geometry(),
    };

    this.wallRenderer = new WallRenderer(
      colorGenerator,
      wallRendererDependencies,
      textureManager,
      flatManager
    );

    this.solidSegsManager = wallRendererDependencies.solidSegsManager;

    const levelsData = {
      subsectors: levels.subsectors,
      vertices: levels.vertices,
    };

    const segmentData = {
      segs: data.segObjects,
      sidedefs: data.sidedefObjects,
    };

    this.linkedSubsectors = [];
    for (let i = 0; i < levelsData.subsectors.length; i++) {
      const subsector = levelsData.subsectors[i];
      const seg = segmentData.segs[subsector.firstSegNumber];
      const modifiedFrontsector = {
        ...seg.frontsector,
        validCount: 0,
        thingList: null,
      };

      this.linkedSubsectors[i] = {
        sector: modifiedFrontsector,
        ...levelsData.subsectors[i],
      };
    }

    const subsector = new Subsector(
      levelsData,
      segmentData,
      this.wallRenderer,
      this.linkedSubsectors
    );
    this.bspTraversal = new BSPTraversal(levels, subsector);

    this.textureManager = textureManager;

    this.visplanes = this.wallRenderer.visplanes;

    this.flatManager = flatManager;

    this.subsector = subsector;

    this.segs = data.segObjects;
    this.subsectors = levels.subsectors;
    this.linedefs = levels.linedefs;
    this.vertices = levels.vertices;
    this.nodes = levels.nodes;
    this.things = levels.things;

    this.yslope = [];
    let dy;
    for (let i = 0; i < CANVASWIDTH; i++) {
      dy = Math.abs(i - CANVASWIDTH / 2);
      this.yslope[i] = CANVASWIDTH / 2 / dy;
    }
  }

  draw() {
    validCount++;

    vissprites = [];

    let ss = (this.wallRenderer.solidsegs =
      this.solidSegsManager.clearSolidsegs(this.wallRenderer.solidsegs));
    this.wallRenderer.initClipHeights();

    this.wallRenderer.clearVisplanes();
    this.wallRenderer.clearDrawSegs();

    this.bspTraversal.traverseBSP(this.nodes.length - 1);

    traverseBSP = true;
    traverseCount = 0;

    // visplanes
    this.drawVisplanes();

    // masked wall
    this.drawMasked();
  }

  drawVisplanes() {
    // this function has separate responsibilities.
    /*
      - it loops through all the visplanes
      - it branches based off texture type (SKY versus regular flat)
      - it calculates texture data
      - it renders columns and pixels (inner loops that do the actual drawing)
    */

    // What is the main decision or action this function needs to perform?
    // this function needs to draw visplanes
    for (let i = 0; i < this.wallRenderer.visplanes.length; i++) {
      let visplane = this.wallRenderer.visplanes[i];

      if (visplane.textureName === "F_SKY1") {
        this.handleSkyVisplane(visplane);
        continue;
      }

      let flat = this.flatManager.flatPool.get(visplane.textureName);

      if (!flat) continue;

      const textureWidthFlat = flat.width;
      const textureHeightFlat = flat.height;
      const textureData = flat.data;

      this.renderFlatTexture(
        visplane,
        textureWidthFlat,
        textureHeightFlat,
        textureData
      );
    }
  }

  renderFlatTexture(
    visplane,
    textureWidthFlat,
    textureHeightFlat,
    textureData
  ) {
    for (let j = visplane.minX; j <= visplane.maxX; j++) {
      let topY = visplane.top[j];
      let bottomY = visplane.bottom[j];

      if (topY <= bottomY) {
        // Calculate direction vectors for texture mapping
        let playerDirectionX = Math.cos(
          degreesToRadians(gameEngine.player.direction.angle)
        );
        let playerDirectionY = Math.sin(
          degreesToRadians(gameEngine.player.direction.angle)
        );

        // Iterate from top to bottom in this column
        this.drawFlat(
          topY,
          bottomY,
          visplane,
          playerDirectionX,
          playerDirectionY,
          j,
          textureWidthFlat,
          textureHeightFlat,
          textureData
        );
      }
    }
  }

  drawFlat(
    topY,
    bottomY,
    visplane,
    playerDirectionX,
    playerDirectionY,
    j,
    textureWidthFlat,
    textureHeightFlat,
    textureData
  ) {
    for (let y = topY; y <= bottomY; y++) {
      let z = (HALFWIDTH * visplane.worldFront) / (HALFHEIGHT - y);
      let px = playerDirectionX * z + gameEngine.player.x;
      let py = playerDirectionY * z + gameEngine.player.y;

      let leftX = -playerDirectionY * z + px;
      let leftY = playerDirectionX * z + py;
      let rightX = playerDirectionY * z + px;
      let rightY = -playerDirectionX * z + py;

      let dx = (rightX - leftX) / CANVASWIDTH;
      let dy = (rightY - leftY) / CANVASWIDTH;
      let tx = Math.floor(leftX + dx * j) & (textureWidthFlat - 1);
      let ty = Math.floor(leftY + dy * j) & (textureHeightFlat - 1);
      const texPos = (ty * textureWidthFlat + tx) * 4;

      let screenPosition = y * CANVASWIDTH + j;

      // Apply color to the screen buffer
      let r = textureData[texPos];
      let g = textureData[texPos + 1];
      let b = textureData[texPos + 2];
      let a = textureData[texPos + 3];
      r = adjustColorComponent(r, visplane.lightLevel);
      g = adjustColorComponent(g, visplane.lightLevel);
      b = adjustColorComponent(b, visplane.lightLevel);

      gameEngine.canvas.screenBuffer[screenPosition] =
        (a << 24) | (b << 16) | (g << 8) | r;
    }
  }

  handleSkyVisplane(visplane) {
    let skyname = this.calculateSkyName();
    let textureWidthSky;
    let textureHeightSky;
    let textureDataSky;
    ({ textureWidthSky, textureHeightSky, textureDataSky } =
      this.getSkyTextureInfo(skyname));

    this.renderSkyTexture(
      visplane,
      textureWidthSky,
      textureHeightSky,
      textureDataSky
    );
  }

  renderSkyTexture(
    visplane,
    textureWidthSky,
    textureHeightSky,
    textureDataSky
  ) {
    for (let x = visplane.minX; x <= visplane.maxX; x++) {
      let topY = visplane.top[x];
      let bottomY = visplane.bottom[x];

      if (topY <= bottomY) {
        let textureColumn =
          (gameEngine.player.direction.angle + getXToAngle(x)) *
          SKY_TEXTURE_MULTIPLIER;

        this.wallRenderer.drawColumn(
          CANVASHEIGHT / 2,
          topY,
          bottomY,
          1,
          textureColumn,
          textureWidthSky,
          textureHeightSky,
          textureDataSky,
          x,
          1
        );
      }
    }
  }

  getSkyTextureInfo(skyname) {
    let r = this.wallRenderer.textureManager.texturePool.get(skyname);
    const textureWidthSky = r.textureWidth;
    const textureHeightSky = r.textureHeight;
    const textureDataSky = r.textureImageData;
    return { textureWidthSky, textureHeightSky, textureDataSky };
  }

  calculateSkyName() {
    let { episode, map, game } = gameEngine.currentLevelInfo;
    let skyname;

    switch (episode) {
      case 1:
        skyname = "SKY1";
        break;
      case 2:
        skyname = "SKY2";
        break;
      case 3:
        skyname = "SKY3";
        break;
      case 4:
        skyname = "SKY4";
        break;
    }
    return skyname;
  }

  drawMasked() {
    // this function has separate responsibilities.
    /*
      - it loops through all the vissprites
      - it retrieves patch, header, columns (texture related info)
      - it loops through the draw segments
      - it determines if a wall segment overlaps with the vissprite
      - it calculates overlapping horizontal range
      - it determines scales
      - it checks if a masked seg should be drawn
      - it sets clip arrays based off silhouette
      - it sets clip markings if values are default (-2)
      - it iterates through horizontal range of the sprite
      - it calculates texture information like texture column
      - it iterates through pixels in a column
      - it processes each post in a column
      - it calculates y values
      - it iterates through the y values in a column
      - it draws the pixels to the buffer

      - after everything it checks if there are any remaining masked segments. 
    */

    // What is the main decision or action this function needs to perform?
    // draw masked...

    for (let i = 0; i < vissprites.length; i++) {
      const sprite = vissprites[i];
      let { spriteLeftX, spriteRightX, spriteYScale, textureMid, start } =
        this.getSpriteProperties(sprite);
      const clipArrays = createSpriteClipArrays(sprite);

      const columns = this.getColumnData(sprite.texture);

      let { cliptop, clipbot } = clipArrays;
      this.checkIfWallOverlapsSprite(
        spriteLeftX,
        spriteRightX,
        sprite,
        clipbot,
        cliptop
      );

      this.setClipMarkings(spriteLeftX, spriteRightX, clipbot, cliptop);

      for (let x = spriteLeftX; x <= spriteRightX; x++) {
        // the cutoff for the bottom of the sprite for this column. Based off silhouette
        const allowedBottom = clipbot[x];
        const allowedTop = cliptop[x];

        let spritetopscreen = HALFHEIGHT - spriteYScale * textureMid;
        let inverseScale = 1.0 / spriteYScale;

        let column;

        let textureColumn = Math.floor(start);
        //console.log(`Column ${x}: textureColumn=${textureColumn}`);
        if (textureColumn < 0 || textureColumn >= columns.length) {
          // skip or continue
          start += inverseScale; // keep the logic consistent
          continue;
        }

        column = columns[textureColumn];

        this.processEachPostInTextureColumn(
          column,
          spritetopscreen,
          spriteYScale,
          allowedTop,
          allowedBottom,
          x
        );

        // so sprites can flip. xiscale is negative when it needs to flip
        start += vissprites[i].xiscale;
      }
    }

    this.drawRemainingMaskedSegments();
  }

  drawRemainingMaskedSegments() {
    for (let i = this.wallRenderer.drawSegments.length - 1; i >= 0; i--) {
      if (this.wallRenderer.drawSegments[i].maskedTextureCol) {
        this.renderMaskedSegRange(
          i,
          this.wallRenderer.drawSegments[i].x1,
          this.wallRenderer.drawSegments[i].x2
        );
        //console.log("");
      }
    }
  }

  processEachPostInTextureColumn(
    column,
    spritetopscreen,
    spriteYScale,
    allowedTop,
    allowedBottom,
    x
  ) {
    for (let j = 0; j < column.length; j++) {
      const post = column[j];

      let topscreen = spritetopscreen + spriteYScale * post.topDelta;

      let bottomscreen = topscreen + spriteYScale * post.length;

      let yl = Math.max(Math.ceil(topscreen), allowedTop + 1);
      let yh = Math.min(Math.floor(bottomscreen), allowedBottom - 1);

      if (yl > yh) {
        continue;
      }

      this.iterateThroughSpriteRows(yl, yh, topscreen, spriteYScale, post, x);
    }
  }

  iterateThroughSpriteRows(yl, yh, topscreen, spriteYScale, post, x) {
    for (let row = yl; row <= yh; row++) {
      let rowInPost = Math.floor((row - topscreen) / spriteYScale);

      if (rowInPost >= 0 && rowInPost < post.data.length) {
        let colorIndex = post.data[rowInPost];

        if (colorIndex !== 0) {
          this.drawSpritePixels(colorIndex, row, x);
        }
      }
    }
  }

  drawSpritePixels(colorIndex, row, x) {
    let colorObj = gameEngine.palette.palettes[0][colorIndex];
    let r = colorObj.red;
    let g = colorObj.green;
    let b = colorObj.blue;
    let a = 255;

    let screenPos = row * CANVASWIDTH + x;
    gameEngine.canvas.screenBuffer[screenPos] =
      (a << 24) | (b << 16) | (g << 8) | r;
  }

  getSpriteProperties(sprite) {
    let spriteLeftX = sprite.x1;
    let spriteRightX = sprite.x2;

    let spriteYScale = sprite.scale;
    let textureMid = sprite.textureMid;
    let start = sprite.start;
    return { spriteLeftX, spriteRightX, spriteYScale, textureMid, start };
  }

  getColumnData(spriteTextureIndex) {
    let patch = gameEngine.lumpData[startIndex + spriteTextureIndex];

    const header = this.parsePatchHeader(patch);

    const columns = this.parsePatchColumns(header.columnOffsets, header, patch);
    return columns;
  }

  setClipMarkings(x1, x2, clipbot, cliptop) {
    for (let x = x1; x <= x2; x++) {
      if (clipbot[x] === -2) {
        clipbot[x] = CANVASHEIGHT;
      }
      if (cliptop[x] === -2) {
        cliptop[x] = -1;
      }
    }
  }

  checkIfWallOverlapsSprite(
    spriteLeftX,
    spriteRightX,
    sprite,
    clipbot,
    cliptop
  ) {
    for (let j = this.wallRenderer.drawSegments.length - 1; j >= 0; j--) {
      let wall = this.wallRenderer.drawSegments[j];
      if (
        wall.x1 > spriteRightX ||
        wall.x2 < spriteLeftX ||
        (!wall.silhouette && !wall.maskedTextureCol)
      ) {
        continue;
      }

      const { r1, r2 } = this.calculateOverlapBetweenWallAndSprite(
        wall,
        sprite
      );

      // the smaller scale. The scale that is from the wall endpoint that is farther away
      let minimumWallProjectionScale;
      let wallProjectionScale;
      ({ minimumWallProjectionScale, wallProjectionScale } =
        this.determineScale(wall));

      if (
        this.isWallBehindSprite(
          wall,
          sprite,
          minimumWallProjectionScale,
          wallProjectionScale
        )
      ) {
        if (wall.maskedTextureCol) {
          this.renderMaskedSegRange(j, r1, r2);
        }
        // seg is behind sprite
        continue;
      }

      let silhouette = this.wallRenderer.drawSegments[j].silhouette;

      // global/world coordinates
      // if the bottom of the sprite is above the wall bottom sil
      if (sprite.gz >= wall.bsilheight) {
        silhouette &= ~SIL_BOTTOM;
      }

      // if the top of the sprite is below the wall top sil
      if (sprite.gzt <= wall.tsilheight) {
        silhouette &= ~SIL_TOP;
      }
      this.setClipArraysBasedOnSilhouette(
        silhouette,
        r1,
        r2,
        clipbot,
        wall,
        cliptop
      );
    }
  }

  isWallBehindSprite(
    wall,
    sprite,
    minimumWallProjectionScale,
    wallProjectionScale
  ) {
    // a larger wall scale means it appears bigger (closer)
    // if the wall's closest point is farther away than the sprite (entire wall segment behind sprite)
    let isEntireWallSegmentBehindSprite = wallProjectionScale < sprite.scale;

    // if the farther endpoint of the wall (minimumWallProjectionScale) is behind the sprite
    let isFartherEndpointBehindSprite =
      minimumWallProjectionScale < sprite.scale;

    let isSpriteNotOnOccludingSide = !this.isPointOnLeftSide(
      sprite.gx,
      sprite.gy,
      wall.currentLine
    );

    return (
      isEntireWallSegmentBehindSprite ||
      (isFartherEndpointBehindSprite && isSpriteNotOnOccludingSide)
    );
  }

  calculateOverlapBetweenWallAndSprite(wall, sprite) {
    const r1 = Math.max(wall.x1, sprite.x1);
    const r2 = Math.min(wall.x2, sprite.x2);
    return { r1, r2 };
  }

  setClipArraysBasedOnSilhouette(silhouette, r1, r2, clipbot, wall, cliptop) {
    if (silhouette === 1) {
      this.setBottomClipArray(r1, r2, clipbot, wall);
    } else if (silhouette === 2) {
      this.setTopClipArray(r1, r2, cliptop, wall);
    } else if (silhouette === 3) {
      this.setTopAndBottomClipArray(r1, r2, clipbot, wall, cliptop);
    }
  }

  setTopAndBottomClipArray(r1, r2, clipbot, wall, cliptop) {
    for (let col = r1; col <= r2; col++) {
      // Merge only these columns
      if (clipbot[col] === -2) {
        clipbot[col] = wall.spriteBottomClip[col];
      }
      if (cliptop[col] === -2) {
        cliptop[col] = wall.spriteTopClip[col];
      }
    }
  }

  setTopClipArray(r1, r2, cliptop, wall) {
    for (let col = r1; col <= r2; col++) {
      // Merge only these columns
      // the overlapping range of the bottom wall portion and sprite
      if (cliptop[col] === -2) {
        cliptop[col] = wall.spriteTopClip[col];
      }
    }
  }

  setBottomClipArray(r1, r2, clipbot, wall) {
    for (let col = r1; col <= r2; col++) {
      // Merge only these columns
      // the overlapping range of the bottom wall portion and sprite
      if (clipbot[col] === -2) {
        clipbot[col] = wall.spriteBottomClip[col];
      }
    }
  }

  determineScale(wall) {
    let minimumWallProjectionScale;
    let wallProjectionScale;
    // if (wall.scale1 > wall.scale2) {
    //   minimumWallProjectionScale = wall.scale2;
    //   wallProjectionScale = wall.scale1;
    // } else {
    //   minimumWallProjectionScale = wall.scale1;
    //   wallProjectionScale = wall.scale2;
    // }
    minimumWallProjectionScale = Math.min(wall.scale1, wall.scale2);
    wallProjectionScale = Math.max(wall.scale1, wall.scale2);
    return { minimumWallProjectionScale, wallProjectionScale };
  }

  renderMaskedSegRange(i, r1, r2) {
    let x1 = this.wallRenderer.drawSegments[i].x1;
    let x2 = this.wallRenderer.drawSegments[i].x2;

    let currentLine = this.wallRenderer.drawSegments[i].currentLine;
    // console.log(`Left Texture: ${currentLine.leftSidedef.middleTexture}`);
    // console.log(`Right Texture: ${currentLine.rightSidedef.middleTexture}`);
    let frontSector = currentLine.rightSidedef.sector;
    let backSector = currentLine.leftSidedef.sector;

    // let textureName = currentLine.rightSidedef.middleTexture; // wrong sides because I am only getting the rightSidedef texture....
    // for example, if the right side is a left texture and then the left side is the right texture.
    // need to somehow know which side the player is on
    let textureName;

    textureName = this.wallRenderer.drawSegments[i].sidedef.middleTexture;

    let maskedTextureCol = this.wallRenderer.drawSegments[i].maskedTextureCol;
    let rwScaleStep = this.wallRenderer.drawSegments[i].scaleStep;

    // let spriteYScale = this.wallRenderer.drawSegments[i].scale1;
    let spriteYScale =
      this.wallRenderer.drawSegments[i].scale1 + (r1 - x1) * rwScaleStep;
    let floorClip = this.wallRenderer.drawSegments[i].spriteBottomClip;
    let ceilingClip = this.wallRenderer.drawSegments[i].spriteTopClip;
    let textureMid;

    // console.log(`Segment X1=${x1}, X2=${x2}, Texture=${textureName}`);
    let {
      textureWidth: textureWidth,
      textureHeight: textureHeight,
      textureData: textureData,
      columns: columns,
    } = this.textureManager.getTextureInfo(textureName);

    if (currentLine.flag & 16) {
      textureMid =
        frontSector.floorHeight > backSector.floorHeight
          ? frontSector.floorHeight
          : backSector.floorHeight;
      textureMid = textureMid + textureHeight - gameEngine.player.height;
    } else {
      textureMid =
        frontSector.ceilingHeight < backSector.ceilingHeight
          ? frontSector.ceilingHeight
          : backSector.ceilingHeight;

      textureMid = textureMid - gameEngine.player.height;
    }
    textureMid += currentLine.rightSidedef.yOffset;
    console.log(`Segment X1=${x1}, X2=${x2}, Texture=${textureName}`);
    // console.log(textureName);
    for (let x = r1; x <= r2; x++) {
      console.log(`Segment rx=${x}, r2=${r2}, Texture=${textureName}`);
      // let spritetopscreen = HALFHEIGHT - spriteYScale * textureMid;
      // let inverseScale = 1.0 / spriteYScale;

      let textureColumnIndex = maskedTextureCol[x];
      // console.log("Y Offset:", currentLine.rightSidedef.yOffset);
      // console.log(
      //   `x=${x}, maskedTextureCol=${textureColumnIndex}, textureMid=${textureMid}`
      // );
      // console.log(
      //   `X=${x}, spriteYScale=${spriteYScale}, rwScaleStep=${rwScaleStep}`
      // );
      if (textureColumnIndex !== 0x7fff) {
        let spritetopscreen = HALFHEIGHT - spriteYScale * textureMid;
        let inverseScale = 1.0 / spriteYScale;

        // console.log("Before Wrapping:", textureColumnIndex);
        // console.log(
        //   "Columns Length:",
        //   columns.length,
        //   "TextureWidth:",
        //   textureWidth
        // );
        // textureColumnIndex =
        //   Math.floor(textureColumnIndex) & (textureWidth - 1);
        textureColumnIndex %= columns.length;
        if (textureColumnIndex < 0) {
          textureColumnIndex += columns.length; // Fix negative indices
        }

        // console.log("After Wrapping:", textureColumnIndex);
        let column;

        column = columns[textureColumnIndex];

        // Process each post in the texture column
        for (let j = 0; j < column.length; j++) {
          const post = column[j];

          let topscreen = spritetopscreen + spriteYScale * post.topDelta;

          let bottomscreen = topscreen + spriteYScale * post.length;

          let yl = Math.ceil(topscreen);
          let yh = Math.floor(bottomscreen);

          // Apply vertical clipping
          if (yh >= floorClip[x]) {
            yh = floorClip[x] - 1;
            // yh = floorClip[x];
          }
          if (yl <= ceilingClip[x]) {
            yl = ceilingClip[x] + 1;
          }

          this.wallRenderer.drawColumn(
            textureMid,
            yl,
            yh,
            inverseScale,
            textureColumnIndex,
            textureWidth,
            textureHeight,
            textureData,
            x,
            this.wallRenderer.drawSegments[i].sidedef.sector.lightLevel
          );
        }
        maskedTextureCol[x] = 0x7fff;
      }

      spriteYScale += rwScaleStep;
    }
  }

  getPlayerSubsectorHeight() {
    let subsectorID = this.nodes.length - 1;

    while (!this.bspTraversal.isSubsector(subsectorID)) {
      let isOnLeft = this.bspTraversal.isPointOnLeftSide(
        gameEngine.player.x,
        gameEngine.player.y,
        this.nodes[subsectorID]
      );
      if (isOnLeft) {
        subsectorID = this.nodes[subsectorID].leftChild;
      } else {
        subsectorID = this.nodes[subsectorID].rightChild;
      }
    }
    let subsector =
      this.subsectors[this.bspTraversal.getSubsector(subsectorID)];
    let seg = this.segs[subsector.firstSegNumber];
    return seg.rightSector.floorHeight;
  }

  pointInSubsector(x, y) {
    let subsectorID = this.nodes.length - 1;

    while (!this.bspTraversal.isSubsector(subsectorID)) {
      let isOnLeft = this.bspTraversal.isPointOnLeftSide(
        x,
        y,
        this.nodes[subsectorID]
      );
      if (isOnLeft) {
        subsectorID = this.nodes[subsectorID].leftChild;
      } else {
        subsectorID = this.nodes[subsectorID].rightChild;
      }
    }
    let subsector =
      this.linkedSubsectors[this.bspTraversal.getSubsector(subsectorID)];
    return subsector;
  }

  loadThings() {
    let mapThing;
    let spawnThing;
    for (let i = 0; i < this.things.length; i++) {
      mapThing = this.things[i];
      if (mapThing.type === 81) {
        console.log("why?");
      }

      spawnThing = mapThing;

      this.spawnMapThing(spawnThing);
    }
  }

  spawnMapThing(mapThing) {
    let i;
    let mapObject = {};
    let x;
    let y;
    let z;

    if (mapThing.type <= 4) {
      this.spawnPlayer(mapThing);
      return;
    }

    if (mapThing.type === 11) {
      return;
    }

    // some definitions were never filled and were just like {}
    // so the key is never found and then it just is stuck with the last accessed key. This is why the shotgun is not spawning
    // I made changes to the python code to resolve it...
    // I should add logic for if the key is never found...?

    // I definitely need to keep in mind the structure of data
    // I know now that it wasnt finding the key
    // I wrongly make assumptions that things just work
    // But I should keep in mind that when searching through arrays or maps or other data that what if I dont find what I am looking for?
    let found = false;
    let key;
    for (key in gameEngine.infoDefinitions) {
      if (mapThing.type == gameEngine.infoDefinitions[key].doomednum) {
        found = true;
        break;
      }
    }

    if (!found) {
      console.error("NOT FOUND");
    }

    // find which type to spawn
    // for (i = 0; i < arr.length; i++) {
    //   // map maybe instead?
    //   // if (mapThing.type == mapinfo[i].doomednum) {
    //   //   break;
    //   // }

    // }

    if (i === arr.length) {
      return;
    }

    x = mapThing.xPosition;
    y = mapThing.yPosition;

    if (gameEngine.infoDefinitions[key].flags & 8) {
      z = ONCEILINGZ;
    } else {
      z = ONFLOORZ;
    }

    mapObject = this.spawnMapObject(x, y, z, key);

    mapObject.angle = Math.floor((mapThing.direction / 45) * 45);
  }

  spawnPlayer(mapThing) {
    console.log(mapThing + "player: do nothing");
    return;
  }

  spawnMapObject(x, y, z, type) {
    let mapObject = {};
    let info = gameEngine.infoDefinitions[type];

    mapObject.type = type;
    mapObject.info = info;
    mapObject.x = x;
    mapObject.y = y;
    mapObject.radius = info.radius;
    mapObject.height = info.height;
    mapObject.flags = info.flags;
    mapObject.health = info.spawnhealth;

    mapObject.angle;

    let stateName = info.spawnstate;
    let state;
    let key;
    for (key in gameEngine.states) {
      if (stateName == key) {
        state = gameEngine.states[key];
        break;
      }
    }

    // no more index number to determine what a name is. The name is just directly in info.spawnstate now
    // this below is problematic because the family names don't always form the the sprite marker.
    // for example GIBS, it doesn't form the sprite for POL5
    // let stateName = spawnStateNames[info.spawnstate];
    // if (stateName.startsWith("S_")) {
    //   stateName = stateName.slice(2);
    // }
    // let family = stateName.split("_")[0];
    // let sprMark = "SPR_" + family;

    // let k;
    // for (k = 0; k < spriteMarkers.length; k++) {
    //   if (sprMark === spriteMarkers[k]) {
    //     break;
    //   }
    // }

    // let state = {
    //   sprite: k,
    //   frame: 0,
    //   tics: 10,
    //   action: null,
    //   nextState: 0,
    // };
    mapObject.state = state;
    mapObject.sprite = state[0];
    mapObject.frame = state[1];
    mapObject.tics = state[2];

    // mapObject.tics = state.tics;

    // mapObject.sprite = state.sprite;

    // mapObject.frame = state.frame;

    this.setThingPosition(mapObject);

    mapObject.floorz = mapObject.subsector.sector.floorHeight;
    mapObject.ceilingz = mapObject.subsector.sector.ceilingHeight;

    if (z == ONFLOORZ) {
      mapObject.z = mapObject.floorz;
    } else if (z == ONCEILINGZ) {
      // mapObject.z = mapObject.ceilingz - mapinfo[i].height;
      mapObject.z = mapObject.ceilingz - info.height;
    } else {
      mapObject.z = z;
    }

    return mapObject;
  }

  setThingPosition(thing) {
    // mistakenly thought x and y were named xPosition and yPosition....
    // this above caused the program to not find the correct subsector... how long was this mistake here?
    // the x and y are named xPosition and yPosition at one point but I store the positions as x and y at a later point
    // the sprites (barrel in my small example) were getting drawn at the wrong subsector height.
    // I figured it out by making a small map and noticing that the program was matching the thing to a different subsector.
    // my small map had two different sectors.
    // let subsec = this.pointInSubsector(thing.xPosition, thing.yPosition);
    let subsec = this.pointInSubsector(thing.x, thing.y);
    thing.subsector = subsec;

    let sec;
    if (!(thing.flags & 8)) {
      sec = subsec.sector;

      thing.sprev = null;
      thing.snext = sec.thingList;

      if (sec.thingList) {
        sec.thingList.sprev = thing;
      }
      sec.thingList = thing;
    }
  }

  parsePatchHeader(patch) {
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
    return {
      width,
      height,
      leftOffset,
      topOffset,
      columnOffsets,
    };
  }

  parsePatchColumns(columnOffsets, header, patch) {
    const dataView = new DataView(patch.data);

    const width = header.width;
    const columns = [];
    for (let i = 0; i < width; i++) {
      let offset = columnOffsets[i];
      const posts = [];

      while (true) {
        const topDelta = dataView.getUint8(offset++);
        if (topDelta === 0xff) {
          // End of column data
          break;
        }
        const length = dataView.getUint8(offset++);
        offset++; // Skip the unused padding byte

        // Read the pixel data for the post
        const data = new Uint8Array(patch.data.slice(offset, offset + length));
        posts.push({ topDelta, length, data });

        offset += length;
        offset++; // Skip the second unused padding byte after the pixel data
      }
      columns.push(posts);
    }

    return columns;
  }

  drawPatch(columns, xStart, yStart, textureWidth, textureUint32Array) {
    const maxColumns = Math.min(columns.length, textureWidth - xStart);

    for (let i = 0; i < maxColumns; i++) {
      const column = columns[i];
      for (let j = 0; j < column.length; j++) {
        const post = column[j];
        for (let k = 0; k < post.data.length; k++) {
          const pixelIndex = post.data[k];
          const pixelDraw = this.palette[pixelIndex];
          const x = xStart + i;
          const y = yStart + post.topDelta + k;
          const pos = y * textureWidth + x;

          let packedPixel;
          if (ENDIAN) {
            // Correctly pack RGBA into a single Uint32 value for little-endian systems
            // ABGR (little-endian)
            packedPixel =
              (FULL_ALPHA << 24) |
              (pixelDraw.blue << 16) |
              (pixelDraw.green << 8) |
              pixelDraw.red;
          } else {
            packedPixel =
              (pixelDraw.red << 24) |
              (pixelDraw.green << 16) |
              (pixelDraw.blue << 8) |
              FULL_ALPHA;
          }

          textureUint32Array[pos] = packedPixel;
        }
      }
    }
  }

  isPointOnLeftSide(x, y, currentLine) {
    const dx = x - currentLine.startVertex.x;

    const dy = y - currentLine.startVertex.y;

    const lineDx = currentLine.endVertex.x - currentLine.startVertex.x;
    const lineDy = currentLine.endVertex.y - currentLine.startVertex.y;

    const result = Math.round(dx * lineDy - dy * lineDx);

    return result <= 0;
  }

  reset(levelData, dataObjects) {}
}
