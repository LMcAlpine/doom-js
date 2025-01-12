const gameEngine = new GameEngine("myCanvas", 50);
const ENDIAN = getSystemEndianness();

// Check system endianness
function getSystemEndianness() {
  const buffer = new ArrayBuffer(2);
  new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
  return new Int16Array(buffer)[0] === 256;
}

(function () {
  let selectedValue = "E1M1";

  function onFileSelected(file) {
    // console.log("File selected in main:", file.name);
    initializeGameData(file);
  }

  function onLevelSelected(value) {
    selectedValue = value;
  }

  DOMUI.init(onFileSelected, onLevelSelected);

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
    gameEngine.lumpData = lumpData;
    // Setup palette and textures
    const { palette, texture } = setupTextureAndPalettes(lumpData);

    // Setup vertices and scaling
    let vertices = levels.vertices;
    let { maxX, minX, maxY, minY } = calculateMinMax(vertices);
    const { scaleX, scaleY } = calculateScale2D(maxX, minX, maxY, minY);

    // Initialize canvas and player
    initializeCanvasAndPlayer(levels, scaleX, scaleY, minX, minY);

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

  function setupTextureAndPalettes(lumpData) {
    const palette = new ReadPalette(lumpData);
    const texture = new Textures(lumpData);

    gameEngine.palette = palette;
    gameEngine.textures = texture;

    return { palette, texture };
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

  function initializeCanvasAndPlayer(levels, scaleX, scaleY, minX, minY) {
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
  }
})();
