"use client";
// The freehand drawing layer — Excalidraw (MIT). Generic: takes initial elements
// and reports scene changes up so the LogicLand Canvas can autosave them. Loaded
// only via a dynamic ssr:false import, so Excalidraw never ships elsewhere.
import "@excalidraw/excalidraw/index.css";
import { Excalidraw } from "@excalidraw/excalidraw";
import { useEffect, useState } from "react";

function useIsDark(): boolean {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setDark(document.documentElement.classList.contains("dark") || mq.matches);
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

export function DrawSurface({
  initialElements,
  onSceneChange,
}: {
  initialElements?: unknown;
  onSceneChange?: (elements: unknown) => void;
}) {
  const dark = useIsDark();
  return (
    <div className="h-full w-full">
      <Excalidraw
        theme={dark ? "dark" : "light"}
        initialData={
          Array.isArray(initialElements)
            ? { elements: initialElements as never, scrollToContent: true }
            : undefined
        }
        onChange={(elements) => onSceneChange?.(elements)}
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
