"use client";
// The working canvas — Excalidraw (MIT), embedded. Loaded only here and only via
// a dynamic ssr:false import from MathSketchpad, so this heavy whiteboard never
// ships in other bundles. We layer LogicLand semantics on top (the problem +
// deterministic feedback live beside it); this component is just the surface a
// learner writes their working on.
import "@excalidraw/excalidraw/index.css";
import { Excalidraw } from "@excalidraw/excalidraw";
import { useEffect, useState } from "react";

function useIsDark(): boolean {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () =>
      setDark(document.documentElement.classList.contains("dark") || mq.matches);
    update();
    mq.addEventListener("change", update);
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => {
      mq.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);
  return dark;
}

export function SketchCanvas() {
  const dark = useIsDark();
  return (
    <div className="h-full w-full">
      <Excalidraw
        theme={dark ? "dark" : "light"}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            export: false,
            saveAsImage: true,
          },
        }}
      />
    </div>
  );
}
