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
  halfFOV: number = 90;

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
    this.halfFOV = this.player.FOV.getValue() / 2;

    this.distancePlayerToScreen =
      this.halfScreenWidth / new Angle(this.halfFOV).getTanValue();

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
      xStart: -Infinity,
      xEnd: -1,
    };
    const wallRightSide: SolidSegmentRange = {
      xStart: this.renderer3d.width,
      xEnd: Infinity,
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
        this.addWallInFOV(seg, angles.V1Angle, angles.V2Angle);
      }
    }
  }

  addWallInFOV(seg: Seg, V1Angle: Angle, V2Angle: Angle) {
    const V1XScreen = this.angleToScreen(V1Angle);
    const V2XScreen = this.angleToScreen(V2Angle);

    if (V1XScreen == V2XScreen) {
      return;
    }

    if (!seg.leftSector) {
      this.clipSolidWalls(seg, V1XScreen, V2XScreen);
    }
  }

  public clipSolidWalls(seg: Seg, V1XScreen: number, V2XScreen: number): void {
    const currentWall: SolidSegmentRange = {
      xStart: V1XScreen,
      xEnd: V2XScreen,
    };

    let foundClipWallIndex = 0;
    while (
      foundClipWallIndex < this.solidWallRanges.length &&
      this.solidWallRanges[foundClipWallIndex].xEnd < currentWall.xStart - 1
    ) {
      foundClipWallIndex++;
    }

    const foundClipWall = this.solidWallRanges[foundClipWallIndex];

    if (currentWall.xStart < foundClipWall.xStart) {
      if (currentWall.xEnd < foundClipWall.xStart - 1) {
        // All of the wall is visible, so insert it
        this.storeWallRange(seg, currentWall.xStart, currentWall.xEnd);
        this.solidWallRanges.splice(foundClipWallIndex, 0, currentWall);
        return;
      }

      // The end is already included, just update start
      this.storeWallRange(seg, currentWall.xStart, foundClipWall.xStart - 1);
      foundClipWall.xStart = currentWall.xStart;
    }

    // Current wall is completely covered
    if (currentWall.xEnd <= foundClipWall.xEnd) {
      return;
    }

    let nextWallIndex = foundClipWallIndex;
    let nextWall = this.solidWallRanges[nextWallIndex];

    while (
      nextWallIndex + 1 < this.solidWallRanges.length &&
      currentWall.xEnd >= this.solidWallRanges[nextWallIndex + 1].xStart - 1
    ) {
      // partially clipped by other walls, store each fragment
      const nextNextWall = this.solidWallRanges[nextWallIndex + 1];
      this.storeWallRange(seg, nextWall.xEnd + 1, nextNextWall.xStart - 1);
      nextWallIndex++;
      nextWall = nextNextWall;

      if (currentWall.xEnd <= nextWall.xEnd) {
        foundClipWall.xEnd = nextWall.xEnd;
        if (nextWallIndex !== foundClipWallIndex) {
          this.solidWallRanges.splice(
            foundClipWallIndex + 1,
            nextWallIndex - foundClipWallIndex
          );
        }
        return;
      }
    }

    this.storeWallRange(seg, nextWall.xEnd + 1, currentWall.xEnd);
    foundClipWall.xEnd = currentWall.xEnd;

    if (nextWallIndex !== foundClipWallIndex) {
      this.solidWallRanges.splice(
        foundClipWallIndex + 1,
        nextWallIndex - foundClipWallIndex
      );
    }
  }

  storeWallRange(seg: Seg, V1XScreen: number, V2XScreen: number) {
    this.drawSolidWall(seg, V1XScreen, V2XScreen);
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

  calculateWallHeightSimple(
    seg: Seg,
    V1XScreen: number,
    V2XScreen: number,
    V1Angle: Angle,
    V2Angle: Angle
  ): void {
    let DistanceToV1 = this.player.distanceToPoint(seg.startVertex);
    let DistanceToV2 = this.player.distanceToPoint(seg.endVertex);

    // Special Case partial seg on the left
    if (V1XScreen <= 0) {
      DistanceToV1 = this.partialSeg(seg, V1Angle, V2Angle, DistanceToV1, true);
    }

    // Special Case partial seg on the right
    if (V2XScreen >= 319) {
      DistanceToV2 = this.partialSeg(
        seg,
        V1Angle,
        V2Angle,
        DistanceToV2,
        false
      );
    }

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
    DistanceToV: number
  ) {
    const Ceiling =
      (seg.rightSector?.ceilingHeight ?? 0) - this.player.getZPosition();
    const Floor =
      (seg.rightSector?.floorHeight ?? 0) - this.player.getZPosition();

    const VScreenAngle = this.screenXToAngle[VXScreen];
    const DistanceToVScreen =
      this.distancePlayerToScreen / new Angle(VScreenAngle).getCosValue();

    let outCeiling = (Math.abs(Ceiling) * DistanceToVScreen) / DistanceToV;
    let outFloor = (Math.abs(Floor) * DistanceToVScreen) / DistanceToV;

    if (Ceiling > 0) {
      outCeiling = this.halfScreenHeight - outCeiling;
    } else {
      outCeiling += this.halfScreenHeight;
    }

    if (Floor > 0) {
      outFloor = this.halfScreenHeight - outFloor;
    } else {
      outFloor += this.halfScreenHeight;
    }

    return {
      outCeiling,
      outFloor,
    };
  }

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
