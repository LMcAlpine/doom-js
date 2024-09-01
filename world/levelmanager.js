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
      this.linkedSubsectors[i] = { sector: segmentData.segs[levelsData.subsectors[i].firstSegNumber].frontsector, ...levelsData.subsectors[i] }
    }


    const subsector = new Subsector(levelsData, segmentData, this.wallRenderer, this.linkedSubsectors);
    this.bspTraversal = new BSPTraversal(levels, subsector);

    this.visplanes = this.wallRenderer.visplanes;

    this.flatManager = flatManager;



    this.subsector = subsector;

    this.segs = data.segObjects;
    this.subsectors = levels.subsectors;
    this.linedefs = levels.linedefs;
    this.vertices = levels.vertices;
    this.nodes = levels.nodes;

    this.spanstart = [];
    this.spanstop = [];

    this.yslope = [];
    let dy;
    for (let i = 0; i < CANVASWIDTH; i++) {
      dy = Math.abs((i - CANVASWIDTH / 2))
      this.yslope[i] = (CANVASWIDTH / 2) / dy;
    }
  }

  draw() {
    this.wallRenderer.solidsegs = this.solidSegsManager.clearSolidsegs(
      this.wallRenderer.solidsegs
    );
    this.wallRenderer.initClipHeights();

    this.wallRenderer.clearVisplanes();

    // gameEngine.canvas.clearCanvas();
    // this.wallRenderer.drawTexture();
    // this.wallRenderer.drawFlat();

    this.bspTraversal.traverseBSP(this.nodes.length - 1);
    // gameEngine.canvas.offScreenCtx.font = "50px Arial";
    // gameEngine.canvas.offScreenCtx.fillStyle = "blue";
    // gameEngine.canvas.offScreenCtx.fillText(
    //   `FPS ${gameEngine.logic.ticks.length}`,
    //   400,
    //   50
    // );

    // gameEngine.canvas.offScreenCtx.fillRect(100, 100, 200, 200);
    //gameEngine.canvas.updateCanvas();
    traverseBSP = true;
    // console.log(traverseCount);
    traverseCount = 0;

    // for (let i = 0; i < this.wallRenderer.visplanes.length; i++) {
    //   let visplane = this.wallRenderer.visplanes[i];
    //   let flat = this.flatManager.flatPool.get(visplane.textureName);
    //   for (let j = visplane.minX; j <= visplane.maxX; j++) {
    //     let topY = visplane.top[j];
    //     let bottomY = visplane.bottom[j];

    //     if (topY <= bottomY) {
    //       // Draw lines to visualize the top and bottom boundaries
    //       // let screenPositionTop = topY * CANVASWIDTH + j;
    //       // let screenPositionBottom = bottomY * CANVASWIDTH + j;

    //       // gameEngine.canvas.screenBuffer[screenPositionTop] = 0xFF0000FF;  // Red for top
    //       // gameEngine.canvas.screenBuffer[screenPositionBottom] = 0xFFFF0000; // Blue for bottom



    //       // Iterate through each row from top to bottom within this column
    //       for (let y = topY; y < bottomY; y++) {
    //         let screenPosition = y * CANVASWIDTH + j;
    //         gameEngine.canvas.screenBuffer[screenPosition] = visplane.color;
    //       }
    //     }
    //   }
    //   // gameEngine.canvas.updateCanvas();
    // }

    for (let i = 0; i < this.wallRenderer.visplanes.length; i++) {
      let visplane = this.wallRenderer.visplanes[i];



      let textureWidthSky;
      let textureHeightSky;
      let textureDataSky;
      if (visplane.textureName === "F_SKY1") {

        let r = this.wallRenderer.textureManager.texturePool.get("SKY1");
        textureWidthSky = r.textureWidth;
        textureHeightSky = r.textureHeight;
        textureDataSky = r.textureImageData;

        for (let x = visplane.minX; x <= visplane.maxX; x++) {
          let topY = visplane.top[x];
          let bottomY = visplane.bottom[x];

          if (topY <= bottomY) {

            // for (let y = topY; y < bottomY; y++) {
            //   let screenPosition = y * CANVASWIDTH + x;
            //   gameEngine.canvas.screenBuffer[screenPosition] = 0xFFFF0000;
            // }
            // gameEngine.canvas.updateCanvas();

            let textureColumn = (gameEngine.player.direction.angle + getXToAngle(x)) * 2.8444; // Random number. No idea. Credit to room4doom for the random number

            this.wallRenderer.drawColumn(CANVASHEIGHT / 2, topY, bottomY, 1, textureColumn, textureWidthSky, textureHeightSky, textureDataSky, x, 1);
            //  gameEngine.canvas.updateCanvas();
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
          let playerDirectionX = Math.cos(degreesToRadians(gameEngine.player.direction.angle));
          let playerDirectionY = Math.sin(degreesToRadians(gameEngine.player.direction.angle));

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

            gameEngine.canvas.screenBuffer[screenPosition] = (a << 24) | (b << 16) | (g << 8) | r;

          }
        }
      }

      //gameEngine.canvas.updateCanvas();
    }

    //     // Draw the top pixel
    //     // let topY = visplane.top[i];
    //     // if (topY >= 0 && topY < CANVASHEIGHT) {
    //     //   let topScreenPosition = topY * CANVASWIDTH + i;
    //     //   gameEngine.canvas.screenBuffer[topScreenPosition] = 0xFF0000FF; // Red color for top pixels
    //     //   gameEngine.canvas.updateCanvas();
    //     // }
    //     // // gameEngine.canvas.updateCanvas();

    //     // //Draw the bottom pixel
    //     // let bottomY = visplane.bottom[i];
    //     // if (bottomY >= 0 && bottomY < CANVASHEIGHT) {
    //     //   let bottomScreenPosition = bottomY * CANVASWIDTH + i;
    //     //   gameEngine.canvas.screenBuffer[bottomScreenPosition] = 0xFFFF0000; // Blue color for bottom pixels
    //     //   gameEngine.canvas.updateCanvas();
    //     // }
    //   }
    //   // gameEngine.canvas.updateCanvas();
    // };



  }

  mapPlane(y, x1, x2) {



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
