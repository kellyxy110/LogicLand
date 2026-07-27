// "Start a project" — the Studio template gallery. Server shell around the
// client gallery (which loads a template into the Studio workspace).
import { TemplateGallery } from "@/features/studio-ide/TemplateGallery";

export const metadata = {
  title: "New Project · LogicLand Studio",
  description: "Pick a project template — each comes with a brief and goals that tick off as you build.",
};

export default function NewProjectPage() {
  return <TemplateGallery />;
}
