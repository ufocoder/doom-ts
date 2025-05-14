import createLoop from "./browser/loop";
import Game from "./lib/Game";

const container2d = document.getElementById('render2d');
const container3d = document.getElementById('render3d');

(async function () {
    const game = new Game(container2d!, container3d!);

    await game.init();

    const loop = createLoop(async (delta) => {
      if (game.isOver()) {
        loop.pause();
      }
      game.update();
      game.render(delta);
    });

    loop.play();
})();
