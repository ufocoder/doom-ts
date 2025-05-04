export interface Header {
  WADType: string;
  directoryCount: number;
  directoryOffset: number;
}

export interface Directory {
  lumpOffset: number;
  lumpSize: number;
  lumpName: string;
}

function convertBytesToNumber(arr: Uint8Array): number {
  let num = 0;
  for (let i = 0; i < arr.length; i++) {
    num += arr[i] << (8 * i);
  }
  return num >>> 0;
}

const decoder = new TextDecoder("utf-8");

function convertBytesToString(arr: Uint8Array) {
  return decoder.decode(arr);
}

export default class WADReader {
  data: Uint8Array;

  constructor(data: Uint8Array) {
    this.data = data;
  }

  readBytes(offset: number, length: number): Uint8Array {
    return this.data.slice(offset, offset + length);
  }

  readHeader(): Header {
    // 0x00 to 0x03
    const WADType = convertBytesToString(this.readBytes(0, 4));
    // 0x04 to 0x07
    const directoryCount = convertBytesToNumber(this.readBytes(4, 4));
    // 0x08 to 0x0b
    const directoryOffset = convertBytesToNumber(this.readBytes(8, 4));

    return {
      WADType,
      directoryCount,
      directoryOffset,
    };
  }

  readDirectory(directoryOffset: number): Directory {
    return {
      //0x00 to 0x03
      lumpOffset: convertBytesToNumber(this.readBytes(directoryOffset, 4)),
      //0x04 to 0x07
      lumpSize: convertBytesToNumber(this.readBytes(directoryOffset + 4, 4)),
      //0x08 to 0x0F
      lumpName: convertBytesToString(this.readBytes(directoryOffset + 8, 8)),
    };
  }
}
