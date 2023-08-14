/**
 * A class for reading binary data from a WAD (Where's All the Data) file.
 */
class WADFileReader {
  /**
   * Creates a new instance of the WADFileReader class.
   * @param {File} file - The File object representing the WAD file to be read.
   */
  constructor(file) {
    this.file = file;
  }
  /**
   * Reads the contents of the WAD file asynchronously and returns an ArrayBuffer.
   * @async
   * @returns {Promise<ArrayBuffer>} A Promise that resolves to an ArrayBuffer containing the binary data of the WAD file.
   */
  async readFile() {
    try {
      const arrayBuffer = await this.readFileAsArrayBuffer(this.file);
      return arrayBuffer;
    } catch (error) {
      console.error("Error parsing WAD file:", error);
    }
  }
  /**
   * Reads the content of a given File object as an ArrayBuffer.
   * @param {File} file - The File object to be read.
   * @returns {Promise<ArrayBuffer>} A Promise that resolves to an ArrayBuffer containing the binary data of the file.
   */
  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }
}
