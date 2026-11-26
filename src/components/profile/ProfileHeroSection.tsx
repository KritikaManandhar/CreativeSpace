"use client";

import React from "react";
import {
  ArrowRight,
  Calendar,
  Camera,
  Check,
  Clock,
  Eye,
  MapPin,
  MessageSquarePlus,
  PencilLine,
  Share2,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import type { ViewerConnectionState } from "@/lib/features/profile";
import type { ProfilePerspective, UserProfileRecord } from "@/data/mockProfiles";
import { ProfileAvatarBadge, ProfileCoverArtwork } from "./ProfileVisualMedia";

interface ProfileHeroSectionProps {
  profile: UserProfileRecord;
  perspective: ProfilePerspective;
  publishedServicesCount: number;
  isFollowing: boolean;
  connectionState: ViewerConnectionState;
  copiedLink: boolean;
  onOpenEditModal: () => void;
  onToggleFollow: () => void;
  onToggleConnect: () => void;
  onOpenCollaborate: () => void;
  onCopyShareLink: () => void;
  onPerspectiveChange: (mode: ProfilePerspective) => void;
  onSelectShowcaseTab: (tab: "works" | "services" | "posts" | "about") => void;
  onOpenSocialModal: (tab: "followers" | "following") => void;
}

export function ProfileHeroSection({
  profile,
  perspective,
  publishedServicesCount,
  isFollowing,
  connectionState,
  copiedLink,
  onOpenEditModal,
  onToggleFollow,
  onToggleConnect,
  onOpenCollaborate,
  onCopyShareLink,
  onPerspectiveChange,
  onSelectShowcaseTab,
  onOpenSocialModal,
}: ProfileHeroSectionProps) {
  const isOwner = perspective === "owner";

  const connectionButtonLabel =
    connectionState === "accepted"
      ? "Connected"
      : connectionState === "pending_outgoing"
      ? "Request Sent"
      : "Connect";

  return (
    <section aria-label="Creator profile overview">
      <div className="rounded-[22px] sm:rounded-[26px] border border-[#203B35]/15 bg-[#FAF8F3] shadow-[0_24px_60px_-28px_rgba(32,59,53,0.16)] overflow-hidden">
        {/* 1. Cover / Banner Area */}
        <ProfileCoverArtwork
          coverUrl={profile.coverUrl}
          coverPreset={profile.coverPreset}
          displayName={profile.displayName}
        >
          {/* Top bar over banner */}
          <div className="relative z-10 flex h-full flex-col justify-between p-3.5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF8F3]/95 backdrop-blur-md px-3 py-1 font-mono text-[10px] sm:text-[10.5px] uppercase tracking-[0.14em] sm:tracking-[0.16em] text-[#203B35] border border-[#203B35]/15 shadow-sm min-w-0">
                <CelestialSpark className="h-3 w-3 shrink-0 text-[#9DB5A5]" />
                <span className="truncate">Studio Folio · @{profile.username}</span>
              </span>

              {isOwner ? (
                <button
                  type="button"
                  onClick={onOpenEditModal}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#FAF8F3]/95 backdrop-blur-md px-3 sm:px-3.5 py-1.5 text-[11.5px] sm:text-[12px] font-medium text-[#203B35] border border-[#203B35]/15 shadow-sm hover:bg-[#FFFFFF] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F6F3EB]"
                >
                  <Camera className="h-3.5 w-3.5 text-[#203B35]" />
                  <span>
                    Edit Cover<span className="hidden sm:inline"> &amp; Info</span>
                  </span>
                </button>
              ) : (
                profile.openToCollab && (
                  <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#203B35]/90 backdrop-blur-md px-2.5 sm:px-3 py-1 text-[11px] sm:text-[11.5px] font-medium text-[#F6F3EB] border border-[#9DB5A5]/40 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-[#9DB5A5]" />
                    <span className="hidden sm:inline">Open to Collaborations</span>
                    <span className="sm:hidden">Open to Collab</span>
                  </span>
                )
              )}
            </div>
          </div>
        </ProfileCoverArtwork>

        {/* 2. Avatar + Identity + Primary Actions */}
        <div className="px-5 sm:px-8 lg:px-10 pb-6 sm:pb-7">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            {/* Avatar + Name Block */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 min-w-0">
              <div className="relative -mt-12 sm:-mt-16 w-fit shrink-0 z-10">
                <ProfileAvatarBadge
                  avatarUrl={profile.avatarUrl}
                  displayName={profile.displayName}
                  initials={profile.avatarInitials}
                  tone={profile.avatarTone}
                  accent={profile.avatarAccent}
                  size="xl"
                />
                {isOwner && (
                  <button
                    type="button"
                    onClick={onOpenEditModal}
                    aria-label="Update profile picture"
                    className="absolute bottom-1 right-1 inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[#203B35] text-[#F6F3EB] ring-2 ring-[#FAF8F3] hover:bg-[#162A26] transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
                  >
                    <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                )}
              </div>

              <div className="min-w-0 pt-1 sm:pb-1">
                {profile.headline && (
                  <p className="flex items-start sm:items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] sm:tracking-[0.16em] text-[#5D635F] mb-1.5 leading-snug">
                    <CelestialSpark className="h-3 w-3 shrink-0 text-[#9DB5A5] mt-0.5 sm:mt-0" />
                    <span>{profile.headline}</span>
                  </p>
                )}

                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h1 className="font-serif text-[2.1rem] sm:text-[2.65rem] lg:text-[3rem] font-normal leading-[1.03] tracking-[-0.025em] text-[#203B35] break-words">
                    {profile.displayName}
                  </h1>
                  <span className="font-mono text-[13px] sm:text-[13.5px] font-medium text-[#5D635F]">
                    @{profile.username}
                  </span>
                </div>

                {/* Location / Timezone / Joined metadata */}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-[#5D635F]">
                  {profile.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#9DB5A5]" />
                      <span>{profile.location}</span>
                    </span>
                  )}
                  {profile.timezone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#9DB5A5]" />
                      <span>{profile.timezone}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#9DB5A5]" />
                    <span>{profile.joinedAt}</span>
                  </span>
                  {profile.studioStatus && (
                    <span className="inline-flex items-center gap-1.5 text-[#203B35] font-medium">
                      <Sparkles className="h-3.5 w-3.5 text-[#9DB5A5]" />
                      <span>{profile.studioStatus}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons (Owner vs Public Visitor) */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-1 lg:pb-1">
              {isOwner ? (
                <>
                  <button
                    type="button"
                    onClick={onOpenEditModal}
                    className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full bg-[#203B35] px-5 py-2 text-[13.5px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F3]"
                  >
                    <PencilLine className="h-4 w-4 text-[#9DB5A5]" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={onCopyShareLink}
                    className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-[#203B35]/20 bg-[#F6F3EB] px-4 py-2 text-[13.5px] font-medium text-[#203B35] hover:border-[#203B35]/45 hover:bg-[#EFECE2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-4 w-4 text-[#4E9F76]" />
                        <span>Link Copied</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4 text-[#5D635F]" />
                        <span>Share</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onPerspectiveChange("visitor")}
                    className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-full border border-[#203B35]/15 px-3.5 py-2 text-[12.5px] font-medium text-[#5D635F] hover:text-[#203B35] hover:border-[#203B35]/35 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
                    title="Preview how public visitors see your profile"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Public View</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onToggleFollow}
                    aria-pressed={isFollowing}
                    className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full px-5 py-2 text-[13.5px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F3] ${
                      isFollowing
                        ? "border border-[#203B35]/25 bg-[#EFECE2] text-[#203B35] hover:bg-[#E7E2D5]"
                        : "bg-[#203B35] text-[#F6F3EB] hover:bg-[#162A26] shadow-sm"
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="h-4 w-4 text-[#203B35]" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 text-[#9DB5A5]" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onToggleConnect}
                    aria-pressed={connectionState !== "none"}
                    className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full border px-4 py-2 text-[13.5px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                      connectionState === "accepted"
                        ? "border-[#9DB5A5] bg-[#9DB5A5]/20 text-[#203B35]"
                        : connectionState === "pending_outgoing"
                        ? "border-[#C8BDE0] bg-[#C8BDE0]/20 text-[#203B35]"
                        : "border-[#203B35]/20 bg-[#F6F3EB] text-[#203B35] hover:border-[#203B35]/45 hover:bg-[#EFECE2]"
                    }`}
                  >
                    {connectionState === "accepted" ? (
                      <UserCheck className="h-4 w-4 text-[#203B35]" />
                    ) : (
                      <Users className="h-4 w-4 text-[#5D635F]" />
                    )}
                    <span>{connectionButtonLabel}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenCollaborate}
                    className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full border border-[#203B35]/20 bg-[#FAF8F3] px-4 py-2 text-[13.5px] font-medium text-[#203B35] hover:border-[#203B35]/45 hover:bg-[#EFECE2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
                  >
                    <MessageSquarePlus className="h-4 w-4 text-[#5D635F]" />
                    <span>Collaborate</span>
                  </button>

                  <button
                    type="button"
                    onClick={onCopyShareLink}
                    aria-label={copiedLink ? "Profile link copied" : "Share profile link"}
                    className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#203B35]/20 bg-[#F6F3EB] text-[#203B35] hover:border-[#203B35]/40 hover:bg-[#EFECE2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
                  >
                    {copiedLink ? (
                      <Check className="h-4 w-4 text-[#4E9F76]" />
                    ) : (
                      <Share2 className="h-4 w-4 text-[#5D635F]" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 3. Compact Editorial Intro & Quick Stats Strip */}
          <div className="mt-6 pt-5 border-t border-[#203B35]/10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="min-w-0 max-w-xl space-y-2">
              <p className="text-[14.5px] leading-[1.65] text-[#282B2A]/85 line-clamp-2">
                {profile.bio || "Explore works, published services, and studio notes."}
              </p>
              <button
                type="button"
                onClick={() => onSelectShowcaseTab("about")}
                className="group inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#203B35] hover:text-[#162A26] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 rounded"
              >
                <span>Full bio, disciplines &amp; social links</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#9DB5A5] transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Compact Clickable Stats Bar */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onSelectShowcaseTab("works")}
                className="rounded-xl border border-[#203B35]/10 bg-[#F6F3EB] px-3.5 py-2 text-left hover:border-[#203B35]/30 transition-colors"
              >
                <span className="font-serif text-[1.25rem] leading-none text-[#203B35] tabular-nums mr-1.5">
                  {profile.projects.length}
                </span>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#5D635F]">
                  Works
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectShowcaseTab("services")}
                className="rounded-xl border border-[#203B35]/10 bg-[#F6F3EB] px-3.5 py-2 text-left hover:border-[#203B35]/30 transition-colors"
              >
                <span className="font-serif text-[1.25rem] leading-none text-[#203B35] tabular-nums mr-1.5">
                  {publishedServicesCount}
                </span>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#5D635F]">
                  Services
                </span>
              </button>

              <button
                type="button"
                onClick={() => onSelectShowcaseTab("posts")}
                className="rounded-xl border border-[#203B35]/10 bg-[#F6F3EB] px-3.5 py-2 text-left hover:border-[#203B35]/30 transition-colors"
              >
                <span className="font-serif text-[1.25rem] leading-none text-[#203B35] tabular-nums mr-1.5">
                  {profile.posts.length}
                </span>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#5D635F]">
                  Posts
                </span>
              </button>

              <button
                type="button"
                onClick={() => onOpenSocialModal("followers")}
                className="rounded-xl border border-[#203B35]/10 bg-[#F6F3EB] px-3.5 py-2 text-left hover:border-[#203B35]/30 transition-colors"
              >
                <span className="font-serif text-[1.25rem] leading-none text-[#203B35] tabular-nums mr-1.5">
                  {profile.stats.followers.toLocaleString()}
                </span>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#5D635F]">
                  Followers
                </span>
              </button>

              <button
                type="button"
                onClick={() => onOpenSocialModal("following")}
                className="rounded-xl border border-[#203B35]/10 bg-[#F6F3EB] px-3.5 py-2 text-left hover:border-[#203B35]/30 transition-colors"
              >
                <span className="font-serif text-[1.25rem] leading-none text-[#203B35] tabular-nums mr-1.5">
                  {profile.stats.following.toLocaleString()}
                </span>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#5D635F]">
                  Following
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
