import {
  EMAPLUMPSINDEX,
  Directory,
  linedefSizeInBytes,
  vertexSizeInBytes,
} from "./DataTypes";
import Map from "./Map";
import WADReader from "./WADReader";

export default class WADLoader {
  protected url: string;
  protected directories: Directory[] = [];
  protected reader: WADReader;

  constructor(url: string) {
    this.url = url;
    this.reader = new WADReader();
  }

  async loadWadFile(): Promise<boolean> {
    if (!(await this.openAndLoad())) {
      return false;
    }
    if (!this.readDirectories()) {
      return false;
    }
    return true;
  }

  private async openAndLoad(): Promise<boolean> {
    try {
      const response = await fetch(this.url);
      const data = await response.arrayBuffer();
      this.reader.setData(data);
      return true;
    } catch (err) {
      console.warn("Problem", err);
      return false;
    }
  }

  private readDirectories(): boolean {
    const result = this.reader.readHeader();
    for (let i = 0; i < result.directoryCount; i++) {
      const directoryOffset = result.directoryOffset + i * 16;
      const directory = this.reader.readDirectory(directoryOffset);
      this.directories.push(directory);
    }
    return true;
  }

  private findMapIndex(map: Map) {
    return this.directories.findIndex(
      (directory) => directory.lumpName === map.getName()
    );
  }

  public loadMapData(map: Map): boolean {
    if (!this.readMapVertex(map)) {
      return false;
    }
    if (!this.readMapLinedef(map)) {
      return false;
    }
    return true;
  }

  private readMapVertex(map: Map) {
    let mapIndex = this.findMapIndex(map);

    if (mapIndex === -1) {
      return false;
    }

    mapIndex += EMAPLUMPSINDEX.eVERTEXES;

    if (this.directories[mapIndex].lumpName !== "VERTEXES") {
      return false;
    }

    const vertexCount = this.directories[mapIndex].lumpSize / vertexSizeInBytes;

    for (let i = 0; i < vertexCount; i++) {
      const offset =
        this.directories[mapIndex].lumpOffset + i * vertexSizeInBytes;
      map.addVertex(this.reader.readVertexData(offset));
    }

    return true;
  }

  private readMapLinedef(map: Map) {
    let mapIndex = this.findMapIndex(map);

    if (mapIndex === -1) {
      return false;
    }

    mapIndex += EMAPLUMPSINDEX.eLINEDEFS;

    if (this.directories[mapIndex].lumpName !== "LINEDEFS") {
      return false;
    }

    const linedefCount =
      this.directories[mapIndex].lumpSize / linedefSizeInBytes;

    for (let i = 0; i < linedefCount; ++i) {
      const offset =
        this.directories[mapIndex].lumpOffset + i * linedefSizeInBytes;
      map.addLinedef(this.reader.readLinedefData(offset));
    }

    return true;
  }
}
