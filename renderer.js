class Renderer {
  constructor(canvasID) {
    const canvas = document.getElementById(canvasID);
    this.ctx = canvas.getContext("2d");
  }

  // I need to normalize the vertices coordinates so they fit within the screen

  // I need to find the minimum x and y values from the set of all vertices

  // subtract the current x and y coordinate from the min ?

  //let min = vertices
  drawVertices(vertices) {
    console.log(vertices);
    let minX = vertices[0].x;
    let minY = vertices[0].y;
    // console.log(min);
    console.log(minX);
    console.log(minY);
    vertices.forEach((element) => {
      // console.log(element);
      if (minX > element.x) {
        minX = element.x;
      }
      if (minY > element.y) {
        minY = element.y;
      }
    });

    console.log(minX);
    console.log(minY);

    vertices.forEach((element) => {
      this.ctx.fillRect(
        (element.x + -minX) / 10,
        600 - 1 - (element.y + -minY) / 10,
        3,
        3
      );
    });

    //this.ctx.fillRect(100, 100, 50, 50);
    // console.log("Hello!!!");
  }
}
