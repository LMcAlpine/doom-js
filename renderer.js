class Renderer {
  constructor(canvasID, marginMultiplier = 2) {
    const canvas = document.getElementById(canvasID);
    this.ctx = canvas.getContext("2d");
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    this.marginMultiplier = marginMultiplier;
    console.log(MyGame);

    this.margin = 10; // The size of the margin you want to keep
    this.marginsPerSide = 2;
  }

  drawVertices(vertices) {
    let { maxX, minX, maxY, minY } = this.calculateMinMax(vertices);

    const { scaleX, scaleY } = this.calculateScale2D(maxX, minX, maxY, minY);

    vertices.forEach((vertex) => {
      const drawX = this.remapXToScreen(vertex, minX, scaleX);
      const drawY = this.remapYToScreen(vertex, minY, scaleY);
      putPixel(drawX, drawY, [190, 0, 210]);
      updateCanvas();
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

      const drawX = this.remapXToScreen(vertex1, minX, scaleX);
      const drawY = this.remapYToScreen(vertex1, minY, scaleY);

      const drawX2 = this.remapXToScreen(vertex2, minX, scaleX);
      const drawY2 = this.remapYToScreen(vertex2, minY, scaleY);
      this.drawLine({ x: drawX, y: drawY }, { x: drawX2, y: drawY2 });
      updateCanvas();
    });
  }

  remapYToScreen(vertex, minY, scaleY) {
    return this.canvasHeight - this.margin - (vertex.y - minY) * scaleY;
  }

  remapXToScreen(vertex, minX, scaleX) {
    return this.margin + (vertex.x - minX) * scaleX;
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

  drawLine(point0, point1) {
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
        putPixel(x, yValues[(x - point0.x) | 0], [190, 0, 210]);
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
        putPixel(xValues[(y - point0.y) | 0], y, [190, 0, 210]);
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
