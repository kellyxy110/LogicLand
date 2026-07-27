"use client";
// The code editor — Monaco, the engine behind VS Code (ADR-013). Loaded only on
// the /studio route (the whole IDE is dynamically imported with ssr:false), so
// this heavy editor never ships in the young-learner bundles. Theme follows the
// viewer's colour scheme.
import Editor from "@monaco-editor/react";
import { useEffect, useState } from "react";

function useIsDark(): boolean {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const classDark = () => document.documentElement.classList.contains("dark");
    const update = () => setDark(classDark() || mq.matches);
    update();
    mq.addEventListener("change", update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => {
      mq.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);
  return dark;
}

export function MonacoPane({
  value,
  language,
  onChange,
}: {
  value: string;
  language: string;
  onChange: (value: string) => void;
}) {
  const dark = useIsDark();
  return (
    <Editor
      height="100%"
      language={language}
      theme={dark ? "vs-dark" : "light"}
      value={value}
      onChange={(v) => onChange(v ?? "")}
      loading={<div className="grid h-full place-items-center text-sm opacity-60">Loading editor…</div>}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "on",
        padding: { top: 12 },
        smoothScrolling: true,
        renderLineHighlight: "line",
      }}
    />
  );
}
