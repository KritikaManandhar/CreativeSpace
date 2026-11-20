import { PrismaClient, ProjectStatus, Visibility, CollaboratorRole, VersionStatus, NotificationType, ReportStatus, ReportTargetType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting CreativeSpace comprehensive database seed...");

  // 1. Seed Core Categories
  console.log("Creating default creative categories...");
  const categories = [
    "Illustration",
    "Photography",
    "Music",
    "Writing",
    "Animation",
    "Video",
    "UI/UX",
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat },
      create: { name: cat },
      update: {},
    });
  }

  // 2. Hash default password
  const defaultPasswordHash = await bcrypt.hash("CreativePass123!", 10);

  // 3. Seed Personas
  console.log("Creating personas: Anya, Rohan, Grace, David, and Platform Admin...");

  // Persona 1: Anya (Illustrator)
  const anya = await prisma.user.upsert({
    where: { email: "anya@creativespace.com" },
    create: {
      email: "anya@creativespace.com",
      username: "anya_art",
      displayName: "Anya Sharma",
      passwordHash: defaultPasswordHash,
      bio: "Freelance digital illustrator specializing in concept art, vector illustrations, and brand identity sets.",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      disciplines: ["Illustration", "Concept Art"],
      isAdmin: false,
    },
    update: {},
  });

  // Persona 2: Rohan (Animator)
  const rohan = await prisma.user.upsert({
    where: { email: "rohan@creativespace.com" },
    create: {
      email: "rohan@creativespace.com",
      username: "rohan_anim",
      displayName: "Rohan Verma",
      passwordHash: defaultPasswordHash,
      bio: "Independent 2D/3D animator and collective lead creating stylized narrative shorts and kinetic typography.",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
      disciplines: ["Animation", "3D Modeling"],
      isAdmin: false,
    },
    update: {},
  });

  // Persona 3: Grace (Music Producer)
  const grace = await prisma.user.upsert({
    where: { email: "grace@creativespace.com" },
    create: {
      email: "grace@creativespace.com",
      username: "grace_music",
      displayName: "Grace Chen",
      passwordHash: defaultPasswordHash,
      bio: "Music producer, composer, and sound designer scoring cinematic trailers, ambient soundscapes, and game audio.",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
      disciplines: ["Music", "Sound Design"],
      isAdmin: false,
    },
    update: {},
  });

  // Persona 4: David (Client / Reviewer)
  const david = await prisma.user.upsert({
    where: { email: "david@creativespace.com" },
    create: {
      email: "david@creativespace.com",
      username: "david_client",
      displayName: "David Miller",
      passwordHash: defaultPasswordHash,
      bio: "Creative Director & Small Business Founder commissioning brand illustration, scores, and media.",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
      disciplines: ["Client Reviewer"],
      isAdmin: false,
    },
    update: {},
  });

  // Platform Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@creativespace.com" },
    create: {
      email: "admin@creativespace.com",
      username: "admin",
      displayName: "CreativeSpace Admin",
      passwordHash: defaultPasswordHash,
      bio: "Platform Administrator managing moderation, categories, and ecosystem health.",
      disciplines: ["Platform Admin"],
      isAdmin: true,
    },
    update: { isAdmin: true },
  });

  // 4. Ensure Portfolios exist for all creators
  const anyaPortfolio = await prisma.portfolio.upsert({
    where: { userId: anya.id },
    create: { userId: anya.id, customSlug: "anya_art" },
    update: {},
  });

  const rohanPortfolio = await prisma.portfolio.upsert({
    where: { userId: rohan.id },
    create: { userId: rohan.id, customSlug: "rohan_anim" },
    update: {},
  });

  const gracePortfolio = await prisma.portfolio.upsert({
    where: { userId: grace.id },
    create: { userId: grace.id, customSlug: "grace_music" },
    update: {},
  });

  // 5. Seed Projects, Assets, Versions, and Comments

  // Project A: Anya's Illustration Project (Completed & Public -> in Portfolio)
  console.log("Seeding Anya's project...");
  const anyaProject = await prisma.project.create({
    data: {
      creatorId: anya.id,
      title: "Client X Brand Illustration Set",
      description: "A comprehensive brand identity illustration suite featuring stylized vector mascot characters and digital asset kits.",
      category: "Illustration",
      status: ProjectStatus.Completed,
      visibility: Visibility.Public,
      metadata: {
        software: "Procreate & Adobe Illustrator",
        style: "Flat / Vector Geometric",
        canvasWidth: 4000,
        canvasHeight: 4000,
        colorProfile: "sRGB Display P3",
      },
    },
  });

  // Add Anya as Owner in ProjectCollaborator
  await prisma.projectCollaborator.create({
    data: {
      projectId: anyaProject.id,
      userId: anya.id,
      role: CollaboratorRole.Owner,
      acceptedAt: new Date(),
    },
  });

  // Add David as ClientReviewer on Anya's project
  await prisma.projectCollaborator.create({
    data: {
      projectId: anyaProject.id,
      userId: david.id,
      role: CollaboratorRole.ClientReviewer,
      acceptedAt: new Date(),
    },
  });

  // Tags for Anya's project
  for (const tag of ["branding", "vector", "mascot", "flatart"]) {
    const t = await prisma.tag.upsert({
      where: { name: tag },
      create: { name: tag },
      update: {},
    });
    await prisma.projectTag.create({
      data: { projectId: anyaProject.id, tagId: t.id },
    });
  }

  // Assets for Anya's project
  const anyaAsset1 = await prisma.asset.create({
    data: {
      projectId: anyaProject.id,
      uploaderId: anya.id,
      fileName: "mascot_sketch_v1.png",
      mimeType: "image/png",
      fileSize: 2450000,
      storagePath: `projects/${anyaProject.id}/mascot_sketch_v1.png`,
    },
  });

  const anyaAsset2 = await prisma.asset.create({
    data: {
      projectId: anyaProject.id,
      uploaderId: anya.id,
      fileName: "mascot_final_vector_v2.png",
      mimeType: "image/png",
      fileSize: 4200000,
      storagePath: `projects/${anyaProject.id}/mascot_final_vector_v2.png`,
    },
  });

  // Sequential Versions for Anya's project
  const anyaVersion1 = await prisma.version.create({
    data: {
      projectId: anyaProject.id,
      versionNumber: 1,
      createdById: anya.id,
      status: VersionStatus.Draft,
    },
  });

  const anyaVersion2 = await prisma.version.create({
    data: {
      projectId: anyaProject.id,
      versionNumber: 2,
      createdById: anya.id,
      status: VersionStatus.Approved,
    },
  });

  // Link assets to versions
  await prisma.asset.update({
    where: { id: anyaAsset1.id },
    data: { versionId: anyaVersion1.id },
  });
  await prisma.asset.update({
    where: { id: anyaAsset2.id },
    data: { versionId: anyaVersion2.id },
  });

  // Comments & Feedback on Anya's project
  await prisma.comment.create({
    data: {
      projectId: anyaProject.id,
      versionId: anyaVersion1.id,
      authorId: david.id,
      content: "Love the character poses! Can we increase the contrast on the secondary mascot colors?",
    },
  });

  await prisma.comment.create({
    data: {
      projectId: anyaProject.id,
      versionId: anyaVersion2.id,
      authorId: anya.id,
      content: "Revision v2 updated with enriched palette contrast as requested!",
    },
  });

  await prisma.comment.create({
    data: {
      projectId: anyaProject.id,
      versionId: anyaVersion2.id,
      authorId: david.id,
      content: "[APPROVED]: Sign-off complete! The deliverables look fantastic for launch.",
    },
  });

  // Add Anya's completed project to her public portfolio
  await prisma.portfolioProject.create({
    data: {
      portfolioId: anyaPortfolio.id,
      projectId: anyaProject.id,
      featured: true,
      displayOrder: 1,
    },
  });

  // Project B: Rohan's Collaborative Animation Project
  console.log("Seeding Rohan's collaborative animation project...");
  const rohanProject = await prisma.project.create({
    data: {
      creatorId: rohan.id,
      title: "Short Film: Wandering Light",
      description: "An evocative stylized 2D/3D hybrid animation exploring urban isolation and luminescence. Multi-disciplinary collaboration with composer and background artist.",
      category: "Animation",
      status: ProjectStatus.InProgress,
      visibility: Visibility.Public,
      metadata: {
        fps: 24,
        resolution: "1920x1080 (FHD)",
        software: "Blender, After Effects, Clip Studio Paint",
        technique: "2D Frame-by-Frame on 3D Backgrounds",
      },
    },
  });

  await prisma.projectCollaborator.create({
    data: {
      projectId: rohanProject.id,
      userId: rohan.id,
      role: CollaboratorRole.Owner,
      acceptedAt: new Date(),
    },
  });

  // Collaborators: Anya (Artist) and Grace (Musician)
  await prisma.projectCollaborator.create({
    data: {
      projectId: rohanProject.id,
      userId: anya.id,
      role: CollaboratorRole.Collaborator,
      acceptedAt: new Date(),
    },
  });

  await prisma.projectCollaborator.create({
    data: {
      projectId: rohanProject.id,
      userId: grace.id,
      role: CollaboratorRole.Collaborator,
      acceptedAt: new Date(),
    },
  });

  // Tags for Rohan's project
  for (const tag of ["animation", "blender", "shortfilm", "storytelling"]) {
    const t = await prisma.tag.upsert({
      where: { name: tag },
      create: { name: tag },
      update: {},
    });
    await prisma.projectTag.create({
      data: { projectId: rohanProject.id, tagId: t.id },
    });
  }

  // Version 1 of animation project
  const rohanVersion1 = await prisma.version.create({
    data: {
      projectId: rohanProject.id,
      versionNumber: 1,
      createdById: rohan.id,
      status: VersionStatus.Draft,
    },
  });

  await prisma.comment.create({
    data: {
      projectId: rohanProject.id,
      versionId: rohanVersion1.id,
      authorId: rohan.id,
      content: "Cut 1 assembly uploaded. @grace_music take a look at the pacing around minute 01:20 for musical cues.",
    },
  });

  // Project C: Grace's Music Project (Completed & Public -> in Portfolio)
  console.log("Seeding Grace's music project...");
  const graceProject = await prisma.project.create({
    data: {
      creatorId: grace.id,
      title: "Cinematic Sci-Fi Score: Neon Horizon",
      description: "An analog synthesizer and orchestral hybrid soundtrack engineered for cinematic games and interactive media.",
      category: "Music",
      status: ProjectStatus.Completed,
      visibility: Visibility.Public,
      metadata: {
        bpm: 118,
        key: "F# Minor",
        daw: "Ableton Live 12 Suite",
        genre: "Cinematic Synthwave / Ambient",
      },
    },
  });

  await prisma.projectCollaborator.create({
    data: {
      projectId: graceProject.id,
      userId: grace.id,
      role: CollaboratorRole.Owner,
      acceptedAt: new Date(),
    },
  });

  // Tags for Grace's project
  for (const tag of ["synthwave", "soundtrack", "ambient", "ableton"]) {
    const t = await prisma.tag.upsert({
      where: { name: tag },
      create: { name: tag },
      update: {},
    });
    await prisma.projectTag.create({
      data: { projectId: graceProject.id, tagId: t.id },
    });
  }

  // Version 1 for Grace's project
  const graceVersion1 = await prisma.version.create({
    data: {
      projectId: graceProject.id,
      versionNumber: 1,
      createdById: grace.id,
      status: VersionStatus.Approved,
    },
  });

  // Add Grace's completed project to her public portfolio
  await prisma.portfolioProject.create({
    data: {
      portfolioId: gracePortfolio.id,
      projectId: graceProject.id,
      featured: true,
      displayOrder: 1,
    },
  });

  // 6. Seed Likes & Follows
  console.log("Seeding interaction graph: likes and follows...");
  await prisma.like.create({
    data: { userId: david.id, projectId: anyaProject.id },
  });
  await prisma.like.create({
    data: { userId: rohan.id, projectId: anyaProject.id },
  });
  await prisma.like.create({
    data: { userId: anya.id, projectId: rohanProject.id },
  });
  await prisma.like.create({
    data: { userId: david.id, projectId: graceProject.id },
  });

  await prisma.follow.create({
    data: { followerId: david.id, followingId: anya.id },
  });
  await prisma.follow.create({
    data: { followerId: rohan.id, followingId: grace.id },
  });

  // 7. Seed Sample Report for Admin Testing
  console.log("Seeding sample moderation report for admin...");
  await prisma.report.create({
    data: {
      reporterId: david.id,
      targetType: ReportTargetType.Project,
      targetId: rohanProject.id,
      reason: "Test moderation report: please verify tag classification matches community standards.",
      status: ReportStatus.Open,
    },
  });

  console.log("✅ CreativeSpace database seeding successfully completed!");
  console.log("\nDefault Test Credentials (Password for all: CreativePass123!):");
  console.log("---------------------------------------------------------------");
  console.log("Anya (Illustrator):      anya@creativespace.com");
  console.log("Rohan (Animator):        rohan@creativespace.com");
  console.log("Grace (Music Producer):  grace@creativespace.com");
  console.log("David (Client/Reviewer): david@creativespace.com");
  console.log("Platform Administrator:  admin@creativespace.com");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
