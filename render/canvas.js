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
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    // for (let i = 0; i < this.canvasBuffer.data.length; i += 4) {
    //   this.canvasBuffer.data[i] = 0;
    //   this.canvasBuffer.data[i + 1] = 0;
    //   this.canvasBuffer.data[i + 2] = 0;
    //   this.canvasBuffer.data[i + 3] = 0;
    // }
  }

  putPixel(x, y, color, targetBuffer = null) {
    x = Math.round(x); // Round the x-coordinate to the nearest integer
    y = Math.round(y); // Round the y-coordinate to the nearest integer

    if (x < 0 || x >= this.canvasWidth || y < 0 || y >= this.canvasHeight) {
      return;
    }

    let buffer = targetBuffer ? targetBuffer : this.canvasBuffer;
    let offset = 4 * x + this.canvasPitch * y;
    buffer.data[offset++] = color[0];
    buffer.data[offset++] = color[1];
    buffer.data[offset++] = color[2];
    buffer.data[offset++] = 255;
    this.canvasBuffer.data[offset++] = 255; // Alpha = 255 (full opacity)
  }

  // drawWallCol(
  //   offscreenCtx,
  //   texture,
  //   textureColumn,
  //   x,
  //   y1,
  //   y2,
  //   textureAlt,
  //   invScale,
  //   lightLevel
  // ) {
  //   if (y1 < y2) {
  //     let textureWidth = texture.width;
  //     let textureHeight = texture.height;
  //     textureColumn = Math.trunc(textureColumn) % textureWidth;
  //     let textureY = textureAlt + (y1 - HALFHEIGHT) * invScale;

  //     //  let imageData = offscreenCtx.getImageData(textureColumn, Math.trunc(textureY)%textureHeight, 1, 1);
  //     let imageData = offscreenCtx.getImageData(
  //       0,
  //       0,
  //       textureWidth,
  //       textureHeight
  //     );
  //     // let data = imageData.data;

  //     for (let i = y1; i <= y2; i++) {
  //       //let column
  //       // let column = the column in this texture ?
  //       // let column = offscreenCtx.getImageData(
  //       //   textureColumn,
  //       //   Math.trunc(textureY) % textureHeight,
  //       //   1,
  //       //   1
  //       // );
  //       // console.log(column);
  //       let texPixel = offscreenCtx.getImageData(
  //         textureColumn,
  //         Math.trunc(textureY) % textureHeight,
  //         1,
  //         1
  //       ).data;

  //       // texPixel[0] *= lightLevel;
  //       // texPixel[1] *= lightLevel;
  //       // texPixel[2] *= lightLevel;

  //       //  this.putPixel(x, i, texPixel);
  //       this.ctx.fillStyle = `rgb(${texPixel[0]},${texPixel[1]},${texPixel[2]})`;
  //       this.ctx.fillRect(x, i, 1, 1);

  //       textureY += invScale;
  //     }

  //     // for (let iy = y1; iy <= y2; iy++) {
  //     //   let idx = (iy - y1) * 4;
  //     //   let col = offscreenCtx.getImageData(
  //     //     textureColumn,
  //     //     textureY % textureHeight,
  //     //     1,
  //     //     1
  //     //   ).data;

  //     //   data[idx] = col[0] * lightLevel;
  //     //   data[idx + 1] = col[1] * lightLevel;
  //     //   data[idx + 2] = col[2] * lightLevel;
  //     //   data[idx + 3] = 255; // Assuming full alpha

  //     //   textureY += invScale;
  //     // }

  //     // this.ctx.putImageData(imageData, x, y1);
  //   }
  // }

  drawWallCol(
    offscreenCtx,
    texture,
    textureColumn,
    x,
    y1,
    y2,
    textureAlt,
    invScale,
    lightLevel
  ) {
    if (y1 < y2) {
      const textureWidth = texture.width;
      const textureHeight = texture.height;
      textureColumn = Math.trunc(textureColumn) % textureWidth;
  
      const entireTextureData = offscreenCtx.getImageData(0, 0, textureWidth, textureHeight).data;
      const columnData = offscreenCtx.getImageData(x, y1, 1, y2 - y1);
      
      let textureY = textureAlt + (y1 - HALFHEIGHT) * invScale;
  
      for (let i = 0; i < columnData.data.length; i += 4) {
        const texY = Math.trunc(textureY) % textureHeight;
        const texPos = (texY * textureWidth + textureColumn) * 4;
  
        columnData.data[i] = entireTextureData[texPos];
        columnData.data[i + 1] = entireTextureData[texPos + 1];
        columnData.data[i + 2] = entireTextureData[texPos + 2];
        columnData.data[i + 3] = 255; // Assuming full alpha
  
        textureY += invScale;
      }
  
      this.ctx.putImageData(columnData, x, y1);
    }
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
}
