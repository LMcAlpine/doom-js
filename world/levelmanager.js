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


    // this.visplanes.forEach(visplane => {
    //   let test = this.flatManager.flatPool.get(visplane.textureName);

    //   for (let i = visplane.minX; i <= visplane.maxX; i++) {
    //     let topY = visplane.top[i];
    //     let bottomY = visplane.bottom[i];

    //     if (topY <= bottomY) {
    //       // Iterate through each row from top to bottom within this column
    //       for (let y = topY; y <= bottomY; y++) {
    //         let screenPosition = y * CANVASWIDTH + i;

    //         // gameEngine.canvas.screenBuffer[screenPosition] = 0xFF0000FF;
    //         console.log(`Drawing pixel at screen position (${i}, ${y}) with color (${visplane.color})`);
    //         gameEngine.canvas.screenBuffer[screenPosition] = visplane.color;
    //       }
    //     }
    //   }
    //   gameEngine.canvas.updateCanvas();

    // })

    this.visplanes.forEach(visplane => {
      for (let i = 0; i < CANVASWIDTH; i++) {
        // Draw the top pixel
        let topY = visplane.top[i];
        if (topY >= 0 && topY < CANVASHEIGHT) {
          let topScreenPosition = topY * CANVASWIDTH + i;
          gameEngine.canvas.screenBuffer[topScreenPosition] = 0xFF0000FF; // Red color for top pixels
          gameEngine.canvas.updateCanvas();
        }
        // gameEngine.canvas.updateCanvas();

        //Draw the bottom pixel
        let bottomY = visplane.bottom[i];
        if (bottomY >= 0 && bottomY < CANVASHEIGHT) {
          let bottomScreenPosition = bottomY * CANVASWIDTH + i;
          gameEngine.canvas.screenBuffer[bottomScreenPosition] = 0xFFFF0000; // Blue color for bottom pixels
          gameEngine.canvas.updateCanvas();
        }
      }
     // gameEngine.canvas.updateCanvas();
    });




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
