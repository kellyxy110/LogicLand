import { describe, expect, it } from "vitest";
import {
  MAX_HISTORY,
  addBlock,
  availableBlockKinds,
  createDoc,
  exportJson,
  exportText,
  pushSnapshot,
  removeBlock,
  restoreSnapshot,
  setScene,
  updateBlock,
  type CanvasSnapshot,
} from "./canvas-doc";

describe("canvas-doc engine", () => {
  it("adds, updates and removes blocks", () => {
    let doc = createDoc("Test");
    doc = addBlock(doc, "note", "hello");
    expect(doc.blocks).toHaveLength(1);
    const id = doc.blocks[0].id;
    doc = updateBlock(doc, id, { text: "changed" });
    expect(doc.blocks[0].text).toBe("changed");
    doc = removeBlock(doc, id);
    expect(doc.blocks).toHaveLength(0);
  });

  it("keeps version history bounded and restores a snapshot", () => {
    let doc = createDoc("V");
    let history: CanvasSnapshot[] = [];
    for (let i = 0; i < MAX_HISTORY + 3; i++) {
      doc = addBlock(doc, "note", `n${i}`);
      history = pushSnapshot(history, doc);
    }
    expect(history.length).toBe(MAX_HISTORY);
    // newest first
    const restored = restoreSnapshot(history[history.length - 1]);
    // the oldest kept snapshot had fewer blocks than the latest doc
    expect(restored.blocks.length).toBeLessThan(doc.blocks.length);
    // restoring is a copy — mutating it doesn't touch the snapshot
    restored.blocks.push({ id: "x", kind: "note", text: "y", x: 0, y: 0 });
    expect(history[history.length - 1].doc.blocks.length).not.toBe(restored.blocks.length);
  });

  it("exports self-contained JSON and readable text", () => {
    let doc = createDoc("My Canvas");
    doc = addBlock(doc, "equation", "a^2 + b^2 = c^2");
    doc = setScene(doc, [{ type: "rectangle" }]);
    const json = exportJson(doc);
    expect(json).toContain("a^2 + b^2 = c^2");
    expect(() => JSON.parse(json)).not.toThrow();
    const text = exportText(doc);
    expect(text).toContain("My Canvas");
    expect(text).toContain("[equation] a^2 + b^2 = c^2");
  });

  it("age-adaptive toolbar reveals block kinds progressively", () => {
    const sprout = availableBlockKinds("sprout").map((b) => b.kind);
    const builder = availableBlockKinds("builder").map((b) => b.kind);
    expect(sprout).toContain("note");
    expect(sprout).not.toContain("code");
    expect(builder).toContain("code");
    expect(builder).toContain("equation");
  });
});
