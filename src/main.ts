import createLoop, { wait } from "./browser/loop";
import Game from "./lib/Game";

const container = document.getElementById('app');

(async function () {
    const game = new Game(container!);

    await game.init();

    const loop = createLoop(async (delta) => {
      if (game.isOver()) {
        loop.pause();
      }
      game.update();
      game.render(delta);
      await wait(1_000);
    });

    loop.play();
})();
