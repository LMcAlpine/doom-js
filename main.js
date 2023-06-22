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

    // try {
    //   await wadParser.parse();
    // } catch (error) {
    //   console.error("Error parsing WAD file:", error);
    // }
  });
