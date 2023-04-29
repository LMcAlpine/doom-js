document.getElementById("fileInput").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
        console.error("No file selected.");
        return;
    }

    const wadParser = new WADParser(file);
    try {
        await wadParser.parse();
    } catch (error) {
        console.error("Error parsing WAD file:", error);
    }
});