// The Studio project engine — pure, deterministic, testable (like the game and
// math-fix engines). It knows two things and nothing about React:
//   1. what language a file is (for editor highlighting), and
//   2. how to assemble the project's files into a single runnable HTML document
//      for the browser preview (ADR-014's browser execution lane).
//
// This is the real Studio (ADR-013), distinct from the guided young-learner
// HTML Studio (features/studio). Here JS actually runs, so the preview iframe is
// sandboxed with allow-scripts and we bridge console output back to the parent.
import type { FsNode } from "@/types/studio";

/** Monaco language id for a filename, from its extension. */
export function languageForFile(name: string): string {
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  switch (ext) {
    case "html":
    case "htm":
      return "html";
    case "css":
      return "css";
    case "js":
    case "mjs":
    case "cjs":
      return "javascript";
    case "ts":
      return "typescript";
    case "tsx":
      return "typescript";
    case "json":
      return "json";
    case "md":
    case "markdown":
      return "markdown";
    case "py":
      return "python";
    default:
      return "plaintext";
  }
}

const isFile = (n: FsNode): boolean => n.kind === "file";
const hasExt = (name: string, ext: string): boolean =>
  name.toLowerCase().endsWith(`.${ext}`);

/** The project's entry HTML file: the first file named index.html, else the
 *  first .html file, else null. */
export function entryHtml(nodes: FsNode[]): FsNode | null {
  const files = nodes.filter(isFile);
  return (
    files.find((n) => n.name.toLowerCase() === "index.html") ??
    files.find((n) => hasExt(n.name, "html")) ??
    null
  );
}

/** The project's Python entry: main.py if present, else the first .py file. */
export function pythonEntry(nodes: FsNode[]): FsNode | null {
  const files = nodes.filter(isFile);
  return (
    files.find((n) => n.name.toLowerCase() === "main.py") ??
    files.find((n) => hasExt(n.name, "py")) ??
    null
  );
}

/** True when a file runs as Python (drives the Studio run mode). */
export function isPythonFile(name: string): boolean {
  return hasExt(name, "py");
}

/** A tiny script injected first, so the sandboxed preview can stream console
 *  output and uncaught errors back to the Studio's console panel. Marked with a
 *  sentinel the parent checks before trusting a message. */
export const CONSOLE_BRIDGE = `<script>
(function(){
  function send(level, args){
    try {
      var text = args.map(function(a){
        try { return typeof a === "object" ? JSON.stringify(a) : String(a); }
        catch(e){ return String(a); }
      }).join(" ");
      parent.postMessage({ __logicland_studio: true, level: level, text: text }, "*");
    } catch(e){}
  }
  ["log","info","warn","error"].forEach(function(level){
    var orig = console[level];
    console[level] = function(){ send(level, [].slice.call(arguments)); if (orig) orig.apply(console, arguments); };
  });
  window.addEventListener("error", function(e){ send("error", [e.message]); });
  window.addEventListener("unhandledrejection", function(e){ send("error", ["Unhandled promise rejection: " + (e.reason && e.reason.message ? e.reason.message : e.reason)]); });
})();
</script>`;

// Local (non-http) <link rel=stylesheet> and <script src> references can't
// resolve inside a srcDoc iframe, so we strip them and inline the real contents.
const LOCAL_STYLESHEET =
  /<link\b[^>]*rel=["']?stylesheet["']?[^>]*href=["'](?!https?:|\/\/)[^"']+["'][^>]*>/gi;
const LOCAL_SCRIPT_SRC =
  /<script\b[^>]*src=["'](?!https?:|\/\/)[^"']+["'][^>]*>\s*<\/script>/gi;

function injectBefore(html: string, tag: string, snippet: string): string {
  const re = new RegExp(`</${tag}>`, "i");
  return re.test(html) ? html.replace(re, `${snippet}\n</${tag}>`) : html + snippet;
}

/**
 * Assemble the project into one self-contained HTML document for the preview:
 * inline every .css file into a <style> in the head, and every .js file into a
 * <script> before </body> (after the console bridge). Local link/script
 * references are stripped first so nothing 404s in the sandbox. Returns null if
 * there is no HTML entry file to run.
 */
export function buildRunnableDoc(nodes: FsNode[]): string | null {
  const entry = entryHtml(nodes);
  if (!entry) return null;

  const files = nodes.filter(isFile);
  const css = files
    .filter((n) => hasExt(n.name, "css"))
    .map((n) => `/* ${n.name} */\n${n.content}`)
    .join("\n\n");
  const js = files
    .filter((n) => hasExt(n.name, "js") || hasExt(n.name, "mjs"))
    .map((n) => `// ${n.name}\n${n.content}`)
    .join("\n\n");

  let doc = entry.content.replace(LOCAL_STYLESHEET, "").replace(LOCAL_SCRIPT_SRC, "");

  if (css.trim()) doc = injectBefore(doc, "head", `<style>\n${css}\n</style>`);
  // Console bridge goes first so it captures everything the user's code logs.
  doc = injectBefore(doc, "body", CONSOLE_BRIDGE);
  if (js.trim()) doc = injectBefore(doc, "body", `<script>\n${js}\n</script>`);

  return doc;
}

/** A real, working multi-file starter project — the first thing a learner sees
 *  in the Studio: HTML that links a stylesheet and a script, a button that logs
 *  to the console and updates the page. Not a decorated answer box. */
export function defaultStudioProject(): Array<Pick<FsNode, "name" | "kind" | "content">> {
  return [
    {
      name: "index.html",
      kind: "file",
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My LogicLand App</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <main>
      <h1>Hello, builder! 👋</h1>
      <p id="count">You have clicked 0 times.</p>
      <button id="go">Click me</button>
    </main>
    <script src="script.js"></script>
  </body>
</html>
`,
    },
    {
      name: "style.css",
      kind: "file",
      content: `body {
  font-family: system-ui, sans-serif;
  display: grid;
  place-items: center;
  min-height: 100vh;
  margin: 0;
  background: #0f172a;
  color: #e2e8f0;
}
button {
  font: inherit;
  padding: 0.6rem 1.1rem;
  border: 0;
  border-radius: 999px;
  background: #6366f1;
  color: white;
  cursor: pointer;
}
button:hover { background: #4f46e5; }
`,
    },
    {
      name: "script.js",
      kind: "file",
      content: `let clicks = 0;
const button = document.getElementById("go");
const count = document.getElementById("count");

button.addEventListener("click", () => {
  clicks += 1;
  count.textContent = "You have clicked " + clicks + " times.";
  console.log("Clicked", clicks);
});

console.log("App started 🚀");
`,
    },
    {
      name: "main.py",
      kind: "file",
      content: `# Python runs right here in your browser!
# Open this file and press Run to see it work.

for i in range(1, 6):
    print("Counting:", i)

print("Nice work!")
`,
    },
  ];
}
