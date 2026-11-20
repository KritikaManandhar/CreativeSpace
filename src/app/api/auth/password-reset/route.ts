import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PasswordResetRequestSchema } from "@/lib/validations/auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = PasswordResetRequestSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // To prevent user enumeration, always return success even if email not found
    if (!user) {
      return apiSuccess({
        message: "If an account exists with this email, a password reset link has been dispatched.",
      });
    }

    // In production, dispatch an email token. In MVP, return success response.
    return apiSuccess({
      message: "If an account exists with this email, a password reset link has been dispatched.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
