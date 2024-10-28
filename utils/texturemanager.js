class TextureManager {
  constructor(textures, palette) {
    this.textures = textures;
    this.palette = palette;
    this.texturesMap = new Map();
    this.textures.forEach((texture, index) => {
      this.texturesMap.set(texture.name, index);
    });

    this.texturePool = new Map();
    this.initializeTextures();
  }

  initializeTextures() {
    this.textures.forEach((texture, index) => {
      if (texture.name !== "-") {
        let textureProperties = this.cacheTexture(texture.name, index);
        this.texturePool.set(texture.name, textureProperties);
      }
    });
  }

  calculateTextureIndex(textureName) {
    let index;

    if (textureName !== "-") {
      index = this.texturesMap.get(textureName);
    }
    return index;
  }

  cacheTexture(wallTexture, textureIndex) {
    let textureImageData;

    let textureWidth;
    let textureHeight;
    let columns;
    // cache the texture
    if (!this.texturePool.has(wallTexture)) {
      let result = this.drawTexture(textureIndex);

      textureImageData = result.textureImageData;
      textureWidth = result.textureWidth;
      textureHeight = result.textureHeight;
      columns = result.columnsArray;
      this.texturePool.set(wallTexture, {
        textureWidth,
        textureHeight,
        textureImageData,
        columns,
      });
    } else {
      const cachedTexture = this.texturePool.get(wallTexture);

      textureWidth = cachedTexture.textureWidth;
      textureHeight = cachedTexture.textureHeight;

      textureImageData = cachedTexture.textureImageData;
      columns = cachedTexture.columnsArray;
    }
    return {
      textureWidth,
      textureHeight,
      textureImageData,
      textureIndex,
      columns,
    };
  }

  // drawPatch(columns, xStart, yStart, textureWidth, textureImageData) {
  //     const maxColumns = Math.min(columns.length, textureWidth - xStart);

  //     for (let i = 0; i < maxColumns; i++) {
  //         const column = columns[i];
  //         for (let j = 0; j < column.length; j++) {
  //             const post = column[j];
  //             for (let k = 0; k < post.data.length; k++) {
  //                 const pixel = post.data[k];
  //                 const pixelDraw = this.palette[pixel];
  //                 const x = xStart + i;
  //                 const y = yStart + post.topDelta + k;
  //                 const pos = (y * textureWidth + x) * 4;

  //                 textureImageData[pos] = pixelDraw.red;
  //                 textureImageData[pos + 1] = pixelDraw.green;
  //                 textureImageData[pos + 2] = pixelDraw.blue;
  //                 textureImageData[pos + 3] = FULL_ALPHA; // Assuming full alpha

  //             }
  //         }
  //     }
  // }

  drawPatch(columns, xStart, yStart, textureWidth, textureUint32Array) {
    const maxColumns = Math.min(columns.length, textureWidth - xStart);

    for (let i = 0; i < maxColumns; i++) {
      const column = columns[i];
      for (let j = 0; j < column.length; j++) {
        const post = column[j];
        for (let k = 0; k < post.data.length; k++) {
          const pixelIndex = post.data[k];
          const pixelDraw = this.palette[pixelIndex];
          const x = xStart + i;
          const y = yStart + post.topDelta + k;
          const pos = y * textureWidth + x;

          let packedPixel;
          if (ENDIAN) {
            // Correctly pack RGBA into a single Uint32 value for little-endian systems
            // ABGR (little-endian)
            packedPixel =
              (FULL_ALPHA << 24) |
              (pixelDraw.blue << 16) |
              (pixelDraw.green << 8) |
              pixelDraw.red;
          } else {
            packedPixel =
              (pixelDraw.red << 24) |
              (pixelDraw.green << 16) |
              (pixelDraw.blue << 8) |
              FULL_ALPHA;
          }

          textureUint32Array[pos] = packedPixel;
        }
      }
    }
  }

  drawTexture(indexOfName) {
    let textureWidth = this.textures[indexOfName].width;
    let textureHeight = this.textures[indexOfName].height;

    // seems redundant?
    let textureImageObj = new ImageData(textureWidth, textureHeight);
    // let textureImageData = textureImageObj.data;
    let textureUint32Array = new Uint32Array(textureImageObj.data.buffer);
    let columnsArray;

    for (let j = 0; j < this.textures[indexOfName].patches.length; j++) {
      const patches = this.textures[indexOfName].patches;
      const xStart = this.textures[indexOfName].patches[j].originX;
      const yStart = this.textures[indexOfName].patches[j].originY;

      const header = gameEngine.patchNames.parsePatchHeader(
        gameEngine.patchNames.names[patches[j].patchNumber].toUpperCase()
      );

      const columns = gameEngine.patchNames.parsePatchColumns(
        header.columnOffsets,
        header,
        gameEngine.patchNames.names[patches[j].patchNumber].toUpperCase()
      );
      //columnsArray[j] = columns;
      columnsArray = columns;
      this.drawPatch(columns, xStart, yStart, textureWidth, textureUint32Array);
    }

    return {
      textureWidth,
      textureHeight,
      textureImageData: textureUint32Array,
      columnsArray,
    };
  }

  getTextureInfo(textureName) {
    if (textureName !== "-" && this.texturePool.has(textureName)) {
      let textureInfo = this.texturePool.get(textureName);
      return {
        textureWidth: textureInfo.textureWidth,
        textureHeight: textureInfo.textureHeight,
        textureData: textureInfo.textureImageData,
        columns: textureInfo.columns,
      };
    } else {
      // Return default values or null if the texture doesn't exist
      return {
        textureWidth: null,
        textureHeight: null,
        textureData: null,
        columns: null,
      };
    }
  }
}
