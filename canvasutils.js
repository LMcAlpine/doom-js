this.canvasWidth = document.getElementById("myCanvas").width;
this.canvasHeight = document.getElementById("myCanvas").height;

this.margin = 10; // The size of the margin you want to keep
this.marginsPerSide = 2;

function calculateScale2D(maxX, minX, maxY, minY) {
  const scaleX =
    (this.canvasWidth - this.marginsPerSide * this.margin) / (maxX - minX);
  const scaleY =
    (this.canvasHeight - this.marginsPerSide * this.margin) / (maxY - minY);
  return { scaleX, scaleY };
}

function remapYToScreen(yCoordinate, minY, scaleY) {
  return this.canvasHeight - this.margin - (yCoordinate - minY) * scaleY;
}

function remapXToScreen(xCoordinate, minX, scaleX) {
  return this.margin + (xCoordinate - minX) * scaleX;
}

function calculateMinMax(vertices) {
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

function swap(d, point0, point1) {
  if (d < 0) {
    const swap = point0;
    point0 = point1;
    point1 = swap;
  }
  return { point0, point1 };
}

function interpolate(i0, d0, i1, d1) {
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
