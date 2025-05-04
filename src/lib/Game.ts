import DoomEngine from "./DoomEngine";

export default class Game {
    engine: DoomEngine;

    constructor(container: HTMLElement) {
        this.engine = new DoomEngine(container);
    }

    async init() {
        await this.engine.init();
        window.addEventListener('keypress', this.handleWindowKeypress);
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

    handleWindowKeypress = (e: KeyboardEvent) => {
        this.engine.handleKeyPressed(e);
    }

    destroy() {
        window.removeEventListener('keypress', this.handleWindowKeypress);
    }
}