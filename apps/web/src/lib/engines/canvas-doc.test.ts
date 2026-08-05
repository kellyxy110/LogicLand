import { describe, expect, it } from "vitest";
import {
  MAX_HISTORY,
  addBlock,
  availableBlockKinds,
  blockInsight,
  canLink,
  canUseGraph,
  createDoc,
  duplicateBlock,
  exportJson,
  exportMarkdown,
  exportText,
  linkBlocks,
  migrateDoc,
  moveBlock,
  pushSnapshot,
  removeBlock,
  restoreSnapshot,
  setScene,
  toGraph,
  unlinkBlocks,
  updateBlock,
  type CanvasDoc,
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

describe("canvas-doc V2 graph layer (ADR-025)", () => {
  const twoBlocks = () => {
    let doc = createDoc("G");
    doc = addBlock(doc, "equation", "a + b = c");
    doc = addBlock(doc, "note", "why it works");
    return doc;
  };

  it("moves a block up/down and is bounds-safe", () => {
    let doc = twoBlocks();
    const [first, second] = doc.blocks.map((b) => b.id);
    doc = moveBlock(doc, second, "up");
    expect(doc.blocks.map((b) => b.id)).toEqual([second, first]);
    // moving the top block up is a no-op (bounds-safe)
    const before = doc.blocks.map((b) => b.id);
    doc = moveBlock(doc, second, "up");
    expect(doc.blocks.map((b) => b.id)).toEqual(before);
  });

  it("duplicates a block right after it with a fresh id", () => {
    let doc = addBlock(createDoc("D"), "code", "print(1)");
    const id = doc.blocks[0].id;
    doc = duplicateBlock(doc, id);
    expect(doc.blocks).toHaveLength(2);
    expect(doc.blocks[1].text).toBe("print(1)");
    expect(doc.blocks[1].id).not.toBe(id);
  });

  it("links blocks, rejects self-loops and duplicates", () => {
    let doc = twoBlocks();
    const [a, b] = doc.blocks.map((x) => x.id);
    expect(canLink(doc, a, a, "depends-on")).toBe(false); // self-loop
    doc = linkBlocks(doc, a, b, "depends-on");
    expect(doc.edges).toHaveLength(1);
    // exact duplicate is rejected
    doc = linkBlocks(doc, a, b, "depends-on");
    expect(doc.edges).toHaveLength(1);
    // a different relation between the same pair is allowed
    doc = linkBlocks(doc, a, b, "explains");
    expect(doc.edges).toHaveLength(2);
  });

  it("removing a block prunes every edge that touched it", () => {
    let doc = twoBlocks();
    const [a, b] = doc.blocks.map((x) => x.id);
    doc = linkBlocks(doc, a, b, "leads-to");
    expect(doc.edges).toHaveLength(1);
    doc = removeBlock(doc, b);
    expect(doc.blocks).toHaveLength(1);
    expect(doc.edges).toHaveLength(0); // no dangling edge
  });

  it("unlinks a specific edge", () => {
    let doc = twoBlocks();
    const [a, b] = doc.blocks.map((x) => x.id);
    doc = linkBlocks(doc, a, b, "depends-on");
    const edgeId = doc.edges[0].id;
    doc = unlinkBlocks(doc, edgeId);
    expect(doc.edges).toHaveLength(0);
  });

  it("projects to a {nodes, edges} graph with stable labels", () => {
    let doc = twoBlocks();
    const [a, b] = doc.blocks.map((x) => x.id);
    doc = linkBlocks(doc, a, b, "explains");
    const g = toGraph(doc);
    expect(g.nodes).toHaveLength(2);
    expect(g.nodes[0]).toMatchObject({ id: a, kind: "equation", label: "a + b = c" });
    expect(g.edges).toHaveLength(1);
    expect(g.edges[0]).toMatchObject({ from: a, to: b, relation: "explains" });
    // graph excludes the freehand scene
    expect(g).not.toHaveProperty("scene");
  });

  it("migrates a v1 doc (no edges) and drops dangling edges", () => {
    const v1 = { title: "old", blocks: [{ id: "b1", kind: "note", text: "hi", x: 0, y: 0 }] };
    const migrated = migrateDoc(v1 as Partial<CanvasDoc>);
    expect(migrated.edges).toEqual([]);
    expect(migrated.blocks).toHaveLength(1);
    // an edge to a missing block is discarded during migration
    const corrupt = {
      title: "c",
      blocks: [{ id: "b1", kind: "note", text: "hi", x: 0, y: 0 }],
      edges: [{ id: "e1", from: "b1", to: "ghost", relation: "depends-on" }],
    };
    expect(migrateDoc(corrupt as Partial<CanvasDoc>).edges).toEqual([]);
  });

  it("gives deterministic block insight without an LLM", () => {
    expect(blockInsight({ id: "1", kind: "equation", text: "a = b", x: 0, y: 0 })).toMatch(/two sides/);
    expect(blockInsight({ id: "2", kind: "equation", text: "(a + b", x: 0, y: 0 })).toMatch(/unbalanced/);
    expect(blockInsight({ id: "3", kind: "code", text: "// hi\nx=1", x: 0, y: 0 })).toMatch(/2 lines.*1 comment/);
    expect(blockInsight({ id: "4", kind: "note", text: "", x: 0, y: 0 })).toMatch(/Empty/);
  });

  it("exports Markdown with fenced code and a connections list", () => {
    let doc = twoBlocks();
    const [a, b] = doc.blocks.map((x) => x.id);
    doc = addBlock(doc, "code", "print(1)");
    doc = linkBlocks(doc, a, b, "explains");
    const md = exportMarkdown(doc);
    expect(md).toContain("# G");
    expect(md).toContain("```");
    expect(md).toContain("print(1)");
    expect(md).toContain("## Connections");
    expect(md).toContain("explains");
  });

  it("carries edges through version snapshots and export", () => {
    let doc = twoBlocks();
    const [a, b] = doc.blocks.map((x) => x.id);
    doc = linkBlocks(doc, a, b, "depends-on");
    const history = pushSnapshot([], doc);
    const restored = restoreSnapshot(history[0]);
    expect(restored.edges).toHaveLength(1);
    expect(exportJson(doc)).toContain("depends-on");
  });

  it("gates the graph capability to builder and up", () => {
    expect(canUseGraph("sprout")).toBe(false);
    expect(canUseGraph("explorer")).toBe(false);
    expect(canUseGraph("builder")).toBe(true);
    expect(canUseGraph("pro")).toBe(true);
  });
});
