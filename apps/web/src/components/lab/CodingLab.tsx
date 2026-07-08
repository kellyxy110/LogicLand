"use client";
// Robo Coding Lab — the interactive block-coding surface. Kids tap blocks from
// the palette to build a program (loops and if-path can hold nested blocks one
// level deep — plenty for the Beginner Journey), press Run to watch Robo act it
// out on the grid, and solve the puzzle to unlock the rest of the mission.
import { Button } from "@logicland/ui";
import { Play, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import {
  type Block,
  type BlockType,
  countBlocks,
  type Frame,
  type Puzzle,
  runProgram,
} from "@/lib/puzzles";
import { RoboStage } from "./RoboStage";

const LABELS: Record<BlockType, string> = {
  move: "Move",
  left: "Turn ↺",
  right: "Turn ↻",
  repeat: "Repeat",
  if_path: "If Path",
};
const EMOJI: Record<BlockType, string> = {
  move: "🦶",
  left: "↺",
  right: "↻",
  repeat: "🔁",
  if_path: "🚧",
};
const CONTAINER: BlockType[] = ["repeat", "if_path"];

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function CodingLab({
  puzzle,
  onSolved,
}: {
  puzzle: Puzzle;
  onSolved: () => void;
}) {
  const [program, setProgram] = useState<Block[]>([]);
  const [target, setTarget] = useState<string>("root"); // where new blocks land
  const [frame, setFrame] = useState<Frame>({
    x: puzzle.start.x,
    y: puzzle.start.y,
    dir: puzzle.startDir,
    collected: [],
    bumped: false,
  });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<"solved" | "retry" | null>(null);
  const solvedOnce = useRef(false);

  const addBlock = (type: BlockType) => {
    if (running) return;
    setResult(null);
    const block: Block = { id: newId(), type };
    if (type === "repeat") {
      block.times = 3;
      block.children = [];
    } else if (type === "if_path") {
      block.children = [];
    }
    setProgram((prev) => insert(prev, target, block));
    // A new container becomes the active insertion target.
    if (CONTAINER.includes(type)) setTarget(block.id);
  };

  const removeBlock = (id: string) => {
    if (running) return;
    setResult(null);
    setProgram((prev) => remove(prev, id));
    if (target === id) setTarget("root");
  };

  const setTimes = (id: string, delta: number) => {
    if (running) return;
    setProgram((prev) =>
      mapBlocks(prev, (b) =>
        b.id === id
          ? { ...b, times: Math.max(1, Math.min(20, (b.times ?? 1) + delta)) }
          : b,
      ),
    );
  };

  const reset = () => {
    if (running) return;
    setProgram([]);
    setTarget("root");
    setResult(null);
    setFrame({
      x: puzzle.start.x,
      y: puzzle.start.y,
      dir: puzzle.startDir,
      collected: [],
      bumped: false,
    });
  };

  const run = useCallback(async () => {
    if (running || program.length === 0) return;
    setRunning(true);
    setResult(null);
    const { frames, solved } = runProgram(program, puzzle);
    for (const f of frames) {
      setFrame(f);
      await new Promise((r) => setTimeout(r, 380));
    }
    setRunning(false);
    setResult(solved ? "solved" : "retry");
    if (solved && !solvedOnce.current) {
      solvedOnce.current = true;
      onSolved();
    }
  }, [running, program, puzzle, onSolved]);

  const total = countBlocks(program);

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium opacity-80">{puzzle.instruction}</p>

      <RoboStage puzzle={puzzle} frame={frame} />

      {result && (
        <p
          className={`text-center text-sm font-bold ${
            result === "solved" ? "text-meadow" : "text-sunburst"
          }`}
        >
          {result === "solved"
            ? "🎉 You solved it! Robo collected everything."
            : "Not quite — tweak your blocks and Run again. You've got this!"}
        </p>
      )}

      {/* Palette */}
      <div className="flex flex-wrap gap-2">
        {puzzle.palette.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => addBlock(t)}
            disabled={running}
            className="flex items-center gap-1.5 rounded-xl bg-brand/10 px-3 py-2 text-sm font-semibold text-brand transition hover:bg-brand/20 disabled:opacity-50"
          >
            <span aria-hidden>{EMOJI[t]}</span> {LABELS[t]}
          </button>
        ))}
      </div>

      {/* Program */}
      <div
        onClick={() => setTarget("root")}
        className={`min-h-[64px] rounded-2xl border-2 border-dashed p-3 ${
          target === "root" ? "border-brand/50" : "border-black/10 dark:border-white/10"
        }`}
      >
        {program.length === 0 ? (
          <p className="py-3 text-center text-sm opacity-50">
            Tap blocks above to build Robo&apos;s program ↑
          </p>
        ) : (
          <BlockList
            blocks={program}
            target={target}
            onSelectTarget={setTarget}
            onRemove={removeBlock}
            onTimes={setTimes}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium opacity-50">{total} blocks</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={reset} disabled={running}>
            <RotateCcw className="mr-1 h-4 w-4" /> Reset
          </Button>
          <Button
            size="sm"
            onClick={run}
            disabled={running || program.length === 0}
          >
            <Play className="mr-1 h-4 w-4" /> {running ? "Running…" : "Run"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BlockList({
  blocks,
  target,
  onSelectTarget,
  onRemove,
  onTimes,
  nested = false,
}: {
  blocks: Block[];
  target: string;
  onSelectTarget: (id: string) => void;
  onRemove: (id: string) => void;
  onTimes: (id: string, delta: number) => void;
  nested?: boolean;
}) {
  return (
    <ul className={`space-y-1.5 ${nested ? "ml-4 border-l-2 border-brand/20 pl-3" : ""}`}>
      {blocks.map((b) => {
        const isContainer = b.type === "repeat" || b.type === "if_path";
        return (
          <li key={b.id}>
            <div
              onClick={(e) => {
                if (isContainer) {
                  e.stopPropagation();
                  onSelectTarget(b.id);
                }
              }}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-semibold ${
                isContainer
                  ? `cursor-pointer bg-sunburst/15 text-amber-700 dark:text-amber-300 ${
                      target === b.id ? "ring-2 ring-sunburst/50" : ""
                    }`
                  : "bg-brand/10 text-brand"
              }`}
            >
              <span aria-hidden>{EMOJI[b.type]}</span>
              <span>{LABELS[b.type]}</span>
              {b.type === "repeat" && (
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTimes(b.id, -1);
                    }}
                    className="grid h-5 w-5 place-items-center rounded bg-black/10 dark:bg-white/10"
                  >
                    −
                  </button>
                  <span className="w-6 text-center">{b.times}×</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTimes(b.id, 1);
                    }}
                    className="grid h-5 w-5 place-items-center rounded bg-black/10 dark:bg-white/10"
                  >
                    +
                  </button>
                </span>
              )}
              {target === b.id && isContainer && (
                <span className="text-xs font-medium opacity-70">adding inside ⤵</span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(b.id);
                }}
                className="ml-auto opacity-50 hover:opacity-100"
                aria-label="Remove block"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {isContainer && (
              <BlockList
                blocks={b.children ?? []}
                target={target}
                onSelectTarget={onSelectTarget}
                onRemove={onRemove}
                onTimes={onTimes}
                nested
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

// --- immutable tree helpers -------------------------------------------------
function insert(blocks: Block[], targetId: string, block: Block): Block[] {
  if (targetId === "root") return [...blocks, block];
  return blocks.map((b) => {
    if (b.id === targetId && b.children) {
      return { ...b, children: [...b.children, block] };
    }
    if (b.children) return { ...b, children: insert(b.children, targetId, block) };
    return b;
  });
}

function remove(blocks: Block[], id: string): Block[] {
  return blocks
    .filter((b) => b.id !== id)
    .map((b) =>
      b.children ? { ...b, children: remove(b.children, id) } : b,
    );
}

function mapBlocks(blocks: Block[], fn: (b: Block) => Block): Block[] {
  return blocks.map((b) => {
    const mapped = fn(b);
    return mapped.children
      ? { ...mapped, children: mapBlocks(mapped.children, fn) }
      : mapped;
  });
}
