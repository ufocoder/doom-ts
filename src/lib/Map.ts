import { Angle } from "./Angle";
import {
  Linedef,
  Node,
  Sector,
  Seg,
  Sidedef,
  Subsector,
  Thing,
  Vertex,
  WADLinedef,
  WADSector,
  WADSeg,
  WADSidedef,
} from "./DataTypes";

import Player from "./Player";
import Things from "./Things";

export default class Map {
  private name: string;
  private player: Player;
  private things: Things;

  XMin: number = Number.MAX_SAFE_INTEGER;
  XMax: number = Number.MIN_SAFE_INTEGER;
  YMin: number = Number.MAX_SAFE_INTEGER;
  YMax: number = Number.MIN_SAFE_INTEGER;

  autoMapScaleFactor: number = 10;

  WADLinedefs: WADLinedef[] = [];
  WADSectors: WADSector[] = [];
  WADSegs: WADSeg[] = [];
  WADSidedefs: WADSidedef[] = [];

  vertexes: Vertex[] = [];
  nodes: Node[] = [];
  linedefs: Linedef[] = [];
  segs: Seg[] = [];
  sectors: Sector[] = [];
  sidedefs: Sidedef[] = [];
  subsectors: Subsector[] = [];

  constructor(name: string, player: Player, things: Things) {
    this.name = name;
    this.player = player;
    this.things = things;
  }

  public getName() {
    return this.name;
  }

  public getThings() {
    return this.things;
  }

  public init() {
    this.buildSectors();
    this.buildSidedefs();
    this.buildLinedef();
    this.buildSeg();
  }

  buildSectors() {
    for (const wadsector of this.WADSectors) {
      this.sectors.push({
        floorHeight: wadsector.floorHeight,
        floorTexture: wadsector.floorTexture + "\0",
        ceilingHeight: wadsector.ceilingHeight,
        ceilingTexture: wadsector.ceilingTexture + "\0",
        lightlevel: wadsector.lightlevel,
        type: wadsector.type,
        tag: wadsector.tag,
      });
    }
  }

  buildSidedefs() {
    for (const wadsidedef of this.WADSidedefs) {
      this.sidedefs.push({
        xOffset: wadsidedef.xOffset,
        yOffset: wadsidedef.yOffset,
        upperTexture: wadsidedef.upperTexture + "\0",
        middleTexture: wadsidedef.middleTexture + "\0",
        lowerTexture: wadsidedef.lowerTexture + "\0",
        sector: this.sectors[wadsidedef.sectorID],
      });
    }
  }

  buildLinedef() {
    for (const wadlinedef of this.WADLinedefs) {
      this.linedefs.push({
        startVertex: this.vertexes[wadlinedef.startVertexID]!,
        endVertex: this.vertexes[wadlinedef.endVertexID]!,
        flags: wadlinedef.flags,
        lineType: wadlinedef.lineType,
        sectorTag: wadlinedef.sectorTag,
        rightSidedef: this.sidedefs[wadlinedef.rightSidedef],
        leftSidedef: this.sidedefs[wadlinedef.leftSidedef],
      });
    }
  }

  buildSeg() {
    for (const wadseg of this.WADSegs) {
      const linedef = this.linedefs[wadseg.linedefID];
      this.segs.push({
        startVertex: this.vertexes[wadseg.startVertexID],
        endVertex: this.vertexes[wadseg.endVertexID],
        linedef,
        slopeAngle: new Angle((wadseg.slopeAngle << 16) * 8.38190317e-8),
        direction: wadseg.direction,
        offset: (wadseg.offset << 16) / (1 << 16),
        rightSector: wadseg.direction
          ? linedef?.leftSidedef?.sector
          : linedef?.rightSidedef?.sector,
        leftSector: wadseg.direction
          ? linedef?.rightSidedef?.sector
          : linedef?.leftSidedef?.sector,
      });
    }
  }

  public addVertex(vertex: Vertex) {
    this.vertexes.push(vertex);
    if (this.XMin > vertex.x) {
      this.XMin = vertex.x;
    }
    if (this.XMax < vertex.x) {
      this.XMax = vertex.x;
    }
    if (this.YMin > vertex.y) {
      this.YMin = vertex.y;
    }
    if (this.YMax < vertex.y) {
      this.YMax = vertex.y;
    }
  }

  public addThing(thing: Thing) {
    if (thing.type == this.player.getID()) {
      this.player.setXPosition(thing.x);
      this.player.setYPosition(thing.y);
      this.player.setAngle(thing.angle);
    }
    this.things.add(thing);
  }

  public addNode(node: Node) {
    this.nodes.push(node);
  }

  public addSubsector(subsector: Subsector) {
    this.subsectors.push(subsector);
  }

  public addLinedef(linedef: WADLinedef) {
    this.WADLinedefs.push(linedef);
  }

  public addSeg(seg: WADSeg) {
    this.WADSegs.push(seg);
  }

  public addSidedef(sidedef: WADSidedef) {
    this.WADSidedefs.push(sidedef);
  }

  public addSector(sector: WADSector) {
    this.WADSectors.push(sector);
  }
}
