import DoomEngine from "./DoomEngine";

export default class Game {
    engine: DoomEngine;

    constructor(container2d: HTMLElement, container3d: HTMLElement) {
        this.engine = new DoomEngine(container2d, container3d);
    }

    async init() {
        await this.engine.init();
        window.addEventListener('keydown', this.handleWindowKeydown);
    }

    isOver() {
        return this.engine.getIsOver();
    }

    render(delta: number) {
        this.engine.render(delta);
    }

    update() {
        this.engine.update();
    }

    handleWindowKeydown = (e: KeyboardEvent) => {
        this.engine.handleKeyPressed(e);
    }

    destroy() {
        window.removeEventListener('keydown', this.handleWindowKeydown);
    }
}