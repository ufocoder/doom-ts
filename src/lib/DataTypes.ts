export const SUBSECTORIDENTIFIER = 0x8000;

export interface Vertex {
  x: number;
  y: number;
}

export const vertexSizeInBytes = 4;

export interface Linedef {
  startVertexID: number;
  endVertexID: number;
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

export const thingsSizeInBytes = 10;

export interface Thing {
    x: number;
    y: number;
    angle: number;
    type: number;
    flags: number;
};

export const nodeSizeInBytes = 28;

export interface Node {
    x: number;
    y: number;
    changeX: number;
    changeY: number;

    rightBoxTop: number;
    rightBoxBottom: number;
    rightBoxLeft: number;
    rightBoxRight: number;

    leftBoxTop: number;
    leftBoxBottom: number;
    leftBoxLeft: number;
    leftBoxRight: number;

    rightChildID: number;
    leftChildID: number;
};

export const subsectorSizeInBytes = 4;

export interface Subsector {
    segCount: number;
    firstSegID: number;
};

export const segSizeInBytes = 12;

export interface Seg {
    startVertexID: number;
    endVertexID: number;
    angle: number;
    linedefID: number;
    direction: number;
    offset: number;
};
