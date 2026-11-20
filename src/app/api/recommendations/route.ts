import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { VersionStatus, Visibility } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/recommendations - Content-based recommendations with popularity blending & cold-start fallback
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    // 1. Fetch all candidate Public projects (excluding user's own)
    const candidateProjects = await prisma.project.findMany({
      where: {
        visibility: Visibility.Public,
        ...(user ? { creatorId: { not: user.id } } : {}),
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            disciplines: true,
          },
        },
        assets: {
          where: {
            version: {
              status: { in: [VersionStatus.Approved, VersionStatus.Final] },
            },
          },
          select: {
            id: true,
            projectId: true,
            versionId: true,
            fileName: true,
            mimeType: true,
            fileSize: true,
            thumbnailPath: true,
            createdAt: true,
          },
          take: 3,
          orderBy: { createdAt: "desc" },
        },
        projectTags: {
          include: { tag: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Cold-Start Fallback: If user is not logged in or has 0 interactions, return sorted by popularity
    if (!user) {
      const sortedByPopularity = [...candidateProjects].sort(
        (a, b) => b._count.likes - a._count.likes
      ).slice(0, 12);

      return apiSuccess({
        type: "cold-start",
        recommendations: sortedByPopularity.map((p) => ({
          ...p,
          tags: p.projectTags.map((pt) => pt.tag.name),
          similarityScore: 0,
        })),
      });
    }

    // 2. Gather user's interaction history: user's declared disciplines + liked project categories/tags
    const [userLikes, userProjects, userRecord] = await Promise.all([
      prisma.like.findMany({
        where: { userId: user.id },
        include: {
          project: {
            include: {
              projectTags: { include: { tag: true } },
            },
          },
        },
      }),
      prisma.project.findMany({
        where: { creatorId: user.id },
        include: {
          projectTags: { include: { tag: true } },
        },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { disciplines: true },
      }),
    ]);

    // Build user preference category & tag frequency map
    const categoryWeights: Record<string, number> = {};
    const tagWeights: Record<string, number> = {};

    // Declared disciplines in profile
    const declaredDisciplines = Array.isArray(userRecord?.disciplines)
      ? (userRecord.disciplines as string[])
      : [];
    for (const d of declaredDisciplines) {
      categoryWeights[d] = (categoryWeights[d] || 0) + 3;
    }

    // Likes count heavily (weight = 2)
    for (const l of userLikes) {
      const cat = l.project.category;
      categoryWeights[cat] = (categoryWeights[cat] || 0) + 2;
      for (const pt of l.project.projectTags) {
        tagWeights[pt.tag.name] = (tagWeights[pt.tag.name] || 0) + 2;
      }
    }

    // Created projects (weight = 1.5)
    for (const p of userProjects) {
      categoryWeights[p.category] = (categoryWeights[p.category] || 0) + 1.5;
      for (const pt of p.projectTags) {
        tagWeights[pt.tag.name] = (tagWeights[pt.tag.name] || 0) + 1.5;
      }
    }

    const hasInteractions = Object.keys(categoryWeights).length > 0;

    if (!hasInteractions) {
      // Cold-start fallback for new user
      const sortedByPopularity = [...candidateProjects].sort(
        (a, b) => b._count.likes - a._count.likes
      ).slice(0, 12);

      return apiSuccess({
        type: "cold-start",
        recommendations: sortedByPopularity.map((p) => ({
          ...p,
          tags: p.projectTags.map((pt) => pt.tag.name),
          similarityScore: 0,
        })),
      });
    }

    // 3. Score candidate projects using Content-Based Similarity + Popularity Blending (TRD Section 27)
    const scoredCandidates = candidateProjects.map((project) => {
      let contentScore = 0;

      // Category match
      if (categoryWeights[project.category]) {
        contentScore += categoryWeights[project.category] * 4;
      }

      // Tag match
      for (const pt of project.projectTags) {
        if (tagWeights[pt.tag.name]) {
          contentScore += tagWeights[pt.tag.name] * 2;
        }
      }

      // Popularity blending: logarithmic scale of like count
      const popularityScore = Math.log10(project._count.likes + 1) * 3;

      const finalScore = contentScore + popularityScore;

      return {
        ...project,
        tags: project.projectTags.map((pt) => pt.tag.name),
        similarityScore: Math.round(finalScore * 10) / 10,
      };
    });

    // Sort by blended score descending
    scoredCandidates.sort((a, b) => b.similarityScore - a.similarityScore);

    return apiSuccess({
      type: "personalized",
      recommendations: scoredCandidates.slice(0, 12),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
