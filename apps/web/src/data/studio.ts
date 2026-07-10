// The Coding City HTML course — a full, progressive curriculum, all as data.
// Each mission is one *module* (a guided HTML class); each module's steps are
// its progressive levels. New modules are added here without touching the studio
// components or the validator — content stays data, code stays generic.
//
// Design rules that keep the course robust:
//   • The learner types real HTML (never multiple choice).
//   • Steps verify *meaning* via declarative checks (has / count), never one
//     exact answer string — see lib/engines/html-lesson.ts.
//   • Modules 2+ ship a `starter` template so learners build on prior work and
//     focus on the new concept instead of retyping a whole page.
//   • The live preview runs in a script-free sandboxed iframe (HtmlPreview), so
//     <script>, event handlers, and remote code can never execute.
import type {
  HtmlLessonStep,
  HtmlStudioData,
  StarterFile,
  StudioAssignment,
} from "@/types/studio";

// --- tiny authoring helpers (all checks target index.html) -----------------
const FILE = "index.html";

function has(
  id: string,
  needle: string,
  instruction: string,
  hint: string,
): HtmlLessonStep {
  return { id, instruction, hint, check: { type: "content-has", file: FILE, needle } };
}

function count(
  id: string,
  needle: string,
  min: number,
  instruction: string,
  hint: string,
): HtmlLessonStep {
  return { id, instruction, hint, check: { type: "content-count", file: FILE, needle, min } };
}

function starter(content: string): StarterFile[] {
  return [{ name: FILE, content: content.trimStart() }];
}

// Reusable "page so far" templates seeded into later modules.
const PAGE_BASE = `
<html>
  <body>
    <h1>My Web Page</h1>
    <p>Welcome to my page!</p>
  </body>
</html>
`;

const PAGE_RICH = `
<html>
  <body>
    <header>
      <h1>My Web Page</h1>
    </header>
    <main>
      <p>Welcome to my page!</p>
    </main>
  </body>
</html>
`;

// --- Module 1 — Welcome to Web Building ------------------------------------
const M1: HtmlStudioData = {
  kind: "html-studio",
  title: "My First Web Page",
  intro: "Every website is built from HTML tags. Let's build your very first one!",
  previewFile: FILE,
  steps: [
    { id: "folder", instruction: "Make a folder for your website", hint: "Tap the folder button and name it, like my-website.", check: { type: "has-folder" } },
    { id: "file", instruction: "Make a file called index.html", hint: "Tap the file button and type index.html.", check: { type: "has-file", name: FILE } },
    has("html", "<html", "Wrap your page in <html> and </html>", "Every page starts with <html> and ends with </html>."),
    has("body", "<body", "Add a <body> — where everything you see lives", "Put <body> ... </body> inside your <html>."),
    has("h1", "<h1", "Add a big title: <h1>My Website</h1>", "Type it inside the <body>, then watch the preview!"),
    has("p", "<p", "Add a sentence: <p>Hello world!</p>", "A <p> is a paragraph of words."),
    count("p2", "<p", 2, "Mini-project: add a second sentence too", "One more <p> makes it a real page. Great work — you built a web page!"),
  ],
};

// --- Module 2 — Headings ----------------------------------------------------
const M2: HtmlStudioData = {
  kind: "html-studio",
  title: "Heading Levels",
  intro: "Headings come in sizes h1 to h6. h1 is the biggest — a page has just one.",
  previewFile: FILE,
  starter: starter(`
<html>
  <body>
    <h1>My Animal Page</h1>
  </body>
</html>
`),
  steps: [
    has("h2", "<h2", "Add a subheading: <h2>All About Cats</h2>", "h2 is a little smaller than h1."),
    has("h3", "<h3", "Add an <h3> heading", "h3 is smaller again — good for sections."),
    has("h4", "<h4", "Add an <h4> heading", "The headings keep getting smaller."),
    has("h5", "<h5", "Add an <h5> heading", "Almost the whole family now."),
    has("h6", "<h6", "Add an <h6> — the smallest heading", "h6 is the tiniest heading."),
    has("p", "<p", "Add a sentence under a heading", "A <p> paragraph explains the heading."),
    count("h2more", "<h2", 2, "Mini-project: add a second <h2> chapter", "Two chapters make a story title page. Nicely done!"),
  ],
};

// --- Module 3 — Paragraphs & Text ------------------------------------------
const M3: HtmlStudioData = {
  kind: "html-studio",
  title: "Words & Sentences",
  intro: "Paragraphs and text tags make your words easy to read.",
  previewFile: FILE,
  starter: starter(PAGE_BASE),
  steps: [
    count("p2", "<p", 2, "Add a second paragraph <p>", "Two <p> tags = two paragraphs."),
    has("br", "<br", "Add a line break with <br>", "<br> pushes the next words onto a new line."),
    has("hr", "<hr", "Add a divider line with <hr>", "<hr> draws a line across the page."),
    has("strong", "<strong", "Make a word important with <strong>", "<strong>word</strong> makes it bold and important."),
    has("em", "<em", "Emphasise a word with <em>", "<em>word</em> adds a gentle emphasis."),
    has("mark", "<mark", "Highlight a word with <mark>", "<mark>word</mark> highlights it like a marker."),
    count("p3", "<p", 3, "Mini-project: an About Me page with three paragraphs", "Three paragraphs about you — that's an About Me page!"),
  ],
};

// --- Module 4 — Links -------------------------------------------------------
const M4: HtmlStudioData = {
  kind: "html-studio",
  title: "Web Links",
  intro: "Links jump between pages. A link is an <a> tag with an href address.",
  previewFile: FILE,
  starter: starter(PAGE_BASE),
  steps: [
    has("a", "<a", "Add a link with <a>", "Start with <a> ... </a>."),
    has("href", "href", "Give your link an address with href", 'Like <a href="page2.html">.'),
    has("close", "</a>", "Add link words and close it: <a ...>Click me</a>", "The words between <a> and </a> are what people click."),
    count("two", "href", 2, "Add a second link", "Two links let you visit two places."),
    has("nav", "<nav", "Put your links in a <nav> menu", "<nav> holds a group of links, like a menu."),
    count("three", "href", 3, "Add a third link to your menu", "A menu usually has a few links."),
    count("four", "href", 4, "Mini-project: My Favourite Websites (four links)", "Four favourite links — a real link page!"),
  ],
};

// --- Module 5 — Images ------------------------------------------------------
const M5: HtmlStudioData = {
  kind: "html-studio",
  title: "Pictures",
  intro: "Images use the <img> tag. Every image needs alt text so everyone can enjoy it.",
  previewFile: FILE,
  starter: starter(PAGE_BASE),
  steps: [
    has("img", "<img", "Add a picture with <img>", 'Like <img src="cat.png">.'),
    has("src", "src", "Point it at a picture with src", 'src="cat.png" says which picture to show.'),
    has("alt", "alt", "Describe the picture with alt text", 'alt="A fluffy cat" helps people who can\'t see it.'),
    has("width", "width", "Resize it with width", 'width="200" makes it 200 wide.'),
    count("two", "<img", 2, "Add a second picture", "Two pictures start a gallery."),
    count("three", "<img", 3, "Add a third picture", "Your gallery is growing!"),
    count("alt3", "alt", 3, "Mini-project: every picture in your gallery has alt text", "Kind coders always add alt text. Beautiful gallery!"),
  ],
};

// --- Module 6 — Lists -------------------------------------------------------
const M6: HtmlStudioData = {
  kind: "html-studio",
  title: "Lists",
  intro: "Lists tidy up information. <ul> is bullets, <ol> is numbers, <li> is each item.",
  previewFile: FILE,
  starter: starter(PAGE_BASE),
  steps: [
    has("ul", "<ul", "Start a bullet list with <ul>", "<ul> holds bullet points."),
    has("li", "<li", "Add a list item with <li>", "Each <li> is one thing on the list."),
    count("li3", "<li", 3, "Add three things to your list", "A shopping list needs a few items!"),
    has("ol", "<ol", "Start a numbered list with <ol>", "<ol> numbers the items 1, 2, 3."),
    count("li5", "<li", 5, "Add items so you have five in total", "Numbered lists are great for steps."),
    count("ul2", "<ul", 2, "Make a nested list (a list inside a list)", "Put a <ul> inside an <li> for a mini-list."),
    count("li6", "<li", 6, "Mini-project: My Daily Plan (six items)", "Six things in your day — that's a daily plan!"),
  ],
};

// --- Module 7 — Containers & Page Sections ---------------------------------
const M7: HtmlStudioData = {
  kind: "html-studio",
  title: "Page Sections",
  intro: "Semantic tags are like rooms in a house: a header, a main room, a footer.",
  previewFile: FILE,
  starter: starter(PAGE_BASE),
  steps: [
    has("div", "<div", "Group things in a <div> box", "<div> is a plain container box."),
    has("header", "<header", "Add a <header> at the top", "The <header> holds the title, like a sign on a house."),
    has("main", "<main", "Add a <main> for the main content", "<main> is the biggest room in the house."),
    has("section", "<section", "Add a <section>", "A <section> is one part of the main room."),
    has("article", "<article", "Add an <article>", "An <article> is a self-contained piece."),
    has("footer", "<footer", "Add a <footer> at the bottom", "The <footer> is the sign at the bottom of the page."),
    has("span", "<span", "Mini-project: a School Club page — add a <span> too", "<span> wraps a few words. Your page has rooms now!"),
  ],
};

// --- Module 8 — Buttons -----------------------------------------------------
const M8: HtmlStudioData = {
  kind: "html-studio",
  title: "Buttons",
  intro: "Buttons are for doing things; links are for going places. Buttons need words.",
  previewFile: FILE,
  starter: starter(PAGE_RICH),
  steps: [
    has("button", "<button", "Add a <button>", "Start with <button> ... </button>."),
    has("close", "</button>", "Give it words: <button>Start</button>", "A button needs words so people know what it does."),
    count("two", "<button", 2, "Add a second button", "Two buttons — a tiny control panel."),
    has("disabled", "disabled", "Add a disabled button", "disabled makes a button unclickable for now."),
    has("link", "href", "Add a link too — links go places, buttons do things", "Use <a href> for going somewhere."),
    count("three", "<button", 3, "Build a control panel with three buttons", "Control panels have a few buttons."),
    count("four", "<button", 4, "Mini-project: Space Mission Control (four buttons)", "Mission control online! Great building."),
  ],
};

// --- Module 9 — Tables ------------------------------------------------------
const M9: HtmlStudioData = {
  kind: "html-studio",
  title: "Tables",
  intro: "Tables show information in rows and columns, like a timetable.",
  previewFile: FILE,
  starter: starter(PAGE_BASE),
  steps: [
    has("table", "<table", "Start a table with <table>", "<table> holds all the rows."),
    has("tr", "<tr", "Add a row with <tr>", "<tr> is one row across."),
    has("th", "<th", "Add heading cells with <th>", "<th> cells are the column titles."),
    has("td", "<td", "Add data cells with <td>", "<td> holds one piece of data."),
    count("tr3", "<tr", 3, "Add more rows (three in total)", "More rows, more information."),
    has("caption", "<caption", "Give your table a <caption> title", "<caption> names what the table shows."),
    count("td6", "<td", 6, "Mini-project: a Weekly Activity table (six data cells)", "A whole week in a table — brilliant!"),
  ],
};

// --- Module 10 — Forms ------------------------------------------------------
const M10: HtmlStudioData = {
  kind: "html-studio",
  title: "Forms",
  intro: "Forms let people type answers. Labels tell them what each box is for.",
  previewFile: FILE,
  starter: starter(PAGE_BASE),
  steps: [
    has("form", "<form", "Add a <form>", "<form> holds all the questions."),
    has("input", "<input", "Add a text box with <input>", "<input> is a box people type into."),
    has("label", "<label", "Add a <label> for your box", "A <label> is the words next to the box."),
    has("type", "type=", "Set the input type", 'type="number" makes a number box.'),
    has("select", "<select", "Add a dropdown with <select>", "<select> and <option> make a dropdown menu."),
    has("textarea", "<textarea", "Add a big box with <textarea>", "<textarea> is for longer answers."),
    count("label2", "<label", 2, "Mini-project: a Favourite Things survey (label every box)", "Every box has a label — that's a friendly form!"),
  ],
};

// --- Module 11 — Audio & Video ---------------------------------------------
const M11: HtmlStudioData = {
  kind: "html-studio",
  title: "Sound & Video",
  intro: "The <audio> and <video> tags play media. Add controls so people can press play.",
  previewFile: FILE,
  starter: starter(PAGE_BASE),
  steps: [
    has("audio", "<audio", "Add an <audio> player", 'Like <audio src="song.mp3"></audio>.'),
    has("controls", "controls", "Add controls so people can press play", "controls shows the play button."),
    has("video", "<video", "Add a <video> player", "<video> works like <audio> but for movies."),
    has("source", "<source", "Add a <source> inside your media", "<source> tells the player which file to use."),
    count("source2", "<source", 2, "Add a second <source> as a backup", "Extra sources help it work everywhere."),
    has("track", "<track", "Add captions with <track>", "<track> adds captions so everyone can follow."),
    has("figure", "<figure", "Mini-project: a media card with <figure>", "<figure> groups media with a caption. Lights, camera, action!"),
  ],
};

// --- Module 12 — Accessibility ---------------------------------------------
const M12: HtmlStudioData = {
  kind: "html-studio",
  title: "Friendly for Everyone",
  intro: "Accessible pages work for everyone — with alt text, labels, and clear structure.",
  previewFile: FILE,
  starter: starter(`
<html>
  <body>
    <h1>My Page</h1>
    <img src="cat.png">
    <a href="page2.html">click here</a>
    <form>
      <input type="text">
    </form>
  </body>
</html>
`),
  steps: [
    has("lang", "lang", "Set the page language: <html lang=\"en\">", "lang tells screen readers which language to speak."),
    has("alt", "alt", "Give the image alt text", 'alt="A fluffy cat" describes the picture.'),
    has("label", "<label", "Add a <label> for the input box", "Labels tell everyone what to type."),
    has("title", "<title", "Add a page <title>", "The <title> names the page in the browser tab."),
    count("alt2", "alt", 2, "Add another picture with alt text too", "Every image gets a description."),
    has("aria", "aria-", "Add an aria-label to something", 'aria-label="Main menu" adds a hidden description.'),
    count("label2", "<label", 2, "Mini-project: make the whole page friendly (two labels)", "You made the page friendly for everyone. That's what great coders do!"),
  ],
};

// --- Module 13 — Metadata ---------------------------------------------------
const M13: HtmlStudioData = {
  kind: "html-studio",
  title: "Page Information",
  intro: "The <head> holds hidden information that tells the browser about your page.",
  previewFile: FILE,
  starter: starter(`
<html>
  <body>
    <h1>My Page</h1>
    <p>Welcome!</p>
  </body>
</html>
`),
  steps: [
    has("head", "<head>", "Add a <head> section above the body", "The <head> is hidden info, not shown on the page."),
    has("title", "<title", "Add a <title> for the browser tab", "The <title> is the name on the tab."),
    has("meta", "<meta", "Add a <meta> tag", "<meta> tags carry page information."),
    has("charset", "charset", "Add charset so letters show correctly", '<meta charset="UTF-8"> handles every letter.'),
    has("viewport", "viewport", "Add viewport info for phones", "The viewport meta helps phones show your page well."),
    has("lang", "lang", "Set the page language on <html>", 'lang="en" says the page is in English.'),
    has("description", "description", "Mini-project: add a page description", 'A <meta name="description"> tells search engines about your page. All set up!'),
  ],
};

// --- Module 14 — Debugging --------------------------------------------------
const M14: HtmlStudioData = {
  kind: "html-studio",
  title: "Fix the Page",
  intro: "Coders fix mistakes all the time. This page is broken — can you repair it?",
  previewFile: FILE,
  starter: starter(`
<html>
  <body>
    <h1>Broken Page
    <img src="cat.png">
    <a>Visit my page</a>
    <ul>
      Milk
      Bread
    </ul>
</html>
`),
  steps: [
    has("closeh1", "</h1>", "The <h1> never closes — add </h1>", "Every <h1> needs a matching </h1>."),
    has("alt", "alt", "The image has no alt — add one", 'Add alt="A cat" to the <img>.'),
    has("href", "href", "The link has no address — add href", 'Add href="page.html" to the <a>.'),
    has("li", "<li", "The list items aren't in tags — wrap them in <li>", "Each item needs its own <li> ... </li>."),
    count("li2", "<li", 2, "Wrap the second item in <li> too", "Both items belong in <li> tags."),
    has("closebody", "</body>", "The <body> never closes — add </body>", "Add </body> before </html>."),
    has("p", "<p", "Mini-project: add a working <p> to finish repairs", "You saved Coding City! Debugging is a real coder superpower."),
  ],
};

// --- Module 15 — Complete Website Project ----------------------------------
const M15: HtmlStudioData = {
  kind: "html-studio",
  title: "My Website Project",
  intro: "Your final project! Combine everything you've learned into one real web page.",
  previewFile: FILE,
  starter: starter(`
<html>
  <head>
  </head>
  <body>
  </body>
</html>
`),
  steps: [
    has("title", "<title", "Give your site a <title>", "Put it in the <head>."),
    has("h1", "<h1", "Add a main heading <h1>", "One big title for your project."),
    has("p", "<p", "Add a paragraph about your project", "Tell visitors what it's about."),
    has("img", "<img", "Add a picture with alt text", "Every project needs a picture — with alt!"),
    has("link", "href", "Add a link", "Link to a favourite page."),
    has("li", "<li", "Add a list", "Use <ul> and <li> for a list."),
    has("footer", "<footer", "Finish with a <footer>", "A footer signs off your masterpiece. You're a Website Creator!"),
  ],
};

// --- Take-home assessments ------------------------------------------------
// Each module ends with an open-ended "homework" brief the child builds in their
// own studio and submits for the teacher to review next class. Checks reuse the
// same declarative validator as the guided classwork.
function assignment(
  title: string,
  brief: string,
  checklist: HtmlLessonStep[],
): StudioAssignment {
  return { title, brief, checklist };
}

const ASSIGNMENTS: Record<string, StudioAssignment> = {
  "first-web-page": assignment(
    "My First Page",
    "Build a tiny page about yourself: a title and a sentence.",
    [
      has("a1", "<html", "Wrap it in <html>", ""),
      has("a2", "<h1", "A title with <h1>", ""),
      has("a3", "<p", "A sentence with <p>", ""),
    ],
  ),
  headings: assignment(
    "Favourite Animal Page",
    "Make a page about your favourite animal with a main title and two subtitles.",
    [
      has("a1", "<h1", "One main <h1>", ""),
      count("a2", "<h2", 2, "Two subtitles (<h2>)", ""),
    ],
  ),
  "text-and-paragraphs": assignment(
    "About Me Page",
    "Write three sentences about you, and make one word important.",
    [
      count("a1", "<p", 3, "Three paragraphs", ""),
      has("a2", "<strong", "One important word (<strong>)", ""),
    ],
  ),
  links: assignment(
    "My Favourite Websites",
    "Make a page that links to two websites you like.",
    [
      count("a1", "href", 2, "Two links with href", ""),
      has("a2", "</a>", "Link text inside <a> ... </a>", ""),
    ],
  ),
  images: assignment(
    "My Picture Gallery",
    "Build a gallery with two pictures — each with alt text.",
    [
      count("a1", "<img", 2, "Two pictures", ""),
      count("a2", "alt", 2, "Alt text on each", ""),
    ],
  ),
  lists: assignment(
    "My Daily Plan",
    "Write your day as a list of five things.",
    [
      has("a1", "<ul", "A list (<ul> or <ol>)", ""),
      count("a2", "<li", 5, "Five list items", ""),
    ],
  ),
  "page-sections": assignment(
    "My Club Page",
    "Give your page a header, a main area, and a footer.",
    [
      has("a1", "<header", "A <header>", ""),
      has("a2", "<main", "A <main>", ""),
      has("a3", "<footer", "A <footer>", ""),
    ],
  ),
  buttons: assignment(
    "Control Panel",
    "Make a control panel with three buttons that have words.",
    [
      count("a1", "<button", 3, "Three buttons", ""),
      has("a2", "</button>", "Words inside each button", ""),
    ],
  ),
  tables: assignment(
    "Weekly Table",
    "Make a table with heading cells and some data.",
    [
      has("a1", "<table", "A <table>", ""),
      has("a2", "<th", "Heading cells (<th>)", ""),
      count("a3", "<td", 4, "Four data cells", ""),
    ],
  ),
  forms: assignment(
    "My Survey",
    "Build a survey with a labelled text box and a dropdown.",
    [
      has("a1", "<form", "A <form>", ""),
      has("a2", "<label", "A <label>", ""),
      has("a3", "<select", "A dropdown (<select>)", ""),
    ],
  ),
  media: assignment(
    "My Media Page",
    "Add an audio player people can press play on.",
    [
      has("a1", "<audio", "An <audio> player", ""),
      has("a2", "controls", "With controls", ""),
    ],
  ),
  accessibility: assignment(
    "Friendly Page",
    "Make a page everyone can use: add alt text, a label, and a language.",
    [
      has("a1", "alt", "Alt text on a picture", ""),
      has("a2", "<label", "A label for an input", ""),
      has("a3", "lang", "A language on <html>", ""),
    ],
  ),
  metadata: assignment(
    "Page Setup",
    "Set up your page's head with a title and character info.",
    [
      has("a1", "<title", "A <title>", ""),
      has("a2", "charset", "A charset meta tag", ""),
    ],
  ),
  debugging: assignment(
    "Repair Mission",
    "Fix a page: close the heading, and add alt text and a link address.",
    [
      has("a1", "</h1>", "Close the <h1>", ""),
      has("a2", "alt", "Add alt text", ""),
      has("a3", "href", "Add an href", ""),
    ],
  ),
  "website-project": assignment(
    "My Complete Website",
    "Your big project: a full page with a title, heading, picture, link, and a list.",
    [
      has("a1", "<h1", "A heading", ""),
      has("a2", "<img", "A picture", ""),
      has("a3", "href", "A link", ""),
      has("a4", "<li", "A list", ""),
      has("a5", "<footer", "A footer", ""),
    ],
  ),
};

const BASE_MODULES: Record<string, HtmlStudioData> = {
  "first-web-page": M1,
  headings: M2,
  "text-and-paragraphs": M3,
  links: M4,
  images: M5,
  lists: M6,
  "page-sections": M7,
  buttons: M8,
  tables: M9,
  forms: M10,
  media: M11,
  accessibility: M12,
  metadata: M13,
  debugging: M14,
  "website-project": M15,
};

/** The full HTML course, in module order, each with its take-home assessment.
 *  Slugs must match curriculum/worlds.py. */
const STUDIO_DATA: Record<string, HtmlStudioData> = Object.fromEntries(
  Object.entries(BASE_MODULES).map(([slug, data]) => [
    slug,
    ASSIGNMENTS[slug] ? { ...data, assignment: ASSIGNMENTS[slug] } : data,
  ]),
);

/** HTML Studio data for a mission slug, or null if it isn't a studio mission. */
export function studioDataFor(slug: string): HtmlStudioData | null {
  return STUDIO_DATA[slug] ?? null;
}

/** Every HTML module slug, in course order. Slugs mirror curriculum/worlds.py.
 *  Exposed so tests can assert the full 15-module ladder stays intact. */
export const STUDIO_MODULE_SLUGS = Object.keys(BASE_MODULES);
