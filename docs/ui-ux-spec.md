# LogicLand — UI/UX Specification

**Status:** Source of truth for screens & flows. **Companion:** [`PRD.md`](PRD.md),
[`branding.md`](branding.md), [`animations.md`](animations.md).

## Design north star

Every screen answers one question: **"Does this make learning exciting?"**
Modern, warm, magical, professional — **not childish**. Rounded cards, soft
gradients, friendly illustrations, large typography, minimal reading, bright
colours used with restraint.

## Global patterns

- **Navigation:** role-scoped app shell. Students get a playful bottom/side nav
  with big icons; parents and teachers get a calm sidebar.
- **Reading load:** children's screens use icons + short phrases, never paragraphs.
- **Feedback:** every meaningful action has motion + sound-ready hooks (see
  `animations.md`). Rewards celebrate; errors reassure ("Let's try again!").
- **States:** every data view ships loading skeletons, empty states, and error
  boundaries.
- **Accessibility:** WCAG AA, dark mode, large tap targets (≥ 44px), focus rings.

## 1. Student experience

Route: `/student`. Tone: playful, adventurous, low-friction.

| Screen | Purpose | Key elements |
|---|---|---|
| **Home** | Launchpad | Robo greeting, streak flame, XP/level bar, quick tiles |
| **Today's Adventure** | The day's mission | Story card, big "Start" button, progress dots |
| **Continue Mission** | Resume in progress | Mission map, current step highlighted |
| **Achievements** | Pride wall | Badges grid, certificates, level milestones |
| **Projects** | What I built | Thumbnails, "Show my grown-up" share |
| **Games** | Play to learn | Skill-reinforcing mini-games |
| **Ask AI Helper** | Scaffolded hints | Robo chat; one hint at a time; never the answer |
| **Rewards** | Coins & unlocks | Coin balance, unlockable worlds, reward animations |

**Key flow — Mission:** Story → Objective → Activity → Challenge → Project →
Homework → Badge + reward animation → Parent Summary generated.

## 2. Parent experience

Route: `/parent`. Tone: reassuring, informative, calm.

| Screen | Purpose |
|---|---|
| **Dashboard** | At-a-glance status of each child |
| **Current Lesson** | What the child is learning now |
| **Weekly Progress** | AI-written summary + highlights |
| **Attendance** | Presence record |
| **Homework** | Assigned / completed |
| **Teacher Notes** | Personal notes from Mr. Kelly |
| **Certificates / Projects / Achievements** | Celebrate output |
| **Growth Timeline** | Narrative of progress over time |
| **Progress Graph** | Skill mastery over weeks |
| **Upcoming Lessons** | What's next |
| **Messaging** | Two-way with the teacher |

## 3. Teacher experience

Route: `/teacher`. Tone: powerful, efficient — reduce manual work.

| Screen | Purpose |
|---|---|
| **Dashboard** | Classroom pulse, alerts, quick actions |
| **Student / Parent Management** | Roster, invites, links parent↔student |
| **Lesson / Mission / Assignment Builder** | Author curriculum content |
| **Worksheet / Quiz / Flashcard Generator** | AI-generated materials |
| **Certificate Generator** | Issue awards |
| **Weekly Report Generator** | AI-drafted, teacher-approved reports |
| **Announcements** | Broadcast to parents/students |
| **Analytics** | Mastery, engagement, streaks |
| **Project Review** | Review + feedback on submissions |
| **Badge Management** | Define + award badges |
| **Attendance** | Mark and track |

**Principle:** every generator is *draft-then-approve* — AI proposes, the teacher
edits and confirms. AI never publishes to a child unreviewed for high-stakes items.

## 4. Auth & routing

Clerk sign-in/up under `/(auth)`. After auth, redirect by role
(`ROLE_HOME` in `packages/auth`). Unauthorized role → friendly 403.

## 5. Responsive & platforms

Mobile-first for students (tablets are the common device), comfortable desktop
layouts for teachers. All breakpoints tested; no horizontal body scroll.

## 6. Component inventory (built in `packages/ui`)

Buttons, cards, stat tiles, XP/streak meters, badge chip, mission map, story
panel, Robo avatar, reward burst, progress graph, data table (teacher), skeleton
loaders, empty states, toast/notification. All Shadcn-based + Tailwind tokens
from `branding.md`.
