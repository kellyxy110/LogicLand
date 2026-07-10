"use client";
// MissionRunner — the seam every game plugs into. It switches on the mission's
// game kind (robot-maze, typing-quest, and future blockly/scratch/python…), so a
// new game type is one case here and never touches existing missions. It owns
// the shared shell (header) and the *only* place progress is committed: on a win
// it calls the server action, which computes the reward and persists it. The
// client can never inflate XP.
import { RoboAvatar } from "@logicland/ui";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import type { MissionReward } from "@/lib/engine";
import { useStudent } from "@/lib/student-store";
import type { LandMission } from "@/types/world";
import type { MissionGameData } from "@/types/game";
import { RewardModal } from "@/features/rewards/RewardModal";
import { HtmlStudio } from "@/features/studio/HtmlStudio";
import { KeyboardQuest } from "./KeyboardQuest";
import { MemoryGame } from "./MemoryGame";
import { PatternBuilder } from "./PatternBuilder";
import { RobotMaze } from "./RobotMaze";
import { ShapeMatch } from "./ShapeMatch";
import { TypingQuest } from "./TypingQuest";
import { useGameSession } from "./useGameSession";

interface MissionRunnerProps {
  worldSlug: string;
  worldTitle: string;
  mission: LandMission;
  gameData: MissionGameData;
  /** The next playable mission in this world, for reward-screen continuity. */
  nextMission: { slug: string; title: string } | null;
}

export function MissionRunner({
  worldSlug,
  worldTitle,
  mission,
  gameData,
  nextMission,
}: MissionRunnerProps) {
  const { completeMission } = useStudent();
  const restart = useGameSession((s) => s.restart);
  const [reward, setReward] = useState<MissionReward | null>(null);
  const [stars, setStars] = useState(0);
  const [saving, setSaving] = useState(false);

  // The single, guarded path to committing progress. Idempotent server-side.
  const handleWin = useCallback(
    async (starsCollected: number) => {
      if (saving || reward) return;
      setSaving(true);
      setStars(starsCollected);
      try {
        const r = await completeMission(mission.slug);
        setReward(r);
      } finally {
        setSaving(false);
      }
    },
    [saving, reward, completeMission, mission.slug],
  );

  const handleReplay = useCallback(() => {
    setReward(null);
    setStars(0);
    restart();
  }, [restart]);

  // The studio needs room for three panes; the tap games stay cozy and centered.
  const wide = gameData.kind === "html-studio";

  return (
    <main className={`mx-auto ${wide ? "max-w-5xl" : "max-w-lg"} px-5 py-6`}>
      <header className="mb-4 flex items-center gap-3">
        <Link
          href={`/worlds/${worldSlug}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> {worldTitle}
        </Link>
      </header>

      <div className="mb-5 flex items-center gap-3">
        <RoboAvatar mood="idle" size={52} />
        <div>
          <h1 className="font-display text-2xl font-extrabold">{mission.title}</h1>
          <p className="text-sm font-semibold text-brand">{mission.skill}</p>
        </div>
      </div>

      {renderGame(gameData, mission.slug, handleWin)}

      <AnimatePresence>
        {reward && (
          <RewardModal
            reward={reward}
            badge={mission.badge}
            starsCollected={stars}
            worldSlug={worldSlug}
            worldTitle={worldTitle}
            nextMission={nextMission}
            onReplay={handleReplay}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/** The game-kind switch: the one place a new game type plugs in. TypeScript
 *  narrows `gameData` per case, so each game gets exactly its own data shape. */
function renderGame(
  gameData: MissionGameData,
  slug: string,
  onWin: (stars: number) => void,
) {
  switch (gameData.kind) {
    case "robot-maze":
      return <RobotMaze slug={slug} data={gameData} onWin={onWin} />;
    case "typing-quest":
      return <TypingQuest slug={slug} data={gameData} onWin={onWin} />;
    case "shape-match":
      return <ShapeMatch slug={slug} data={gameData} onWin={onWin} />;
    case "memory":
      return <MemoryGame slug={slug} data={gameData} onWin={onWin} />;
    case "pattern-builder":
      return <PatternBuilder slug={slug} data={gameData} onWin={onWin} />;
    case "key-quest":
      return <KeyboardQuest slug={slug} data={gameData} onWin={onWin} />;
    case "html-studio":
      return <HtmlStudio slug={slug} data={gameData} onWin={onWin} />;
    default:
      return null;
  }
}
