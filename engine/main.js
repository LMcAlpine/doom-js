const gameEngine = new GameEngine("myCanvas", 50);

// Check system endianness
function getSystemEndianness() {
  const buffer = new ArrayBuffer(2);
  new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
  return new Int16Array(buffer)[0] === 256;
}

const ENDIAN = getSystemEndianness();

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

  // Setup game data objects
  const dataObjects = setupLevelData(levels);

  const patchNames = new PatchNames(lumpData);
  gameEngine.patchNames = patchNames;

  // Setup texture managers
  const textureManager = new TextureManager(
    texture.maptextures,
    palette.palettes[0]
  );
  const flatManager = new FlatManager(lumpData, palette.palettes[0]);

  const spriteManager = new SpriteManager(lumpData);

  // Process sprites
  // processSprites(spriteManager, lumpData);
  spriteManager.processSprites();

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
