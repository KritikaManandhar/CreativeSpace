"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserPlus,
  UserCheck,
  Check,
  Plus,
  ArrowRight,
  Globe,
  Twitter,
  Github,
  Instagram,
  ExternalLink,
  Users,
  Compass,
  Sparkles,
} from "lucide-react";
import { CreatorAvatar } from "@/components/landing/CreativeSpaceBrand";
import { ProjectCreator } from "./projectTypes";

interface ProjectCreatorSectionProps {
  creator: ProjectCreator;
  isFollowing?: boolean;
  onToggleFollow?: () => Promise<void>;
  isFollowBusy?: boolean;
  isCurrentUser?: boolean;
  onSendConnectRequest?: () => Promise<void>;
  connectionStatus?: "none" | "pending" | "accepted";
  isConnectBusy?: boolean;
}

export function ProjectCreatorSection({
  creator,
  isFollowing = false,
  onToggleFollow,
  isFollowBusy = false,
  isCurrentUser = false,
  onSendConnectRequest,
  connectionStatus = "none",
  isConnectBusy = false,
}: ProjectCreatorSectionProps) {
  // Normalize disciplines array
  const disciplines: string[] = Array.isArray(creator.disciplines)
    ? creator.disciplines
    : [];

  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-10">
      <div className="rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          {/* Creator Profile Summary */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left min-w-0">
            {/* Avatar */}
            <Link
              href={`/profile/${creator.username}`}
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-[#203B35] text-[#F6F3EB] flex items-center justify-center text-xl font-bold overflow-hidden ring-4 ring-[#203B35]/10 shrink-0 hover:ring-[#203B35]/25 transition-all"
              title={`View ${creator.displayName}'s profile`}
            >
              {creator.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={creator.avatarUrl}
                  alt={creator.displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <CreatorAvatar
                  name={creator.displayName}
                  initials={creator.displayName.slice(0, 2).toUpperCase()}
                  tone="#203B35"
                  accent="#C8BDE0"
                  size="md"
                />
              )}
            </Link>

            {/* Info */}
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Link
                  href={`/profile/${creator.username}`}
                  className="text-lg sm:text-xl font-serif italic text-[#203B35] hover:underline"
                >
                  {creator.displayName}
                </Link>
                <span className="text-xs font-mono text-[#92958F]">
                  @{creator.username}
                </span>
              </div>

              {/* Bio */}
              <p className="text-xs sm:text-sm text-[#282B2A]/85 max-w-xl leading-relaxed">
                {creator.bio ||
                  "Independent practitioner sharing verified work on CreativeSpace."}
              </p>

              {/* Disciplines */}
              {disciplines.length > 0 && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                  {disciplines.map((d) => (
                    <span
                      key={d}
                      className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#EFECE2] text-[#203B35] border border-[#203B35]/10"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions (Follow, Connect, View Profile) */}
          {!isCurrentUser && (
            <div className="flex flex-col sm:items-end gap-2.5 shrink-0 w-full sm:w-auto">
              <div className="flex items-center justify-center sm:justify-end gap-2 w-full">
                {/* Follow Button */}
                {onToggleFollow && (
                  <button
                    type="button"
                    disabled={isFollowBusy}
                    onClick={onToggleFollow}
                    className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all shadow-sm ${
                      isFollowing
                        ? "bg-[#EFECE2] text-[#203B35] border border-[#203B35]/20 hover:bg-rose-50 hover:text-rose-700"
                        : "bg-[#203B35] text-[#FAF8F3] hover:bg-[#162A26]"
                    }`}
                  >
                    {isFollowBusy ? (
                      <span className="animate-spin text-xs">···</span>
                    ) : isFollowing ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                )}

                {/* Collaboration Connection Button */}
                {onSendConnectRequest && connectionStatus !== "accepted" && (
                  <button
                    type="button"
                    disabled={isConnectBusy || connectionStatus === "pending"}
                    onClick={onSendConnectRequest}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#203B35] text-xs font-medium border border-[#203B35]/15 hover:border-[#203B35]/35 hover:bg-[#FAF8F3] transition-all shadow-sm"
                  >
                    {connectionStatus === "pending" ? (
                      <>
                        <Users className="w-3.5 h-3.5 text-amber-600" />
                        <span>Request Sent</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5 text-[#203B35]" />
                        <span>Connect</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* View Full Profile Link */}
              <Link
                href={`/profile/${creator.username}`}
                className="inline-flex items-center justify-center sm:justify-end gap-1.5 text-xs font-semibold text-[#203B35] hover:underline pt-1"
              >
                <span>Explore Full Portfolio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
