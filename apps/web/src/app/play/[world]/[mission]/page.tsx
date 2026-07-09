// The mission player route: /play/logic-forest/robot-path. Server-resolves the
// world + mission from the engine catalog and the game data from config, then
// hands a ready MissionRunner to the client. Any mismatch (unknown, locked,
// not-yet-live, or missing game data) 404s cleanly — no broken game can load.
import { notFound } from "next/navigation";
import { gameDataFor } from "@/data/missions";
import { getWorlds } from "@/lib/worlds";
import { MissionRunner } from "@/features/games/MissionRunner";

interface Params {
  params: { world: string; mission: string };
}

export async function generateMetadata({ params }: Params) {
  const worlds = await getWorlds();
  const mission = worlds
    .find((w) => w.slug === params.world)
    ?.missions.find((m) => m.slug === params.mission);
  return { title: mission ? `${mission.title} · LogicLand` : "LogicLand" };
}

export default async function PlayPage({ params }: Params) {
  const worlds = await getWorlds();
  const world = worlds.find((w) => w.slug === params.world);
  if (!world || world.locked) notFound();

  const mission = world.missions.find((m) => m.slug === params.mission);
  if (!mission || mission.status !== "live") notFound();

  const gameData = gameDataFor(mission.slug);
  if (!gameData) notFound();

  // The next playable mission in this world (live + has game data), so the
  // reward screen can carry the explorer straight into their next adventure.
  const ordered = [...world.missions].sort((a, b) => a.order - b.order);
  const fromHere = ordered.slice(ordered.findIndex((m) => m.slug === mission.slug) + 1);
  const next = fromHere.find((m) => m.status === "live" && gameDataFor(m.slug));
  const nextMission = next ? { slug: next.slug, title: next.title } : null;

  return (
    <MissionRunner
      worldSlug={world.slug}
      worldTitle={world.title}
      mission={mission}
      gameData={gameData}
      nextMission={nextMission}
    />
  );
}
