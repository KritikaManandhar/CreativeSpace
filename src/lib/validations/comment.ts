import { z } from "zod";

export const CommentScopeEnum = z.enum(["project", "version"], {
  errorMap: () => ({ message: "Scope must be either 'project' or 'version'" }),
});

export type CommentScope = z.infer<typeof CommentScopeEnum>;

export const GetCommentsQuerySchema = z
  .object({
    scope: CommentScopeEnum,
    versionId: z.string().uuid("Invalid version ID").optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.scope === "project" && data.versionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["versionId"],
        message: "Project discussion scope cannot specify a versionId",
      });
    }
    if (data.scope === "version" && !data.versionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["versionId"],
        message: "Version feedback scope requires a valid versionId",
      });
    }
  });

export const CreateCommentSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1, "Comment content cannot be empty")
      .max(2000, "Comment is too long"),
    scope: CommentScopeEnum.optional(),
    versionId: z.string().uuid("Invalid version ID").optional().nullable(),
    parentId: z.string().uuid("Invalid parent comment ID").optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.scope === "project" && data.versionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["versionId"],
        message: "Project discussion comments cannot specify a versionId",
      });
    }
    if (data.scope === "version" && !data.versionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["versionId"],
        message: "Version feedback comments require a versionId",
      });
    }
  });

export const UpdateCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment content cannot be empty")
    .max(2000, "Comment is too long"),
});
