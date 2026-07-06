# LogicLand — 12-Week Beginner Curriculum

Human-readable companion to the code source of truth
(`logicland-engine/curriculum/beginner_journey.py`). Never "Lesson 1" — every
week is a **World** containing one or more **Missions**, each teaching one
**Skill**. Every mission includes: Objectives · Teacher Guide · Student Mission ·
Project · Worksheet · Quiz · Homework · Parent Summary · Badge · Estimated Time ·
Required Assets.

| Week | World | Skill | Signature Mission | Badge |
|---|---|---|---|---|
| 1 | Meet Robo | Algorithms | Meet Robo | First Friend |
| 2 | Which Way, Robo? | Directions / Sequencing | Which Way, Robo? | Pathfinder |
| 3 | The Pattern Forest | Patterns | The Pattern Forest | Pattern Wizard |
| 4 | The Star Collector | Loops | Collect the Stars | Loop Hero |
| 5 | The Button Kingdom | Events | The Button Kingdom | Event Master |
| 6 | The Fork in the Road | Conditions | Avoid the Obstacles | Choice Champion |
| 7 | The Glitch Cave | Debugging | The Glitch Cave | Bug Detective |
| 8 | The Dancing Robot | Animation | The Dancing Robot | Animator |
| 9 | Robo's Storybook | Interactive Stories | Robo's Storybook | Storyteller |
| 10 | The Star Chase Game | Combining Skills | Build a Mini Game | Game Maker |
| 11 | My Big Idea | Project Building | Build Your Big Idea | Creator |
| 12 | The Graduation Showcase | Showcase & Reflection | Graduation Showcase | LogicLand Graduate |

## Per-mission template

Each mission (see the code for exact strings) provides:

- **Objectives** — what the child will be able to do.
- **Teacher Guide** — how to introduce, facilitate, and close the mission.
- **Student Mission** — Story → Objective → Activity → Challenge.
- **Project** — a small build showcasing the skill.
- **Worksheet & Quiz** — AI-generatable, aligned to skill + difficulty.
- **Homework** — a short, joyful at-home task (10–15 min).
- **Parent Summary** — plain-language recap + one way to help at home.
- **Badge** — the reward that marks mastery.
- **Estimated Time** — 45 min (60 for project/game/graduation weeks).
- **Required Assets** — mission illustration, Robo character, reward animation.

## Weekly narrative arc

Weeks 1–7 build core computational-thinking primitives (algorithms → debugging).
Weeks 8–9 turn skills into expressive, creative output (animation, stories).
Weeks 10–11 combine everything into a game and an original project. Week 12
celebrates with a showcase — the child graduates as a LogicLand coder.

## Extending the curriculum

Add a `World` with `Mission`s to `beginner_journey.py`; the engine exposes it at
`/api/curriculum/journey`, and the DB seed mirrors it. Keep the vocabulary and
the per-mission template intact.
