this.canvasWidth = document.getElementById("myCanvas").width;
this.canvasHeight = document.getElementById("myCanvas").height;

const CANVASWIDTH = this.canvasWidth;
const CANVASHEIGHT = this.canvasHeight;

this.margin = 10; // The size of the margin
this.marginsPerSide = 2;

const MAXSCALE = 64.0;
const MINSCALE = 0.00390625;

const HALFWIDTH = this.canvasWidth / 2;
const HALFHEIGHT = this.canvasHeight / 2;

const FOV = 90;
const HALFFOV = FOV / 2;

// const FRACBITS = 16;
// const FRACUNIT = 1 << FRACBITS;

const ANG45 = 0x20000000;
const ANG90 = 0x40000000;
const ANG180 = 0x80000000;
const ANG270 = 0xc0000000;
const ANG_MAX = 0xffffffff;

const ANG1 = ANG45 / 45;
const ANG60 = ANG180 / 3;

let traverseBSP;
let traverseCount = 0;

const SCREENDISTANCE = HALFWIDTH / Math.tan(degreesToRadians(HALFFOV));

// temp
let floorPlane;
let ceilingPlane;

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

function calculateScale(vertices) {
  const { maxX, minX, maxY, minY } = calculateMinMax(vertices);

  const { scaleX, scaleY } = calculateScale2D(maxX, minX, maxY, minY);
  return {
    scale: { scaleX, scaleY },
    min: { x: minX, y: minY },
  };
}

function convertToScreenCoordinates(vertices, startIndex, endIndex, data) {
  const v1 = vertices[startIndex];
  const v2 = vertices[endIndex];

  const drawX = remapXToScreen(v1.x, data.min.x, data.scale.scaleX);
  const drawY = remapYToScreen(v1.y, data.min.y, data.scale.scaleY);

  const drawX2 = remapXToScreen(v2.x, data.min.x, data.scale.scaleX);
  const drawY2 = remapYToScreen(v2.y, data.min.y, data.scale.scaleY);

  return { v1: { x: drawX, y: drawY }, v2: { x: drawX2, y: drawY2 } };
}

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function radiansToDegrees(radians) {
  return radians * (180 / Math.PI);
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return hash;
}

function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function getRandomInt(min, max, seed) {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
}

// function angleToX(angle) {
//   let SCREENDISTANCE = gameEngine.canvas.canvasWidth / 2.0 + 1.0;
//   let x = 0;
//   if (angle > 90) {
//     angle = new Angle(angle - 90);

//     x =
//       SCREENDISTANCE - Math.tan(degreesToRadians(angle.angle)) * SCREENDISTANCE;
//   } else {
//     angle = Angle.subtract(90, angle);
//     x = Math.tan(degreesToRadians(angle.angle)) * SCREENDISTANCE;
//     x += SCREENDISTANCE;
//   }
//   return Math.floor(x);
// }
function angleToX(angle) {
  let SCREENDISTANCE = gameEngine.canvas.canvasWidth / 2.0 + 1.0;
  angle = new Angle(angle - 90);
  return Math.floor(
    SCREENDISTANCE - Math.tan(degreesToRadians(angle.angle)) * SCREENDISTANCE
  );
  // if (angle > 90) {
  //   angle = new Angle(angle - 90);

  //   x =
  //     SCREENDISTANCE - Math.tan(degreesToRadians(angle.angle)) * SCREENDISTANCE;
  // } else {
  //   angle = Angle.subtract(90, angle);
  //   x = Math.tan(degreesToRadians(angle.angle)) * SCREENDISTANCE;
  //   x += SCREENDISTANCE;
  // }
  //return Math.floor(x);
}

function getXToAngle(x) {
  let angleRad = Math.atan((HALFWIDTH - x) / SCREENDISTANCE);
  return angleRad * (180 / Math.PI); // Convert radians to degrees
}

function areCloseEnough(a, b, epsilon = 1e-6) {
  return Math.abs(a - b) < epsilon;
}
function playerDistToScreen(screenWidth) {
  return screenWidth / 2.0 / Math.tan(degreesToRadians(45));
}

function screenToXView(x, screenWidth) {
  return Math.atan((screenWidth / 2.0 - x) / playerDistToScreen(screenWidth));
}

function scaleFromViewAngle(
  visangle,
  realWallNormalAngle,
  realWallDistance,
  viewangle,
  screenwidth
) {
  let anglea = new Angle(RIGHT_ANGLE_DEGREES + (visangle - viewangle));
  let angleb = new Angle(
    RIGHT_ANGLE_DEGREES + (visangle - realWallNormalAngle)
  );

  let sinea = Math.sin(degreesToRadians(anglea.angle));
  let sineb = Math.sin(degreesToRadians(angleb.angle));

  let p = screenwidth / 2.0;
  let num = p * sineb;
  let den = realWallDistance * sinea;
  return num / den;
}

function isPowerOfTwo(number) {
  return (number & (number - 1)) === 0;
}

function adjustColorComponent(component, lightLevel) {
  return Math.min(255, Math.max(0, Math.floor(component * lightLevel)));
}

// flats
// function adjustColorComponent(color, lightLevel) {
//   return Math.min(255, Math.floor(color * lightLevel));
// }
