import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { z } from "zod";

const CategoryCreateSchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters").max(50),
});

// GET /api/admin/categories - List all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return apiSuccess(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/admin/categories - Create category (Admin only)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return apiError("FORBIDDEN", "Administrative privileges required", 403);
    }

    const body = await req.json();
    const { name } = CategoryCreateSchema.parse(body);

    const category = await prisma.category.upsert({
      where: { name: name.trim() },
      create: { name: name.trim() },
      update: {},
    });

    return apiSuccess(category, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
