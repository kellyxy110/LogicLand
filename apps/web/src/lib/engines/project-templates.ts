// Project templates (Phase 1 #2). An extensible registry of real, runnable
// starter projects across categories and levels. Each template carries its own
// brief (story + completion criteria), objectives and rubric — so "New Project"
// gives a genuine build task, not a blank page. Completion criteria reuse the
// deterministic project-brief checks (ADR-015). Add a template by appending to
// PROJECT_TEMPLATES; nothing else changes.
import type { Criterion, ProjectBrief } from "./project-brief";

export type TemplateCategory =
  | "web"
  | "javascript"
  | "python"
  | "math"
  | "ai"
  | "engineering"
  | "research"
  | "robotics";

export type TemplateLevel = "beginner" | "intermediate" | "advanced";

export interface RubricRow {
  dimension: string;
  description: string;
}

export interface ProjectTemplate {
  id: string;
  title: string;
  category: TemplateCategory;
  level: TemplateLevel;
  summary: string;
  /** Higher-level learning objectives (the "why"). */
  objectives: string[];
  /** Quality dimensions a mentor/teacher looks at. */
  rubric: RubricRow[];
  /** Starter files seeded into the workspace. */
  files: { name: string; content: string }[];
  /** Story + completion criteria (the auto-checked milestones). */
  brief: ProjectBrief;
}

export const CATEGORY_LABEL: Record<TemplateCategory, string> = {
  web: "Web (HTML/CSS)",
  javascript: "JavaScript",
  python: "Python",
  math: "Mathematics",
  ai: "Artificial Intelligence",
  engineering: "Engineering",
  research: "Research & Data",
  robotics: "Robotics",
};

export const LEVEL_LABEL: Record<TemplateLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const brief = (
  id: string,
  title: string,
  story: string,
  criteria: Criterion[],
): ProjectBrief => ({ id, title, story, criteria });

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  // ── Web ────────────────────────────────────────────────────────────────
  {
    id: "web-profile-card",
    title: "About-Me Card",
    category: "web",
    level: "beginner",
    summary: "A little web page that introduces you, styled with CSS.",
    objectives: [
      "Structure a page with HTML tags",
      "Style elements with CSS",
      "See how HTML and CSS work together",
    ],
    rubric: [
      { dimension: "Structure", description: "Uses a heading, text and an image" },
      { dimension: "Style", description: "Colours, spacing and a rounded card" },
    ],
    files: [
      {
        name: "index.html",
        content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="style.css" />
    <title>About Me</title>
  </head>
  <body>
    <main class="card">
      <h1>Hi, I'm ...</h1>
      <p>One cool thing about me is ...</p>
    </main>
  </body>
</html>
`,
      },
      {
        name: "style.css",
        content: `body { font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; background: #0f172a; }
.card { background: white; padding: 2rem; border-radius: 16px; max-width: 20rem; }
`,
      },
    ],
    brief: brief("web-profile-card", "Build an About-Me Card", "Make a card that introduces you.", [
      { id: "html", label: "Have an index.html page", check: { type: "has-file", name: "index.html" } },
      { id: "heading", label: "Add a heading with your name", check: { type: "content-has", file: "index.html", needle: "<h1" } },
      { id: "style", label: "Give the card a colour in style.css", check: { type: "any-content-has", needle: "background" } },
      { id: "image", label: "Add a picture (an <img>)", check: { type: "content-has", file: "index.html", needle: "<img" } },
      { id: "para2", label: "Add a second paragraph", check: { type: "content-count", file: "index.html", needle: "<p", min: 2 } },
    ]),
  },
  // ── JavaScript ───────────────────────────────────────────────────────────
  {
    id: "js-quiz",
    title: "Mini Quiz",
    category: "javascript",
    level: "intermediate",
    summary: "A one-question quiz that checks your answer with JavaScript.",
    objectives: ["Store data in variables", "Respond to a click event", "Use a condition to check an answer"],
    rubric: [
      { dimension: "Logic", description: "Checks the answer with if/else" },
      { dimension: "Interactivity", description: "Responds to the button" },
    ],
    files: [
      { name: "index.html", content: `<!doctype html><html><head><link rel="stylesheet" href="style.css"></head><body>
    <h1>Quick Quiz</h1>
    <p id="q">What has loops, variables and functions?</p>
    <input id="answer" placeholder="your answer" />
    <button id="check">Check</button>
    <p id="result"></p>
    <script src="script.js"></script>
  </body></html>` },
      { name: "style.css", content: `body { font-family: system-ui, sans-serif; padding: 2rem; }` },
      { name: "script.js", content: `const button = document.getElementById("check");
const answer = document.getElementById("answer");
const result = document.getElementById("result");

button.addEventListener("click", () => {
  // TODO: check if the answer is correct
  console.log("You typed:", answer.value);
});
` },
    ],
    brief: brief("js-quiz", "Build a Mini Quiz", "Ask a question and tell the player if they're right.", [
      { id: "listen", label: "Respond to the Check button", check: { type: "any-content-has", needle: "addEventListener" } },
      { id: "if", label: "Use an if to check the answer", check: { type: "content-has", file: "script.js", needle: "if" } },
      { id: "result", label: "Show a result message on the page", check: { type: "any-content-has", needle: "result.textContent" } },
    ]),
  },
  // ── Python ────────────────────────────────────────────────────────────────
  {
    id: "py-guessing",
    title: "Number Guessing",
    category: "python",
    level: "beginner",
    summary: "The computer thinks of a number and tells you higher or lower.",
    objectives: ["Use variables and a loop", "Compare numbers with conditions", "Print helpful messages"],
    rubric: [
      { dimension: "Loop", description: "Repeats until solved" },
      { dimension: "Conditions", description: "Higher / lower / correct" },
    ],
    files: [
      { name: "main.py", content: `secret = 7
guesses = [4, 9, 7]  # pretend guesses for now

for guess in guesses:
    if guess < secret:
        print(guess, "is too low")
    elif guess > secret:
        print(guess, "is too high")
    else:
        print(guess, "is correct!")
` },
    ],
    brief: brief("py-guessing", "Build Number Guessing", "Guide a guess to the secret number.", [
      { id: "loop", label: "Use a loop to try each guess", check: { type: "content-has", file: "main.py", needle: "for" } },
      { id: "cond", label: "Say higher or lower with if/elif", check: { type: "content-has", file: "main.py", needle: "elif" } },
      { id: "win", label: "Print a message when it's correct", check: { type: "content-has", file: "main.py", needle: "correct" } },
    ]),
  },
  // ── Mathematics ─────────────────────────────────────────────────────────
  {
    id: "math-primes",
    title: "Prime Finder",
    category: "math",
    level: "intermediate",
    summary: "Write code that finds the prime numbers up to 30.",
    objectives: ["Turn a maths idea into code", "Use a loop and the % (remainder) operator", "Write a reusable function"],
    rubric: [
      { dimension: "Correctness", description: "Finds the right primes" },
      { dimension: "Reuse", description: "Uses a function" },
    ],
    files: [
      { name: "main.py", content: `def is_prime(n):
    if n < 2:
        return False
    for d in range(2, n):
        if n % d == 0:
            return False
    return True

for n in range(2, 31):
    if is_prime(n):
        print(n)
` },
    ],
    brief: brief("math-primes", "Build a Prime Finder", "Print every prime number up to 30.", [
      { id: "func", label: "Write an is_prime function", check: { type: "content-has", file: "main.py", needle: "def is_prime" } },
      { id: "mod", label: "Use the % remainder operator", check: { type: "content-has", file: "main.py", needle: "%" } },
      { id: "loop", label: "Loop over the numbers", check: { type: "content-has", file: "main.py", needle: "range(" } },
    ]),
  },
  // ── Artificial Intelligence ───────────────────────────────────────────────
  {
    id: "ai-classifier",
    title: "Rule-Based Classifier",
    category: "ai",
    level: "intermediate",
    summary: "Teach a program to sort animals using rules — the idea behind AI features.",
    objectives: ["Represent data as features", "Make decisions from features", "See how rules become 'intelligence'"],
    rubric: [
      { dimension: "Features", description: "Uses inputs to decide" },
      { dimension: "Logic", description: "Clear decision rules" },
    ],
    files: [
      { name: "main.py", content: `def classify(legs, can_fly):
    # A tiny "model": rules over features.
    if can_fly:
        return "bird"
    if legs == 4:
        return "dog"
    return "unknown"

print(classify(2, True))
print(classify(4, False))
` },
    ],
    brief: brief("ai-classifier", "Build a Rule-Based Classifier", "Sort things using rules over their features.", [
      { id: "func", label: "Write a classify function", check: { type: "content-has", file: "main.py", needle: "def classify" } },
      { id: "rules", label: "Decide using if on the features", check: { type: "content-has", file: "main.py", needle: "if" } },
      { id: "return", label: "Return a label", check: { type: "content-has", file: "main.py", needle: "return" } },
      { id: "third", label: "Add a third category of your own", check: { type: "content-count", file: "main.py", needle: "return", min: 4 } },
    ]),
  },
  // ── Engineering ───────────────────────────────────────────────────────────
  {
    id: "eng-projectile",
    title: "Projectile Range",
    category: "engineering",
    level: "advanced",
    summary: "Model how far a ball flies — real physics in code.",
    objectives: ["Use a formula in code", "Import and use the math module", "Print a computed result"],
    rubric: [
      { dimension: "Model", description: "Uses the range formula" },
      { dimension: "Clarity", description: "Readable, named values" },
    ],
    files: [
      { name: "main.py", content: `import math

speed = 20      # metres per second
angle = 45      # degrees
g = 9.81

# Range of a projectile: v^2 * sin(2*angle) / g
r = (speed ** 2) * math.sin(math.radians(2 * angle)) / g
print("Range:", round(r, 2), "metres")
` },
    ],
    brief: brief("eng-projectile", "Model Projectile Range", "Work out how far a launched ball travels.", [
      { id: "math", label: "Import the math module", check: { type: "content-has", file: "main.py", needle: "import math" } },
      { id: "power", label: "Use a power (**) in the formula", check: { type: "content-has", file: "main.py", needle: "**" } },
      { id: "print", label: "Print the range", check: { type: "content-has", file: "main.py", needle: "print" } },
    ]),
  },
  // ── Research & Data ───────────────────────────────────────────────────────
  {
    id: "research-stats",
    title: "Survey Stats",
    category: "research",
    level: "intermediate",
    summary: "Analyse a list of numbers — average, biggest, smallest.",
    objectives: ["Hold data in a list", "Summarise data with code", "Report findings clearly"],
    rubric: [
      { dimension: "Analysis", description: "Computes correct summaries" },
      { dimension: "Reporting", description: "Prints clear results" },
    ],
    files: [
      { name: "main.py", content: `scores = [7, 9, 5, 10, 8, 6]

average = sum(scores) / len(scores)
print("Average:", average)
print("Highest:", max(scores))
print("Lowest:", min(scores))
` },
    ],
    brief: brief("research-stats", "Analyse Survey Data", "Find the average, highest and lowest of some numbers.", [
      { id: "list", label: "Store the data in a list", check: { type: "content-has", file: "main.py", needle: "[" } },
      { id: "avg", label: "Work out the average", check: { type: "content-has", file: "main.py", needle: "sum(" } },
      { id: "count", label: "Count how many with len()", check: { type: "content-has", file: "main.py", needle: "len(" } },
    ]),
  },
  // ── Robotics ──────────────────────────────────────────────────────────────
  {
    id: "robotics-path",
    title: "Robot Path",
    category: "robotics",
    level: "beginner",
    summary: "Program a virtual robot's moves and print the path it takes.",
    objectives: ["Give a sequence of commands", "Repeat commands with a loop", "Trace the robot's route"],
    rubric: [
      { dimension: "Sequence", description: "Correct ordered moves" },
      { dimension: "Repetition", description: "Uses a loop" },
    ],
    files: [
      { name: "main.py", content: `moves = ["up", "up", "right", "right"]

x, y = 0, 0
for move in moves:
    if move == "up":
        y += 1
    elif move == "right":
        x += 1
    print("Robot at", (x, y))
` },
    ],
    brief: brief("robotics-path", "Drive the Robot", "Command a robot and trace where it ends up.", [
      { id: "moves", label: "List the robot's moves", check: { type: "content-has", file: "main.py", needle: "moves" } },
      { id: "loop", label: "Step through the moves with a loop", check: { type: "content-has", file: "main.py", needle: "for" } },
      { id: "track", label: "Print the robot's position", check: { type: "content-has", file: "main.py", needle: "print" } },
    ]),
  },
];

export function templateById(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find((t) => t.id === id);
}

/** Templates grouped by category, in the CATEGORY_LABEL order. */
export function templatesByCategory(): Array<{
  category: TemplateCategory;
  label: string;
  templates: ProjectTemplate[];
}> {
  return (Object.keys(CATEGORY_LABEL) as TemplateCategory[])
    .map((category) => ({
      category,
      label: CATEGORY_LABEL[category],
      templates: PROJECT_TEMPLATES.filter((t) => t.category === category),
    }))
    .filter((g) => g.templates.length > 0);
}
