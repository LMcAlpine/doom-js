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

async function loadData(name) {
  const response = await fetch(name);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

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

  const actions = {
    A_Light0(obj) {
      console.log("light 0 ", obj);
    },
    A_WeaponReady(obj) {
      console.log("Weapon Ready ", obj);
    },
    A_Lower(obj) {
      console.log("Lower ", obj);
    },
    A_Raise(obj) {
      console.log("Raise ", obj);
    },
    A_Punch(obj) {
      console.log("Punch ", obj);
    },
    A_ReFire(obj) {
      console.log("ReFire ", obj);
    },
    A_FirePistol(obj) {
      console.log("Fire pistol", obj);
    },
    A_Light1(obj) {
      console.log("Light 1 ", obj);
    },
    A_FireShotgun(obj) {
      console.log("Fire Shotgun", obj);
    },
    A_Light2(obj) {
      console.log("Light 2 ", obj);
    },
    A_FireShotgun2(obj) {
      console.log("Fire Shotgun 2", obj);
    },
    A_CheckReload(obj) {
      console.log("Check Reload ", obj);
    },
    A_OpenShotgun2(obj) {
      console.log("Open Shotgun 2", obj);
    },
    A_LoadShotgun2(obj) {
      console.log("Load Shotgun 2", obj);
    },
    A_CloseShotgun2(obj) {
      console.log("Close Shotgun 2", obj);
    },
    A_FireCGun(obj) {
      console.log("Fire C Gun ", obj);
    },
    A_GunFlash(obj) {
      console.log("Gun Flash ", obj);
    },
    A_FireMissile(obj) {
      console.log("Fire Missile ", obj);
    },
    A_Saw(obj) {
      console.log("Saw ", obj);
    },
    A_FirePlasma(obj) {
      console.log("Fire Plasma ", obj);
    },
    A_Refire(obj) {
      console.log("Refire ", obj);
    },
    A_BFGsound(obj) {
      console.log("BFG sound ", obj);
    },
    A_FireBFG(obj) {
      console.log("Fire BFG ", obj);
    },
    A_BFGSpray(obj) {
      console.log("BFG Spray ", obj);
    },
    A_Explode(obj) {
      console.log("Explode ", obj);
    },
    A_Pain(obj) {
      console.log("Pain ", obj);
    },
    A_PlayerScream(obj) {
      console.log("Player Scream ", obj);
    },
    A_Fall(obj) {
      console.log("Fall ", obj);
    },
    A_XScream(obj) {
      console.log("XScream ", obj);
    },
    A_Look(obj) {
      console.log("Look ", obj);
    },
    A_Chase(obj) {
      console.log("Chase ", obj);
    },
    A_FaceTarget(obj) {
      console.log("Face Target ", obj);
    },
    A_PosAttack(obj) {
      console.log("Pos Attack ", obj);
    },
    A_Scream(obj) {
      console.log("Scream ", obj);
    },
    A_SPosAttack(obj) {
      console.log("SPos Attack ", obj);
    },
    A_VileChase(obj) {
      console.log("Vile Chase ", obj);
    },
    A_VileStart(obj) {
      console.log("Vile Start ", obj);
    },
    A_VileTarget(obj) {
      console.log("Vile Target ", obj);
    },
    A_VileAttack(obj) {
      console.log("Vile Attack ", obj);
    },
    A_StartFire(obj) {
      console.log("Start Fire ", obj);
    },
    A_Fire(obj) {
      console.log("Fire ", obj);
    },
    A_FireCrackle(obj) {
      console.log("Fire Crackle ", obj);
    },
    A_Tracer(obj) {
      console.log("Tracer ", obj);
    },
    A_SkelWhoosh(obj) {
      console.log("Skel Whoosh ", obj);
    },
    A_SkelFist(obj) {
      console.log("Skel Fist ", obj);
    },
    A_SkelMissile(obj) {
      console.log("Skel Missile ", obj);
    },
    A_FatRaise(obj) {
      console.log("Fat Raise ", obj);
    },
    A_FatAttack1(obj) {
      console.log("Fat Attack 1 ", obj);
    },
    A_FatAttack2(obj) {
      console.log("Fat Attack 2 ", obj);
    },
    A_FatAttack3(obj) {
      console.log("Fat Attack 3 ", obj);
    },
    A_BossDeath(obj) {
      console.log("Boss Death ", obj);
    },
    A_CPosAttack(obj) {
      console.log("CPos Attack ", obj);
    },
    A_CPosRefire(obj) {
      console.log("CPos Refire ", obj);
    },
    A_TroopAttack(obj) {
      console.log("Troop Attack ", obj);
    },
    A_FALL(obj) {
      console.log("FALL ", obj);
    },
    A_SargAttack(obj) {
      console.log("Sarg Attack ", obj);
    },
    A_HeadAttack(obj) {
      console.log("Head Attack ", obj);
    },
    A_BruisAttack(obj) {
      console.log("Bruis Attack ", obj);
    },
    A_Skullttack(obj) {
      console.log("Skull Attack ", obj);
    },
    A_Metal(obj) {
      console.log("Metal ", obj);
    },
    A_SpidRefire(obj) {
      console.log("Spid Refire ", obj);
    },
    A_BabyMetal(obj) {
      console.log("Baby Metal ", obj);
    },
    A_BspiAttack(obj) {
      console.log("Bspi Attack ", obj);
    },
    A_Hoof(obj) {
      console.log("Hoof ", obj);
    },
    A_CyberAttack(obj) {
      console.log("Cyber Attack ", obj);
    },
    A_PainAttack(obj) {
      console.log("Pain Attack ", obj);
    },
    A_PainDie(obj) {
      console.log("Pain Die ", obj);
    },
    A_KeenDie(obj) {
      console.log("Keen Die ", obj);
    },
    A_BrainPain(obj) {
      console.log("Brain Pain ", obj);
    },
    A_BrainScream(obj) {
      console.log("Brain Scream ", obj);
    },
    A_BrainDie(obj) {
      console.log("Brain Die ", obj);
    },
    A_BrainAwake(obj) {
      console.log("Brain Awake ", obj);
    },
    A_BrainSpit(obj) {
      console.log("Brain Spit ", obj);
    },
    A_SpawnSound(obj) {
      console.log("Spawn Sound ", obj);
    },
    A_SpawnFly(obj) {
      console.log("Spawn Fly ", obj);
    },
    A_BrainExplode(obj) {
      console.log("Brain Explode ", obj);
    },
  };

  const uniqueActionNames = new Set();

  for (const [key, value] of Object.entries(states)) {
    console.log(key, value);
    let action = value[3];
    if (!uniqueActionNames.has(action)) {
      uniqueActionNames.add(action);
    }
  }

  for (let name of uniqueActionNames) {
    actions[name] = new (function (name) {})();
  }

  console.log(uniqueActionNames.size);
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

  const parsedLevelNum = parseLevelName(levelName);
  gameEngine.currentLevelInfo = parsedLevelNum;

  gameEngine.loadLevel(levelData);

  let vertices = levelData.vertices;
  let { maxX, minX, maxY, minY } = calculateMinMax(vertices);
  const { scaleX, scaleY } = calculateScale2D(maxX, minX, maxY, minY);

  gameEngine.initializePlayer(levelData, scaleX, scaleY, minX, minY);

  // player needs to be initialized before
  gameEngine.levelManager.loadThings();
}

function setupTextureAndPalettes(lumpData) {
  const palette = new ReadPalette(lumpData);
  const texture = new Textures(lumpData);

  return { palette, texture };
}
