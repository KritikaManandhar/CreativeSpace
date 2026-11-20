import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Purging all mock data from database...");

  // Delete in order of foreign key dependencies
  await prisma.report.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.version.deleteMany({});
  await prisma.projectCollaborator.deleteMany({});
  await prisma.portfolioProject.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.projectTag.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.portfolio.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("✅ All mock data (users, projects, assets, versions, comments, portfolios, likes, notifications, reports) has been completely removed from the database!");
}

main()
  .catch((e) => {
    console.error("Error cleaning database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
