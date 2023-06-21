document
  .getElementById("fileInput")
  .addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.error("No file selected.");
      return;
    }

    const wadParser = new WADParser(file);
    const lumpData = await wadParser.parse();
    const levelParser = new LevelParser(lumpData);
    const levels = levelParser.parse();

    // try {
    //   await wadParser.parse();
    // } catch (error) {
    //   console.error("Error parsing WAD file:", error);
    // }
  });
