const gameEngine = new GameEngine("myCanvas", 50);

const ENDIAN = (() => {
  // Determines the system's endianness (little-endian or big-endian).
  // This is necessary for correctly interpreting binary data, such as WAD files.
  const buffer = new ArrayBuffer(2);
  new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
  return new Int16Array(buffer)[0] === 256;
})();

// DOM Elements
let levelSelect = document.getElementById("levels");
let selectedValue = "E1M1";
levelSelect.addEventListener("change", function () {
  selectedValue = this.value;
  console.log("Selected level:", selectedValue);
});

document
  .getElementById("fileInput")
  .addEventListener("change", handleFileInput);

async function handleFileInput(event) {
  const file = event.target.files[0];
  if (!file) {
    console.error("No file selected.");
    return;
  }
  initializeGameData(file);
}

async function initializeGameData(file) {
  let skyTextureName = "SKY1";

  gameEngine.skyTextureName = skyTextureName;

  const wadFileReader = new WADFileReader(file);
  const arrayBuffer = await wadFileReader.readFile();
  const wadParser = new WADParser(arrayBuffer);
  const lumpData = await wadParser.parse();
  const levelParser = new LevelParser(lumpData);
  const levels = levelParser.parse(selectedValue);

  setupGameEngine(levels, lumpData);
}

function setupGameEngine(levels, lumpData) {
  // Setup palette and textures
  const palette = new ReadPalette(lumpData);
  const texture = new Textures(lumpData);

  gameEngine.lumpData = lumpData;
  gameEngine.palette = palette;
  gameEngine.textures = texture;

  // Setup vertices and scaling
  let vertices = levels.vertices;
  let { maxX, minX, maxY, minY } = calculateMinMax(vertices);
  const { scaleX, scaleY } = calculateScale2D(maxX, minX, maxY, minY);

  // Initialize canvas and player
  const canvas = new Canvas("myCanvas");
  const player = new Player(
    levels.things[0],
    { minX: minX, minY: minY },
    { scaleX: scaleX, scaleY: scaleY },
    90,
    41
  );
  gameEngine.addEntity(player);
  gameEngine.player = player;
  gameEngine.canvas = canvas;
  gameEngine.ctx = canvas.ctx;

  const patchNames = new PatchNames(lumpData);
  gameEngine.patchNames = patchNames;

  const dataObjects = setupLevelData(levels);

  const textureManager = new TextureManager(
    texture.maptextures,
    palette.palettes[0]
  );
  const flatManager = new FlatManager(lumpData, palette.palettes[0]);

  let sprites = flatManager.getFlatData(lumpData, "S_START", "S_END");

  startIndex = lumpData.findIndex((lump) => lump.name === "S_START") + 1;
  endIndex = lumpData.findIndex((lump) => lump.name === "S_END") - 1;

  let patch;
  let spriteWidth = [];
  let spriteOffset = [];
  let spriteTopOffset = [];
  for (let i = 0; i < sprites.length; i++) {
    patch = patchNames.parsePatchHeader(sprites[i].name);
    spriteWidth[i] = patch.width;
    spriteOffset[i] = patch.leftOffset;
    spriteTopOffset[i] = patch.topOffset;
  }

  let spriteName;
  let frame;
  let rotation;

  startIndex--;
  endIndex++;

  for (let i = 0; i < spriteNames.length; i++) {
    maxFrame = -1;
    for (let j = startIndex + 1; j < endIndex; j++) {
      let sprite = lumpData[j].name;

      if (sprite.startsWith(spriteNames[i])) {
        spriteName = sprite;
        frame = sprite[4].charCodeAt(0) - "A".charCodeAt(0);
        rotation = sprite[5] - "0";

        // install sprite

        installSpriteLump(j, frame, rotation, false);

        if (sprite.length > 6) {
          if (sprite[6]) {
            frame = sprite[6].charCodeAt(0) - "A".charCodeAt(0);
            rotation = sprite[7] - "0";
            // install sprite

            installSpriteLump(j, frame, rotation, true);
          }
        }
      }
    }
    maxFrame++;

    theSprites[i].framesCount = maxFrame;
    theSprites[i].spriteFrames = spriteTemp;
  }

  const levelManager = new LevelManager(
    levels,
    dataObjects,
    textureManager,
    flatManager
  );
  gameEngine.levelManager = levelManager;
  gameEngine.init();

  gameEngine.start();
}

function setupLevelData(levels) {
  const sectorObjects = buildSectors(levels.sectors);
  const sidedefObjects = buildSidedefs(levels.sidedefs, sectorObjects);
  const linedefObjects = buildLinedefs(
    levels.linedefs,
    levels.vertices,
    sidedefObjects
  );
  const segObjects = buildSegs(levels.segs, levels.vertices, linedefObjects);
  const thingObjects = buildThings(levels.things);

  return {
    sectorObjects,
    sidedefObjects,
    linedefObjects,
    segObjects,
    thingObjects,
  };
}
