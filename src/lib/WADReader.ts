import {
  Header,
  Directory,
  Vertex,
  Thing,
  Subsector,
  WADSector,
  WADSidedef,
  WADLinedef,
  WADSeg,
} from "./DataTypes";

const decoder = new TextDecoder("utf-8");

function dataViewtoString(view: DataView, offset: number, length: number) {
  const buffer = view.buffer.slice(offset, offset + length) as ArrayBuffer;
  return decoder.decode(buffer).replace(/\x00+$/g, "");
}

export default class WADReader {
  dataView!: DataView;

  public setData(data: ArrayBuffer) {
    this.dataView = new DataView(data);
  }

  public readHeader(): Header {
    const WADType = dataViewtoString(this.dataView, 0, 4);
    const directoryCount = this.dataView.getInt32(4, true);
    const directoryOffset = this.dataView.getInt32(8, true);

    return {
      WADType,
      directoryCount,
      directoryOffset,
    };
  }

  public readDirectory(offset: number): Directory {
    return {
      lumpOffset: this.dataView.getUint32(offset, true),
      lumpSize: this.dataView.getUint32(offset + 4, true),
      lumpName: dataViewtoString(this.dataView, offset + 8, 8),
    };
  }

  public readVertexData(offset: number): Vertex {
    return {
      x: this.dataView.getInt16(offset, true),
      y: this.dataView.getInt16(offset + 2, true),
    };
  }

  public readSectorData(offset: number): WADSector {
    return {
      floorHeight: this.dataView.getInt16(offset, true),
      ceilingHeight: this.dataView.getInt16(offset + 2, true),
      floorTexture: dataViewtoString(this.dataView, offset + 4, 8),
      ceilingTexture: dataViewtoString(this.dataView, offset + 12, 8),
      lightlevel: this.dataView.getUint16(offset + 20, true),
      type: this.dataView.getUint16(offset + 22, true),
      tag: this.dataView.getUint16(offset + 24, true),
    };
  }

  public readSidedefData(offset: number): WADSidedef {
    return {
      xOffset: this.dataView.getInt16(offset, true),
      yOffset: this.dataView.getInt16(offset + 2, true),
      upperTexture: dataViewtoString(this.dataView, offset + 4, 8),
      lowerTexture: dataViewtoString(this.dataView, offset + 12, 8),
      middleTexture: dataViewtoString(this.dataView, offset + 20, 8),
      sectorID: this.dataView.getUint16(offset + 28, true),
    };
  }

  public readLinedefData(offset: number): WADLinedef {
    return {
      startVertexID: this.dataView.getUint16(offset, true),
      endVertexID: this.dataView.getUint16(offset + 2, true),
      flags: this.dataView.getUint16(offset + 4, true),
      lineType: this.dataView.getUint16(offset + 6, true),
      sectorTag: this.dataView.getUint16(offset + 8, true),
      rightSidedef: this.dataView.getUint16(offset + 10, true),
      leftSidedef: this.dataView.getUint16(offset + 12, true),
    };
  }

  public readThingData(offset: number): Thing {
    return {
      x: this.dataView.getInt16(offset, true),
      y: this.dataView.getInt16(offset + 2, true),
      angle: this.dataView.getUint16(offset + 4, true),
      type: this.dataView.getUint16(offset + 6, true),
      flags: this.dataView.getUint16(offset + 8, true),
    };
  }

  public readNodeData(offset: number) {
    return {
      x: this.dataView.getInt16(offset, true),
      y: this.dataView.getInt16(offset + 2, true),
      changeX: this.dataView.getInt16(offset + 4, true),
      changeY: this.dataView.getInt16(offset + 6, true),

      rightBoxTop: this.dataView.getInt16(offset + 8, true),
      rightBoxBottom: this.dataView.getInt16(offset + 10, true),
      rightBoxLeft: this.dataView.getInt16(offset + 12, true),
      rightBoxRight: this.dataView.getInt16(offset + 14, true),

      leftBoxTop: this.dataView.getInt16(offset + 16, true),
      leftBoxBottom: this.dataView.getInt16(offset + 18, true),
      leftBoxLeft: this.dataView.getInt16(offset + 20, true),
      leftBoxRight: this.dataView.getInt16(offset + 22, true),

      rightChildID: this.dataView.getUint16(offset + 24, true),
      leftChildID: this.dataView.getUint16(offset + 26, true),
    };
  }

  readSubsectorData(offset: number): Subsector {
    return {
      segCount: this.dataView.getUint16(offset, true),
      firstSegID: this.dataView.getUint16(offset + 2, true),
    };
  }

  readSegData(offset: number): WADSeg {
    return {
      startVertexID: this.dataView.getUint16(offset, true),
      endVertexID: this.dataView.getUint16(offset + 2, true),
      slopeAngle: this.dataView.getUint16(offset + 4, true),
      linedefID: this.dataView.getUint16(offset + 6, true),
      direction: this.dataView.getUint16(offset + 8, true),
      offset: this.dataView.getUint16(offset + 10, true),
    };
  }
}
