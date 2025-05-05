import Renderer from "./Renderer";
import {
  Linedef,
  Node,
  Seg,
  Subsector,
  SUBSECTORIDENTIFIER,
  Thing,
  Vertex,
} from "./DataTypes";
import Player from "./Player";

function getRandomColor(): string {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export default class Map {
  private name: string;
  private player: Player;

  XMin: number = Number.MAX_SAFE_INTEGER;
  XMax: number = Number.MIN_SAFE_INTEGER;
  YMin: number = Number.MAX_SAFE_INTEGER;
  YMax: number = Number.MIN_SAFE_INTEGER;

  autoMapScaleFactor: number = 10;

  vertexes: Vertex[] = [];
  linedefs: Linedef[] = [];
  things: Thing[] = [];
  nodes: Node[] = [];
  subsectors: Subsector[] = [];
  segs: Seg[] = [];

  constructor(name: string, player: Player) {
    this.name = name;
    this.player = player;
  }

  public getName() {
    return this.name;
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

  public addLinedef(linedef: Linedef) {
    this.linedefs.push(linedef);
  }

  public addThing(thing: Thing) {
    if (thing.type == this.player.getID()) {
      this.player.setXPosition(thing.x);
      this.player.setYPosition(thing.y);
      this.player.setAngle(thing.angle);
    }

    this.things.push(thing);
  }

  public addNode(node: Node) {
    this.nodes.push(node);
  }

  public addSubsector(subsector: Subsector) {
    this.subsectors.push(subsector);
  }

  public addSeg(seg: Seg) {
    this.segs.push(seg);
  }

  protected remapXToScreen(XMapPosition: number) {
    return (XMapPosition + -this.XMin) / this.autoMapScaleFactor;
  }

  protected remapYToScreen(YMapPosition: number, renderer: Renderer) {
    return (
      renderer.height - (YMapPosition + -this.YMin) / this.autoMapScaleFactor
    );
  }

  renderAutoMap(renderer: Renderer) {
    this.renderAutoMapWalls(renderer);
    this.renderAutoMapPlayer(renderer);
    this.renderBSPNodes(renderer, this.nodes.length - 1);
  }

  renderAutoMapWalls(renderer: Renderer) {
    for (const linedef of this.linedefs) {
      const vStart = this.vertexes[linedef.startVertexID];
      const vEnd = this.vertexes[linedef.endVertexID];

      renderer.drawLine(
        this.remapXToScreen(vStart.x),
        this.remapYToScreen(vStart.y, renderer),
        this.remapXToScreen(vEnd.x),
        this.remapYToScreen(vEnd.y, renderer),
        "red"
      );
    }
  }

  renderAutoMapPlayer(renderer: Renderer) {
    renderer.drawCircle(
      this.remapXToScreen(this.player.getXPosition()),
      this.remapYToScreen(this.player.getYPosition(), renderer),
      4,
      "green"
    );
  }

  renderBSPNodes(renderer: Renderer, nodeID: number) {
    if (nodeID & SUBSECTORIDENTIFIER) {
      this.renderSubsector(renderer, nodeID & ~SUBSECTORIDENTIFIER);
      return;
    }

    const isOnLeft = this.isPointOnLeftSide(
      this.player.getXPosition(),
      this.player.getYPosition(),
      nodeID
    );

    if (isOnLeft) {
      this.renderBSPNodes(renderer, this.nodes[nodeID].leftChildID);
      this.renderBSPNodes(renderer, this.nodes[nodeID].rightChildID);
    } else {
      this.renderBSPNodes(renderer, this.nodes[nodeID].rightChildID);
      this.renderBSPNodes(renderer, this.nodes[nodeID].leftChildID);
    }
  }

  renderSubsector(renderer: Renderer, subsectorID: number) {
    const subsector = this.subsectors[subsectorID];

    for (let i = 0; i < subsector.segCount; i++) {
        const seg = this.segs[subsector.firstSegID + i];
        renderer.drawLine(
          this.remapXToScreen(this.vertexes[seg.startVertexID].x),
          this.remapYToScreen(this.vertexes[seg.startVertexID].y, renderer),
          this.remapXToScreen(this.vertexes[seg.endVertexID].x),
          this.remapYToScreen(this.vertexes[seg.endVertexID].y, renderer),
          getRandomColor(),
        );
    }
  }

  isPointOnLeftSide(x: number, y: number, nodeID: number) {
    const node = this.nodes[nodeID];
    const dx = x - node.x;
    const dy = y - node.y;

    return dx * node.changeY - dy * node.changeX <= 0;
  }

  renderAutoMapNode(renderer: Renderer, nodeID: number) {
    const node = this.nodes[nodeID];

    renderer.drawRect(
      this.remapXToScreen(node.rightBoxLeft),
      this.remapYToScreen(node.rightBoxTop, renderer),
      this.remapXToScreen(node.rightBoxRight) -
        this.remapXToScreen(node.rightBoxLeft) +
        1,
      this.remapYToScreen(node.rightBoxBottom, renderer) -
        this.remapYToScreen(node.rightBoxTop, renderer) +
        1,
      "blue"
    );

    renderer.drawRect(
      this.remapXToScreen(node.leftBoxLeft),
      this.remapYToScreen(node.leftBoxTop, renderer),
      this.remapXToScreen(node.leftBoxRight) -
        this.remapXToScreen(node.leftBoxLeft) +
        1,
      this.remapYToScreen(node.leftBoxBottom, renderer) -
        this.remapYToScreen(node.leftBoxTop, renderer) +
        1,
      "orange"
    );

    renderer.drawLine(
      this.remapXToScreen(node.x),
      this.remapYToScreen(node.y, renderer),
      this.remapXToScreen(node.x + node.changeX),
      this.remapYToScreen(node.y + node.changeY, renderer),
      "green"
    );
  }
}
