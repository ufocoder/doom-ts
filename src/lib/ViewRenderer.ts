import { Angle } from "./Angle";
import { Seg, SUBSECTORIDENTIFIER } from "./DataTypes";
import Map from "./Map";
import Player from "./Player";
import Renderer from "./Renderer";

interface SolidSegmentRange {
  xStart: number;
  xEnd: number;
}

function getRandomColor(): string {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export default class ViewRenderer {
  map: Map;
  player: Player;

  renderer2d: Renderer;
  renderer3d: Renderer;

  distancePlayerToScreen: number = 0;
  halfScreenWidth: number = 0;
  halfScreenHeight: number = 0;
  halfFOV: Angle = new Angle(90);

  private wallColor: Record<string, string> = {};
  private screenXToAngle: number[] = [];
  private solidWallRanges: SolidSegmentRange[] = [];

  constructor(
    map: Map,
    player: Player,
    renderer2d: Renderer,
    renderer3d: Renderer
  ) {
    this.map = map;
    this.player = player;
    this.renderer2d = renderer2d;
    this.renderer3d = renderer3d;
  }

  init() {
    this.halfScreenWidth = this.renderer3d.width / 2;
    this.halfScreenHeight = this.renderer3d.height / 2;
    this.halfFOV = new Angle(this.player.FOV.getValue() / 2);
    this.distancePlayerToScreen = Math.round(
      this.halfScreenWidth / this.halfFOV.getTanValue()
    );

    for (let i = 0; i <= this.renderer3d.width; i++) {
      this.screenXToAngle[i] =
        (Math.atan((this.halfScreenWidth - i) / this.distancePlayerToScreen) *
          180) /
        Math.PI;
    }
  }

  protected remapXToScreen(XMapPosition: number) {
    return (XMapPosition + -this.map.XMin) / this.map.autoMapScaleFactor;
  }

  protected remapYToScreen(YMapPosition: number, renderer: Renderer) {
    return (
      renderer.height -
      (YMapPosition + -this.map.YMin) / this.map.autoMapScaleFactor
    );
  }

  // render

  render() {
    this.render2DMap();
    this.render3DView();
  }

  // 2D
  render2DMap() {
    this.renderer2d.clear();
    this.renderAutoMapWalls();
    this.renderAutoMapPlayer();
    this.renderAutoMapThins();
  }

  renderAutoMapWalls() {
    for (const linedef of this.map.linedefs) {
      const vStart = linedef.startVertex;
      const vEnd = linedef.endVertex;

      this.renderer2d.drawLine(
        this.remapXToScreen(vStart.x),
        this.remapYToScreen(vStart.y, this.renderer2d),
        this.remapXToScreen(vEnd.x),
        this.remapYToScreen(vEnd.y, this.renderer2d),
        "red"
      );
    }
  }

  renderAutoMapPlayer() {
    this.renderer2d.drawCircle(
      this.remapXToScreen(this.player.getXPosition()),
      this.remapYToScreen(this.player.getYPosition(), this.renderer2d),
      4,
      "green"
    );
  }

  renderAutoMapThins() {
    for (const thing of this.map.getThings().data) {
        this.renderer2d.drawRect(
        this.remapXToScreen(thing.x),
        this.remapYToScreen(thing.y, this.renderer2d),
        2,
        2,
        "red"
      );
    }
  }

  // 3D

  render3DView() {
    this.renderer3d.clear();
    this.initFrame();
    this.renderBSPNodes(this.map.nodes.length - 1);
  }

  initFrame() {
    this.solidWallRanges = [];

    const wallLeftSide: SolidSegmentRange = {
      xStart: Number.MIN_SAFE_INTEGER,
      xEnd: -1,
    };
    const wallRightSide: SolidSegmentRange = {
      xStart: this.renderer3d.width,
      xEnd: Number.MAX_SAFE_INTEGER,
    };

    this.solidWallRanges.push(wallLeftSide);
    this.solidWallRanges.push(wallRightSide);
  }

  renderBSPNodes(nodeID: number) {
    if (nodeID & SUBSECTORIDENTIFIER) {
      this.renderSubsector(nodeID & ~SUBSECTORIDENTIFIER);
      return;
    }

    const isOnLeft = this.isPointOnLeftSide(
      this.player.getXPosition(),
      this.player.getYPosition(),
      nodeID
    );

    if (isOnLeft) {
      this.renderBSPNodes(this.map.nodes[nodeID].leftChildID);
      this.renderBSPNodes(this.map.nodes[nodeID].rightChildID);
    } else {
      this.renderBSPNodes(this.map.nodes[nodeID].rightChildID);
      this.renderBSPNodes(this.map.nodes[nodeID].leftChildID);
    }
  }

  renderSubsector(subsectorID: number) {
    const subsector = this.map.subsectors[subsectorID];
    for (let i = 0; i < subsector.segCount; i++) {
      const seg = this.map.segs[subsector.firstSegID + i];
      const angles = this.player.clipVertexesInFOV(
        seg.startVertex,
        seg.endVertex
      );
      if (angles) {
        this.addWallInFOV(
          seg,
          angles.V1Angle,
          angles.V2Angle,
          angles.V1AngleFromPlayer,
          angles.V2AngleFromPlayer
        );
      }
    }
  }

  addWallInFOV(
    seg: Seg,
    V1Angle: Angle,
    V2Angle: Angle,
    V1AngleFromPlayer: Angle,
    V2AngleFromPlayer: Angle
  ) {
    const V1XScreen = this.angleToScreen(V1AngleFromPlayer);
    const V2XScreen = this.angleToScreen(V2AngleFromPlayer);

    if (V1XScreen == V2XScreen) {
      return;
    }

    if (!seg.leftSector) {
      this.clipSolidWalls(seg, V1XScreen, V2XScreen, V1Angle, V2Angle);
      return;
    }
  }

  private clipSolidWalls(
    seg: Seg,
    V1XScreen: number,
    V2XScreen: number,
    V1Angle: Angle,
    V2Angle: Angle
  ): void {
    if (this.solidWallRanges.length < 2) {
        return;
    }

    let i = 0;
    while (i < this.solidWallRanges.length && this.solidWallRanges[i].xEnd < V1XScreen - 1) {
        i++;
    }
    let segIndex = i;
    const segRange = this.solidWallRanges[segIndex];

    if (V1XScreen < segRange.xStart) {
        if (V2XScreen < segRange.xStart - 1) {
            this.storeWallRange(seg, V1XScreen, V2XScreen, V1Angle, V2Angle);
            this.solidWallRanges.splice(segIndex, 0, { xStart: V1XScreen, xEnd: V2XScreen });
            return;
        }
        this.storeWallRange(seg, V1XScreen, segRange.xStart - 1, V1Angle, V2Angle);
        segRange.xStart = V1XScreen;
    }

    if (V2XScreen <= segRange.xEnd) {
        return;
    }

    let nextSegIndex = segIndex;
    let nextSegRange = segRange;
    while (V2XScreen >= this.solidWallRanges[nextSegIndex + 1].xStart - 1) {
        this.storeWallRange(seg, nextSegRange.xEnd + 1, this.solidWallRanges[nextSegIndex + 1].xStart - 1, V1Angle, V2Angle);

        nextSegIndex++;
        nextSegRange = this.solidWallRanges[nextSegIndex];
        if (V2XScreen <= nextSegRange.xEnd) {
            segRange.xEnd = nextSegRange.xEnd;
            if (nextSegIndex !== segIndex) {
                segIndex++;
                nextSegIndex++;
                this.solidWallRanges.splice(segIndex, nextSegIndex - segIndex);
            }
            return;
        }
    }

    this.storeWallRange(seg, nextSegRange.xEnd + 1, V2XScreen, V1Angle, V2Angle);
    segRange.xEnd = V2XScreen;

    if (nextSegIndex !== segIndex) {
        segIndex++;
        nextSegIndex++;
        this.solidWallRanges.splice(segIndex, nextSegIndex - segIndex);
    }
  }

  private storeWallRange(
    seg: Seg,
    V1XScreen: number,
    V2XScreen: number,
    V1Angle: Angle,
    V2Angle: Angle
  ): void {
    this.calculateWallHeight(seg, V1XScreen, V2XScreen, V1Angle, V2Angle);
  }

  private calculateWallHeight(
    seg: Seg,
    V1XScreen: number,
    V2XScreen: number,
    V1Angle: Angle,
    _: Angle
  ): void {
    const Angle90 = new Angle(90);
    
    const SegToNormalAngle = new Angle(seg.slopeAngle.getValue() + Angle90.getValue());
    const NomalToV1Angle = new Angle(SegToNormalAngle.getValue() - V1Angle.getValue());
    const SegToPlayerAngle = new Angle(Angle90.getValue() - NomalToV1Angle.getValue());

    const DistanceToV1 = this.player.distanceToPoint(seg.startVertex);
    const DistanceToNormal = SegToPlayerAngle.getSinValue() * DistanceToV1;

    const V1ScaleFactor = this.getScaleFactor(V1XScreen, SegToNormalAngle, DistanceToNormal);
    const V2ScaleFactor = this.getScaleFactor(V2XScreen, SegToNormalAngle, DistanceToNormal);

    const Steps = V1XScreen == V2XScreen 
      ? 1 
      : (V2ScaleFactor - V1ScaleFactor) / (V2XScreen - V1XScreen);

    const ceiling = seg.rightSector?.ceilingHeight! - this.player.getZPosition();
    const floor = seg.rightSector?.floorHeight! - this.player.getZPosition();

    const CeilingStep = -(ceiling * Steps);
    const FloorStep = -(floor * Steps);

    let CeilingEnd = Math.round(this.halfScreenHeight - ceiling * V1ScaleFactor);
    let FloorStart = Math.round(this.halfScreenHeight - floor * V1ScaleFactor);

    const color = this.getWallColor(seg.linedef.rightSidedef?.middleTexture!);
    let XCurrent = V1XScreen;
    while (XCurrent <= V2XScreen)
    {
        this.renderer3d.drawLine(
          XCurrent,
          CeilingEnd,
          XCurrent,
          FloorStart,
          color
        );
        XCurrent++;
        CeilingEnd += CeilingStep;
        FloorStart += FloorStep;
    }
  }

  private getScaleFactor(
    VXScreen: number,
    SegToNormalAngle: Angle,
    DistanceToNormal: number
  ): number {
    const MAX_SCALEFACTOR = 64.0;
    const MIN_SCALEFACTOR = 0.00390625;

    const ScreenXAngle = new Angle(this.screenXToAngle[VXScreen]);
    const SkewAngle = new Angle(
        ScreenXAngle.getValue() + 
        this.player.getAngle().getValue() -
        SegToNormalAngle.getValue()
    );
    const ScreenXAngleCos = ScreenXAngle.getCosValue();
    const SkewAngleCos = SkewAngle.getCosValue();

    const ScaleFactor =
      (this.distancePlayerToScreen * SkewAngleCos) /
      (DistanceToNormal * ScreenXAngleCos);
 
    return Math.min(MAX_SCALEFACTOR, Math.max(MIN_SCALEFACTOR, ScaleFactor));
  }

  // utils

  isPointOnLeftSide(x: number, y: number, nodeID: number) {
    const node = this.map.nodes[nodeID];
    const dx = x - node.x;
    const dy = y - node.y;

    return dx * node.changeY - dy * node.changeX <= 0;
  }

  angleToScreen(angle: Angle) {
    let x = 0;
    if (angle.greaterThan(90)) {
      angle.subtractAssign(90);
      x =
        this.distancePlayerToScreen -
        Math.round(angle.getTanValue() * this.halfScreenWidth);
    } else {
      angle.assign(90 - angle.getValue());
      x = Math.round(angle.getTanValue() * this.halfScreenWidth);
      x += this.distancePlayerToScreen;
    }
    return x;
  }

  getWallColor(textureName: string) {
    if (!this.wallColor[textureName]) {
      this.wallColor[textureName] = getRandomColor();
      return this.wallColor[textureName];
    }
    return this.wallColor[textureName];
  }
}
