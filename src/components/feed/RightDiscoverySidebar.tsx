"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Sparkles,
  TrendingUp,
  Handshake,
  ArrowRight,
  Check,
  Plus,
  Briefcase,
  Compass,
} from "lucide-react";
import { CelestialSpark, CreatorAvatar } from "@/components/landing/CreativeSpaceBrand";

export interface TrendingCreatorItem {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  disciplines: string[];
  followerCount?: number;
  isFollowing?: boolean;
}

export interface CollabOpportunityItem {
  id: string;
  title: string;
  creatorName: string;
  creatorAvatar?: string | null;
  creatorUsername: string;
  requiredSkills: string[];
  description: string;
  projectId?: string;
}

interface RightDiscoverySidebarProps {
  creators: TrendingCreatorItem[];
  onToggleFollow: (creatorId: string, currentlyFollowing: boolean) => Promise<void>;
  busyFollowIds?: Record<string, boolean>;
  onSelectTopic?: (topic: string) => void;
  selectedCategory?: string;
  className?: string;
}

const DEFAULT_POPULAR_TOPICS = [
  { name: "Digital Illustration", category: "Illustration", tag: "#illustration" },
  { name: "Creative Photography", category: "Photography", tag: "#photography" },
  { name: "UI/UX Inspiration", category: "UI/UX", tag: "#designsystem" },
  { name: "Kinetic Typography", category: "Animation", tag: "#typography" },
  { name: "Motion & 3D Design", category: "Animation", tag: "#3d" },
  { name: "Cinematic Soundscapes", category: "Music", tag: "#sound" },
];

const CURATED_COLLAB_OPPORTUNITIES: CollabOpportunityItem[] = [
  {
    id: "collab-1",
    title: "Solaris: Stylized Sci-Fi Animation Short",
    creatorName: "Rohan Verma",
    creatorUsername: "rohan_anim",
    creatorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    requiredSkills: ["Sound Designer", "3D Lighting"],
    description: "Looking for an ambient music composer and lighting artist to complete our 3-minute festival cut.",
  },
  {
    id: "collab-2",
    title: "Artisanal Botanical Brand Identity",
    creatorName: "Anya Sharma",
    creatorUsername: "anya_art",
    creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    requiredSkills: ["Packaging Design", "Copywriter"],
    description: "Crafting sustainable apothecary packaging and editorial brand narratives for zero-waste studio.",
  },
  {
    id: "collab-3",
    title: "Nordic Minimalist Architecture Anthology",
    creatorName: "Grace Chen",
    creatorUsername: "grace_music",
    creatorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    requiredSkills: ["Photo Retoucher", "Editorial Layout"],
    description: "High-contrast architectural photo essay spanning Copenhagen and Stockholm modern pavilions.",
  },
];

export function RightDiscoverySidebar({
  creators,
  onToggleFollow,
  busyFollowIds = {},
  onSelectTopic,
  selectedCategory,
  className = "",
}: RightDiscoverySidebarProps) {
  return (
    <aside
      aria-label="Community discovery recommendations"
      className={`space-y-6 ${className}`}
    >
      {/* ============================================================ */}
      {/* SECTION A: TRENDING CREATORS                                 */}
      {/* ============================================================ */}
      <div className="rounded-2xl bg-[#FAF8F3] border border-[#203B35]/10 p-4.5 shadow-[0_2px_8px_rgba(32,59,53,0.03)]">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#203B35]/10">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#203B35]" />
            <h3 className="text-xs font-bold text-[#203B35] uppercase tracking-wider font-mono">
              Trending Creators
            </h3>
          </div>
          <Link
            href="/discover"
            className="text-[11px] font-medium text-[#5D635F] hover:text-[#203B35] transition-colors"
          >
            See all
          </Link>
        </div>

        <div className="space-y-3">
          {creators.length > 0 ? (
            creators.slice(0, 4).map((creator) => {
              const isFollowing = Boolean(creator.isFollowing);
              const isBusy = Boolean(busyFollowIds[creator.id]);
              const discipline = creator.disciplines[0] || "Creator";

              return (
                <div
                  key={creator.id}
                  className="flex items-center justify-between gap-3 group"
                >
                  <Link
                    href={`/profile/${creator.username}`}
                    className="flex items-center gap-2.5 min-w-0 flex-1 focus:outline-none"
                  >
                    <div className="h-8 w-8 rounded-full bg-[#203B35] text-[#F6F3EB] flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0">
                      {creator.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={creator.avatarUrl}
                          alt={creator.displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        creator.displayName?.charAt(0) || creator.username?.charAt(0) || "C"
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#203B35] truncate group-hover:text-[#162A26]">
                        {creator.displayName}
                      </p>
                      <p className="text-[11px] text-[#5D635F] truncate">
                        {discipline}
                      </p>
                    </div>
                  </Link>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onToggleFollow(creator.id, isFollowing)}
                    className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-medium transition-all shrink-0 ${
                      isFollowing
                        ? "bg-[#EFECE2] text-[#203B35] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-[#203B35]/15"
                        : "bg-[#203B35] text-[#F6F3EB] hover:bg-[#162A26]"
                    }`}
                  >
                    {isBusy ? (
                      <span className="animate-spin text-[10px]">···</span>
                    ) : isFollowing ? (
                      <span className="flex items-center gap-1">
                        <Check className="h-2.5 w-2.5" />
                        <span>Following</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Plus className="h-2.5 w-2.5" />
                        <span>Follow</span>
                      </span>
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-2 text-center text-xs text-[#5D635F]">
              Explore more creators in Discover.
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION B: POPULAR TOPICS                                    */}
      {/* ============================================================ */}
      <div className="rounded-2xl bg-[#FAF8F3] border border-[#203B35]/10 p-4.5 shadow-[0_2px_8px_rgba(32,59,53,0.03)]">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#203B35]/10">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#203B35]" />
            <h3 className="text-xs font-bold text-[#203B35] uppercase tracking-wider font-mono">
              Popular Topics
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {DEFAULT_POPULAR_TOPICS.map((topic) => {
            const isSelected = selectedCategory === topic.category;

            return (
              <button
                key={topic.name}
                type="button"
                onClick={() => onSelectTopic?.(topic.category)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-[#203B35] text-[#F6F3EB] shadow-sm"
                    : "bg-[#EFECE2]/70 text-[#282B2A] border border-[#203B35]/10 hover:border-[#203B35]/25 hover:bg-[#EFECE2]"
                }`}
              >
                <span className="text-[#9DB5A5] font-mono text-[11px]">{topic.tag}</span>
                <span className="truncate">{topic.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION C: COLLABORATION OPPORTUNITIES                       */}
      {/* ============================================================ */}
      <div className="rounded-2xl bg-[#FAF8F3] border border-[#203B35]/10 p-4.5 shadow-[0_2px_8px_rgba(32,59,53,0.03)]">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#203B35]/10">
          <div className="flex items-center gap-2">
            <Handshake className="h-4 w-4 text-[#203B35]" />
            <h3 className="text-xs font-bold text-[#203B35] uppercase tracking-wider font-mono">
              Collaborations
            </h3>
          </div>
          <Link
            href="/dashboard?tab=invitations"
            className="text-[11px] font-medium text-[#5D635F] hover:text-[#203B35] transition-colors"
          >
            My Invites
          </Link>
        </div>

        <div className="space-y-3.5">
          {CURATED_COLLAB_OPPORTUNITIES.map((collab) => (
            <div
              key={collab.id}
              className="p-3 rounded-xl bg-[#F6F3EB]/80 border border-[#203B35]/10 space-y-2 hover:border-[#203B35]/25 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-semibold text-[#203B35] leading-snug line-clamp-1">
                  {collab.title}
                </h4>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-[#5D635F]">
                <span>by {collab.creatorName}</span>
              </div>

              <p className="text-[11px] text-[#282B2A]/80 line-clamp-2 leading-relaxed">
                {collab.description}
              </p>

              <div className="flex flex-wrap gap-1 pt-1">
                {collab.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-[#EFECE2] px-2 py-0.5 text-[9.5px] font-mono text-[#203B35] border border-[#203B35]/10"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="pt-1.5 flex justify-end">
                <Link
                  href={`/profile/${collab.creatorUsername}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#203B35] hover:underline"
                >
                  <span>View Details</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Refined Minimalist Footer Info */}
      <div className="px-3 pt-2 text-[11px] text-[#92958F] space-y-1.5">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <Link href="/discover" className="hover:text-[#203B35] transition-colors">
            Explore
          </Link>
          <Link href="/discover?tab=services" className="hover:text-[#203B35] transition-colors">
            Services
          </Link>
          <a href="#about" className="hover:text-[#203B35] transition-colors">
            Guidelines
          </a>
          <a href="#privacy" className="hover:text-[#203B35] transition-colors">
            Privacy
          </a>
        </div>
        <p className="font-mono text-[10px] text-[#92958F]/80">
          © {new Date().getFullYear()} CreativeSpace 2.0 · Atelier Community
        </p>
      </div>
    </aside>
  );
}
