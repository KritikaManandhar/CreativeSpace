import { z } from "zod";
import { SocialPrivacy } from "@prisma/client";

export const RegisterSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must not exceed 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  disciplines: z.array(z.string()).default([]),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const PasswordResetRequestSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters long"),
});

export const SocialLinkEntrySchema = z.union([
  z.string(),
  z.object({
    url: z.string(),
    visibility: z.nativeEnum(SocialPrivacy).optional(),
  }),
]);

export const ProfileUpdateSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").optional(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
  avatarUrl: z.string().url("Avatar URL must be a valid URL").or(z.literal("")).optional(),
  disciplines: z.array(z.string()).optional(),
  socialLinks: z.record(SocialLinkEntrySchema).optional(),
  socialPrivacy: z.nativeEnum(SocialPrivacy).optional(),
  timezone: z.string().min(1).max(100).optional(),
});

export const UpdateAccountSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(60).optional(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional().nullable(),
  timezone: z.string().min(1, "Timezone is required").max(100).optional(),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmPassword"],
  });

export const PrivacySettingsSchema = z.object({
  socialPrivacy: z.nativeEnum(SocialPrivacy),
});

export const DeleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required to confirm account deletion"),
  confirmUsername: z.string().min(1, "Please type your username to confirm deletion"),
});
