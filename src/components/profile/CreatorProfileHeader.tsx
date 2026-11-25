"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Users,
  Check,
  Plus,
  Share2,
  Settings,
  MoreHorizontal,
  ExternalLink,
  Globe,
  Github,
  Twitter,
  Instagram,
  Lock,
  Sparkles,
  Calendar,
  Layers,
  MapPin,
  Clock,
  UserCheck,
  Flag,
  Copy,
  FolderPlus,
  Handshake,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";

interface ViewerConnectionState {
  id: string;
  status: "Pending" | "Accepted" | "Rejected";
  direction: "incoming" | "outgoing";
  acceptedAt: string | null;
  rejectedAt: string | null;
}

interface NormalizedSocialLink {
  platform: string;
  label: string;
  href: string;
  visibility?: "Public" | "ConnectionsOnly" | "Private";
}

interface CreatorStats {
  createdProjects: number;
  followers: number;
  following: number;
  collaborations: number;
}

interface CreatorData {
  id: string;
  username: string;
  displayName: string;
  role: string;
  bio?: string | null;
  avatarUrl?: string | null;
  disciplines?: string[] | any;
  socialLinks?: any;
  socialPrivacy?: string;
  joinedAt: string;
  stats?: CreatorStats;
  location?: string;
}

interface CreatorProfileHeaderProps {
  creator: CreatorData;
  isOwner: boolean;
  connection: ViewerConnectionState | null;
  isFollowing: boolean;
  onToggleFollow: () => Promise<void>;
  isFollowBusy: boolean;
  onOpenFollowers: () => void;
  onOpenFollowing: () => void;
  onOpenCollaborate: () => void;
  onOpenReport: () => void;
  onShareProfile: () => void;
  onSwitchTab: (tab: "posts" | "projects" | "about" | "collaborations") => void;
}

function PlatformIcon({ platform }: { platform: string }) {
  switch (platform.toLowerCase()) {
    case "github":
      return <Github className="w-3.5 h-3.5 text-[#203B35]" />;
    case "twitter":
    case "x":
      return <Twitter className="w-3.5 h-3.5 text-sky-600" />;
    case "instagram":
      return <Instagram className="w-3.5 h-3.5 text-pink-600" />;
    case "website":
      return <Globe className="w-3.5 h-3.5 text-[#203B35]" />;
    default:
      return <ExternalLink className="w-3.5 h-3.5 text-[#5D635F]" />;
  }
}

function sanitizeExternalUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return null;
}

function normalizeSocialLinks(raw: unknown): NormalizedSocialLink[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return [];
  }

  const list: NormalizedSocialLink[] = [];
  for (const [platform, value] of Object.entries(raw as Record<string, unknown>)) {
    let rawUrl: string | null = null;
    let visibility: "Public" | "ConnectionsOnly" | "Private" | undefined;

    if (typeof value === "string") {
      rawUrl = value;
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      if (typeof obj.url === "string") {
        rawUrl = obj.url;
      }
      if (
        obj.visibility === "Public" ||
        obj.visibility === "ConnectionsOnly" ||
        obj.visibility === "Private"
      ) {
        visibility = obj.visibility;
      }
    }

    if (!rawUrl) continue;
    const safeHref = sanitizeExternalUrl(rawUrl);
    if (!safeHref) continue;

    list.push({
      platform,
      label: platform.charAt(0).toUpperCase() + platform.slice(1),
      href: safeHref,
      visibility,
    });
  }

  return list;
}

export function CreatorProfileHeader({
  creator,
  isOwner,
  connection,
  isFollowing,
  onToggleFollow,
  isFollowBusy,
  onOpenFollowers,
  onOpenFollowing,
  onOpenCollaborate,
  onOpenReport,
  onShareProfile,
  onSwitchTab,
}: CreatorProfileHeaderProps) {
  const { status: authStatus } = useSession();
  const isAuthenticated = authStatus === "authenticated";

  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  // Close more options dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setOptionsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const disciplines = Array.isArray(creator.disciplines) ? creator.disciplines : [];
  const visibleSocialLinks = normalizeSocialLinks(creator.socialLinks);

  // Format joined date
  const joinedDateFormatted = (() => {
    try {
      return new Date(creator.joinedAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      });
    } catch {
      return "2026";
    }
  })();

  return (
    <section className="relative rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 p-6 sm:p-10 lg:p-12 mb-10 shadow-[0_4px_24px_rgba(32,59,53,0.04)] overflow-hidden">
      {/* Editorial Decorative Background Flourish */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-[#EFECE2]/70 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-20 w-64 h-64 rounded-full bg-[#9DB5A5]/10 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 lg:gap-10">
        {/* Creator Avatar with Studio Frame */}
        <div className="relative shrink-0">
          <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-3xl bg-gradient-to-br from-[#203B35] to-[#162A26] text-[#F6F3EB] flex items-center justify-center text-4xl sm:text-5xl font-serif font-bold shadow-xl shadow-[#203B35]/15 ring-4 ring-[#FAF8F3] overflow-hidden">
            {creator.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={creator.avatarUrl}
                alt={creator.displayName}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            ) : (
              creator.displayName.charAt(0).toUpperCase()
            )}
          </div>

          {/* Verification / Creator Spark Badge */}
          <div
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF8F3] border border-[#203B35]/15 shadow-sm text-[#203B35]"
            title="Verified Creator on CreativeSpace"
          >
            <CelestialSpark className="h-4 w-4 text-[#203B35]" />
          </div>
        </div>

        {/* Creator Info & Action Controls */}
        <div className="flex-1 w-full text-center md:text-left space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Display Name & Handle */}
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mb-1">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#203B35] font-semibold tracking-tight">
                  {creator.displayName}
                </h1>
                <span className="text-xs sm:text-sm font-mono text-[#5D635F] px-2 py-0.5 rounded-full bg-[#EFECE2]">
                  @{creator.username}
                </span>
              </div>

              {/* Sub-meta: Location, Joined Date */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3.5 text-xs text-[#5D635F] pt-1">
                {creator.location && (
                  <span className="flex items-center gap-1 font-mono uppercase tracking-wider text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-[#9DB5A5]" />
                    {creator.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#9DB5A5]" />
                  Member since {joinedDateFormatted}
                </span>
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5">
              {isOwner ? (
                // OWNER ACTIONS
                <>
                  <Link href="/settings/profile">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-full text-xs h-9.5 px-4.5 bg-[#EFECE2] text-[#203B35] border border-[#203B35]/15 hover:bg-[#FAF8F3] shadow-sm gap-1.5"
                    >
                      <Settings className="w-3.5 h-3.5 text-[#203B35]" />
                      Edit Profile
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onShareProfile}
                    className="rounded-full text-xs h-9.5 px-3.5 border-[#203B35]/20 text-[#203B35] hover:bg-[#203B35]/5 gap-1.5"
                    title="Share your profile"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                </>
              ) : (
                // VISITOR / PEER ACTIONS
                <>
                  {/* Follow Button */}
                  {isAuthenticated ? (
                    <Button
                      variant={isFollowing ? "outline" : "primary"}
                      size="sm"
                      disabled={isFollowBusy}
                      isLoading={isFollowBusy}
                      onClick={onToggleFollow}
                      className={`rounded-full text-xs h-9.5 px-5 font-semibold gap-1.5 transition-all shadow-sm ${
                        isFollowing
                          ? "border-[#203B35]/25 text-[#203B35] bg-[#EFECE2]/70 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                          : "bg-[#203B35] text-[#F6F3EB] hover:bg-[#162A26]"
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          Following
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 text-[#9DB5A5]" />
                          Follow
                        </>
                      )}
                    </Button>
                  ) : (
                    <Link href={`/login?callbackUrl=${encodeURIComponent(`/profile/${creator.username}`)}`}>
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-[#203B35] text-[#F6F3EB] hover:bg-[#162A26] rounded-full text-xs h-9.5 px-5 font-semibold gap-1.5 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#9DB5A5]" />
                        Follow
                      </Button>
                    </Link>
                  )}

                  {/* Collaborate Button (Connects to existing collaboration request workflow) */}
                  {isAuthenticated ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onOpenCollaborate}
                      className="rounded-full text-xs h-9.5 px-4 font-semibold border-[#203B35]/20 bg-white text-[#203B35] hover:bg-[#EFECE2] hover:border-[#203B35]/35 transition-all gap-1.5 shadow-sm"
                    >
                      {connection?.status === "Accepted" ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Connected</span>
                        </>
                      ) : connection?.status === "Pending" ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Request Sent</span>
                        </>
                      ) : (
                        <>
                          <Handshake className="w-3.5 h-3.5 text-[#203B35]" />
                          <span>Collaborate</span>
                        </>
                      )}
                    </Button>
                  ) : (
                    <Link href={`/login?callbackUrl=${encodeURIComponent(`/profile/${creator.username}`)}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs h-9.5 px-4 font-semibold border-[#203B35]/20 bg-white text-[#203B35] hover:bg-[#EFECE2] gap-1.5 shadow-sm"
                      >
                        <Handshake className="w-3.5 h-3.5 text-[#203B35]" />
                        <span>Collaborate</span>
                      </Button>
                    </Link>
                  )}

                  {/* More Options Dropdown */}
                  <div ref={optionsMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setOptionsMenuOpen(!optionsMenuOpen)}
                      className="flex h-9.5 w-9.5 items-center justify-center rounded-full border border-[#203B35]/20 bg-white text-[#203B35] hover:bg-[#EFECE2] transition-colors"
                      aria-label="More profile options"
                      title="More options"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {optionsMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#FAF8F3] border border-[#203B35]/15 py-1.5 shadow-2xl z-40 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setOptionsMenuOpen(false);
                            onShareProfile();
                          }}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[#282B2A] hover:bg-[#EFECE2] transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5 text-[#5D635F]" />
                          <span>Copy Profile Link</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOptionsMenuOpen(false);
                            onOpenReport();
                          }}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-rose-700 hover:bg-rose-50 transition-colors"
                        >
                          <Flag className="w-3.5 h-3.5" />
                          <span>Report Profile</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Short Biography */}
          <p className="text-sm sm:text-base text-[#282B2A]/85 max-w-2xl leading-relaxed font-sans font-normal">
            {creator.bio || "Creative maker and independent artist sharing works on CreativeSpace."}
          </p>

          {/* Creative Specialties / Disciplines */}
          {disciplines.length > 0 && (
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-1">
              {disciplines.map((d: string) => (
                <span
                  key={d}
                  className="text-xs font-mono font-medium px-3 py-1 rounded-full bg-[#EFECE2] text-[#203B35] border border-[#203B35]/10 shadow-sm"
                >
                  {d}
                </span>
              ))}
            </div>
          )}

          {/* External Social / Studio Links (strictly server-authorized per privacy rules) */}
          {visibleSocialLinks.length > 0 && (
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
              {visibleSocialLinks.map((item) => (
                <a
                  key={item.platform}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white text-[#203B35] border border-[#203B35]/15 hover:border-[#203B35]/40 hover:bg-[#EFECE2] transition-all shadow-sm"
                  title={`${item.label} (${item.href})`}
                >
                  <PlatformIcon platform={item.platform} />
                  <span>{item.label}</span>
                  {isOwner && item.visibility === "ConnectionsOnly" && (
                    <span title="Visible only to approved connections">
                      <Users className="w-3 h-3 text-[#9DB5A5]" />
                    </span>
                  )}
                  {isOwner && item.visibility === "Private" && (
                    <span title="Private (visible only to you)">
                      <Lock className="w-3 h-3 text-rose-500" />
                    </span>
                  )}
                </a>
              ))}
            </div>
          )}

          {/* Profile Statistics Strip */}
          <div className="pt-3 border-t border-[#203B35]/10 flex flex-wrap items-center justify-center md:justify-start gap-6 sm:gap-8 text-xs text-[#5D635F]">
            <button
              type="button"
              onClick={() => onSwitchTab("projects")}
              className="flex items-center gap-1.5 hover:text-[#203B35] transition-colors focus:outline-none"
            >
              <Layers className="w-4 h-4 text-[#9DB5A5]" />
              <strong className="text-[#203B35] font-semibold text-sm">
                {creator.stats?.createdProjects ?? 0}
              </strong>
              <span>Published Works</span>
            </button>

            <button
              type="button"
              onClick={onOpenFollowers}
              className="flex items-center gap-1.5 hover:text-[#203B35] transition-colors focus:outline-none"
            >
              <Users className="w-4 h-4 text-[#9DB5A5]" />
              <strong className="text-[#203B35] font-semibold text-sm">
                {creator.stats?.followers ?? 0}
              </strong>
              <span>Followers</span>
            </button>

            <button
              type="button"
              onClick={onOpenFollowing}
              className="flex items-center gap-1.5 hover:text-[#203B35] transition-colors focus:outline-none"
            >
              <strong className="text-[#203B35] font-semibold text-sm">
                {creator.stats?.following ?? 0}
              </strong>
              <span>Following</span>
            </button>

            <button
              type="button"
              onClick={() => onSwitchTab("collaborations")}
              className="flex items-center gap-1.5 hover:text-[#203B35] transition-colors focus:outline-none"
            >
              <Sparkles className="w-4 h-4 text-[#E5A93C]" />
              <strong className="text-[#203B35] font-semibold text-sm">
                {creator.stats?.collaborations ?? 0}
              </strong>
              <span>Collaborations</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
