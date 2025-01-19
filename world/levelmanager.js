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
    for (let i = 0; i < this.wallRenderer.visplanes.length; i++) {
      let visplane = this.wallRenderer.visplanes[i];

      let textureWidthSky;
      let textureHeightSky;
      let textureDataSky;
      if (visplane.textureName === "F_SKY1") {
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

        let r = this.wallRenderer.textureManager.texturePool.get(skyname);
        textureWidthSky = r.textureWidth;
        textureHeightSky = r.textureHeight;
        textureDataSky = r.textureImageData;

        for (let x = visplane.minX; x <= visplane.maxX; x++) {
          let topY = visplane.top[x];
          let bottomY = visplane.bottom[x];

          if (topY <= bottomY) {
            let textureColumn =
              (gameEngine.player.direction.angle + getXToAngle(x)) * 2.8444; // Random number. No idea. Credit to room4doom for the random number

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
        continue;
      }

      let flat = this.flatManager.flatPool.get(visplane.textureName);

      if (!flat) continue;

      const textureWidthFlat = flat.width;
      const textureHeightFlat = flat.height;
      const textureData = flat.data;

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
      }
    }

    // masked wall
    this.drawMasked();
  }

  drawMasked() {
    if (vissprites.length > 0) {
      let x1 = vissprites[0].x1;
      let x2 = vissprites[0].x2;

      let textureMid = vissprites[0].textureMid;

      let patch = gameEngine.lumpData[startIndex + vissprites[0].texture];

      const header = this.parsePatchHeader(patch);

      const columns = this.parsePatchColumns(
        header.columnOffsets,
        header,
        patch
      );

      let spriteYScale = vissprites[0].scale;

      let start = vissprites[0].start;

      for (let x = x1; x <= x2; x++) {
        let spritetopscreen = HALFHEIGHT - spriteYScale * textureMid;
        let inverseScale = 1.0 / spriteYScale;

        let column;

        let textureColumn = Math.floor(start);
        console.log(`Column ${x}: textureColumn=${textureColumn}`);
        if (textureColumn < 0 || textureColumn >= columns.length) {
          // skip or continue
          start += inverseScale; // keep the logic consistent
          continue;
        }

        column = columns[textureColumn];
        // console.log(columns.length + "\n");

        // Process each post in the texture column
        // console.log(start);
        // console.log(textureColumn);
        for (let j = 0; j < column.length; j++) {
          const post = column[j];

          let topscreen = spritetopscreen + spriteYScale * post.topDelta;

          let bottomscreen = topscreen + spriteYScale * post.length;

          let yl = Math.ceil(topscreen);
          let yh = Math.floor(bottomscreen);

          console.log(
            `Post top= ${topscreen} bottom= ${bottomscreen} (yl=${yl} yh=${yh})`
          );

          // Apply vertical clipping
          // if (yh >= floorClip[x]) {
          //   yh = floorClip[x] - 1;
          //   // yh = floorClip[x];
          // }
          // if (yl <= ceilingClip[x]) {
          //   yl = ceilingClip[x] + 1;
          // }

          for (let row = yl; row <= yh; row++) {
            let rowInPost = Math.floor((row - topscreen) / spriteYScale);

            if (rowInPost >= 0 && rowInPost < post.data.length) {
              let colorIndex = post.data[rowInPost];

              if (colorIndex !== 0) {
                let colorObj = gameEngine.palette.palettes[0][colorIndex];
                let r = colorObj.red;
                let g = colorObj.green;
                let b = colorObj.blue;
                let a = 255;

                let screenPos = row * CANVASWIDTH + x;
                gameEngine.canvas.screenBuffer[screenPos] =
                  (a << 24) | (b << 16) | (g << 8) | r;
              }
            }
          }
        }

        // spriteYScale += vissprites[0].xiscale;
        // so sprites can flip. xiscale is negative when it needs to flip
        start += vissprites[0].xiscale;

        //  start += inverseScale;
      }
    }

    for (let i = this.wallRenderer.drawSegments.length - 1; i >= 0; i--) {
      if (this.wallRenderer.drawSegments[i].maskedTextureCol) {
        //this.renderMaskedSegRange(i);
        //console.log("");
      }
    }
  }

  renderMaskedSegRange(i) {
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

    let spriteYScale = this.wallRenderer.drawSegments[i].scale1;
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
    // console.log(textureName);
    for (let x = x1; x <= x2; x++) {
      let spritetopscreen = HALFHEIGHT - spriteYScale * textureMid;
      let inverseScale = 1.0 / spriteYScale;

      let textureColumnIndex = maskedTextureCol[x];
      // console.log("Y Offset:", currentLine.rightSidedef.yOffset);
      // console.log(
      //   `x=${x}, maskedTextureCol=${textureColumnIndex}, textureMid=${textureMid}`
      // );
      // console.log(
      //   `X=${x}, spriteYScale=${spriteYScale}, rwScaleStep=${rwScaleStep}`
      // );
      if (textureColumnIndex != null) {
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

    // find which type to spawn
    for (i = 0; i < arr.length; i++) {
      // map maybe instead?
      if (mapThing.type == mapinfo[i].doomednum) {
        break;
      }
    }

    x = mapThing.xPosition;
    y = mapThing.yPosition;

    if (mapinfo[i].flags & 8) {
      z = ONCEILINGZ;
    } else {
      z = ONFLOORZ;
    }

    mapObject = this.spawnMapObject(x, y, z, i);

    mapObject.angle = Math.floor((mapThing.direction / 45) * 45);
  }

  spawnPlayer(mapThing) {
    console.log(mapThing + "player: do nothing");
    return;
  }

  spawnMapObject(x, y, z, type) {
    let mapObject = {};
    let info = mapinfo[type];

    mapObject.type = type;
    mapObject.info = info;
    mapObject.x = x;
    mapObject.y = y;
    mapObject.radius = info.radius;
    mapObject.height = info.height;
    mapObject.flags = info.flags;
    mapObject.health = info.spawnhealth;

    mapObject.angle;

    // set a temporary state...

    let state = {
      sprite: spriteMarkersNums.SPR_TROO,
      frame: 0,
      tics: 10,
      action: null,
      nextState: 0,
    };

    mapObject.state = state;

    mapObject.tics = state.tics;

    mapObject.sprite = state.sprite;

    mapObject.frame = state.frame;

    this.setThingPosition(mapObject);

    mapObject.floorz = mapObject.subsector.sector.floorHeight;
    mapObject.ceilingz = mapObject.subsector.sector.ceilingHeight;

    if (z == ONFLOORZ) {
      mapObject.z = mapObject.floorz;
    } else if (z == ONCEILINGZ) {
      mapObject.z = mapObject.ceilingz - mapinfo[i].height;
    } else {
      mapObject.z = z;
    }

    return mapObject;
  }

  setThingPosition(thing) {
    let subsec = this.pointInSubsector(thing.xPosition, thing.yPosition);
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

  reset(levelData, dataObjects) {}
}
