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

let selectedValue = "";
// function onLevelSelected(value) {
//   selectedValue = value;
// }

function onLevelSelected(levelName) {
  // how do i make sure it is required to select a file FIRST? before the level
  // but then it doesnt let me select the level..
  // wait no, i just had to remove the breakpoint in onFileSelected? wait no this line is wrong too
  // i need to select the file and then change the level..
  // somehow i need to change it from being on e1m1 by default because then it doesnt register a level change since it wasnt clicked.
  if (!fileCheck) {
    return;
  }

  // const levelSelect = document.getElementById("levels");
  // const levelName = levelSelect.value;
  selectedValue = levelName;
  if (!gameEngine) {
    gameEngine = new GameEngine("myCanvas", 50);
    gameEngine.patchNames = patchNames;
    gameEngine.palette = paletteField;
    gameEngine.textures = textureField;
    const canvas = new Canvas("myCanvas");
    gameEngine.canvas = canvas;
    gameEngine.ctx = canvas.ctx;
    gameEngine.init();
    // not ready to start. It starts the drawing loop
    //gameEngine.start();
  }

  loadLevel(levelName);
}

initDOM(onFileSelected, onLevelSelected);

async function initializeGameData(file) {
  let skyTextureName = "SKY1";

  //gameEngine.skyTextureName = skyTextureName;

  // this only sets the level name once...
  // gameEngine.level = selectedValue;

  // I want this info below to be loaded once and then reuse it.
  // I need to somehow get the level name if it changes

  const wadFileReader = new WADFileReader(file);
  const arrayBuffer = await wadFileReader.readFile();
  const wadParser = new WADParser(arrayBuffer);
  lumpData = await wadParser.parse();
  // gameEngine.lumpData = lumpData;
  // const levelParser = new LevelParser(lumpData);
  // const levels = levelParser.parse(selectedValue);
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
  spriteManager = new SpriteManager(lumpData);

  // setupGameEngine(levels, lumpData);
}

// function onLevelSelected(levelName) {
//   if (!gameEngine) {
//     gameEngine = new GameEngine("myCanvas", 50);
//     gameEngine.patchNames = patchNames;
//     gameEngine.palette = palette;
//     gameEngine.textures = texture;
//     gameEngine.init();
//     gameEngine.start();
//   }

//   loadLevel(levelName);
// }

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

  // .... somehow player isnt getting reset via level change?
  // .... okay, after looking into it. The player is getting the correct new spawn BUT i noticed visually that even though I select E1M3 it was still E1M2
  // .... is it only using the level data for the first level I select?
  // .... if I select e1m2 and then e1m1 will i still see e1m2?
  // .... YES! it is always staying at the first level selected (well, I have to do a level change event...
  // for ex, select the wad, (it's at e1m1 by default) change to e1m2 and then change back to e1m1 or some other level)

  // I need to go through and see what is going on with the level data...
  // compare it to slade

  // the reason is because the level manager data is not getting reset between each level change
  // temporarily create new levelmanager instances to fix...

  gameEngine.initializePlayer(levelData, scaleX, scaleY, minX, minY);

  // can I start now? forgot to load player
  gameEngine.start();

  //setupGameEngine(levels, gameEngine.lumpData);
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

  // // Setup texture managers
  // const textureManager = new TextureManager(
  //   texture.maptextures,
  //   palette.palettes[0]
  // );
  // const flatManager = new FlatManager(lumpData, palette.palettes[0]);
  // const spriteManager = new SpriteManager(lumpData);

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

  // gameEngine.palette = palette;
  // gameEngine.textures = texture;

  return { palette, texture };
}

// function setupLevelData(levels) {
//   const sectorObjects = buildSectors(levels.sectors);
//   const sidedefObjects = buildSidedefs(levels.sidedefs, sectorObjects);
//   const linedefObjects = buildLinedefs(
//     levels.linedefs,
//     levels.vertices,
//     sidedefObjects
//   );
//   const segObjects = buildSegs(levels.segs, levels.vertices, linedefObjects);
//   const thingObjects = buildThings(levels.things);

//   return {
//     sectorObjects,
//     sidedefObjects,
//     linedefObjects,
//     segObjects,
//     thingObjects,
//   };
// }

// function initializeCanvasAndPlayer(levels, scaleX, scaleY, minX, minY) {
//   const canvas = new Canvas("myCanvas");
//   const player = new Player(
//     levels.things[0],
//     { minX: minX, minY: minY },
//     { scaleX: scaleX, scaleY: scaleY },
//     90,
//     41
//   );
//   gameEngine.addEntity(player);
//   gameEngine.player = player;
//   gameEngine.canvas = canvas;
//   gameEngine.ctx = canvas.ctx;
// }
