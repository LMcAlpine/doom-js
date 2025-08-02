// const gameEngine = new GameEngine("myCanvas", 50);
let gameEngine = null;
let textureManager = null;
let flatManager = null;
let spriteManager = null;

// Check system endianness
function getSystemEndianness() {
  const buffer = new ArrayBuffer(2);
  new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
  return new Int16Array(buffer)[0] === 256;
}

const ENDIAN = getSystemEndianness();

this.canvasWidth = document.getElementById("myCanvas").width;
this.canvasHeight = document.getElementById("myCanvas").height;

const CANVASWIDTH = this.canvasWidth;
const CANVASHEIGHT = this.canvasHeight;

this.margin = 10; // The size of the margin
this.marginsPerSide = 2;

// Credit to room4doom for this value
const SKY_TEXTURE_MULTIPLIER = 2.8444;

const MAXSCALE = 64.0;
const MINSCALE = 0.00390625;

const HALFWIDTH = this.canvasWidth / 2;
const HALFHEIGHT = this.canvasHeight / 2;

const FOV = 90;
const HALFFOV = FOV / 2;

const ONFLOORZ = Number.MIN_SAFE_INTEGER;
const ONCEILINGZ = Number.MAX_SAFE_INTEGER;

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

const SPAWNCEILING = 256;
const NOSECTOR = 8;

const FRACBITS = 16;
const FRACUNIT = 1 << FRACBITS;
const TABLE_SIZE = 65536; // full circle in fine angles
let finetangent = new Int32Array(TABLE_SIZE);

for (let i = 0; i < TABLE_SIZE; i++) {
  let angleRadians = (i * 2 * Math.PI) / TABLE_SIZE;
  let t = Math.tan(angleRadians);
  let fixedT = Math.floor(t * FRACUNIT);
  finetangent[i] = fixedT;
}

function degreesToFineAngle(deg) {
  return Math.floor((deg / 360) * TABLE_SIZE) & (TABLE_SIZE - 1);
}

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

  let sinea = Math.abs(Math.sin(degreesToRadians(anglea.angle)));
  let sineb = Math.abs(Math.sin(degreesToRadians(angleb.angle)));

  let p = screenwidth / 2.0;
  let num = p * sineb;
  let den = realWallDistance * sinea;
  let scale = num / den;
  if (scale > 64) {
    scale = 64;
  } else if (scale < 0.0039) {
    // 256 in fixed-point corresponds to about 0.0039 in floating point
    scale = 0.0039;
  }
  return scale;
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

const debugCanvas = document.getElementById("debugCanvas");
const debugCtx = debugCanvas.getContext("2d");

function drawDebugText(x, y, text, color) {
  clearDebugOverlay(); // Clear previous frame
  debugCtx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  debugCtx.font = "10px Arial";
  debugCtx.textBaseline = "top"; // Align text properly
  debugCtx.fillText(text, x, y);
}

function drawDebugTextWrapped(x, y, text, color) {
  clearDebugOverlay();
  const maxWidth = 300;
  const lineHeight = 12;
  const words = text.split(" ");
  let line = "";

  debugCtx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  debugCtx.font = "10px Arial";
  debugCtx.textBaseline = "top";

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const testWidth = debugCtx.measureText(testLine).width;
    if (testWidth > maxWidth && i > 0) {
      debugCtx.fillText(line, x, y); // Draw the current line
      line = words[i] + " "; // Start a new line
      y += lineHeight; // Move to the next vertical position
    } else {
      line = testLine;
    }
  }
  debugCtx.fillText(line, x, y); // Draw the last line
}

function clearDebugOverlay() {
  debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
}

function getSpriteData() {}

let startIndex;
let endIndex;
let maxFrame = -1;

// let theSprites = [];
// for (let i = 0; i < spriteNames.length; i++) {
//   theSprites[i] = new SpriteDef();
// }

let theSprites = new Map();
// for (let i = 0; i < spriteNames.length; i++) {
//   theSprites.set("SPR_" + spriteNames[i], new SpriteDef(-1, []));
// }

let spriteTemp = [];

for (let i = 0; i < 29; i++) {
  spriteTemp[i] = new SpriteFrame();
}

function installSpriteLump(lump, frame, rotation, flipped) {
  if (frame >= 29 || rotation > 8) {
    console.log("Bad frame characters");
    return;
  }

  if (frame > maxFrame) {
    maxFrame = frame;
  }

  if (rotation === 0) {
    if (spriteTemp[frame].rotate !== undefined) {
      if (spriteTemp[frame].rotate === false) {
        console.log(`frame ${frame} has multiple rotation=0 lump`);
        return;
      }
      if (spriteTemp[frame].rotate === true) {
        console.log(`frame ${frame} has rotations and a rotation=0 lump`);
        return;
      }
    }

    spriteTemp[frame].rotate = false;
    for (let i = 0; i < 8; i++) {
      spriteTemp[frame].lump[i] = lump - startIndex;
      spriteTemp[frame].flip[i] = flipped;
    }
    return;
  }

  if (spriteTemp[frame].rotate === false) {
    console.log(`frame ${frame} has rotations and a rotation=0 lump`);
    return;
  }

  spriteTemp[frame].rotate = true;

  // make rotation 0 based
  rotation--;
  if (spriteTemp[frame].lump[rotation] != -1) {
    console.log(`Sprite has two lumps mapped to it`);
    return;
  }

  spriteTemp[frame].lump[rotation] = lump - startIndex;
  spriteTemp[frame].flip[rotation] = flipped;
}

function parseLevelName(levelName) {
  const doom1Regex = /^E(\d)+M(\d+)$/i;

  let match = levelName.match(doom1Regex);
  if (match) {
    return {
      game: "DOOM1",
      episode: parseInt(match[1], 10),
      map: parseInt(match[2], 10),
      originalName: levelName,
    };
  }

  // const doom2Regex = /^MAP(\d+)$/i;
  // match = levelName.match(doom2Regex);
  // if (match) {
  //   return {
  //     game: "DOOM2",
  //     episode: null,
  //     map: parseInt(match[1], 10),
  //     originalName: levelName,
  //   };
  // }

  return {
    game: "UNKNOWN",
    episode: null,
    map: null,
    originalName: levelName,
  };
}

let vissprites = [];

function createVissprite(x1, x2, scale, texture, textureMid) {
  const vis = new Vissprite(x1, x2, scale, texture, textureMid);
  vissprites.push(vis);
}

let validCount = 1;

const SIL_TOP = 2;
const SIL_BOTTOM = 1;
const SIL_BOTH = 3;

function createSpriteClipArrays(sprite) {
  // const numColumns = sprite.x2 - sprite.x1 + 1;
  const numColumns = 320;
  // const cliptop = new Array(numColumns).fill(-2);
  // const clipbot = new Array(numColumns).fill(-2);
  const cliptop = new Array(numColumns);
  const clipbot = new Array(numColumns);
  for (let x = sprite.x1; x <= sprite.x2; x++) {
    clipbot[x] = -2;
    cliptop[x] = -2;
  }
  return { cliptop, clipbot };
}

function updateSpriteClipArrays(sprite, wall, clipArrays) {
  const { cliptop, clipbot } = clipArrays;
  // Calculate overlapping horizontal range:
  const r1 = Math.max(wall.x1, sprite.x1);
  const r2 = Math.min(wall.x2, sprite.x2);
  if (r1 > r2) return; // No overlap

  const startIndex = r1 - sprite.x1;
  const endIndex = r2 - sprite.x1;

  // Adjust silhouette based on vertical extents and wall boundaries:
  let silhouette = wall.silhouette;
  if (sprite.gz >= wall.bsilheight) {
    silhouette &= ~SIL_BOTTOM;
  }
  // if (sprite.gzt <= wall.tsilheight) {
  //   silhouette &= ~SIL_TOP;
  // }

  // Update clip arrays over the overlapping range:
  for (let i = startIndex; i <= endIndex; i++) {
    if (
      (silhouette === SIL_BOTTOM || silhouette === SIL_BOTH) &&
      clipbot[i] === -2
    ) {
      clipbot[i] = wall.sprbottomclip[i]; // wall's precomputed bottom clip for this column
    }
    if (
      (silhouette === SIL_TOP || silhouette === SIL_BOTH) &&
      cliptop[i] === -2
    ) {
      cliptop[i] = wall.sprtopclip[i]; // wall's precomputed top clip for this column
    }
  }
}

function finalizeClipArrays(clipArrays, viewHeight) {
  const { cliptop, clipbot } = clipArrays;
  for (let i = 0; i < cliptop.length; i++) {
    if (cliptop[i] === -2) cliptop[i] = -1;
    if (clipbot[i] === -2) clipbot[i] = viewHeight;
  }
}
