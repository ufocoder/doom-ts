import createLoop from "./browser/loop";
import Game from "./lib/Game";

const container = document.getElementById('app');

(async function () {
    const game = new Game(container!);

    await game.init();

    const loop = createLoop((delta) => {
      if (game.isOver()) {
        loop.pause();
      }
      game.update();
      game.render(delta);
    });

    loop.play();
})();
