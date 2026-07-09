// HTML Studio lesson content, keyed by mission slug. The guided "class" is just
// data — an ordered list of steps with declarative checks — so new HTML/CSS
// classes are added here without touching the studio components or validator.
import type { HtmlStudioData } from "@/types/studio";

const FIRST_WEB_PAGE: HtmlStudioData = {
  kind: "html-studio",
  title: "My First Web Page",
  previewFile: "index.html",
  steps: [
    {
      id: "folder",
      instruction: "Make a folder for your website",
      hint: "Tap the folder button (📁) and give it a name, like my-website.",
      check: { type: "has-folder" },
    },
    {
      id: "file",
      instruction: "Make a file called index.html",
      hint: "Tap the file button (📄) and type index.html.",
      check: { type: "has-file", name: "index.html" },
    },
    {
      id: "heading",
      instruction: "Add a title: type <h1>My Website</h1>",
      hint: "Click index.html, then type your heading in the editor.",
      check: { type: "content-has", file: "index.html", needle: "<h1" },
    },
    {
      id: "paragraph",
      instruction: "Add a sentence: type <p>Hello world!</p>",
      hint: "Put it on a new line under your title, then watch the preview!",
      check: { type: "content-has", file: "index.html", needle: "<p" },
    },
  ],
};

const STUDIO_DATA: Record<string, HtmlStudioData> = {
  "first-web-page": FIRST_WEB_PAGE,
};

/** HTML Studio data for a mission slug, or null if it isn't a studio mission. */
export function studioDataFor(slug: string): HtmlStudioData | null {
  return STUDIO_DATA[slug] ?? null;
}
