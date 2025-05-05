import Canvas2d from "../browser/Canvas2d";
import Map from "./Map";
import Player from "./Player";
import WADLoader from "./WADLoader";

export default class DoomEngine {
  isOver: boolean = false;

  container: HTMLElement;
  renderWidth: number = 640;
  renderHeight: number = 400;
  renderer: Canvas2d;

  map: Map;
  player: Player;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new Canvas2d(this.renderWidth, this.renderHeight);
    this.container.appendChild(this.renderer.element);

    this.player = new Player(1);
    this.map = new Map("E1M1", this.player);
  }

  getIsOver() {
    return this.isOver;
  }

  getRenderWidth() {
    return this.renderWidth;
  }

  getRenderHeight() {
    return this.renderHeight;
  }

  getName() {
    return "DIYDoom";
  }

  async init() {
    const WADUrl = import.meta.env.BASE_URL + "DOOM.WAD";
    const wadloader = new WADLoader(WADUrl);
    await wadloader.loadWadFile();
    wadloader.loadMapData(this.map);
  }

  handleKeyPressed(e: KeyboardEvent) {
    switch (e.key) {
      case "ArrowUp":
        break;

      case "ArrowDown":
        break;

      case "ArrowLeft":
        break;

      case "ArrowRight":
        break;

      case "Escape":
        this.quit();
        break;
    }
  }

  render(_: number) {
    this.renderer.clear();
    this.map.renderAutoMap(this.renderer);
  }

  update() {}

  quit() {
    this.isOver = true;
  }
}
