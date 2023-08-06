class Renderer {
  constructor(canvasID, marginMultiplier = 2, levels) {
    const canvas = document.getElementById(canvasID);
    this.ctx = canvas.getContext("2d");

    this.canvasBuffer = this.ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
    this.canvasPitch = this.canvasBuffer.width * 4;
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;

    this.canvasID = canvasID;
    this.marginMultiplier = marginMultiplier;
    // console.log(MyGame);

    this.things = levels.things;
    console.log(this.things);
    this.player = this.things[0];
    console.log(this.player);

    this.linedefs = levels.linedefs;
    this.vertices = levels.vertices;
    this.nodes = levels.nodes;

    this.margin = 10; // The size of the margin you want to keep
    this.marginsPerSide = 2;

    this.count = 0;
    this.visitedNodes = [];

    this.backCanvas = document.createElement("canvas");
    this.backCanvas.width = this.canvasWidth;
    this.backCanvas.height = this.canvasHeight;
    this.backCanvasCtx = this.backCanvas.getContext("2d");
    this.backCanvasBuffer = this.backCanvasCtx.getImageData(
      0,
      0,
      this.backCanvas.width,
      this.backCanvas.height
    );

    this.backCanvasPitch = this.backCanvasBuffer.width * 4;
    this.x = 0;
    this.y = 0;

    this.boundingBoxesDrawn = [];

    this.isTraversalDone = false;
  }

  // New method to clear the canvas buffer
  // clearCanvas() {
  //   console.log("Clearing canvas...");
  //   // this.backCanvasCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  //   for (let i = 0; i < this.backCanvasBuffer.data.length; i += 4) {
  //     this.backCanvasBuffer.data[i] = 255;
  //     this.backCanvasBuffer.data[i + 1] = 255;
  //     this.backCanvasBuffer.data[i + 2] = 255;
  //     this.backCanvasBuffer.data[i + 3] = 255;
  //   }
  //   // this.backCanvasCtx.putImageData(this.backCanvasBuffer, 0, 0);
  //   this.swapBuffers();
  //   this.updateCanvas();
  // }

  // clearCanvas() {
  //   console.log("Clearing canvas...");
  //   for (let i = 0; i < this.backCanvasBuffer.data.length; i += 4) {
  //     this.backCanvasBuffer.data[i] = 255;
  //     this.backCanvasBuffer.data[i + 1] = 255;
  //     this.backCanvasBuffer.data[i + 2] = 255;
  //     this.backCanvasBuffer.data[i + 3] = 255;
  //   }
  // }
  clearCanvas() {
    console.log("Clearing canvas...");
    // this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    // for (let i = 0; i < this.backCanvasBuffer.data.length; i += 4) {
    //   this.canvasBuffer.data[i] = 255;
    //   this.canvasBuffer.data[i + 1] = 255;
    //   this.canvasBuffer.data[i + 2] = 255;
    //   this.canvasBuffer.data[i + 3] = 255;
    // }
  }

  // putPixel(x, y, color) {
  //   // x = canvas.width / 2 + x;
  //   // y = canvas.height / 2 - y - 1;
  //   x = Math.round(x); // Round the x-coordinate to the nearest integer
  //   y = Math.round(y); // Round the y-coordinate to the nearest integer

  //   if (
  //     x < 0 ||
  //     x >= this.backCanvas.width ||
  //     y < 0 ||
  //     y >= this.backCanvas.height
  //   ) {
  //     return;
  //   }

  //   let offset = 4 * x + this.backCanvasPitch * y;
  //   this.backCanvasBuffer.data[offset++] = color[0];
  //   this.backCanvasBuffer.data[offset++] = color[1];
  //   this.backCanvasBuffer.data[offset++] = color[2];
  //   this.backCanvasBuffer.data[offset++] = 255; // Alpha = 255 (full opacity)
  // }
  putPixel(x, y, color) {
    // x = canvas.width / 2 + x;
    // y = canvas.height / 2 - y - 1;
    x = Math.round(x); // Round the x-coordinate to the nearest integer
    y = Math.round(y); // Round the y-coordinate to the nearest integer

    if (x < 0 || x >= this.canvasWidth || y < 0 || y >= this.canvasHeight) {
      return;
    }

    let offset = 4 * x + this.canvasPitch * y;
    this.canvasBuffer.data[offset++] = color[0];
    this.canvasBuffer.data[offset++] = color[1];
    this.canvasBuffer.data[offset++] = color[2];
    this.canvasBuffer.data[offset++] = 255; // Alpha = 255 (full opacity)
  }
  // swapBuffers() {
  //   console.log("Swapping buffers...");
  //   let temp = this.canvasBuffer;
  //   this.canvasBuffer = this.backCanvasBuffer;
  //   this.backCanvasBuffer = temp;
  // }

  // swapBuffers() {
  //   console.log("Swapping buffers...");
  //   // need to create a deep copy
  //   let tempBuffer = structuredClone(this.canvasBuffer);
  //   console.log("temp buffer which should be all zeros?");
  //   console.log(tempBuffer);
  //   this.canvasBuffer.data.set(this.backCanvasBuffer.data);
  //   console.log("temp buffer 2 which now should be all zero");
  //   console.log(tempBuffer);
  //   this.backCanvasBuffer.data.set(tempBuffer.data);
  //   for (let i = 0; i < this.backCanvasBuffer.data.length; i += 4) {
  //     this.backCanvasBuffer.data[i] = 255;
  //     this.backCanvasBuffer.data[i + 1] = 255;
  //     this.backCanvasBuffer.data[i + 2] = 255;
  //     this.backCanvasBuffer.data[i + 3] = 255;
  //   }
  // }

  // updateCanvas() {
  //   // this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  //   const imageData = this.ctx.createImageData(100, 100);
  //   // Iterate through every pixel
  //   for (let i = 0; i < imageData.data.length; i += 4) {
  //     // Modify pixel data
  //     imageData.data[i + 0] = 190; // R value
  //     imageData.data[i + 1] = 0; // G value
  //     imageData.data[i + 2] = 210; // B value
  //     imageData.data[i + 3] = 255; // A value
  //   }

  //   // Draw image data to the canvas
  //   this.ctx.putImageData(imageData, this.x, this.y);

  //   this.ctx.putImageData(this.canvasBuffer, 0, 0);
  // }

  updateCanvas() {
    this.ctx.putImageData(this.canvasBuffer, 0, 0);
  }

  /**
   * Determines if a given point is on the left side of the splitter line.
   * Uses the cross product to calculate the direction of a vector based on player's position and the splitter line.
   *
   * @param {number} xPosition - The player's X position.
   * @param {number} yPosition - The player's Y position.
   * @param {object} nodeID - The node object containing the splitter line's coordinates and direction.
   * @param {number} nodeID.partitionLineX - The X coordinate of the splitter line.
   * @param {number} nodeID.partitionLineY - The Y coordinate of the splitter line.
   * @param {number} nodeID.changeInY - The distance to move in the Y direction to go to the end of the splitter line.
   * @param {number} nodeID.changeInX - The distance to move in the X direction to go to the end of the splitter line.
   * @returns {boolean} True if the point is on the left side of the splitter line, false otherwise.
   */

  isPointOnLeftSide(xPosition, yPosition, nodeID) {
    const dx = xPosition - nodeID.partitionLineX;

    const dy = yPosition - nodeID.partitionLineY;

    const result = Math.round(dx * nodeID.changeInY - dy * nodeID.changeInX);

    return result <= 0;
  }

  isSubsector(node) {
    return (node & 0xffff8000) != 0;
  }

  getSubsector(node) {
    return node ^ 0xffff8000;
  }

  renderBSPNode(nodeID) {
    if (this.isTraversalDone) return;
    // check for is this node a leaf node.
    if (this.isSubsector(nodeID)) {
      this.isTraversalDone = true;
      // getSubsector gives the number of subsector
      // this ID is passed into the renderSubsector method
      //this.renderSubsector(this.getSubsector(nodeID), ctx);
      //  console.log("subsector found");
      if (this.count === 0) {
        // this.visitedNodes.push(nodeID);
        this.count = 1;
      }

      return;
    }

    // console.log(this.visitedNodes);
    const bsp = this.nodes[nodeID];

    //1056,-3616
    // console.log(this.player.xPosition);
    // console.log(this.player.yPosition);
    const isOnLeft = this.isPointOnLeftSide(
      this.player.xPosition,
      this.player.yPosition,
      bsp
    );

    //want to draw splitter
    // convert partitionLineX to screenSpace
    //convert partitionLineY to screenSpace

    let { maxX, minX, maxY, minY } = this.calculateMinMax(this.vertices);

    const { scaleX, scaleY } = this.calculateScale2D(maxX, minX, maxY, minY);

    const drawX = this.remapXToScreen(bsp.partitionLineX, minX, scaleX);
    const drawY = this.remapYToScreen(bsp.partitionLineY, minY, scaleY);
    const drawX2 = this.remapXToScreen(
      bsp.partitionLineX + bsp.changeInX,
      minX,
      scaleX
    );
    const drawY2 = this.remapYToScreen(
      bsp.partitionLineY + bsp.changeInY,
      minY,
      scaleY
    );

    this.drawLine(
      { x: drawX, y: drawY },
      { x: drawX2, y: drawY2 },
      [255, 255, 0]
    );
    //this.updateCanvas();

    // draw bounding boxes?
    // console.log(bsp.rightBoundingBox);

    // draw the bounding boxes but then clear them...?
    this.drawBoundingBox(
      bsp.leftBoundingBox,
      [255, 0, 0],
      minY,
      minX,
      scaleX,
      scaleY
    );
    this.drawBoundingBox(
      bsp.rightBoundingBox,
      [0, 255, 0],
      minY,
      minX,
      scaleX,
      scaleY
    );

    // traversing left
    if (isOnLeft) {
      // console.log(bsp.rightBoundingBox);

      // want to draw left bounding box

      this.renderBSPNode(bsp.leftChild);
      //  this.renderBSPNode(bsp.rightChild);
    } else {
      // traversing right

      this.renderBSPNode(bsp.rightChild);
      // this.renderBSPNode(bsp.leftChild);
    }
  }

  drawBoundingBox(boundingBox, color, minY, minX, scaleX, scaleY) {
    // upper y coordinate
    const top = this.remapYToScreen(boundingBox.top, minY, scaleY);

    // lower y coordinate
    const bottom = this.remapYToScreen(boundingBox.bottom, minY, scaleY);

    // lower x coordinate
    const left = this.remapXToScreen(boundingBox.left, minX, scaleX);

    //upper x coordinate
    const right = this.remapXToScreen(boundingBox.right, minX, scaleX);

    // Add this bounding box to the list of drawn bounding boxes
    this.boundingBoxesDrawn.push({ left, top, right, bottom });

    this.drawBox(left, top, right, bottom, color);
    //  this.updateCanvas();
  }
  drawBox(x1, y1, x2, y2, color) {
    // Ensure coordinates are integers
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    x2 = Math.round(x2);
    y2 = Math.round(y2);

    // Ensure the box is within the canvas
    if (
      x1 < 0 ||
      x1 >= this.canvasWidth ||
      y1 < 0 ||
      y1 >= this.canvasHeight ||
      x2 < 0 ||
      x2 >= this.canvasWidth ||
      y2 < 0 ||
      y2 >= this.canvasHeight
    ) {
      return;
    }

    // Draw top and bottom lines
    for (let x = x1; x <= x2; x++) {
      this.putPixel(x, y1, color);
      this.putPixel(x, y2, color);
    }

    // Draw left and right lines
    for (let y = y1; y <= y2; y++) {
      this.putPixel(x1, y, color);
      this.putPixel(x2, y, color);
    }
  }

  clearBoundingBoxes() {
    // Iterate over the bounding boxes and clear them
    for (const bbox of this.boundingBoxesDrawn) {
      this.ctx.clearRect(
        bbox.left,
        bbox.top,
        bbox.right - bbox.left,
        bbox.bottom - bbox.top
      );
    }
    // Clear the list of bounding boxes
    this.boundingBoxesDrawn = [];
  }

  drawVertices(vertices) {
    let { maxX, minX, maxY, minY } = this.calculateMinMax(vertices);

    const { scaleX, scaleY } = this.calculateScale2D(maxX, minX, maxY, minY);

    vertices.forEach((vertex) => {
      const drawX = this.remapXToScreen(vertex.x, minX, scaleX);
      const drawY = this.remapYToScreen(vertex.y, minY, scaleY);
      this.putPixel(drawX, drawY, [255, 255, 255]);
    });
  }

  calculateScale2D(maxX, minX, maxY, minY) {
    const scaleX =
      (this.canvasWidth - this.marginsPerSide * this.margin) / (maxX - minX);
    const scaleY =
      (this.canvasHeight - this.marginsPerSide * this.margin) / (maxY - minY);
    return { scaleX, scaleY };
  }

  drawLinedefs(linedefs, vertices) {
    let { maxX, minX, maxY, minY } = this.calculateMinMax(vertices);

    const { scaleX, scaleY } = this.calculateScale2D(maxX, minX, maxY, minY);

    linedefs.forEach((linedef) => {
      const vertex1 = vertices[linedef.startVertex];
      const vertex2 = vertices[linedef.endVertex];

      const drawX = this.remapXToScreen(vertex1.x, minX, scaleX);
      const drawY = this.remapYToScreen(vertex1.y, minY, scaleY);

      const drawX2 = this.remapXToScreen(vertex2.x, minX, scaleX);
      const drawY2 = this.remapYToScreen(vertex2.y, minY, scaleY);
      this.drawLine({ x: drawX, y: drawY }, { x: drawX2, y: drawY2 });
    });
  }

  remapYToScreen(yCoordinate, minY, scaleY) {
    return this.canvasHeight - this.margin - (yCoordinate - minY) * scaleY;
  }

  remapXToScreen(xCoordinate, minX, scaleX) {
    return this.margin + (xCoordinate - minX) * scaleX;
  }

  calculateMinMax(vertices) {
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    vertices.forEach((element) => {
      minX = Math.min(minX, element.x);
      maxX = Math.max(maxX, element.x);
      minY = Math.min(minY, element.y);
      maxY = Math.max(maxY, element.y);
    });
    return { maxX, minX, maxY, minY };
  }

  drawLine(point0, point1, color = [0, 255, 255]) {
    // slope or change
    let dx = Math.trunc(point1.x - point0.x);
    let dy = Math.trunc(point1.y - point0.y);
    // To see if there are more values of x to draw than values of y
    if (Math.abs(dx) > Math.abs(dy)) {
      // The line is horizontal-ish. Make sure it's left to right.
      ({ point0, point1 } = this.swap(dx, point0, point1));

      // Compute the Y values and draw.
      const yValues = this.interpolate(
        Math.trunc(point0.x),
        point0.y,
        Math.trunc(point1.x),
        point1.y
      );
      for (let x = point0.x; x <= point1.x; x++) {
        this.putPixel(x, yValues[(x - point0.x) | 0], color);
      }
    } else {
      // The line is verical-ish. Make sure it's bottom to top.
      ({ point0, point1 } = this.swap(dy, point0, point1));

      // Compute the X values and draw.
      const xValues = this.interpolate(
        Math.trunc(point0.y),
        point0.x,
        Math.trunc(point1.y),
        point1.x
      );
      for (let y = point0.y; y <= point1.y; y++) {
        this.putPixel(xValues[(y - point0.y) | 0], y, color);
      }
    }
  }

  swap(d, point0, point1) {
    if (d < 0) {
      const swap = point0;
      point0 = point1;
      point1 = swap;
    }
    return { point0, point1 };
  }

  interpolate(i0, d0, i1, d1) {
    if (i0 === i1) {
      return [d0];
    }
    let values = [];
    let slope = (d1 - d0) / (i1 - i0);
    let d = d0;
    for (let i = i0; i <= i1; i++) {
      values.push(d);
      // we know the d+1 point can be calculated by adding the slope to d.
      // avoids a multiplication
      d = d + slope;
    }
    return values;
  }
}
