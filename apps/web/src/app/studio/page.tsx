// LogicLand Studio (ADR-013) — the "build" environment. A Server Component shell
// that mounts the client IDE; Monaco loads on demand inside it, so nothing heavy
// reaches other routes.
import { StudioIDE } from "@/features/studio-ide/StudioIDE";

export const metadata = {
  title: "Studio · LogicLand",
  description:
    "LogicLand Studio — a real browser code editor with a file explorer, tabs, and a live preview. Build something and run it.",
};

export default function StudioPage() {
  return <StudioIDE />;
}
