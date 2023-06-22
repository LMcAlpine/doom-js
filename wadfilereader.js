class WADFileReader {
  constructor(file) {
    this.file = file;
  }

  async readFile() {
    try {
      const arrayBuffer = await this.readFileAsArrayBuffer(this.file);
      return arrayBuffer;
    } catch (error) {
      console.error("Error parsing WAD file:", error);
    }
  }

  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }
}
