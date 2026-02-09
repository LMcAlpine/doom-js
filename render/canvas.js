class Canvas {
  constructor(canvasID) {
    const canvas = document.getElementById(canvasID);
    this.ctx = canvas.getContext("2d");

    this.canvasBuffer = this.ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    );
    this.canvasPitch = this.canvasBuffer.width * 4;
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;

    this.screenImageData = this.ctx.createImageData(
      canvas.width,
      canvas.height,
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
    const { screenBuffer, canvasWidth } = this;
    // Clamp once (avoid out-of-bounds & JIT deopts)
    const W = canvasWidth;
    const H = this.canvasHeight; // ensure you have this
    x1 = x1 | 0;
    y1 = y1 | 0;
    x2 = x2 | 0;
    y2 = y2 | 0;
    if (x1 < 0) x1 = 0;
    else if (x1 >= W) x1 = W - 1;
    if (x2 < 0) x2 = 0;
    else if (x2 >= W) x2 = W - 1;
    if (y1 < 0) y1 = 0;
    else if (y1 >= H) y1 = H - 1;
    if (y2 < 0) y2 = 0;
    else if (y2 >= H) y2 = H - 1;

    // Pack once
    const r = color[0] | 0,
      g = color[1] | 0,
      b = color[2] | 0;
    const rgba = (255 << 24) | (b << 16) | (g << 8) | r;

    if (x1 === x2) {
      // Vertical: walk the buffer with a stride
      let y = y1,
        end = y2;
      if (y > end) {
        const t = y;
        y = end;
        end = t;
      }
      let idx = y * W + x1;
      const step = W;
      for (; y <= end; y++, idx += step) screenBuffer[idx] = rgba;
      return;
    }

    if (y1 === y2) {
      // Horizontal: contiguous write
      let x = x1,
        end = x2;
      if (x > end) {
        const t = x;
        x = end;
        end = t;
      }
      let idx = y1 * W + x;
      for (; x <= end; x++, idx++) screenBuffer[idx] = rgba;
      return;
    }

    // Bresenham (integer math, no extra table lookups)
    let dx = Math.abs(x2 - x1),
      sx = x1 < x2 ? 1 : -1;
    let dy = -Math.abs(y2 - y1),
      sy = y1 < y2 ? 1 : -1;
    let err = dx + dy;

    while (true) {
      screenBuffer[y1 * W + x1] = rgba;
      if (x1 === x2 && y1 === y2) break;
      const e2 = err << 1;
      if (e2 >= dy) {
        err += dy;
        x1 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y1 += sy;
      }
    }
  }

  drawSolidCircle(cx, cy, radius, color) {
    const { screenBuffer, canvasWidth: W, canvasHeight: H, ylookup } = this;

    cx = cx | 0;
    cy = cy | 0;
    radius = radius | 0;
    if (radius <= 0) return;

    // Pack once (same packing style as your drawLine)
    const r = color[0] | 0,
      g = color[1] | 0,
      b = color[2] | 0;
    const rgba = (255 << 24) | (b << 16) | (g << 8) | r;

    // Fill a horizontal segment on a single scanline y
    const fillSpan = (y, x0, x1) => {
      if (y < 0 || y >= H) return;
      if (x0 > x1) {
        const t = x0;
        x0 = x1;
        x1 = t;
      }

      if (x1 < 0 || x0 >= W) return;
      if (x0 < 0) x0 = 0;
      if (x1 >= W) x1 = W - 1;

      let idx = (ylookup ? ylookup[y] : y * W) + x0;
      for (let x = x0; x <= x1; x++) screenBuffer[idx++] = rgba;
    };

    // Midpoint circle algorithm + span filling
    let x = radius;
    let y = 0;
    let err = 1 - x;

    while (x >= y) {
      // For each (x,y), fill the 4 unique scanlines with appropriate spans
      fillSpan(cy + y, cx - x, cx + x);
      fillSpan(cy - y, cx - x, cx + x);
      fillSpan(cy + x, cx - y, cx + y);
      fillSpan(cy - x, cx - y, cx + y);

      y++;
      if (err < 0) {
        err += (y << 1) + 1;
      } else {
        x--;
        err += ((y - x) << 1) + 1;
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
