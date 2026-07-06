# LogicLand — Product Requirements Document (PRD)

**Status:** Source of truth for scope. **Version:** 1.0 (Phase 1 / MVP).
**Companion:** [`ui-ux-spec.md`](ui-ux-spec.md).

## 1. Vision

LogicLand is a premium coding and computational-thinking world for children
aged 5–10. It turns learning to code into a story-based adventure. Version One
is **Mr. Kelly's Digital Coding Classroom** — a single, beautiful classroom that
is architected to grow into a full children's technology academy.

**Tagline:** Think Clearly. Build Boldly. Create Fearlessly.

## 2. Goals & non-goals (Phase 1)

**Goals**
- One teacher (Mr. Kelly), one or more students, and their parents.
- A magical, story-based learning experience (Worlds & Missions).
- Weekly reports, parent engagement, progress tracking, badges, certificates.
- Student projects and a 12-week beginner curriculum.
- AI that assists teacher and student without replacing the teacher.

**Non-goals (Phase 1)**
- Multi-classroom / multi-teacher marketplace (designed for, not built).
- Voice tutor, image generation, live video — reserved for later phases.
- Public self-serve signup — onboarding is teacher-initiated.

## 3. Personas

| Persona | Age | Primary need |
|---|---|---|
| **Student** | 5–10 | Fun, adventure, mastery, rewards, low reading load |
| **Parent** | adult | Reassurance, visible progress, easy engagement |
| **Teacher (Mr. Kelly)** | adult | Less manual work, powerful classroom tools |
| **Admin** | adult | *(future)* multi-classroom oversight |

## 4. Core user stories

**Student**
- As a student, I see **Today's Adventure** and can continue my current mission.
- As a student, I can ask the **AI Helper** for a hint without being given the answer.
- As a student, I earn **XP, stars, coins, badges, and certificates** and see reward animations.
- As a student, I can view my **projects**, **achievements**, and play **games**.

**Parent**
- As a parent, I see the **current lesson**, **weekly progress**, **attendance**, and **teacher notes**.
- As a parent, I receive a readable **weekly report** and can view **certificates** and **projects**.
- As a parent, I can see a **growth timeline** and **progress graph**, and **message** the teacher.

**Teacher**
- As a teacher, I manage **students and parents**.
- As a teacher, I use **builders** (lesson, mission, assignment) and **generators** (worksheet, quiz, flashcard, certificate, weekly report) to reduce manual work.
- As a teacher, I post **announcements**, review **projects**, manage **badges** and **attendance**, and view **analytics**.

## 5. Functional requirements

### 5.1 Curriculum
- Content is organized as **Course → World → Mission → Lesson**.
- Each Mission has: Story, Objective, Activity, Challenge, Project, Homework, Badge, Parent Summary, Estimated Time, Required Assets.
- Ships with the **12-week beginner journey** (see `docs/curriculum.md`).

### 5.2 AI capabilities (all via the engine)
Explain concepts · give hints · generate worksheets/quizzes/flashcards/
certificates/weekly-reports/project-ideas/parent-summaries/lesson-recaps ·
adaptive revision suggestions. Future: speech, image generation, voice tutor.

### 5.3 Gamification
XP · stars · coins · badges · mission completion · daily & weekly streaks ·
certificates · level system · unlockable worlds · reward animations.

### 5.4 Reporting & engagement
Weekly reports · attendance · announcements · notifications · parent–teacher messaging.

## 6. Roles & permissions

Clerk-backed roles: **Teacher, Parent, Student, (future) Admin**, with
role-based routing (`/teacher`, `/parent`, `/student`, `/admin`). A student sees
only their own data; a parent sees only their children; a teacher sees their
classroom.

## 7. Non-functional requirements

- **Safety:** COPPA-minded; no child-facing free-text leaves the engine unfiltered.
- **Performance:** dashboards interactive < 2s on a mid-range device.
- **Accessibility:** WCAG AA; large tap targets; minimal reading; dark mode.
- **Scalability:** clean relational model; stateless engine; horizontal-ready.
- **Maintainability:** typed end-to-end; domain logic isolated from transport.

## 8. Success metrics (Phase 1)

- Mission completion rate per student per week.
- Weekly report open rate (parent engagement).
- Teacher time saved per week on generated materials (qualitative + timing).
- Student daily/weekly streak retention.

## 9. Release plan

See [`roadmap.md`](roadmap.md). Phase 1 = foundation + core classroom loop
(this repo). Phases 2–4 add richness, adaptivity, and multi-classroom scale.

## 10. Open questions

- Final AI provider + budget per classroom.
- Storage provider choice (Cloudinary vs UploadThing) for Phase 1 launch.
- Coding activity runtime: embedded block editor vs guided simulations for week-1.
