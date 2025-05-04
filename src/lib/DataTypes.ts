export interface Vertex {
  x: number;
  y: number;
}

export const vertexSizeInBytes = 4;

export interface Linedef {
  startVertex: number;
  endVertex: number;
  flags: number;
  lineType: number;
  sectorTag: number;
  rightSidedef: number;
  leftSidedef: number;
}

export const linedefSizeInBytes = 14;

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

export enum EMAPLUMPSINDEX {
  eTHINGS = 1,
  eLINEDEFS,
  eSIDEDDEFS,
  eVERTEXES,
  eSEAGS,
  eSSECTORS,
  eNODES,
  eSECTORS,
  eREJECT,
  eBLOCKMAP,
  eCOUNT,
}

export enum ELINEDEFFLAGS {
  eBLOCKING = 0,
  eBLOCKMONSTERS = 1,
  eTWOSIDED = 2,
  eDONTPEGTOP = 4,
  eDONTPEGBOTTOM = 8,
  eSECRET = 16,
  eSOUNDBLOCK = 32,
  eDONTDRAW = 64,
  eDRAW = 128,
}
