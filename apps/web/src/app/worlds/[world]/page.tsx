// A single World's home (e.g. /worlds/logic-forest). Server-fetches the catalog,
// finds this realm, and 404s cleanly for unknown or still-locked worlds so the
// URL can never sneak past the map's lock.
import { notFound } from "next/navigation";
import { getWorlds } from "@/lib/worlds";
import { WorldHome } from "@/features/worlds/WorldHome";

export async function generateMetadata({
  params,
}: {
  params: { world: string };
}) {
  const worlds = await getWorlds();
  const world = worlds.find((w) => w.slug === params.world);
  return { title: world ? `${world.title} · LogicLand` : "LogicLand" };
}

export default async function WorldPage({
  params,
}: {
  params: { world: string };
}) {
  const worlds = await getWorlds();
  const world = worlds.find((w) => w.slug === params.world);
  if (!world || world.locked) notFound();
  return <WorldHome world={world} />;
}
