import { z } from "zod";
import { ProjectStatus, Visibility } from "@prisma/client";

export const CreateProjectSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(120, "Title is too long"),
  description: z.string().max(2000, "Description cannot exceed 2000 characters").optional(),
  category: z.string().min(1, "Category is required"),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.Idea),
  visibility: z.nativeEnum(Visibility).default(Visibility.Private),
  metadata: z.record(z.any()).default({}),
  tags: z.array(z.string()).optional(),
});

export const UpdateProjectSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(120, "Title is too long").optional(),
  description: z.string().max(2000, "Description cannot exceed 2000 characters").optional().nullable(),
  category: z.string().min(1, "Category is required").optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  visibility: z.nativeEnum(Visibility).optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});
