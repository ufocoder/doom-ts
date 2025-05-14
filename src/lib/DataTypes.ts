export const SUBSECTORIDENTIFIER = 0x8000;

export const vertexSizeInBytes = 4;

export interface Vertex {
  x: number;
  y: number;
}

export const sidedefSizeInBytes = 30; 

export interface WADSidedef {
  xOffset: number;
  yOffset: number;
  upperTexture: string;
  lowerTexture: string;
  middleTexture: string;
  sectorID: number;
}

export interface Sidedef {
  xOffset: number;
  yOffset: number;
  upperTexture: string;
  lowerTexture: string;
  middleTexture: string;
  sector?: Sector;
}

export interface WADLinedef {
  startVertexID: number;
  endVertexID: number;
  flags: number;
  lineType: number;
  sectorTag: number;
  rightSidedef: number; //0xFFFF means there is no sidedef
  leftSidedef: number; //0xFFFF means there is no sidedef
}

export const linedefSizeInBytes = 14;

export interface Linedef {
  startVertex: Vertex;
  endVertex: Vertex;
  flags: number;
  lineType: number;
  sectorTag: number;
  rightSidedef?: Sidedef;
  leftSidedef?: Sidedef;
}

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
  eName,
  eTHINGS,
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
}

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
}

export const subsectorSizeInBytes = 4;

export interface Subsector {
  segCount: number;
  firstSegID: number;
}

export const segSizeInBytes = 12;

export interface WADSeg {
  startVertexID: number;
  endVertexID: number;
  slopeAngle: number;
  linedefID: number;
  direction: number; // 0 same as linedef, 1 opposite of linedef
  offset: number; // distance along linedef to start of seg
}

export interface Seg {
  startVertex: Vertex;
  endVertex: Vertex;
  slopeAngle: number;
  linedef: Linedef;
  direction: number;
  offset: number;
  rightSector?: Sector;
  leftSector?: Sector;
}

export const sectorSizeInBytes = 26;

export interface WADSector {
  floorHeight: number;
  floorTexture: string;
  ceilingHeight: number;
  ceilingTexture: string;
  lightlevel: number;
  type: number;
  tag: number;
}

export interface Sector {
  floorHeight: number;
  floorTexture: string;
  ceilingHeight: number;
  ceilingTexture: string;
  lightlevel: number;
  type: number;
  tag: number;
}
