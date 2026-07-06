# LogicLand — Database Design

Canonical schema: `packages/database/prisma/schema.prisma`. PostgreSQL via Prisma.

## Entity groups
- **Identity:** `User` (Clerk-linked, `role`), specialised `Teacher` / `Parent`
  / `Student` profiles (1:1 with `User`). Parent 1:N Student.
- **Curriculum:** `Course → World → Mission → Lesson`, plus `Quiz`, `Worksheet`
  attached to a Mission. Slugs are unique for stable references.
- **Student output:** `Submission` (per mission, with status), `Project`,
  `Certificate`.
- **Gamification:** `Badge`, `StudentBadge` (unique per student+badge), `Reward`.
  XP/coins/stars/level/streak denormalised onto `Student` for fast reads.
- **Operations:** `Attendance` (unique per student+date), `WeeklyReport`
  (unique per student+week), `Announcement`, `Notification`.

## Conventions
- `cuid()` ids, `createdAt`/`updatedAt` timestamps, cascade deletes from owning
  aggregate (e.g. delete User → cascade profile).
- JSON columns for flexible content (`Quiz.questions`, `Worksheet.items`,
  `Submission.content`, report `highlights`/`nextSteps`).
- Uniqueness guards prevent duplicate attendance/reports/badges.

## Scale notes
Model is org-ready: adding a `Classroom`/`Organization` and FK-scoping the
teacher/student rows enables multi-classroom without a rewrite.

## Seeding
`prisma/seed.ts` seeds Mr. Kelly, one Course, and the 12-week journey derived
from the engine's curriculum (`/api/curriculum/journey`).
