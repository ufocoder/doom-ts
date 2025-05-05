import {
  EMAPLUMPSINDEX,
  Directory,
  thingsSizeInBytes,
  linedefSizeInBytes,
  vertexSizeInBytes,
  nodeSizeInBytes,
  subsectorSizeInBytes,
  segSizeInBytes,
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
    if (!this.readMapThing(map)) {
      return false;
    }
    if (!this.readMapNodes(map)) {
      return false;
    }
    if (!this.readMapSubsectors(map)) {
      return false;
    }
    if (!this.readMapSegs(map)) {
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

  private readMapThing(map: Map) {
    let mapIndex = this.findMapIndex(map);

    if (mapIndex === -1) {
      return false;
    }

    mapIndex += EMAPLUMPSINDEX.eTHINGS;

    if (this.directories[mapIndex].lumpName !== "THINGS") {
      return false;
    }

    const thingsCount = this.directories[mapIndex].lumpSize / thingsSizeInBytes;

    for (let i = 0; i < thingsCount; ++i) {
      const offset =
        this.directories[mapIndex].lumpOffset + i * thingsSizeInBytes;
      map.addThing(this.reader.readThingData(offset));
    }

    return true;
  }

  private readMapNodes(map: Map) {
    let mapIndex = this.findMapIndex(map);

    if (mapIndex === -1) {
      return false;
    }

    mapIndex += EMAPLUMPSINDEX.eNODES;

    if (this.directories[mapIndex].lumpName !== "NODES") {
      return false;
    }

    const nodesCount = this.directories[mapIndex].lumpSize / nodeSizeInBytes;

    for (let i = 0; i < nodesCount; i++) {
      const offset =
        this.directories[mapIndex].lumpOffset + i * nodeSizeInBytes;
      map.addNode(this.reader.readNodeData(offset));
    }

    return true;
  }

  readMapSubsectors(map: Map) {
    let mapIndex = this.findMapIndex(map);

    if (mapIndex === -1) {
      return false;
    }

    mapIndex += EMAPLUMPSINDEX.eSSECTORS;

    if (this.directories[mapIndex].lumpName !== "SSECTORS") {
      return false;
    }

    const subsectorsCount =
      this.directories[mapIndex].lumpSize / subsectorSizeInBytes;

    for (let i = 0; i < subsectorsCount; i++) {
      const offset =
        this.directories[mapIndex].lumpOffset + +i * subsectorSizeInBytes;
      map.addSubsector(this.reader.readSubsectorData(offset));
    }

    return true;
  }

  readMapSegs(map: Map) {
    let mapIndex = this.findMapIndex(map);

    if (mapIndex === -1) {
      return false;
    }

    mapIndex += EMAPLUMPSINDEX.eSEAGS;

    if (this.directories[mapIndex].lumpName !== "SEGS") {
      return false;
    }

    const segsCount = this.directories[mapIndex].lumpSize / segSizeInBytes;

    for (let i = 0; i < segsCount; i++) {
      const offset = this.directories[mapIndex].lumpOffset + i * segSizeInBytes;
      map.addSeg(this.reader.readSegData(offset));
    }

    return true;
  }
}
