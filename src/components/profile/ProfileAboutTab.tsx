"use client";

import React from "react";
import {
  ArrowUpRight,
  Calendar,
  Clock,
  Heart,
  MapPin,
  PencilLine,
  Sparkles,
  Users,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import { normalizeSocialLinks } from "@/lib/features/profile";
import type { ProfilePerspective, UserProfileRecord } from "@/data/mockProfiles";
import { formatReadableUrl, getSocialIcon } from "./profileIcons";

interface ProfileAboutTabProps {
  profile: UserProfileRecord;
  perspective: ProfilePerspective;
  projectsCount?: number;
  publishedServicesCount: number;
  onOpenEditModal: () => void;
  onSelectTab: (tab: "works" | "services" | "posts" | "ideas" | "about") => void;
  onOpenSocialModal: (tab: "followers" | "following") => void;
}

export function ProfileAboutTab({
  profile,
  perspective,
  projectsCount,
  publishedServicesCount,
  onOpenEditModal,
  onSelectTab,
  onOpenSocialModal,
}: ProfileAboutTabProps) {
  const isOwner = perspective === "owner";
  const normalizedLinks = normalizeSocialLinks(profile.socialLinks);

  return (
    <div
      id="panel-about"
      role="tabpanel"
      aria-labelledby="tab-about"
      className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start"
    >
      {/* Left Column: Full Bio, Disciplines, Tools & Studio Index */}
      <div className="lg:col-span-7 space-y-6">
        <div className="rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CelestialSpark className="h-3.5 w-3.5 text-[#9DB5A5]" />
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#5D635F]">
                About The Studio
              </h2>
            </div>

            {isOwner && (
              <button
                type="button"
                onClick={onOpenEditModal}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/15 bg-[#F6F3EB] px-3 py-1 text-[12px] font-medium text-[#203B35] hover:bg-[#EFECE2] transition-colors"
              >
                <PencilLine className="h-3 w-3" />
                <span>Edit Bio &amp; Info</span>
              </button>
            )}
          </div>

          {profile.bio ? (
            <p className="text-[15px] sm:text-[15.5px] leading-[1.78] text-[#282B2A]/90 whitespace-pre-line">
              {profile.bio}
            </p>
          ) : (
            <p className="text-[14.5px] italic text-[#5D635F]">
              No studio bio added yet.
            </p>
          )}

          {/* Creative Disciplines */}
          {profile.disciplines.length > 0 && (
            <div className="pt-2 border-t border-[#203B35]/10">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#5D635F] mb-2.5">
                Primary Disciplines
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.disciplines.map((disc) => (
                  <span
                    key={disc}
                    className="rounded-full border border-[#203B35]/15 bg-[#9DB5A5]/20 px-3.5 py-1 text-[12.5px] font-medium text-[#203B35]"
                  >
                    {disc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tools & Mediums */}
          {profile.tools.length > 0 && (
            <div className="pt-2 border-t border-[#203B35]/10">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#5D635F] mb-2.5">
                Mediums &amp; Tools
              </p>
              <div className="flex flex-wrap gap-2">
                {profile.tools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-full border border-[#203B35]/10 bg-[#EFECE2]/85 px-3 py-1 text-[12.5px] text-[#282B2A]/85"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Studio Index Summary */}
        <div className="rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] p-5 sm:p-7">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#5D635F]">
              Studio Index
            </span>
            <span className="font-mono text-[11px] text-[#203B35]/75">Overview</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => onSelectTab("works")}
              className="group rounded-xl border border-[#203B35]/10 bg-[#F6F3EB]/85 p-3.5 text-left hover:border-[#203B35]/30 transition-colors"
            >
              <p className="font-serif text-[1.75rem] leading-none text-[#203B35] tabular-nums">
                {projectsCount ?? profile.projects.length}
              </p>
              <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F] group-hover:text-[#203B35]">
                Works
              </p>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab("services")}
              className="group rounded-xl border border-[#203B35]/10 bg-[#F6F3EB]/85 p-3.5 text-left hover:border-[#203B35]/30 transition-colors"
            >
              <p className="font-serif text-[1.75rem] leading-none text-[#203B35] tabular-nums">
                {publishedServicesCount}
              </p>
              <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F] group-hover:text-[#203B35]">
                Services
              </p>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab("posts")}
              className="group rounded-xl border border-[#203B35]/10 bg-[#F6F3EB]/85 p-3.5 text-left hover:border-[#203B35]/30 transition-colors"
            >
              <p className="font-serif text-[1.75rem] leading-none text-[#203B35] tabular-nums">
                {profile.posts.length}
              </p>
              <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F] group-hover:text-[#203B35]">
                Posts
              </p>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab("ideas")}
              className="group rounded-xl border border-[#203B35]/10 bg-[#F6F3EB]/85 p-3.5 text-left hover:border-[#203B35]/30 transition-colors"
            >
              <p className="font-serif text-[1.75rem] leading-none text-[#203B35] tabular-nums">
                {profile.ideas.length}
              </p>
              <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F] group-hover:text-[#203B35]">
                Ideas
              </p>
            </button>

            <button
              type="button"
              onClick={() => onOpenSocialModal("followers")}
              className="group rounded-xl border border-[#203B35]/10 bg-[#F6F3EB]/85 p-3.5 text-left hover:border-[#203B35]/30 transition-colors"
            >
              <p className="font-serif text-[1.75rem] leading-none text-[#203B35] tabular-nums">
                {profile.stats.followers.toLocaleString()}
              </p>
              <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F] group-hover:text-[#203B35]">
                Followers
              </p>
            </button>

            <button
              type="button"
              onClick={() => onOpenSocialModal("following")}
              className="group rounded-xl border border-[#203B35]/10 bg-[#F6F3EB]/85 p-3.5 text-left hover:border-[#203B35]/30 transition-colors"
            >
              <p className="font-serif text-[1.75rem] leading-none text-[#203B35] tabular-nums">
                {profile.stats.following.toLocaleString()}
              </p>
              <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F] group-hover:text-[#203B35]">
                Following
              </p>
            </button>

            <div className="col-span-2 sm:col-span-3 flex items-center justify-between rounded-xl border border-[#203B35]/10 bg-[#F6F3EB]/85 p-3.5">
              <p className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F]">
                <Heart className="h-3.5 w-3.5 text-[#9DB5A5]" />
                <span>Total Appreciations</span>
              </p>
              <p className="font-serif text-[1.5rem] leading-none text-[#203B35] tabular-nums">
                {profile.stats.totalLikes.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Profile Details & Social Media Links */}
      <div className="lg:col-span-5 space-y-6">
        {/* Profile Details Card */}
        <div className="rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] p-5 sm:p-7 space-y-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#5D635F]">
            Profile Information
          </h2>

          <dl className="divide-y divide-[#203B35]/10 text-[13.5px]">
            <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
              <dt className="inline-flex items-center gap-2 text-[#5D635F]">
                <MapPin className="h-4 w-4 text-[#9DB5A5]" />
                <span>Location</span>
              </dt>
              <dd className="font-medium text-[#203B35] text-right">
                {profile.location || "Not specified"}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="inline-flex items-center gap-2 text-[#5D635F]">
                <Clock className="h-4 w-4 text-[#9DB5A5]" />
                <span>Timezone</span>
              </dt>
              <dd className="font-mono text-[12.5px] text-[#203B35] text-right">
                {profile.timezone || "UTC"}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="inline-flex items-center gap-2 text-[#5D635F]">
                <Calendar className="h-4 w-4 text-[#9DB5A5]" />
                <span>Member Since</span>
              </dt>
              <dd className="font-medium text-[#203B35] text-right">
                {profile.joinedAt}
              </dd>
            </div>

            {perspective === "owner" && (
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="inline-flex items-center gap-2 text-[#5D635F]">
                  <Users className="h-4 w-4 text-[#9DB5A5]" />
                  <span>Collaborations</span>
                </dt>
                <dd className="font-medium text-[#203B35] text-right">
                  {profile.openToCollab ? "Open to collaborate" : "Focused studio"}
                </dd>
              </div>
            )}

            {profile.studioStatus && (
              <div className="flex items-start justify-between gap-4 py-3 last:pb-0">
                <dt className="inline-flex items-center gap-2 text-[#5D635F] shrink-0">
                  <Sparkles className="h-4 w-4 text-[#9DB5A5]" />
                  <span>Status</span>
                </dt>
                <dd className="font-medium text-[#203B35] text-right">
                  {profile.studioStatus}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Social Media Links Card */}
        <div className="rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] p-5 sm:p-7 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#5D635F]">
              Elsewhere &amp; Social Links
            </h2>
            {isOwner && (
              <button
                type="button"
                onClick={onOpenEditModal}
                className="text-[12px] font-medium text-[#203B35] underline underline-offset-4 decoration-[#9DB5A5] hover:decoration-[#203B35]"
              >
                Edit links
              </button>
            )}
          </div>

          {normalizedLinks.length > 0 ? (
            <div className="space-y-2.5">
              {normalizedLinks.map((item) => {
                const Icon = getSocialIcon(item.key);
                return (
                  <a
                    key={item.key}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3 rounded-xl border border-[#203B35]/10 bg-[#F6F3EB]/85 px-4 py-3 hover:border-[#203B35]/35 hover:bg-[#EFECE2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FAF8F3] border border-[#203B35]/10 text-[#203B35]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-medium text-[#203B35]">
                          {item.label}
                        </p>
                        <p className="font-mono text-[11px] text-[#5D635F] truncate">
                          {formatReadableUrl(item.url)}
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-[#5D635F] group-hover:text-[#203B35] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#203B35]/20 bg-[#F6F3EB]/60 p-4 text-center text-[13px] text-[#5D635F]">
              <p>No public social links added yet.</p>
              {isOwner && (
                <button
                  type="button"
                  onClick={onOpenEditModal}
                  className="mt-2 font-medium text-[#203B35] underline underline-offset-4 decoration-[#9DB5A5]"
                >
                  Add social links
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
