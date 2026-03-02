import { initDOM } from "../uimanager.js";

import { createActions } from "./gameplay/actions.js";
import { createEngineContext } from "./enginecontext.js";

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

async function loadData(name) {
  const response = await fetch(name);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

async function initializeGameData(file) {
  console.time("init_wad_total");

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
    patchNames,
  );
  flatManager = new FlatManager(lumpData, palette.palettes[0]);

  const spriteNames = await loadData("sprite_names.json");

  spriteManager = new SpriteManager(lumpData, patchNames, spriteNames);

  gameEngine = new GameEngine("myCanvas", 50);
  gameEngine.lumpData = lumpData;
  gameEngine.patchNames = patchNames;
  gameEngine.palette = paletteField;
  gameEngine.textures = textureField;

  if (spriteManager) {
    const { spriteWidth, spriteOffset, spriteTopOffset } =
      spriteManager.processSprites();
    gameEngine.spriteWidth = spriteWidth;
    gameEngine.spriteOffset = spriteOffset;
    gameEngine.spriteTopOffset = spriteTopOffset;
  }

  const infoDefinitions = await loadData("info_definitions.json");
  gameEngine.infoDefinitions = infoDefinitions;
  const states = await loadData("states.json");
  gameEngine.states = states;

  gameEngine.actions = createActions({ gameEngine, Geometry });

  // const uniqueActionNames = new Set();

  // for (const [key, value] of Object.entries(states)) {
  //   console.log(key, value);
  //   let action = value[3];
  //   if (!uniqueActionNames.has(action)) {
  //     uniqueActionNames.add(action);
  //   }
  // }

  const canvas = new Canvas("myCanvas");

  const engineContext = createEngineContext({
    canvas,
    ctx: canvas.ctx,
    assets: {
      lumpData,
      patchNames,
      palette: paletteField,
      textures: textureField,
      textureManager,
      flatManager,
      spriteManager,
      spriteWidth: gameEngine.spriteWidth,
      spriteOffset: gameEngine.spriteOffset,
      spriteTopOffset: gameEngine.spriteTopOffset,
    },
    gameplay: {
      infoDefinitions: gameEngine.infoDefinitions,
      states: gameEngine.states,
      actions: gameEngine.actions,
    },
    deps: {
      LevelManager,
      Player,
      buildSectors,
      buildSidedefs,
      buildLinedefs,
      buildSegs,
      buildThings,
    },
  });

  gameEngine.canvas = canvas;
  gameEngine.ctx = canvas.ctx;
  gameEngine.init(engineContext);
  gameEngine.start();

  console.timeEnd("init_wad_total");
}

function loadLevel(levelName) {
  console.time(`load_level:${levelName}`);

  // load lumps just for this level
  const levelParser = new LevelParser(lumpData);
  const levelData = levelParser.parse(levelName);

  const parsedLevelNum = parseLevelName(levelName);
  gameEngine.currentLevelInfo = parsedLevelNum;

  gameEngine.loadLevel(levelData);

  let vertices = levelData.vertices;
  let { maxX, minX, maxY, minY } = calculateMinMax(vertices);
  const { scaleX, scaleY } = calculateScale2D(maxX, minX, maxY, minY);

  gameEngine.initializePlayer(levelData, scaleX, scaleY, minX, minY);

  // player needs to be initialized before
  gameEngine.levelManager.loadThings();

  console.timeEnd(`load_level:${levelName}`);
}

function setupTextureAndPalettes(lumpData) {
  const palette = new ReadPalette(lumpData);
  const texture = new Textures(lumpData);

  return { palette, texture };
}
