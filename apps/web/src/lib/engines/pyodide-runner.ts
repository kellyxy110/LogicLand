// Python execution for Studio (ADR-014 browser lane) via Pyodide — CPython
// compiled to WebAssembly, running entirely in the browser. Loaded lazily from
// the CDN on the first Python run only, so it never touches other routes or the
// initial bundle. Browser-only: every function here must run client-side.

const PYODIDE_VERSION = "0.26.4";
const BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

interface PyodideAPI {
  runPythonAsync(code: string): Promise<unknown>;
  setStdout(opts: { batched: (s: string) => void }): void;
  setStderr(opts: { batched: (s: string) => void }): void;
}

type PyodideLoader = (opts: { indexURL: string }) => Promise<PyodideAPI>;

let ready: Promise<PyodideAPI> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector("script[data-pyodide]")) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.pyodide = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Python (network?)."));
    document.head.appendChild(s);
  });
}

async function getPyodide(): Promise<PyodideAPI> {
  if (!ready) {
    ready = (async () => {
      await loadScript(`${BASE}pyodide.js`);
      const loader = (window as unknown as { loadPyodide?: PyodideLoader }).loadPyodide;
      if (!loader) throw new Error("Python engine is unavailable.");
      return loader({ indexURL: BASE });
    })();
  }
  return ready;
}

export interface PyRunResult {
  stdout: string;
  stderr: string;
  ok: boolean;
}

/** Run Python source and capture stdout/stderr. Never throws — a Python error
 *  comes back as ok:false with the traceback in stderr. */
export async function runPython(source: string): Promise<PyRunResult> {
  let py: PyodideAPI;
  try {
    py = await getPyodide();
  } catch (e) {
    return { stdout: "", stderr: e instanceof Error ? e.message : String(e), ok: false };
  }

  let stdout = "";
  let stderr = "";
  py.setStdout({ batched: (s: string) => (stdout += s) });
  py.setStderr({ batched: (s: string) => (stderr += s) });

  try {
    await py.runPythonAsync(source);
    return { stdout, stderr, ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { stdout, stderr: stderr ? `${stderr}\n${msg}` : msg, ok: false };
  }
}

/** True once Pyodide has begun loading (so the UI can hint the first run is slow). */
export function pyodideStarted(): boolean {
  return ready !== null;
}
