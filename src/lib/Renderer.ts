export default interface Renderer {
  width: number;
  height: number;

  drawRect(
    x1: number,
    y1: number,
    w: number,
    h: number,
    color: string,
    fill?: boolean
  ): void;

  drawLine(x1: number, y1: number, x2: number, y2: number, color: string): void;
  drawCircle(x1: number, y1: number, radius: number, color: string): void;

  clear(): void;
}
