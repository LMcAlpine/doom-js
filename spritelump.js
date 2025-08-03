let startIndex;
let endIndex;
let maxFrame = -1;

let theSprites = new Map();

let spriteTemp = [];

const MAX_FRAMES = 29;
const MAX_ROTATION = 8;

for (let i = 0; i < MAX_FRAMES; i++) {
  spriteTemp[i] = new SpriteFrame();
}

function installSpriteLump(lump, frame, rotation, flipped) {
  if (frame >= MAX_FRAMES || rotation > MAX_ROTATION) {
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
    for (let i = 0; i < MAX_ROTATION; i++) {
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
