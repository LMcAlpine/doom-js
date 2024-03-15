const gameEngine = new GameEngine("myCanvas", 50);

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

    gameEngine.entities = [];

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

    const textureManager = new TextureManager(texture.maptextures, palette.palettes[0]);


    const levelManager = new LevelManager(levels, dataObjects, textureManager);
    gameEngine.levelManager = levelManager;
    gameEngine.init();

    gameEngine.start();
  });
