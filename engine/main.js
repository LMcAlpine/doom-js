const gameEngine = new GameEngine("myCanvas", 50);

const ENDIAN = (() => {
  const buffer = new ArrayBuffer(2);
  new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
  return new Int16Array(buffer)[0] === 256;
})();

let levelSelect = document.getElementById("levels");

let selectedValue = "E1M1";
levelSelect.addEventListener("change", function () {
  selectedValue = this.value;
  console.log("Selected level:", selectedValue);
});

document
  .getElementById("fileInput")
  .addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.error("No file selected.");
      return;
    }

    // identify version
    let gameMission = GameMission.doom;
    let gameMode = "";
    if (gameMission === GameMission.doom) {
      gameMode = GameMode.shareware;
    }
    let startMap = 1;
    let startEpisode = 1;

    // need to setup the framebuffer/video buffer

    // ...

    // loop has started but still initializing

    // checking the gamemode
    // if gamemmode === commercial
    // else
    // switch gameepisode
    // case 1
    // these comments need to be changed into code but only doing SKY1 for now
    let skyTextureName = "SKY1";
    // might need a texture number for this name

    // G_DoLoadLevel
    //skyflatenum = R_FlatNumForName(SKYFLATNAME)

    // ....

    // setup level P_SetupLevel

    // *** need to more setup before regarding the file reading, parsing, lump loading, etc

    gameEngine.entities = [];

    gameEngine.skyTextureName = "SKY1";

    const wadFileReader = new WADFileReader(file);
    const arrayBuffer = await wadFileReader.readFile();
    const wadParser = new WADParser(arrayBuffer);
    const lumpData = await wadParser.parse();
    const levelParser = new LevelParser(lumpData);
    const levels = levelParser.parse(selectedValue);

    gameEngine.lumpData = lumpData;

    const palette = new ReadPalette(lumpData);

    gameEngine.palette = palette;

    const texture = new Textures(lumpData);

    gameEngine.textures = texture;

    let vertices = levels.vertices;
    let { maxX, minX, maxY, minY } = calculateMinMax(vertices);

    const { scaleX, scaleY } = calculateScale2D(maxX, minX, maxY, minY);

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

    const sectorObjects = buildSectors(levels.sectors);
    const sidedefObjects = buildSidedefs(levels.sidedefs, sectorObjects);

    const linedefObjects = buildLinedefs(
      levels.linedefs,
      vertices,
      sidedefObjects
    );

    const segObjects = buildSegs(levels.segs, vertices, linedefObjects);

    const dataObjects = {
      sectorObjects,
      sidedefObjects,
      linedefObjects,
      segObjects,
    };

    const textureManager = new TextureManager(
      texture.maptextures,
      palette.palettes[0]
    );
    const flatManager = new FlatManager(lumpData, palette.palettes[0]);

    const levelManager = new LevelManager(
      levels,
      dataObjects,
      textureManager,
      flatManager
    );
    gameEngine.levelManager = levelManager;
    gameEngine.init();

    gameEngine.start();
  });
