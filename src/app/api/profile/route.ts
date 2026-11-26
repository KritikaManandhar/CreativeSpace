import { NextRequest } from "next/server";
import { getCurrentUser, isAuthoritativeAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileUpdateSchema } from "@/lib/validations/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

/**
 * GET /api/profile
 * Returns the current authenticated creator's profile data
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return apiError("UNAUTHORIZED", "You must be signed in to access your profile", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        bio: true,
        avatarUrl: true,
        disciplines: true,
        socialLinks: true,
        socialPrivacy: true,
        timezone: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        portfolio: {
          select: {
            id: true,
            customSlug: true,
          },
        },
      },
    });

    if (!user) {
      return apiError("NOT_FOUND", "User profile not found", 404);
    }

    return apiSuccess({
      ...user,
      isAdmin: isAuthoritativeAdmin(user),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/profile
 * Updates the current authenticated creator's profile data
 */
export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return apiError("UNAUTHORIZED", "You must be signed in to update your profile", 401);
    }

    const body = await req.json();
    const validatedData = ProfileUpdateSchema.parse(body);

    const updatePayload: Record<string, any> = {};

    if (validatedData.displayName !== undefined) {
      updatePayload.displayName = validatedData.displayName.trim();
    }
    if (validatedData.bio !== undefined) {
      updatePayload.bio = validatedData.bio.trim() || null;
    }
    if (validatedData.avatarUrl !== undefined) {
      updatePayload.avatarUrl = validatedData.avatarUrl.trim() || null;
    }
    if (validatedData.disciplines !== undefined) {
      updatePayload.disciplines = validatedData.disciplines;
    }
    if (validatedData.socialLinks !== undefined) {
      updatePayload.socialLinks = validatedData.socialLinks;
    }
    if (validatedData.socialPrivacy !== undefined) {
      updatePayload.socialPrivacy = validatedData.socialPrivacy;
    }
    if (validatedData.timezone !== undefined) {
      updatePayload.timezone = validatedData.timezone.trim();
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updatePayload,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        bio: true,
        avatarUrl: true,
        disciplines: true,
        socialLinks: true,
        socialPrivacy: true,
        timezone: true,
        isAdmin: true,
        updatedAt: true,
      },
    });

    return apiSuccess({
      user: {
        ...updatedUser,
        isAdmin: isAuthoritativeAdmin(updatedUser),
      },
      message: "Profile updated successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
