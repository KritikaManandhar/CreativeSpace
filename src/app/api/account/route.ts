import { NextRequest } from "next/server";
import { getCurrentUser, isAuthoritativeAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeleteAccountSchema } from "@/lib/validations/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { Prisma, SocialPrivacy, Visibility } from "@prisma/client";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

/**
 * GET /api/account
 * Returns account information, privacy configuration, and content visibility metrics
 * for the authenticated user.
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return apiError("UNAUTHORIZED", "You must be signed in to access account settings", 401);
    }

    const [user, publicCount, collabCount, privateCount, collaborationsCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: currentUser.id },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          role: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
          socialPrivacy: true,
          timezone: true,
          avatarUrl: true,
          portfolio: {
            select: {
              customSlug: true,
            },
          },
        },
      }),
      prisma.project.count({
        where: { creatorId: currentUser.id, visibility: Visibility.Public },
      }),
      prisma.project.count({
        where: { creatorId: currentUser.id, visibility: Visibility.CollaboratorsOnly },
      }),
      prisma.project.count({
        where: { creatorId: currentUser.id, visibility: Visibility.Private },
      }),
      prisma.projectCollaborator.count({
        where: { userId: currentUser.id },
      }),
    ]);

    if (!user) {
      return apiError("NOT_FOUND", "User account not found", 404);
    }

    return apiSuccess({
      account: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        isAdmin: isAuthoritativeAdmin(user),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        timezone: user.timezone,
        avatarUrl: user.avatarUrl,
        portfolioSlug: user.portfolio?.customSlug || null,
        status: "Active",
      },
      privacy: {
        socialPrivacy: user.socialPrivacy,
      },
      contentVisibility: {
        public: publicCount,
        collaboratorsOnly: collabCount,
        private: privateCount,
        totalCreated: publicCount + collabCount + privateCount,
        collaborationsCount,
      },
      sessionInfo: {
        strategy: "JWT Stateless",
        storage: "HTTP-Only Encrypted Cookie",
        maxAgeDays: 30,
        multiSessionRevocationSupported: false,
      },
      supportedOperations: {
        changePassword: true,
        updatePrivacyPreferences: true,
        accountDeletion: true,
        accountDeactivation: false,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/account
 * Securely deletes or anonymizes the user account and associated personal data per TRD §32.
 * Requires password authentication and username confirmation.
 */
export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return apiError("UNAUTHORIZED", "You must be signed in to delete your account", 401);
    }

    const body = await req.json();
    const { password, confirmUsername } = DeleteAccountSchema.parse(body);

    const dbUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        email: true,
      },
    });

    if (!dbUser || !dbUser.passwordHash) {
      return apiError("NOT_FOUND", "Account not found or password login not configured", 404);
    }

    // Verify username confirmation string
    if (confirmUsername.trim().toLowerCase() !== dbUser.username.trim().toLowerCase()) {
      return apiError(
        "INVALID_CONFIRMATION",
        `Confirmation username "${confirmUsername}" does not match your username "${dbUser.username}"`,
        400
      );
    }

    // Authenticate with current password
    const isPasswordValid = await bcrypt.compare(password, dbUser.passwordHash);
    if (!isPasswordValid) {
      return apiError("INVALID_CREDENTIALS", "Incorrect password. Account deletion aborted.", 403);
    }

    const userId = dbUser.id;

    await prisma.$transaction(async (tx) => {
      // 1. Check user projects and handle solo vs collaborative projects
      const userProjects = await tx.project.findMany({
        where: { creatorId: userId },
        include: {
          collaborators: {
            where: {
              userId: { not: userId },
            },
          },
        },
      });

      const soloProjectIds: string[] = [];
      let hasSharedProjects = false;

      for (const p of userProjects) {
        if (p.collaborators.length === 0) {
          soloProjectIds.push(p.id);
        } else {
          hasSharedProjects = true;
        }
      }

      // Delete solo projects (and clean up nested comments with parentId first)
      if (soloProjectIds.length > 0) {
        await tx.comment.deleteMany({
          where: {
            projectId: { in: soloProjectIds },
            parentId: { not: null },
          },
        });
        await tx.project.deleteMany({
          where: {
            id: { in: soloProjectIds },
          },
        });
      }

      // Check if user has bookings as creator or client
      const bookingsCount = await tx.booking.count({
        where: {
          OR: [{ creatorId: userId }, { clientId: userId }],
        },
      });

      // 2. Remove personal social connections, follows, likes, notifications, activities
      await tx.notification.deleteMany({
        where: {
          OR: [{ userId }, { relatedUserId: userId }],
        },
      });

      await tx.activity.deleteMany({
        where: { actorId: userId },
      });

      await tx.commentLike.deleteMany({
        where: { userId },
      });

      await tx.like.deleteMany({
        where: { userId },
      });

      await tx.follow.deleteMany({
        where: {
          OR: [{ followerId: userId }, { followingId: userId }],
        },
      });

      await tx.connection.deleteMany({
        where: {
          OR: [{ requesterId: userId }, { receiverId: userId }],
        },
      });

      await tx.portfolio.deleteMany({
        where: { userId },
      });

      await tx.uploadIntent.deleteMany({
        where: { uploaderId: userId },
      });

      await tx.creatorAvailabilityTemplate.deleteMany({
        where: { creatorId: userId },
      });

      await tx.creatorDateOverride.deleteMany({
        where: { creatorId: userId },
      });

      await tx.creatorService.deleteMany({
        where: { creatorId: userId },
      });

      // 3. Delete or anonymize user record
      // If user has shared collaborative projects or bookings (ON DELETE RESTRICT),
      // anonymize per TRD §32 to preserve collaborators' work and booking histories.
      if (hasSharedProjects || bookingsCount > 0) {
        await tx.user.update({
          where: { id: userId },
          data: {
            displayName: "Deleted User",
            bio: null,
            avatarUrl: null,
            disciplines: [],
            socialLinks: Prisma.DbNull,
            socialPrivacy: SocialPrivacy.Private,
            passwordHash: null,
            email: `deleted_${userId}@creativespace.deleted`,
            username: `deleted_${userId.slice(0, 8)}`,
          },
        });
      } else {
        // Clean up remaining comments authored by this user with parentId != null
        await tx.comment.deleteMany({
          where: {
            authorId: userId,
            parentId: { not: null },
          },
        });

        // Hard delete user row
        await tx.user.delete({
          where: { id: userId },
        });
      }
    });

    return apiSuccess({
      message: "Account and associated personal data have been permanently deleted.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
