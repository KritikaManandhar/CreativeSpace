import { z } from "zod";

export const AddPortfolioProjectSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  featured: z.boolean().optional().default(false),
  displayOrder: z.coerce.number().int().optional().default(0),
});

export const UpdatePortfolioProjectSchema = z.object({
  featured: z.boolean().optional(),
  displayOrder: z.coerce.number().int().optional(),
});
