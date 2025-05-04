import Renderer from "./Renderer";
import { Linedef, Vertex } from "./DataTypes";

export default class Map {
  private name: string;

  XMin: number = Number.MAX_SAFE_INTEGER;
  XMax: number = Number.MIN_SAFE_INTEGER;
  YMin: number = Number.MAX_SAFE_INTEGER;
  YMax: number = Number.MIN_SAFE_INTEGER;

  autoMapScaleFactor: number = 10;

  vertexes: Vertex[] = [];
  linedef: Linedef[] = [];

  constructor(name: string) {
    this.name = name;
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
    this.linedef.push(linedef);
  }

  renderAutoMap(renderer: Renderer) {
    let iXShift = this.XMin - 100;
    let iYShift = this.YMin - 500;

    let iRenderYSize = renderer.height;    

    for (const linedef of this.linedef) {
      const vStart = this.vertexes[linedef.startVertex];
      const vEnd = this.vertexes[linedef.endVertex];
      const x1 = (vStart.x - iXShift) / this.autoMapScaleFactor;
      const y1 = iRenderYSize - (vStart.y - iYShift) / this.autoMapScaleFactor;
      const x2 = (vEnd.x - iXShift) / this.autoMapScaleFactor;
      const y2 = iRenderYSize - (vEnd.y - iYShift) / this.autoMapScaleFactor;

      renderer.drawLine(x1, y1, x2, y2, "black");
    }
  }
}
