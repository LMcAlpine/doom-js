document
  .getElementById("fileInput")
  .addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.error("No file selected.");
      return;
    }

    // const canvas = document.getElementById("myCanvas");
    // const ctx = canvas.getContext("2d");

    const wadFileReader = new WADFileReader(file);
    const arrayBuffer = await wadFileReader.readFile();
    const wadParser = new WADParser(arrayBuffer);
    const lumpData = await wadParser.parse();
    const levelParser = new LevelParser(lumpData);
    const levels = levelParser.parse("E1M1");

    //const vertices = levels.vertices;

    const gameEngine = new GameEngine("myCanvas", 50, levels);
    //  const renderer = new Renderer("myCanvas");
    // renderer.drawVertices(vertices);

    //const linedefs = levels.linedefs;
    // renderer.drawLinedefs(linedefs, vertices);

    //console.log(levels.linedefs);

    //const nodes = levels.nodes;
    //console.log(nodes);

    gameEngine.start();

    // try {
    //   await wadParser.parse();
    // } catch (error) {
    //   console.error("Error parsing WAD file:", error);
    // }
  });
