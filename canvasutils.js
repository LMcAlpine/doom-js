// const canvas = document.getElementById("myCanvas");
// const ctx = canvas.getContext("2d");
// let canvasBuffer = ctx.getImageData(0, 0, canvas.width, canvas.height);
// let canvasPitch = canvasBuffer.width * 4;

// function putPixel(x, y, color) {
//   // x = canvas.width / 2 + x;
//   // y = canvas.height / 2 - y - 1;
//   x = Math.round(x); // Round the x-coordinate to the nearest integer
//   y = Math.round(y); // Round the y-coordinate to the nearest integer

//   if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
//     return;
//   }

//   let offset = 4 * x + canvasPitch * y;
//   canvasBuffer.data[offset++] = color[0];
//   canvasBuffer.data[offset++] = color[1];
//   canvasBuffer.data[offset++] = color[2];
//   canvasBuffer.data[offset++] = 255; // Alpha = 255 (full opacity)
// }

// let updateCanvas = function () {
//   ctx.putImageData(canvasBuffer, 0, 0);
// };
