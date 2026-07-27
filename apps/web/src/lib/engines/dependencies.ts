// Dependency viewer (Phase 2) — a deterministic read of what a Studio project
// depends on, so learners see the difference between their code and the outside
// packages it uses. No install/registry calls; it just reads the files:
//   • web  — external CDN <script src> / <link href> / JS import "https://…"
//   • python — modules named in `import x` / `from x import …`
//   • npm  — dependencies + devDependencies in package.json
export type DependencyKind = "web" | "python" | "npm";

export interface Dependency {
  name: string;
  kind: DependencyKind;
}

const CDN = /(?:src|href)\s*=\s*["'](https?:\/\/[^"']+)["']/gi;
const JS_IMPORT_URL = /\bimport\b[^"']*["'](https?:\/\/[^"']+)["']/gi;
const PY_IMPORT = /^\s*(?:import|from)\s+([A-Za-z_][\w]*)/gm;

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** All external dependencies the project references, de-duped and sorted. */
export function detectDependencies(files: { name: string; content: string }[]): Dependency[] {
  const seen = new Map<string, Dependency>();
  const add = (name: string, kind: DependencyKind) => {
    const key = `${kind}:${name}`;
    if (name && !seen.has(key)) seen.set(key, { name, kind });
  };

  for (const f of files) {
    const lower = f.name.toLowerCase();
    const c = f.content;
    if (/\.(html?|m?js|cjs|tsx?)$/.test(lower)) {
      for (const m of c.matchAll(CDN)) add(hostOf(m[1]), "web");
      for (const m of c.matchAll(JS_IMPORT_URL)) add(hostOf(m[1]), "web");
    }
    if (lower.endsWith(".py")) {
      for (const m of c.matchAll(PY_IMPORT)) add(m[1], "python");
    }
    if (lower === "package.json") {
      try {
        const pkg = JSON.parse(c) as {
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
        };
        for (const k of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
          add(k, "npm");
        }
      } catch {
        /* malformed package.json — just skip it */
      }
    }
  }

  return [...seen.values()].sort((a, b) =>
    a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind.localeCompare(b.kind),
  );
}
