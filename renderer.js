class Renderer {
  constructor(canvasID, marginMultiplier = 2) {
    const canvas = document.getElementById(canvasID);
    this.ctx = canvas.getContext("2d");
    this.canvasWidth = canvas.width;
    this.canvasHeight = canvas.height;
    this.marginMultiplier = marginMultiplier;
  }

  drawVertices(vertices) {
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
      this.ctx.fillRect(drawX, drawY, rectangleSize, rectangleSize);
    });
  }
}
