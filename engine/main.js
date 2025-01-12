import { initDOM } from "../uimanager.js";

let lumpData = null;
let patchNames = null;
let paletteField = null;
let textureField = null;
let fileCheck = null;

function onFileSelected(file) {
  // console.log("File selected in main:", file.name);
  fileCheck = file;
  initializeGameData(file);
}

function onLoadLevelClicked(levelName) {
  if (!fileCheck) {
    return;
  }
  loadLevel(levelName);
}

initDOM(onFileSelected, onLoadLevelClicked);

async function initializeGameData(file) {
  const wadFileReader = new WADFileReader(file);
  const arrayBuffer = await wadFileReader.readFile();
  const wadParser = new WADParser(arrayBuffer);
  lumpData = await wadParser.parse();

  const { palette, texture } = setupTextureAndPalettes(lumpData);
  paletteField = palette;
  textureField = texture;
  patchNames = new PatchNames(lumpData, palette);

  // Setup texture managers
  textureManager = new TextureManager(
    texture.maptextures,
    palette.palettes[0],
    patchNames
  );
  flatManager = new FlatManager(lumpData, palette.palettes[0]);
  spriteManager = new SpriteManager(lumpData, patchNames);

  if (spriteManager) {
    spriteManager.processSprites();
  }

  gameEngine = new GameEngine("myCanvas", 50);
  gameEngine.patchNames = patchNames;
  gameEngine.palette = paletteField;
  gameEngine.textures = textureField;
  const canvas = new Canvas("myCanvas");
  gameEngine.canvas = canvas;
  gameEngine.ctx = canvas.ctx;
  gameEngine.init();
  gameEngine.start();
}

function loadLevel(levelName) {
  // load lumps just for this level
  const levelParser = new LevelParser(lumpData);
  const levelData = levelParser.parse(levelName);

  gameEngine.loadLevel(levelData);

  // *** BIT OF A HACK *** SHOULD PROBABLY CHANGE THIS
  gameEngine.level = levelName;

  let vertices = levelData.vertices;
  let { maxX, minX, maxY, minY } = calculateMinMax(vertices);
  const { scaleX, scaleY } = calculateScale2D(maxX, minX, maxY, minY);

  gameEngine.initializePlayer(levelData, scaleX, scaleY, minX, minY);
}

function setupTextureAndPalettes(lumpData) {
  const palette = new ReadPalette(lumpData);
  const texture = new Textures(lumpData);

  return { palette, texture };
}
