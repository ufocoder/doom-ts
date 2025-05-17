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
    this.distancePlayerToScreen =
      this.halfScreenWidth / this.halfFOV.getTanValue();

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

  // 3D

  render3DView() {
    this.renderer3d.clear();
    this.initFrame();
    this.renderBSPNodes(this.map.nodes.length - 1);
  }

  initFrame() {
    this.solidWallRanges = [];

    const wallLeftSide: SolidSegmentRange = {
      xStart: -Number.MIN_SAFE_INTEGER,
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
    _: Angle,
    __: Angle,
    V1AngleFromPlayer: Angle,
    V2AngleFromPlayer: Angle
  ) {
    const V1XScreen = this.angleToScreen(V1AngleFromPlayer);
    const V2XScreen = this.angleToScreen(V2AngleFromPlayer);

    if (V1XScreen == V2XScreen) {
      return;
    }

    if (!seg.leftSector) {
      this.clipSolidWalls(seg, V1XScreen, V2XScreen); //, V1Angle, V2Angle);
    }
  }

  public clipSolidWalls(
    seg: Seg,
    V1XScreen: number,
    V2XScreen: number,
    // V1Angle: Angle,
    // V2Angle: Angle
  ): void {
    if (this.solidWallRanges.length < 2) {
      return;
    }

    const currentWall: SolidSegmentRange = {
      xStart: V1XScreen,
      xEnd: V2XScreen,
    };

    let FoundClipWall = 0;
    while (
      FoundClipWall < this.solidWallRanges.length &&
      this.solidWallRanges[FoundClipWall].xEnd < currentWall.xStart - 1
    ) {
      FoundClipWall++;
    }

    if (currentWall.xStart < this.solidWallRanges[FoundClipWall].xStart) {
      if (currentWall.xEnd < this.solidWallRanges[FoundClipWall].xStart - 1) {
        // All of the wall is visible, so insert it
        this.storeWallRange(
          seg,
          currentWall.xStart,
          currentWall.xEnd,
          // V1Angle,
          // V2Angle
        );
        this.solidWallRanges.splice(FoundClipWall, 0, currentWall);
        return;
      }

      // The end is already included, just update start
      this.storeWallRange(
        seg,
        currentWall.xStart,
        this.solidWallRanges[FoundClipWall].xStart - 1,
        // V1Angle,
        // V2Angle
      );
      this.solidWallRanges[FoundClipWall].xStart = currentWall.xStart;
    }

    // This part is already occupied
    if (currentWall.xEnd <= this.solidWallRanges[FoundClipWall].xEnd) {
      return;
    }

    let nextWall = FoundClipWall;

    while (currentWall.xEnd >= this.solidWallRanges[nextWall + 1]?.xStart - 1) {
      // partially clipped by other walls, store each fragment
      this.storeWallRange(
        seg,
        this.solidWallRanges[nextWall].xEnd + 1,
        this.solidWallRanges[nextWall + 1].xStart - 1,
        // V1Angle,
        // V2Angle
      );
      nextWall++;

      if (currentWall.xEnd <= this.solidWallRanges[nextWall].xEnd) {
        this.solidWallRanges[FoundClipWall].xEnd =
          this.solidWallRanges[nextWall].xEnd;
        if (nextWall !== FoundClipWall) {
          this.solidWallRanges.splice(
            FoundClipWall + 1,
            nextWall - FoundClipWall
          );
        }
        return;
      }
    }

    this.storeWallRange(
      seg,
      this.solidWallRanges[nextWall].xEnd + 1,
      currentWall.xEnd,
      // V1Angle,
      // V2Angle
    );
    this.solidWallRanges[FoundClipWall].xEnd = currentWall.xEnd;

    if (nextWall !== FoundClipWall) {
      this.solidWallRanges.splice(FoundClipWall + 1, nextWall - FoundClipWall);
    }
  }

  private storeWallRange(seg: Seg, V1XScreen: number, V2XScreen: number) { //, V1Angle: Angle, V2Angle: Angle): void {
    this.calculateWallHeightSimple(seg, V1XScreen, V2XScreen); //, V1Angle, V2Angle);
  }


  drawSolidWall(visibleSeg: Seg, V1XScreen: number, V2XScreen: number) {
    const color = this.getWallColor(
      visibleSeg.linedef.rightSidedef?.middleTexture ?? ""
    );

    this.renderer3d.drawRect(
      V1XScreen,
      0,
      V2XScreen - V1XScreen + 1,
      this.renderer3d.height,
      color,
      true
    );
  }

  private calculateWallHeightSimple(
    seg: Seg,
    V1XScreen: number,
    V2XScreen: number,
    // V1Angle: Angle,
    // V2Angle: Angle
  ): void {
    let DistanceToV1 = this.player.distanceToPoint(seg.startVertex);
    let DistanceToV2 = this.player.distanceToPoint(seg.endVertex);

    // Special Case partial seg on the left

/*
    if (V1XScreen <= 0) {
      DistanceToV1 = this.partialSeg(
        seg, 
        V1Angle, 
        V2Angle, 
        DistanceToV1, 
        true
      );
    }

    // Special Case partial seg on the right
    if (V2XScreen >= 360) {
      DistanceToV2 = this.partialSeg(
        seg,
        V1Angle,
        V2Angle,
        DistanceToV2,
        false
      );
    }
*/
    const { outCeiling: CeilingV1OnScreen, outFloor: FloorV1OnScreen } =
      this.calculateCeilingFloorHeight(seg, V1XScreen, DistanceToV1);

    const { outCeiling: CeilingV2OnScreen, outFloor: FloorV2OnScreen } =
      this.calculateCeilingFloorHeight(seg, V2XScreen, DistanceToV2);

    const color = this.getWallColor(
      seg.linedef.rightSidedef?.middleTexture ?? ""
    );

    // Draw wall segments
    this.renderer3d.drawLine(
      V1XScreen,
      CeilingV1OnScreen,
      V1XScreen,
      FloorV1OnScreen,
      color
    );
    this.renderer3d.drawLine(
      V2XScreen,
      CeilingV2OnScreen,
      V2XScreen,
      FloorV2OnScreen,
      color
    );
    this.renderer3d.drawLine(
      V1XScreen,
      CeilingV1OnScreen,
      V2XScreen,
      CeilingV2OnScreen,
      color
    );
    this.renderer3d.drawLine(
      V1XScreen,
      FloorV1OnScreen,
      V2XScreen,
      FloorV2OnScreen,
      color
    );
  }

  private calculateCeilingFloorHeight(
    seg: Seg, 
    VXScreen: number, 
    DistanceToV: number, 
)  {
    const Ceiling = seg.rightSector!.ceilingHeight - this.player.getZPosition();
    const Floor = seg.rightSector!.floorHeight - this.player.getZPosition();

    const VScreenAngle = new Angle(this.screenXToAngle[VXScreen]);

    const DistanceToVScreen = this.distancePlayerToScreen / VScreenAngle.getCosValue();

    let CeilingVOnScreen = (Math.abs(Ceiling) * DistanceToVScreen) / DistanceToV;
    let FloorVOnScreen = (Math.abs(Floor) * DistanceToVScreen) / DistanceToV;

    if (Ceiling > 0) {
        CeilingVOnScreen = this.halfScreenHeight - CeilingVOnScreen;
    } else {
        CeilingVOnScreen += this.halfScreenHeight;
    }

    if (Floor > 0) {
        FloorVOnScreen = this.halfScreenHeight - FloorVOnScreen;
    } else {
        FloorVOnScreen += this.halfScreenHeight;
    }

    return {
      outCeiling: CeilingVOnScreen,
      outFloor: FloorVOnScreen, 
    }
  }
/*
  private partialSeg(
    seg: Seg,
    V1Angle: Angle,
    V2Angle: Angle,
    DistanceToV: number,
    IsLeftSide: boolean
  ): number {
    const dx = seg.startVertex.x - seg.endVertex.x;
    const dy = seg.startVertex.y - seg.endVertex.y;
    const SideC = Math.sqrt(dx * dx + dy * dy);

    const V1toV2Span = V1Angle.subtract(V2Angle);
    const SINEAngleB = (DistanceToV * V1toV2Span.getSinValue()) / SideC;
    const AngleB = new Angle((Math.asin(SINEAngleB) * 180.0) / Math.PI);
    const AngleA = new Angle(180 - V1toV2Span.getValue() - AngleB.getValue());

    let AngleVToFOV: Angle;

    if (IsLeftSide) {
      AngleVToFOV = V1Angle.subtract(
        new Angle(this.player.getAngle().getValue() + 45)
      );
    } else {
      AngleVToFOV = new Angle(this.player.getAngle().getValue() - 45).subtract(
        V2Angle
      );
    }

    const NewAngleB = new Angle(
      180 - AngleVToFOV.getValue() - AngleA.getValue()
    );
    return (DistanceToV * AngleA.getSinValue()) / NewAngleB.getSinValue();
  }
*/
  // utils

  isPointOnLeftSide(x: number, y: number, nodeID: number) {
    const node = this.map.nodes[nodeID];
    const dx = x - node.x;
    const dy = y - node.y;

    return dx * node.changeY - dy * node.changeX <= 0;
  }

  angleToScreen(angle: Angle) {
    let x = 0;
    if (angle.getValue() > 90) {
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
