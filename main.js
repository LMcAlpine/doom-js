document
  .getElementById("fileInput")
  .addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.error("No file selected.");
      return;
    }

    const wadFileReader = new WADFileReader(file);
    const arrayBuffer = await wadFileReader.readFile();
    const wadParser = new WADParser(arrayBuffer);
    const lumpData = await wadParser.parse();
    const levelParser = new LevelParser(lumpData);
    const levels = levelParser.parse("E1M1");

    let vertices = levels.vertices;
    let { maxX, minX, maxY, minY } = calculateMinMax(vertices);

    const { scaleX, scaleY } = calculateScale2D(maxX, minX, maxY, minY);
    const gameEngine = new GameEngine("myCanvas", 50, levels);
    gameEngine.init();
    const player = new Player(
      levels.things[0],
      { minX: minX, minY: minY },
      { scaleX: scaleX, scaleY: scaleY },
      gameEngine
    );

    gameEngine.addEntity(player);

    gameEngine.start();
  });
