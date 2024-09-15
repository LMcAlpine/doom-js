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
      this.linkedSubsectors[i] = {
        sector:
          segmentData.segs[levelsData.subsectors[i].firstSegNumber].frontsector,
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

    this.visplanes = this.wallRenderer.visplanes;

    this.flatManager = flatManager;

    this.subsector = subsector;

    this.segs = data.segObjects;
    this.subsectors = levels.subsectors;
    this.linedefs = levels.linedefs;
    this.vertices = levels.vertices;
    this.nodes = levels.nodes;
    this.things = levels.things;

    this.spanstart = [];
    this.spanstop = [];

    this.yslope = [];
    let dy;
    for (let i = 0; i < CANVASWIDTH; i++) {
      dy = Math.abs(i - CANVASWIDTH / 2);
      this.yslope[i] = CANVASWIDTH / 2 / dy;
    }
  }

  draw() {
    this.wallRenderer.solidsegs = this.solidSegsManager.clearSolidsegs(
      this.wallRenderer.solidsegs
    );
    this.wallRenderer.initClipHeights();

    this.wallRenderer.clearVisplanes();
    this.wallRenderer.clearDrawSegs();

    let z;
    for (let i = 0; i < this.things.length; i++) {
      if (this.things[i].flag & SPAWNCEILING) {
        z = Number.MAX_SAFE_INTEGER;
      } else {
        z = Number.MIN_SAFE_INTEGER;
      }

      // link into subsector
      let subsectorID = this.nodes.length - 1;

      while (!this.bspTraversal.isSubsector(subsectorID)) {
        let isOnLeft = this.bspTraversal.isPointOnLeftSide(
          this.things[i].x,
          this.things[i].y,
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

      if (!(this.things[i].flag & NOSECTOR)) {
        let sector = subsector.sector;
      }
    }

    this.bspTraversal.traverseBSP(this.nodes.length - 1);

    traverseBSP = true;
    traverseCount = 0;

    for (let i = 0; i < this.wallRenderer.visplanes.length; i++) {
      let visplane = this.wallRenderer.visplanes[i];

      let textureWidthSky;
      let textureHeightSky;
      let textureDataSky;
      if (visplane.textureName === "F_SKY1") {
        let ep = selectedValue[1];
        let skyname;
        switch (Number(ep)) {
          case 1:
            skyname = "SKY1";
            break;
          case 2:
            skyname = "SKY2";
            break;
          case 3:
            skyname = "SKY3";
          case 4:
            skyname = "SKY4";
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

    for (let i = this.wallRenderer.drawSegments.length - 1; i >= 0; i--) {
      if (this.wallRenderer.drawSegments[i].maskedTextureCol) {
        console.log("draw masked");
        let x1 = this.wallRenderer.drawSegments[i].x1;
        let x2 = this.wallRenderer.drawSegments[i].x2;

        let currentLine = this.wallRenderer.drawSegments[i].currentLine;
        let frontSector = currentLine.rightSidedef.sector;
        let backSector = currentLine.leftSidedef.sector;

        let textureName = currentLine.rightSidedef.middleTexture;
        let maskedTextureCol =
          this.wallRenderer.drawSegments[i].maskedTextureCol;
        let rwScaleStep = this.wallRenderer.drawSegments[i].scaleStep;
        // spryscale
        //mfloorclip
        //mceilingclip
        let textureMid;
        let indexOfName =
          textureName !== "-"
            ? this.wallRenderer.textureManager.texturePool.get(textureName)
                .textureIndex
            : -1;
        let textureHeight = this.wallRenderer.textures[indexOfName].height;

        if (currentLine.flag & 16) {
          textureMid =
            frontSector.floorHeight > backSector.floorHeight
              ? frontSector.floorHeight
              : backSector.floorHeight;
          textureMid = textureMid + textureHeight - gameEngine.player.z;
        } else {
          textureMid =
            frontSector.ceilingHeight < backSector.ceilingHeight
              ? frontSector.ceilingHeight
              : backSector.ceilingHeight;
        }
        textureMid += currentLine.rightSidedef.yOffset;

        for (let x = x1; x <= x2; x++) {}
      }
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
}
