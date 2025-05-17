import Canvas2d from "../browser/Canvas2d";
import Map from "./Map";
import Player from "./Player";
import Things from "./Things";
import ViewRenderer from "./ViewRenderer";
import WADLoader from "./WADLoader";

const WADUrl = import.meta.env.BASE_URL + "DOOM.WAD";

export default class DoomEngine {
  isOver: boolean = false;

  container3d: HTMLElement;
  container2d: HTMLElement;

  renderWidth: number = 480;
  renderHeight: number = 300;
  
  renderer2d: Canvas2d;
  renderer3d: Canvas2d;

  viewRenderer: ViewRenderer;

  map: Map;
  player: Player;
  things: Things;

  constructor(container2d: HTMLElement, container3d: HTMLElement) {
    this.container2d = container2d;
    this.container3d = container3d;

    this.renderer2d = new Canvas2d(this.renderWidth, this.renderHeight);
    this.renderer3d = new Canvas2d(this.renderWidth, this.renderHeight);

    this.container2d.appendChild(this.renderer2d.element);
    this.container3d.appendChild(this.renderer3d.element);

    this.player = new Player(1);
    this.things = new Things();

    this.map = new Map("E1M1", this.player, this.things);

    this.viewRenderer = new ViewRenderer(
      this.map,
      this.player,
      this.renderer2d,
      this.renderer3d
    )
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
    const wadloader = new WADLoader(WADUrl);
    await wadloader.loadWadFile();
    wadloader.loadMapData(this.map);

    const playerThing = this.map.getThings().getThingByID(this.player.getID());

    this.viewRenderer.init();
    this.player.init(playerThing);
    this.map.init();

    this.viewRenderer.render()

    return true;
  }

  handleKeyPressed(e: KeyboardEvent) {
    switch (e.key) {
      case "ArrowUp":
        this.player.moveForward();
        break;

      case "ArrowDown":
        this.player.moveLeftward();
        break;

      case "ArrowLeft":
        this.player.rotateLeft();
        break;

      case "ArrowRight":
        this.player.rotateRight();
        break;

      case "Escape":
        this.quit();
        break;
    }
  }

  render(_: number) {
    this.viewRenderer.render()
  }

  update() {}

  quit() {
    this.isOver = true;
  }
}
