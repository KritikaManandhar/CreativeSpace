import { parseApiResponse } from "./api-client";

export type SocialPrivacyLevel = "Public" | "ConnectionsOnly" | "Private";
export type PerLinkVisibility = "Default" | SocialPrivacyLevel;

export interface SocialLinkFieldState {
  url: string;
  visibility: PerLinkVisibility;
}

export interface ProfileSettingsFormData {
  displayName: string;
  bio: string;
  avatarUrl: string;
  disciplines: string[];
  socialPrivacy: SocialPrivacyLevel;
  timezone: string;
  socialLinks: Record<string, SocialLinkFieldState>;
}

export interface ProfileApiRecord {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  bio: string | null;
  avatarUrl: string | null;
  disciplines: string[];
  socialLinks: Record<string, string | { url: string; visibility?: SocialPrivacyLevel }> | null;
  socialPrivacy: SocialPrivacyLevel;
  timezone: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  portfolio?: {
    id: string;
    customSlug: string | null;
  } | null;
}

export const SOCIAL_PLATFORMS = [
  { key: "website", label: "Personal Website", placeholder: "https://yourstudio.com" },
  { key: "twitter", label: "X / Twitter", placeholder: "https://x.com/handle" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/username" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/handle" },
  { key: "behance", label: "Behance", placeholder: "https://behance.net/username" },
  { key: "dribbble", label: "Dribbble", placeholder: "https://dribbble.com/username" },
] as const;

export const PRIVACY_OPTIONS: readonly SocialPrivacyLevel[] = [
  "Public",
  "ConnectionsOnly",
  "Private",
] as const;

export const AVAILABLE_DISCIPLINES = [
  "Illustration",
  "Photography",
  "Music",
  "Writing",
  "Animation",
  "Video",
  "UI/UX",
  "Sound Design",
  "3D Art",
  "Creative Direction",
] as const;

const KNOWN_PLATFORM_KEYS = new Set<string>(SOCIAL_PLATFORMS.map((p) => p.key));

export function parseSocialLinkEntry(raw: unknown): SocialLinkFieldState {
  if (typeof raw === "string") {
    return { url: raw, visibility: "Default" };
  }
  if (raw && typeof raw === "object" && "url" in raw) {
    const obj = raw as { url?: unknown; visibility?: unknown };
    const visibility =
      obj.visibility === "Public" ||
      obj.visibility === "ConnectionsOnly" ||
      obj.visibility === "Private"
        ? obj.visibility
        : "Default";
    return {
      url: typeof obj.url === "string" ? obj.url : "",
      visibility,
    };
  }
  return { url: "", visibility: "Default" };
}

export async function loadProfileSettings(): Promise<{
  profile: ProfileApiRecord;
  formData: ProfileSettingsFormData;
  extraSocialLinks: Record<string, unknown>;
}> {
  const res = await fetch("/api/profile", { cache: "no-store" });
  const profile = await parseApiResponse<ProfileApiRecord>(
    res,
    "Failed to load profile settings"
  );

  const rawLinks =
    profile.socialLinks && typeof profile.socialLinks === "object" ? profile.socialLinks : {};

  const socialLinks: Record<string, SocialLinkFieldState> = {};
  for (const platform of SOCIAL_PLATFORMS) {
    socialLinks[platform.key] = parseSocialLinkEntry(rawLinks[platform.key]);
  }

  const extraSocialLinks: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(rawLinks)) {
    if (!KNOWN_PLATFORM_KEYS.has(key)) {
      extraSocialLinks[key] = val;
    }
  }

  return {
    profile,
    formData: {
      displayName: profile.displayName || "",
      bio: profile.bio || "",
      avatarUrl: profile.avatarUrl || "",
      disciplines: Array.isArray(profile.disciplines) ? profile.disciplines : [],
      socialPrivacy: profile.socialPrivacy || "Public",
      timezone: profile.timezone || "UTC",
      socialLinks,
    },
    extraSocialLinks,
  };
}

export function buildProfileUpdatePayload(
  formData: ProfileSettingsFormData,
  extraSocialLinks: Record<string, unknown> = {}
) {
  const socialLinksPayload: Record<string, string | { url: string; visibility: SocialPrivacyLevel }> =
    {};

  for (const [key, val] of Object.entries(extraSocialLinks)) {
    if (typeof val === "string" || (val && typeof val === "object")) {
      socialLinksPayload[key] = val as string | { url: string; visibility: SocialPrivacyLevel };
    }
  }

  for (const [key, entry] of Object.entries(formData.socialLinks)) {
    const cleanUrl = entry.url.trim();
    if (!cleanUrl) continue;
    if (entry.visibility === "Default") {
      socialLinksPayload[key] = cleanUrl;
    } else {
      socialLinksPayload[key] = {
        url: cleanUrl,
        visibility: entry.visibility,
      };
    }
  }

  return {
    displayName: formData.displayName.trim(),
    bio: formData.bio.trim(),
    avatarUrl: formData.avatarUrl.trim(),
    disciplines: formData.disciplines,
    socialPrivacy: formData.socialPrivacy,
    timezone: formData.timezone.trim() || "UTC",
    socialLinks: socialLinksPayload,
  };
}

export async function saveProfileSettings(
  payload: ReturnType<typeof buildProfileUpdatePayload>
): Promise<ProfileApiRecord> {
  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseApiResponse<ProfileApiRecord>(res, "Failed to update profile settings");
}
