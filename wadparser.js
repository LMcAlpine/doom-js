class WADParser {
    constructor(file) {
        this.file = file;
    }

    async parse() {
        const arrayBuffer = await this.readFileAsArrayBuffer(this.file);
        const header = this.parseHeader(arrayBuffer);
        const lumps = this.parseLumps(header, arrayBuffer);

        console.log(header, lumps);
    }


    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }

    parseHeader(arrayBuffer) {
        const dataView = new DataView(arrayBuffer);

        const header = {
            wadType: this.readString(dataView, 0, 4),
            numLumps: dataView.getInt32(4, true),
            lumpDirectoryOffset: dataView.getInt32(8, true),
        };

        if (header.wadType !== "IWAD" && header.wadType !== "PWAD") {
            throw new Error("Invalid WAD file.");
        }

        return header;
    }

    parseLumps(header, arrayBuffer) {
        const dataView = new DataView(arrayBuffer);
        const lumps = [];

        for (let i = 0; i < header.numLumps; i++) {
            const offset = header.lumpDirectoryOffset + i * 16;

            lumps.push({ filePos: dataView.getInt32(offset, true), size: dataView.getInt32(offset + 4, true), name: this.readString(dataView, offset + 8, 8), });
        }
        return lumps;
    }

    readString(dataView, offset, maxLength) {
        let result = "";
        for (let i = 0; i < maxLength; i++) {
            const charCode = dataView.getUint8(offset + i);
            if (charCode === 0) {
                break;
            }
            result += String.fromCharCode(charCode);
        }
        return result;
    }
}