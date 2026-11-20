import { z } from "zod";
import { VersionStatus } from "@prisma/client";

export const CreateVersionSchema = z.object({
  assetIds: z.array(z.string().uuid("Invalid asset ID")).optional().default([]),
  notes: z.string().optional(),
});

export const UpdateVersionStatusSchema = z.object({
  status: z.enum([VersionStatus.Draft, VersionStatus.Approved, VersionStatus.Final, VersionStatus.Rejected], {
    errorMap: () => ({ message: "Status must be Draft, Approved, Final, or Rejected" }),
  }),
  comment: z.string().optional(),
});
