// Seed the classroom: Mr. Kelly, one course, the 12-week beginner journey.
// Full seed derives from logicland-engine curriculum via the engine's
// /api/curriculum/journey endpoint or a shared JSON export. Placeholder for now.
import { prisma } from "../src";

async function main() {
  console.log("TODO: seed Mr. Kelly, worlds, missions, badges. See docs/database.md");
}

main().finally(() => prisma.$disconnect());
