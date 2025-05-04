
import WADLoader from "./lib/WADLoader";

const WADUrl = import.meta.env.BASE_URL + 'DOOM.WAD';

(async function () {
  const loader = new WADLoader(WADUrl);
  loader.load();
})();
