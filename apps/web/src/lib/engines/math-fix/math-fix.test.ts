import { describe, expect, it } from "vitest";
import {
  MAX_DIFFICULTY,
  MIN_DIFFICULTY,
  START_MASTERY,
  STREAK_TO_ADVANCE,
  afterAttempt,
  diagnose,
  generateProblem,
  masteryPercent,
  renderProblem,
  solve,
  type Problem,
} from "./index";

const bracket = (a: number, c: number, x: number): Problem => ({
  id: "t",
  form: "bracket",
  a,
  c,
  d: a * (x + c),
  answer: x,
  difficulty: 5,
});

const simple = (a: number, b: number, x: number): Problem => ({
  id: "t",
  form: "simple",
  a,
  b,
  d: a * x + b,
  answer: x,
  difficulty: 3,
});

describe("problem rendering & solving", () => {
  it("renders the flagship example exactly", () => {
    const p = bracket(3, 4, 0); // 3(x + 4) = 12, x = 0
    expect(renderProblem(p)).toBe("3(x + 4) = 12");
    expect(solve(p)).toBe(0);
  });

  it("renders simple forms cleanly", () => {
    expect(renderProblem(simple(1, 5, 3))).toBe("x + 5 = 8");
    expect(renderProblem(simple(4, 0, 2))).toBe("4x = 8");
    expect(renderProblem(simple(2, -3, 5))).toBe("2x - 3 = 7");
  });

  it("generated problems always have integer, non-negative answers", () => {
    for (let d = MIN_DIFFICULTY; d <= MAX_DIFFICULTY; d++) {
      for (let i = 0; i < 40; i++) {
        const p = generateProblem(d);
        expect(Number.isInteger(p.answer)).toBe(true);
        expect(p.answer).toBeGreaterThanOrEqual(0);
        expect(solve(p)).toBe(p.answer);
        expect(p.difficulty).toBe(d);
      }
    }
  });
});

describe("misconception diagnosis", () => {
  it("THE flagship case: 3(x+4)=12 answered 8 → skipped-the-multiply", () => {
    const p = bracket(3, 4, 0); // correct x = 0
    const d = diagnose(p, 8); // 8 comes from solving x + 4 = 12
    expect(d.correct).toBe(false);
    expect(d.correctAnswer).toBe(0);
    expect(d.misconception?.id).toBe("ignored-coefficient");
    expect(d.steps.length).toBeGreaterThan(0);
  });

  it("marks the correct answer correct, with no misconception", () => {
    const p = bracket(3, 4, 0);
    const d = diagnose(p, 0);
    expect(d.correct).toBe(true);
    expect(d.misconception).toBeNull();
  });

  it("detects partial distribution: 2(x+3)=10 answered 3.5→ (only when integer)", () => {
    // 2(x+3)=10, correct x=2. Partial: 2x+3=10 → x=3.5 (not integer) → no match.
    const p = bracket(2, 3, 2);
    expect(diagnose(p, 3).misconception).not.toBe("partial-distribution");
    // 2(x+4)=16, correct x=4. Partial: 2x+4=16 → x=6 (integer) → matches.
    const q = bracket(2, 4, 4);
    expect(diagnose(q, 6).misconception?.id).toBe("partial-distribution");
  });

  it("detects forgot-final-divide: distributes but skips the last divide", () => {
    // 3(x+2)=15, correct x=3. Forgot divide: x = 15 - 3*2 = 9.
    const p = bracket(3, 2, 3);
    expect(diagnose(p, 9).misconception?.id).toBe("forgot-final-divide");
  });

  it("detects a sign error on a simple equation", () => {
    // 2x - 4 = 6, correct x=5. Sign error: (6 + (-4))/2... uses (d+b)/a = (6-4)/2=1.
    const p = simple(2, -4, 5);
    expect(diagnose(p, 1).misconception?.id).toBe("sign-error");
  });

  it("returns no misconception for an unrecognised slip", () => {
    const p = bracket(3, 4, 0);
    const d = diagnose(p, 999);
    expect(d.correct).toBe(false);
    expect(d.misconception).toBeNull();
    expect(d.steps.length).toBeGreaterThan(0);
  });
});

describe("adaptive mastery", () => {
  it("steps difficulty up after a clean streak", () => {
    let s = START_MASTERY;
    expect(s.difficulty).toBe(MIN_DIFFICULTY);
    for (let i = 0; i < STREAK_TO_ADVANCE; i++) s = afterAttempt(s, true);
    expect(s.difficulty).toBe(MIN_DIFFICULTY + 1);
    expect(s.streak).toBe(0);
    expect(s.correct).toBe(STREAK_TO_ADVANCE);
  });

  it("eases difficulty down after a wrong answer, never below the floor", () => {
    let s = { ...START_MASTERY, difficulty: 3 };
    s = afterAttempt(s, false);
    expect(s.difficulty).toBe(2);
    expect(s.streak).toBe(0);
    let floor = { ...START_MASTERY, difficulty: MIN_DIFFICULTY };
    floor = afterAttempt(floor, false);
    expect(floor.difficulty).toBe(MIN_DIFFICULTY);
  });

  it("reaches mastery only after clearing the top tier", () => {
    let s = { ...START_MASTERY, difficulty: MAX_DIFFICULTY };
    expect(s.mastered).toBe(false);
    for (let i = 0; i < STREAK_TO_ADVANCE; i++) s = afterAttempt(s, true);
    expect(s.mastered).toBe(true);
    expect(masteryPercent(s)).toBe(100);
  });

  it("mastery percent grows monotonically with progress", () => {
    const low = masteryPercent(START_MASTERY);
    const mid = masteryPercent({ ...START_MASTERY, difficulty: 3, streak: 1 });
    expect(mid).toBeGreaterThan(low);
    expect(mid).toBeLessThan(100);
  });
});
