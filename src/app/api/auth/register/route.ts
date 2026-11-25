import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { RegisterSchema } from "@/lib/validations/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = RegisterSchema.parse(body);

    const email = validatedData.email.toLowerCase().trim();
    const username = validatedData.username.toLowerCase().trim();

    // Check email uniqueness
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return apiError("CONFLICT", "An account with this email address already exists", 409);
    }

    // Check username uniqueness
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return apiError("CONFLICT", "This username is already taken. Please choose another.", 409);
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // Create user and conditional portfolio inside a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          username,
          passwordHash,
          displayName: validatedData.displayName.trim(),
          role: validatedData.role,
          bio: validatedData.bio?.trim() || null,
          disciplines: validatedData.disciplines || [],
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          role: true,
          bio: true,
          disciplines: true,
          avatarUrl: true,
          isAdmin: true,
          createdAt: true,
        },
      });

      // Initialize empty portfolio only for Creators; Viewers do not have a portfolio
      if (validatedData.role === "CREATOR") {
        await tx.portfolio.create({
          data: {
            userId: user.id,
            customSlug: user.username,
          },
        });
      }

      return user;
    });

    return apiSuccess(
      {
        user: newUser,
        message: "Registration successful. You can now log in.",
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
