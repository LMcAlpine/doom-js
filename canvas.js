class Canvas {
  constructor(canvasID) {
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
  }

  clearCanvas() {
    //  console.log("Clearing canvas...");
    for (let i = 0; i < this.canvasBuffer.data.length; i += 4) {
      this.canvasBuffer.data[i] = 0;
      this.canvasBuffer.data[i + 1] = 0;
      this.canvasBuffer.data[i + 2] = 0;
      this.canvasBuffer.data[i + 3] = 0;
    }
  }

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

  updateCanvas() {
    this.ctx.putImageData(this.canvasBuffer, 0, 0);
  }

  drawBoundingBox(boundingBox, color, minY, minX, scaleX, scaleY) {
    // upper y coordinate
    const top = remapYToScreen(boundingBox.top, minY, scaleY);

    // lower y coordinate
    const bottom = remapYToScreen(boundingBox.bottom, minY, scaleY);

    // lower x coordinate
    const left = remapXToScreen(boundingBox.left, minX, scaleX);

    //upper x coordinate
    const right = remapXToScreen(boundingBox.right, minX, scaleX);

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

  drawLine(point0, point1, color = [0, 255, 255]) {
    // slope or change
    let dx = Math.trunc(point1.x - point0.x);
    let dy = Math.trunc(point1.y - point0.y);
    // To see if there are more values of x to draw than values of y
    if (Math.abs(dx) > Math.abs(dy)) {
      // The line is horizontal-ish. Make sure it's left to right.
      ({ point0, point1 } = swap(dx, point0, point1));

      // Compute the Y values and draw.
      const yValues = interpolate(
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
      ({ point0, point1 } = swap(dy, point0, point1));

      // Compute the X values and draw.
      const xValues = interpolate(
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

  drawVertices(vertices) {
    let { maxX, minX, maxY, minY } = calculateMinMax(vertices);

    const { scaleX, scaleY } = calculateScale2D(maxX, minX, maxY, minY);

    vertices.forEach((vertex) => {
      const drawX = remapXToScreen(vertex.x, minX, scaleX);
      const drawY = remapYToScreen(vertex.y, minY, scaleY);
      this.putPixel(drawX, drawY, [255, 255, 255]);
    });
  }

  drawLinedefs(linedefs, vertices) {
    const scaleData = calculateScale(vertices);

    linedefs.forEach((linedef) => {
      const vertexPair = convertToScreenCoordinates(
        vertices,
        linedef.startVertex,
        linedef.endVertex,
        scaleData
      );

      const p1 = vertexPair.v1;
      const p2 = vertexPair.v2;
      this.drawLine(p1, p2);
    });
  }

  drawSegs(segs, vertices) {
    const scaleData = calculateScale(vertices);

    segs.forEach((seg) => {
      const vertexPair = convertToScreenCoordinates(
        vertices,
        seg.startingVertexNumber,
        seg.endingVertexNumber,
        scaleData
      );

      const p1 = vertexPair.v1;
      const p2 = vertexPair.v2;
      this.drawLine(p1, p2, [
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
      ]);
      this.updateCanvas();
    });
  }
}
