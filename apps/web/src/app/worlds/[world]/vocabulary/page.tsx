// The Word Wall route: /worlds/logic-forest/vocabulary. Server-resolves the
// world (404s for unknown/locked) and reads its vocabulary from config, then
// hands both to the client deck.
import { notFound } from "next/navigation";
import { vocabularyFor } from "@/data/vocabulary";
import { getWorlds } from "@/lib/worlds";
import { VocabularyDeck } from "@/features/vocabulary/VocabularyDeck";

interface Params {
  params: { world: string };
}

export async function generateMetadata({ params }: Params) {
  const worlds = await getWorlds();
  const world = worlds.find((w) => w.slug === params.world);
  return { title: world ? `${world.title} Word Wall · LogicLand` : "LogicLand" };
}

export default async function VocabularyPage({ params }: Params) {
  const worlds = await getWorlds();
  const world = worlds.find((w) => w.slug === params.world);
  if (!world || world.locked) notFound();

  return (
    <VocabularyDeck
      worldSlug={world.slug}
      worldTitle={world.title}
      words={vocabularyFor(world.slug)}
    />
  );
}
