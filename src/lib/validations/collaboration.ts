import { z } from "zod";
import { CollaboratorRole } from "@prisma/client";

export const AssignableCollaboratorRoleEnum = z.enum(
  [CollaboratorRole.Collaborator, CollaboratorRole.ClientReviewer],
  {
    errorMap: () => ({
      message: "Role must be either Collaborator or ClientReviewer",
    }),
  }
);

export const InviteCollaboratorSchema = z.object({
  userIdentifier: z.string().trim().min(1, "Please provide an email or username"),
  role: AssignableCollaboratorRoleEnum,
});

export const UpdateCollaboratorRoleSchema = z.object({
  role: z.nativeEnum(CollaboratorRole),
});

export const CollaboratorLifecycleActionSchema = z.object({
  action: z.enum(["accept", "reject", "cancel"], {
    errorMap: () => ({
      message: "Action must be one of: accept, reject, cancel",
    }),
  }),
});
