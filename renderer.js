class Renderer {
  constructor(canvasID, marginMultiplier = 2) {
    const canvas = document.getElementById(canvasID);
    this.ctx = canvas.getContext("2d");
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    this.marginMultiplier = marginMultiplier;
    console.log(MyGame);
  }

  drawVertices(vertices) {
    // let minX = Infinity,
    //   maxX = -Infinity,
    //   minY = Infinity,
    //   maxY = -Infinity;

    // vertices.forEach((element) => {
    //   minX = Math.min(minX, element.x);
    //   maxX = Math.max(maxX, element.x);
    //   minY = Math.min(minY, element.y);
    //   maxY = Math.max(maxY, element.y);
    // });
    let { maxX, minX, maxY, minY } = this.calculateMinMax(vertices);

    const margin = 10; // The size of the margin you want to keep
    const marginsPerSide = 2;
    const scaleX = (this.canvasWidth - marginsPerSide * margin) / (maxX - minX);
    const scaleY =
      (this.canvasHeight - marginsPerSide * margin) / (maxY - minY);
    const scale = Math.min(scaleX, scaleY);
    const rectangleSize = 1 / scale;
    vertices.forEach((element) => {
      const drawX = margin + (element.x - minX) * scaleX;
      const drawY = this.canvasHeight - margin - (element.y - minY) * scaleY;
      putPixel(drawX, drawY, [190, 0, 210]);
      updateCanvas();
      //  this.ctx.fillRect(drawX, drawY, rectangleSize, rectangleSize);
    });
  }

  drawLinedefs(linedefs, vertices) {
    let { maxX, minX, maxY, minY } = this.calculateMinMax(vertices);

    const margin = 10; // The size of the margin you want to keep
    const marginsPerSide = 2;
    const scaleX = (this.canvasWidth - marginsPerSide * margin) / (maxX - minX);
    const scaleY =
      (this.canvasHeight - marginsPerSide * margin) / (maxY - minY);
    const scale = Math.min(scaleX, scaleY);

    linedefs.forEach((linedef) => {
      // console.log(linedef.startVertex);
      //console.log(linedef.endVertex);
      // these above are indices into which vertex
      // i need to use these indices to access the vertices and to draw a line between those two points
      const vertex1 = vertices[linedef.startVertex];
      const vertex2 = vertices[linedef.endVertex];
      console.log(vertex1);
      console.log(vertex2);
      let drawX = margin + (vertex1.x - minX) * scaleX;
      let drawY = this.canvasHeight - margin - (vertex1.y - minY) * scaleY;
      // putPixel(drawX, drawY, [190, 0, 210]);
      // updateCanvas();
      let drawX2 = margin + (vertex2.x - minX) * scaleX;
      let drawY2 = this.canvasHeight - margin - (vertex2.y - minY) * scaleY;
      this.drawLine({ x: drawX, y: drawY }, { x: drawX2, y: drawY2 });
      updateCanvas();

      // this.ctx.beginPath();
      // this.ctx.moveTo(drawX, drawY);
      // drawX = margin + (vertex2.x - minX) * scaleX;
      // drawY = this.canvasHeight - margin - (vertex2.y - minY) * scaleY;
      // this.ctx.lineTo(drawX, drawY);
      // this.ctx.stroke();
      // I need to convert these vertices to fit into screenspace
    });
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
    let dx = Math.trunc(point1.x - point0.x);
    let dy = Math.trunc(point1.y - point0.y);
    if (Math.abs(dx) > Math.abs(dy)) {
      // The line is horizontal-ish. Make sure it's left to right.
      if (dx < 0) {
        const swap = point0;
        point0 = point1;
        point1 = swap;
      }

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
      if (dy < 0) {
        const swap = point0;
        point0 = point1;
        point1 = swap;
      }

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

  interpolate(i0, d0, i1, d1) {
    if (i0 === i1) {
      return [d0];
    }
    let values = [];
    let slope = (d1 - d0) / (i1 - i0);
    let d = d0;
    for (let i = i0; i <= i1; i++) {
      values.push(d);
      d = d + slope;
    }
    return values;
  }
}
