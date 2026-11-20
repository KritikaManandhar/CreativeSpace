"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowLeft,
  ExternalLink,
  Globe,
  Users,
  Lock,
  Shield,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingState";

type SocialPrivacyLevel = "Public" | "ConnectionsOnly" | "Private";
type PerLinkVisibility = "Default" | SocialPrivacyLevel;

interface SocialLinkFieldState {
  url: string;
  visibility: PerLinkVisibility;
}

const SOCIAL_PLATFORMS = [
  { key: "website", label: "Personal Website", placeholder: "https://myportfolio.com" },
  { key: "twitter", label: "Twitter / X", placeholder: "https://x.com/username" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/username" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
  { key: "behance", label: "Behance", placeholder: "https://behance.net/username" },
  { key: "dribbble", label: "Dribbble", placeholder: "https://dribbble.com/username" },
] as const;

const PRIVACY_OPTIONS: Array<{
  value: SocialPrivacyLevel;
  label: string;
  description: string;
}> = [
  {
    value: "Public",
    label: "Public",
    description: "Visible to everyone, including anonymous visitors on your public profile.",
  },
  {
    value: "ConnectionsOnly",
    label: "Connections Only",
    description: "Visible only to you and creators you have an accepted connection with.",
  },
  {
    value: "Private",
    label: "Private",
    description: "Visible only to you. Hidden from anonymous visitors and all connections.",
  },
];

function parseSocialLinkEntry(raw: unknown): SocialLinkFieldState {
  if (typeof raw === "string") {
    return { url: raw, visibility: "Default" };
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    const url = typeof obj.url === "string" ? obj.url : "";
    const vis =
      obj.visibility === "Public" ||
      obj.visibility === "ConnectionsOnly" ||
      obj.visibility === "Private"
        ? (obj.visibility as SocialPrivacyLevel)
        : "Default";
    return { url, visibility: vis };
  }
  return { url: "", visibility: "Default" };
}

const AVAILABLE_DISCIPLINES = [
  "Illustration",
  "Photography",
  "Music",
  "Writing",
  "Animation",
  "Video",
  "UI/UX",
];

export default function ProfileSettingsPage() {
  const { data: session, status: authStatus, update: updateSession } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    avatarUrl: "",
    disciplines: [] as string[],
    socialPrivacy: "Public" as SocialPrivacyLevel,
    socialLinks: {
      website: { url: "", visibility: "Default" },
      twitter: { url: "", visibility: "Default" },
      github: { url: "", visibility: "Default" },
      instagram: { url: "", visibility: "Default" },
      behance: { url: "", visibility: "Default" },
      dribbble: { url: "", visibility: "Default" },
    } as Record<string, SocialLinkFieldState>,
  });
  // Preserve any custom social link keys not in the 6 standard inputs
  const [extraSocialLinks, setExtraSocialLinks] = useState<Record<string, unknown>>({});

  const [customDiscipline, setCustomDiscipline] = useState("");

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/settings/profile");
      return;
    }

    if (authStatus === "authenticated") {
      fetchProfile();
    }
  }, [authStatus, router]);

  const fetchProfile = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMessage(json.error?.message || "Failed to load profile data");
        return;
      }

      const user = json.data;
      const rawLinks =
        user.socialLinks && typeof user.socialLinks === "object" && !Array.isArray(user.socialLinks)
          ? (user.socialLinks as Record<string, unknown>)
          : {};

      const standardKeys = new Set<string>(SOCIAL_PLATFORMS.map((p) => p.key));
      const preservedExtra: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rawLinks)) {
        if (!standardKeys.has(k)) {
          preservedExtra[k] = v;
        }
      }
      setExtraSocialLinks(preservedExtra);

      const privacy: SocialPrivacyLevel =
        user.socialPrivacy === "Public" ||
        user.socialPrivacy === "ConnectionsOnly" ||
        user.socialPrivacy === "Private"
          ? user.socialPrivacy
          : "Public";

      setFormData({
        displayName: user.displayName || "",
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || "",
        disciplines: Array.isArray(user.disciplines) ? user.disciplines : [],
        socialPrivacy: privacy,
        socialLinks: {
          website: parseSocialLinkEntry(rawLinks.website),
          twitter: parseSocialLinkEntry(rawLinks.twitter),
          github: parseSocialLinkEntry(rawLinks.github),
          instagram: parseSocialLinkEntry(rawLinks.instagram),
          behance: parseSocialLinkEntry(rawLinks.behance),
          dribbble: parseSocialLinkEntry(rawLinks.dribbble),
        },
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Network error loading profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisciplineToggle = (item: string) => {
    setFormData((prev) => {
      const exists = prev.disciplines.includes(item);
      const updated = exists
        ? prev.disciplines.filter((d) => d !== item)
        : [...prev.disciplines, item];
      return { ...prev, disciplines: updated };
    });
  };

  const handleAddCustomDiscipline = () => {
    const trimmed = customDiscipline.trim();
    if (!trimmed) return;
    if (!formData.disciplines.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        disciplines: [...prev.disciplines, trimmed],
      }));
    }
    setCustomDiscipline("");
  };

  const handleSocialUrlChange = (key: string, url: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [key]: {
          ...(prev.socialLinks[key] || { url: "", visibility: "Default" }),
          url,
        },
      },
    }));
  };

  const handleSocialVisibilityChange = (key: string, visibility: PerLinkVisibility) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [key]: {
          ...(prev.socialLinks[key] || { url: "", visibility: "Default" }),
          visibility,
        },
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // Preserve backward-compatible flat strings when set to "Default",
      // and store per-link visibility object when an individual override is chosen.
      const cleanSocialLinks: Record<string, any> = { ...extraSocialLinks };
      Object.entries(formData.socialLinks).forEach(([k, entry]) => {
        const trimmedUrl = entry.url.trim();
        if (trimmedUrl) {
          if (entry.visibility === "Default") {
            cleanSocialLinks[k] = trimmedUrl;
          } else {
            cleanSocialLinks[k] = {
              url: trimmedUrl,
              visibility: entry.visibility,
            };
          }
        }
      });

      const payload = {
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim() || undefined,
        avatarUrl: formData.avatarUrl.trim() || "",
        disciplines: formData.disciplines,
        socialPrivacy: formData.socialPrivacy,
        socialLinks: cleanSocialLinks,
      };

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMessage(json.error?.message || "Failed to update profile");
        return;
      }

      setSuccessMessage("Profile updated successfully!");

      // Refresh NextAuth session cache
      if (updateSession) {
        await updateSession({
          user: {
            displayName: payload.displayName,
            avatarUrl: payload.avatarUrl || null,
            disciplines: payload.disciplines,
          },
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <LoadingSpinner className="w-10 h-10 text-violet-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Workspace
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <User className="w-7 h-7 text-violet-400" />
            Creator Profile Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your public identity, disciplines, bio, and social presence.
          </p>
        </div>

        {session?.user?.username && (
          <Link
            href={`/profile/${session.user.username}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors self-start sm:self-auto"
          >
            <ExternalLink className="w-3.5 h-3.5 text-violet-400" />
            View Public Profile
          </Link>
        )}
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Identity Card */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              Creator Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Avatar Preview */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-3xl font-extrabold text-white shadow-xl shadow-violet-500/20 overflow-hidden border border-slate-700 shrink-0">
                  {formData.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={formData.avatarUrl}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    formData.displayName?.charAt(0) || "U"
                  )}
                </div>
                <span className="text-[11px] text-slate-400">Avatar Preview</span>
              </div>

              {/* Identity Fields */}
              <div className="flex-1 w-full space-y-4">
                <Input
                  label="Display Name *"
                  required
                  placeholder="e.g. Jane Doe"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                />

                <Input
                  label="Avatar Image URL"
                  placeholder="https://example.com/my-photo.jpg"
                  value={formData.avatarUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, avatarUrl: e.target.value })
                  }
                  helperText="Provide a direct link to an image file or leave blank for initials."
                />
              </div>
            </div>

            {/* Bio Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">
                  Bio
                </label>
                <span className="text-[11px] text-slate-500">
                  {formData.bio.length} / 500
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="Tell other creators about your background, tools, aesthetic, and what you make..."
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Disciplines Card */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-400" />
              Creative Disciplines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-400">
              Select all disciplines that apply to your work. This powers discovery, category filtering, and recommendations.
            </p>

            {/* Predefined Tags */}
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_DISCIPLINES.map((item) => {
                const selected = formData.disciplines.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleDisciplineToggle(item)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      selected
                        ? "bg-violet-600/30 border-violet-500 text-violet-200 shadow-sm shadow-violet-500/20"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    {item} {selected && "✓"}
                  </button>
                );
              })}
            </div>

            {/* Custom Disciplines */}
            <div className="pt-2 flex items-center gap-2 max-w-md">
              <input
                type="text"
                placeholder="Add other discipline (e.g. 3D Sculpting)"
                value={customDiscipline}
                onChange={(e) => setCustomDiscipline(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomDiscipline();
                  }
                }}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:outline-none"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddCustomDiscipline}
              >
                Add
              </Button>
            </div>

            {/* Selected Custom Disciplines Badges */}
            {formData.disciplines.filter(
              (d) => !AVAILABLE_DISCIPLINES.includes(d)
            ).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {formData.disciplines
                  .filter((d) => !AVAILABLE_DISCIPLINES.includes(d))
                  .map((custom) => (
                    <Badge
                      key={custom}
                      className="cursor-pointer bg-violet-950/60 text-violet-300 border-violet-800/60"
                      onClick={() => handleDisciplineToggle(custom)}
                      title="Click to remove"
                    >
                      {custom} ×
                    </Badge>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Links & Privacy Card */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-emerald-400" />
              Social Links &amp; Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Global Default Social Privacy Setting */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-semibold text-slate-200">
                  Default Social Links Privacy
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Choose who can see your social links on your profile by default. You can also override visibility for any individual link below.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PRIVACY_OPTIONS.map((opt) => {
                  const selected = formData.socialPrivacy === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, socialPrivacy: opt.value }))
                      }
                      className={`text-left p-3.5 rounded-xl border transition-all ${
                        selected
                          ? "border-violet-500 bg-violet-600/15 shadow-sm shadow-violet-500/20"
                          : "border-slate-800 bg-slate-950/70 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {opt.value === "Public" && (
                          <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        {opt.value === "ConnectionsOnly" && (
                          <Users className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        {opt.value === "Private" && (
                          <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span className="text-xs font-bold text-white">{opt.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Individual Social Links with Per-Link Visibility */}
            <div className="border-t border-slate-800/80 pt-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-300">
                  Individual Social &amp; Portfolio Links
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Leave a link&apos;s visibility on &ldquo;Use Default&rdquo; to inherit your setting above, or customize it independently.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SOCIAL_PLATFORMS.map((platform) => {
                  const entry = formData.socialLinks[platform.key] || {
                    url: "",
                    visibility: "Default" as PerLinkVisibility,
                  };
                  const defaultLabel =
                    formData.socialPrivacy === "ConnectionsOnly"
                      ? "Connections Only"
                      : formData.socialPrivacy;

                  return (
                    <div
                      key={platform.key}
                      className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3.5 space-y-2.5"
                    >
                      <Input
                        label={platform.label}
                        placeholder={platform.placeholder}
                        value={entry.url}
                        onChange={(e) =>
                          handleSocialUrlChange(platform.key, e.target.value)
                        }
                      />

                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor={`vis-${platform.key}`}
                          className="text-[11px] font-medium text-slate-400"
                        >
                          Visibility
                        </label>
                        <select
                          id={`vis-${platform.key}`}
                          value={entry.visibility}
                          onChange={(e) =>
                            handleSocialVisibilityChange(
                              platform.key,
                              e.target.value as PerLinkVisibility
                            )
                          }
                          className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        >
                          <option value="Default">Use Default ({defaultLabel})</option>
                          <option value="Public">Public</option>
                          <option value="ConnectionsOnly">Connections Only</option>
                          <option value="Private">Private</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/dashboard">
            <Button variant="ghost" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
            className="min-w-[140px]"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
