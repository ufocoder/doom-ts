import { Header, Directory, Linedef, Vertex } from "./DataTypes";

const decoder = new TextDecoder("utf-8");

function dataViewtoString(view: DataView, offset: number, length: number) {
  const buffer = view.buffer.slice(offset, offset + length) as ArrayBuffer;
  return decoder.decode(buffer).replace(/\x00+$/g, '');
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

  public readDirectory(directoryOffset: number): Directory {
    return {
      lumpOffset: this.dataView.getUint32(directoryOffset, true),
      lumpSize: this.dataView.getUint32(directoryOffset + 4, true),
      lumpName: dataViewtoString(this.dataView, directoryOffset + 8, 8),
    };
  }

  public readVertexData(vertexOffset: number): Vertex {
    return {
      x: this.dataView.getInt16(vertexOffset, true),
      y: this.dataView.getInt16(vertexOffset + 2, true),
    };
  }

  public readLinedefData(linedefOffset: number): Linedef {
    return {
      startVertex: this.dataView.getUint16(linedefOffset, true),
      endVertex: this.dataView.getUint16(linedefOffset + 2, true),
      flags: this.dataView.getUint16(linedefOffset + 4, true),
      lineType: this.dataView.getUint16(linedefOffset + 6, true),
      sectorTag: this.dataView.getUint16(linedefOffset + 8, true),
      rightSidedef: this.dataView.getUint16(linedefOffset + 10, true),
      leftSidedef: this.dataView.getUint16(linedefOffset + 12, true),
    };
  }
}
