"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Heart,
  ArrowRight,
  Sparkles,
  Layers,
} from "lucide-react";
import { CelestialSpark, CreatorAvatar } from "@/components/landing/CreativeSpaceBrand";
import { EXPLORE_PROJECTS } from "@/components/explore/exploreData";
import { RelatedProjectItem, getCategoryArtwork } from "./projectTypes";

interface ProjectRelatedWorksProps {
  currentProjectId: string;
  category: string;
  tags?: string[];
  creatorId?: string;
  creatorUsername?: string;
}

export function ProjectRelatedWorks({
  currentProjectId,
  category,
  tags = [],
  creatorId,
  creatorUsername,
}: ProjectRelatedWorksProps) {
  const [relatedProjects, setRelatedProjects] = useState<RelatedProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRelated() {
      setIsLoading(true);
      try {
        // Query discover by category
        const res = await fetch(`/api/discover?category=${encodeURIComponent(category)}`);
        const json = await res.json();

        let items: RelatedProjectItem[] = [];

        if (json.success && Array.isArray(json.data?.projects)) {
          items = json.data.projects
            .filter((p: any) => p.id !== currentProjectId)
            .map((p: any) => ({
              id: p.id,
              title: p.title,
              category: p.category,
              coverImage:
                p.assets?.[0]?.downloadUrl ||
                p.previewImageUrl ||
                getCategoryArtwork(p.category),
              likes: p._count?.likes || 0,
              description: p.description,
              creator: {
                id: p.creator?.id || "",
                username: p.creator?.username || "creator",
                displayName: p.creator?.displayName || "Creative Practitioner",
                avatarUrl: p.creator?.avatarUrl || null,
              },
            }));
        }

        // If fewer than 3 items, blend in high-quality items from EXPLORE_PROJECTS
        if (items.length < 3) {
          const exploreCandidates = EXPLORE_PROJECTS.filter(
            (ep) => ep.id !== currentProjectId
          ).map((ep) => ({
            id: ep.id,
            title: ep.title,
            category: ep.category,
            coverImage: ep.coverImage,
            likes: ep.likes,
            description: ep.description,
            creator: {
              id: ep.creator.id,
              username: ep.creator.username,
              displayName: ep.creator.displayName,
              avatarUrl: ep.creator.avatarUrl || null,
            },
          }));

          // Prefer matching category or tags
          const matchingCategory = exploreCandidates.filter(
            (c) => c.category.toLowerCase() === category.toLowerCase()
          );
          const others = exploreCandidates.filter(
            (c) => c.category.toLowerCase() !== category.toLowerCase()
          );

          const merged = [...items, ...matchingCategory, ...others];
          // Deduplicate by ID
          const seen = new Set<string>();
          const deduped: RelatedProjectItem[] = [];
          for (const item of merged) {
            if (!seen.has(item.id) && item.id !== currentProjectId) {
              seen.add(item.id);
              deduped.push(item);
            }
          }
          items = deduped.slice(0, 3);
        } else {
          items = items.slice(0, 3);
        }

        setRelatedProjects(items);
      } catch {
        // Fallback to static explore candidates
        const fallback = EXPLORE_PROJECTS.filter((ep) => ep.id !== currentProjectId)
          .slice(0, 3)
          .map((ep) => ({
            id: ep.id,
            title: ep.title,
            category: ep.category,
            coverImage: ep.coverImage,
            likes: ep.likes,
            description: ep.description,
            creator: {
              id: ep.creator.id,
              username: ep.creator.username,
              displayName: ep.creator.displayName,
              avatarUrl: ep.creator.avatarUrl || null,
            },
          }));
        setRelatedProjects(fallback);
      } finally {
        setIsLoading(false);
      }
    }

    loadRelated();
  }, [currentProjectId, category]);

  if (!isLoading && relatedProjects.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-16">
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#203B35]/10 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Compass className="w-4 h-4 text-[#203B35]" />
              <h2 className="text-xs font-mono uppercase tracking-[0.16em] text-[#203B35] font-semibold">
                More to Explore
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#5D635F]">
              Curated works in {category} and kindred disciplines across the creative ecosystem.
            </p>
          </div>

          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#203B35] hover:underline"
          >
            <span>View all in Explore</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Related Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-[#FAF8F3] border border-[#203B35]/10 p-4 space-y-3 animate-pulse"
                >
                  <div className="w-full aspect-[4/3] rounded-xl bg-[#EFECE2]" />
                  <div className="h-4 w-3/4 rounded bg-[#EFECE2]" />
                  <div className="h-3 w-1/2 rounded bg-[#EFECE2]" />
                </div>
              ))
            : relatedProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group flex flex-col justify-between rounded-2xl bg-[#FAF8F3] border border-[#203B35]/12 hover:border-[#203B35]/35 p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div>
                    {/* Cover Preview Image */}
                    <div className="relative w-full aspect-[16/11] rounded-xl overflow-hidden bg-[#162A26] mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={project.coverImage}
                        alt={project.title}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Top-left category tag */}
                      <div className="absolute top-2.5 left-2.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF8F3]/90 backdrop-blur-sm text-[10px] font-mono uppercase tracking-wider text-[#203B35] font-semibold border border-[#203B35]/10 shadow-sm">
                          <CelestialSpark className="w-2.5 h-2.5 text-[#203B35]" />
                          <span>{project.category}</span>
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-serif italic font-normal text-lg text-[#203B35] group-hover:text-[#162A26] leading-snug line-clamp-2 transition-colors mb-2">
                      {project.title}
                    </h3>

                    {project.description && (
                      <p className="text-xs text-[#282B2A]/80 line-clamp-2 leading-relaxed mb-3">
                        {project.description}
                      </p>
                    )}
                  </div>

                  {/* Creator Byline & Likes */}
                  <div className="pt-3 border-t border-[#203B35]/8 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-6 w-6 rounded-full bg-[#203B35] text-[#FAF8F3] flex items-center justify-center text-[10px] font-semibold overflow-hidden shrink-0">
                        {project.creator.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={project.creator.avatarUrl}
                            alt={project.creator.displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          project.creator.displayName.charAt(0)
                        )}
                      </div>
                      <span className="font-medium text-[#282B2A] truncate max-w-[120px]">
                        {project.creator.displayName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[#5D635F] font-mono text-[11px] shrink-0">
                      <Heart className="w-3.5 h-3.5 text-[#E85D3F]" />
                      <span>{project.likes}</span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
