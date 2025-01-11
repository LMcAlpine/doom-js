class SpriteManager {
  constructor(lumpData) {
    this.lumpData = lumpData;
  }

  getSprites(startMarker, endMarker) {
    const startIndex = this.getIndex(startMarker);
    const endIndex = this.getIndex(endMarker);

    return this.lumpData.slice(startIndex + 1, endIndex);
  }

  getIndex(marker) {
    return this.lumpData.findIndex((lump) => lump.name === marker);
  }

  processSprites() {
    let sprites = this.getSprites("S_START", "S_END");

    startIndex = this.getIndex("S_START") + 1;
    endIndex = this.getIndex("S_END") - 1;

    // let patch;
    // let spriteWidth = [];
    // let spriteOffset = [];
    // let spriteTopOffset = [];

    // for (let i = 0; i < sprites.length; i++) {
    //   patch = gameEngine.patchNames.parsePatchHeader(sprites[i].name);
    //   spriteWidth[i] = patch.width;
    //   spriteOffset[i] = patch.leftOffset;
    //   spriteTopOffset[i] = patch.topOffset;
    // }
    const { spriteWidth, spriteOffset, spriteTopOffset } =
      this.calculateOffsets(sprites);

    this.installSprites(spriteNames, startIndex, endIndex);
  }

  installSprites(spriteNames, startIndex, endIndex) {
    let spriteName;
    let frame;
    let rotation;

    startIndex--;
    endIndex++;

    for (let i = 0; i < spriteNames.length; i++) {
      maxFrame = -1;
      for (let j = startIndex + 1; j < endIndex; j++) {
        let sprite = this.lumpData[j].name;

        if (sprite.startsWith(spriteNames[i])) {
          spriteName = sprite;
          frame = sprite[4].charCodeAt(0) - "A".charCodeAt(0);
          rotation = sprite[5] - "0";

          installSpriteLump(j, frame, rotation, false);

          if (sprite.length > 6) {
            if (sprite[6]) {
              frame = sprite[6].charCodeAt(0) - "A".charCodeAt(0);
              rotation = sprite[7] - "0";

              installSpriteLump(j, frame, rotation, true);
            }
          }
        }
      }
      maxFrame++;

      theSprites[i].framesCount = maxFrame;
      theSprites[i].spriteFrames = spriteTemp;
    }
  }

  calculateOffsets(sprites) {
    let patch;
    let spriteWidth = [];
    let spriteOffset = [];
    let spriteTopOffset = [];

    for (let i = 0; i < sprites.length; i++) {
      patch = gameEngine.patchNames.parsePatchHeader(sprites[i].name);
      spriteWidth[i] = patch.width;
      spriteOffset[i] = patch.leftOffset;
      spriteTopOffset[i] = patch.topOffset;
    }

    return { spriteWidth, spriteOffset, spriteTopOffset };
  }
}
