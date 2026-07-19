// The LogicLand Academy catalog — the v2.0 ecosystem, presented honestly. Today
// the Coding Academy is live (it maps onto the existing World Map); every other
// academy is on the roadmap and clearly marked "soon" so the vision is visible
// without ever pretending to ship what isn't built yet. As each academy comes
// online it flips to `status: "live"` with an `href`, and its Courses/Worlds are
// wired beneath — no structural change needed here.
import type { Academy } from "@/types/academy";

export const ACADEMIES: Academy[] = [
  {
    slug: "coding",
    name: "Coding Academy",
    tagline: "From first blocks to real software.",
    description:
      "Where thinkers become builders. Learn to code through play — starting with drag-and-drop blocks and typing, growing into HTML, JavaScript, Python and beyond, every track ending in a real project.",
    icon: "code",
    gradient: "from-indigo-500 to-violet-600",
    status: "live",
    href: "/worlds",
    ageBands: ["Little Explorers", "Young Creators", "Future Innovators"],
    plannedTracks: 24,
    highlights: [
      "Keyboard Kingdom → Coding City learning path",
      "Project-based: every track ships a real build",
      "Scratch, HTML, JavaScript, Python and up",
    ],
  },
  {
    slug: "math-fix",
    name: "Mathematics Academy · Math Fix™",
    tagline: "The AI that repairs misconceptions, not just marks answers.",
    description:
      "LogicLand's flagship. Math Fix diagnoses the exact idea a learner is missing, explains it, and generates targeted practice until mastery. Three topics are live now — Linear Equations, Order of Operations and Fractions of an Amount — with more, through WAEC, JAMB, IGCSE, A-Level, SAT and Olympiad, on the way.",
    icon: "sigma",
    gradient: "from-rose-500 to-orange-500",
    status: "live",
    href: "/academies/math-fix",
    flagship: true,
    ageBands: ["All Ages"],
    plannedTracks: 40,
    highlights: [
      "Three topics live, with mastery on the dashboards",
      "Names the exact misconception, then repairs it",
      "Adaptive practice that tracks true mastery",
    ],
  },
  {
    slug: "olympiad",
    name: "Olympiad Academy",
    tagline: "Train for the world's toughest problems.",
    description:
      "Africa's best Olympiad prep — curated problems with hints, multiple solutions, difficulty ratings and an AI coach, spanning AMC, Kangaroo, Cowbell, national and international competitions.",
    icon: "trophy",
    gradient: "from-amber-500 to-yellow-500",
    status: "soon",
    ageBands: ["Future Innovators", "Senior Academy"],
    plannedTracks: 12,
    highlights: [
      "Hints, multiple solutions, timing per problem",
      "AMC · Kangaroo · Cowbell · national & IMO",
      "AI coach with Socratic guidance",
    ],
  },
  {
    slug: "science",
    name: "Science Academy",
    tagline: "Physics, chemistry and biology you can play with.",
    description:
      "Interactive simulations, virtual labs and STEM projects that make science tangible — experiment safely, see the invisible, and build real understanding.",
    icon: "flask",
    gradient: "from-emerald-500 to-teal-600",
    status: "soon",
    ageBands: ["Young Creators", "Future Innovators"],
    plannedTracks: 15,
    highlights: [
      "Interactive simulations & virtual labs",
      "Physics, chemistry, biology, integrated science",
      "Hands-on STEM projects",
    ],
  },
  {
    slug: "robotics",
    name: "Robotics Academy",
    tagline: "Program robots — virtual, then real.",
    description:
      "From a virtual robot on screen to Micro:bit, Arduino, ESP32 and Raspberry Pi. Learn automation, embedded systems and AI robotics through build-and-test missions.",
    icon: "bot",
    gradient: "from-sky-500 to-cyan-600",
    status: "soon",
    ageBands: ["Young Creators", "Future Innovators", "Senior Academy"],
    plannedTracks: 10,
    highlights: [
      "Virtual robotics before any hardware",
      "Micro:bit · Arduino · ESP32 · Raspberry Pi",
      "Automation & embedded systems",
    ],
  },
  {
    slug: "electronics",
    name: "Electronics Academy",
    tagline: "Circuits, sensors and smart things.",
    description:
      "Design circuits, wire breadboards, and build IoT and smart-home projects — sensors, motors, transistors and microcontrollers, one working prototype at a time.",
    icon: "cpu",
    gradient: "from-lime-500 to-green-600",
    status: "soon",
    ageBands: ["Future Innovators", "Senior Academy"],
    plannedTracks: 8,
    highlights: [
      "Circuit design & breadboarding",
      "Sensors, motors, microcontrollers",
      "Smart-home & IoT projects",
    ],
  },
  {
    slug: "ai",
    name: "Artificial Intelligence Academy",
    tagline: "Understand and build with AI.",
    description:
      "AI for every age — prompt engineering, chatbots, image and voice AI, agents and the ethics behind them, with real projects and a gentle on-ramp to machine learning.",
    icon: "brain",
    gradient: "from-fuchsia-500 to-purple-600",
    status: "soon",
    ageBands: ["Future Innovators", "Senior Academy"],
    plannedTracks: 12,
    highlights: [
      "Prompt engineering & AI ethics",
      "Chatbots, image, voice & AI agents",
      "On-ramp to machine learning",
    ],
  },
  {
    slug: "design",
    name: "Design Academy",
    tagline: "Make things beautiful and usable.",
    description:
      "UI/UX, Figma, branding, illustration, motion and 3D — the craft of designing experiences people love to use.",
    icon: "palette",
    gradient: "from-pink-500 to-rose-500",
    status: "soon",
    ageBands: ["Future Innovators", "Senior Academy"],
    plannedTracks: 9,
    highlights: [
      "UI & UX foundations",
      "Figma, branding & illustration",
      "Motion & 3D design",
    ],
  },
  {
    slug: "creator",
    name: "Creator Academy",
    tagline: "Tell stories the world wants to watch.",
    description:
      "Animation, video editing, storytelling, podcasting and content creation — the modern creator's toolkit, project by project.",
    icon: "clapperboard",
    gradient: "from-orange-500 to-red-500",
    status: "soon",
    ageBands: ["Young Creators", "Future Innovators", "Senior Academy"],
    plannedTracks: 8,
    highlights: [
      "Animation & video editing",
      "Storytelling & podcasting",
      "Content creation & digital marketing",
    ],
  },
  {
    slug: "entrepreneurship",
    name: "Entrepreneurship Academy",
    tagline: "Turn ideas into ventures.",
    description:
      "Financial literacy, product design, sales, negotiation, leadership and startups — the mindset and skills to build and lead.",
    icon: "rocket",
    gradient: "from-violet-500 to-indigo-600",
    status: "soon",
    ageBands: ["Future Innovators", "Senior Academy"],
    plannedTracks: 10,
    highlights: [
      "Financial literacy & business basics",
      "Sales, negotiation & leadership",
      "Product design & startups",
    ],
  },
  {
    slug: "digital-skills",
    name: "Digital Skills Academy",
    tagline: "The essentials for a digital life.",
    description:
      "Typing, Microsoft Office, Google Workspace, research, presentations, productivity and staying safe online — the foundational skills every learner needs.",
    icon: "keyboard",
    gradient: "from-slate-500 to-gray-600",
    status: "soon",
    ageBands: ["All Ages"],
    plannedTracks: 8,
    highlights: [
      "Typing & office productivity",
      "Research & presentation skills",
      "Internet safety & digital citizenship",
    ],
  },
];

/** Live academies come first (enterable now), then the roadmap — flagship first
 *  within the "soon" group so Math Fix leads the vision. */
export function sortedAcademies(): Academy[] {
  return [...ACADEMIES].sort((a, b) => {
    if (a.status !== b.status) return a.status === "live" ? -1 : 1;
    if (!!b.flagship !== !!a.flagship) return a.flagship ? -1 : 1;
    return 0;
  });
}

export function academyBySlug(slug: string): Academy | undefined {
  return ACADEMIES.find((a) => a.slug === slug);
}
