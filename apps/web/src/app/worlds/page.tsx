// The World Map route. A Server Component fetches the six-realm catalog from the
// engine (source of truth for lock state) and hands it to the client map, which
// overlays the explorer's progress. Content is never bundled into the client.
import { getWorlds } from "@/lib/worlds";
import { WorldMap } from "@/features/worlds/WorldMap";

export const metadata = {
  title: "World Map · LogicLand",
};

export default async function WorldMapPage() {
  const worlds = await getWorlds();
  return <WorldMap worlds={worlds} />;
}
