
import Map from "./lib/Map";
import WADLoader from "./lib/WADLoader";

const WADUrl = import.meta.env.BASE_URL + 'DOOM.WAD';

(async function () {
  const wadloader = new WADLoader(WADUrl);
  const map = new Map("E1M1");

  await wadloader.loadWadFile();

  wadloader.loadMapData(map);
})();
