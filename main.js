const gameEngine = new GameEngine("myCanvas", 50);

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
    const levels = levelParser.parse("E1M1");

    let vertices = levels.vertices;
    let { maxX, minX, maxY, minY } = calculateMinMax(vertices);

    const { scaleX, scaleY } = calculateScale2D(maxX, minX, maxY, minY);

    const canvas = new Canvas("myCanvas");

    const player = new Player(
      levels.things[0],
      { minX: minX, minY: minY },
      { scaleX: scaleX, scaleY: scaleY }
    );

    gameEngine.addEntity(player);
    gameEngine.player = player;

    gameEngine.canvas = canvas;
    gameEngine.ctx = canvas.ctx;

    const sectorObjects = buildSectors(levels.sectors);
    const sidedefObjects = buildSidedefs(levels.sidedefs, sectorObjects);

    const linedefObjects = buildLinedefs(
      levels.linedefs,
      vertices,
      sidedefObjects
    );

    const segObjects = buildSegs(levels.segs, vertices, linedefObjects);

    const levelManager = new LevelManager(levels);
    gameEngine.levelManager = levelManager;
    gameEngine.init();

    gameEngine.start();
  });
