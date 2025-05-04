import WADReader, { Directory } from "./WADReader";

export default class WADLoader {
    protected url: string;
    protected data: Uint8Array = new Uint8Array();
    protected directories:Directory[] = [];

    constructor(url: string) {
        this.url = url;
    }

    async load(): Promise<boolean> {
        if (!await this.openAndLoad()) {
            return false;
        }
        if (!this.readDirectories()) {
            return false;
        }
        
        return true;
    }

    async openAndLoad(): Promise<boolean> {
        try {
            const response = await fetch(this.url);
            this.data = await response.bytes();
            return true;
        } catch (err) {
            console.warn('Problem', err);
            return false;
        }
    }

    readDirectories() : boolean {
        const reader = new WADReader(this.data);
        const result = reader.readHeader();

        for (let i = 0; i < result.directoryCount; i++) { 
            const directoryOffset = result.directoryOffset + i * 16;
            const directory = reader.readDirectory(directoryOffset);

            this.directories.push(directory);
        }

        return true;
    }
}