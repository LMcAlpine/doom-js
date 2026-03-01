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

    this.screenImageData = this.ctx.createImageData(
      canvas.width,
      canvas.height
    );
    this.screenBuffer = new Uint32Array(this.screenImageData.data.buffer);

    this.ylookup = [];
    for (let i = 0; i < canvas.height; i++) {
      this.ylookup[i] = i * this.canvasWidth;
    }
  }

  clearCanvas() {
    this.screenBuffer.fill(0);
  }

  updateCanvas() {
    this.ctx.putImageData(this.screenImageData, 0, 0);
    
  }

  drawLine(x1, y1, x2, y2, color) {
    const { screenBuffer, ylookup, canvasWidth } = this;
    const [red, green, blue] = color; // Color as [R, G, B]
    const rgbaColor = (255 << 24) | (blue << 16) | (green << 8) | red;

    // Vertical Line
    if (x1 === x2) {
      const startY = Math.min(y1, y2);
      const endY = Math.max(y1, y2);
      for (let y = startY; y <= endY; y++) {
        const dest = ylookup[y] + x1;
        screenBuffer[dest] = rgbaColor;
      }
    }
    // Horizontal Line
    else if (y1 === y2) {
      const startX = Math.min(x1, x2);
      const endX = Math.max(x1, x2);
      const row = ylookup[y1];
      for (let x = startX; x <= endX; x++) {
        screenBuffer[row + x] = rgbaColor;
      }
    }
    // Diagonal/Bresenham's Line Algorithm (Optional for non-axis-aligned lines)
    else {
      const dx = Math.abs(x2 - x1);
      const dy = Math.abs(y2 - y1);
      const sx = x1 < x2 ? 1 : -1;
      const sy = y1 < y2 ? 1 : -1;
      let err = dx - dy;

      while (true) {
        const dest = ylookup[y1] + x1;
        screenBuffer[dest] = rgbaColor;

        if (x1 === x2 && y1 === y2) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x1 += sx;
        }
        if (e2 < dx) {
          err += dx;
          y1 += sy;
        }
      }
    }
  }

  drawRect(x1, y1, x2, y2, color) {
    this.drawLine(x1, y1, x2, y1, color); // Top
    this.drawLine(x1, y2, x2, y2, color); // Bottom
    this.drawLine(x1, y1, x1, y2, color); // Left
    this.drawLine(x2, y1, x2, y2, color); // Right
  }

  drawText(x, y, text, color) {
    const { ctx } = this;
    ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    ctx.font = "10px Arial";
    ctx.fillText(text, x, y);
  }
}
