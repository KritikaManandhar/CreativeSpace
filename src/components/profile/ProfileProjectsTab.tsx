"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  ArrowUpRight,
  Heart,
  MessageSquare,
  Clock,
  CheckCircle2,
  FileBox,
  Compass,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";

interface ProjectItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  coverUrl?: string | null;
  previewImageUrl?: string | null;
  tags?: string[];
  versionCount?: number;
  latestVersion?: { id: string; versionNumber: number; status: string } | null;
  likeCount?: number;
  commentCount?: number;
  collaborators?: any[];
}

interface ProfileProjectsTabProps {
  projects: ProjectItem[];
  creatorUsername: string;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Completed":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Completed
        </span>
      );
    case "InProgress":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          In Progress
        </span>
      );
    case "InReview":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-semibold bg-sky-50 text-sky-800 border border-sky-200">
          In Review
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-semibold bg-[#EFECE2] text-[#203B35] border border-[#203B35]/10">
          Concept / Draft
        </span>
      );
  }
}

export function ProfileProjectsTab({
  projects,
  creatorUsername,
}: ProfileProjectsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Extract unique categories for filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set)];
  }, [projects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (selectedCategory === "All") return projects;
    return projects.filter((p) => p.category === selectedCategory);
  }, [projects, selectedCategory]);

  if (projects.length === 0) {
    return (
      <div className="py-16 text-center max-w-md mx-auto rounded-3xl bg-[#FAF8F3] border border-[#203B35]/10 p-8 space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#EFECE2] flex items-center justify-center text-[#203B35]">
          <Layers className="w-5 h-5 text-[#203B35]" />
        </div>
        <h3 className="text-base font-serif font-bold text-[#203B35]">
          No Projects Published Yet
        </h3>
        <p className="text-xs text-[#5D635F] leading-relaxed">
          Organized project workspaces, creative series, and client portfolios published by @{creatorUsername} will be showcased here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter Pills (if multiple categories) */}
      {categories.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-[#203B35] text-[#F6F3EB] shadow-sm"
                  : "bg-[#FAF8F3] text-[#5D635F] border border-[#203B35]/15 hover:border-[#203B35]/40 hover:text-[#203B35]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const cover = project.coverUrl || project.previewImageUrl;

          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group flex flex-col justify-between rounded-3xl bg-[#FAF8F3] border border-[#203B35]/15 overflow-hidden hover:border-[#203B35]/40 hover:shadow-xl transition-all duration-300"
            >
              <div>
                {/* Project Cover Preview */}
                <div className="relative aspect-[16/10] w-full bg-[#EFECE2] overflow-hidden">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#EFECE2] to-[#FAF8F3]">
                      <CelestialSpark className="w-8 h-8 text-[#203B35]/30" />
                    </div>
                  )}

                  {/* Category overlay */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F3]/90 backdrop-blur-md text-[10px] font-mono uppercase tracking-wider text-[#203B35] font-semibold border border-[#203B35]/10 shadow-sm">
                      {project.category}
                    </span>
                  </div>

                  {/* Status overlay */}
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={project.status} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xl font-serif font-semibold text-[#203B35] group-hover:text-[#162A26] transition-colors line-clamp-1">
                      {project.title}
                    </h4>
                    <span className="h-7 w-7 rounded-full bg-[#203B35]/5 text-[#203B35] group-hover:bg-[#203B35] group-hover:text-[#F6F3EB] flex items-center justify-center transition-colors shrink-0">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <p className="text-xs text-[#5D635F] line-clamp-3 leading-relaxed">
                    {project.description || "Organized creative project workspace."}
                  </p>

                  {/* Version tag & Collaborators snippet */}
                  <div className="flex items-center gap-2 pt-1">
                    {project.versionCount ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#5D635F] px-2 py-0.5 rounded-md bg-[#EFECE2]">
                        <FileBox className="w-3 h-3 text-[#9DB5A5]" />
                        {project.versionCount} {project.versionCount === 1 ? "version" : "versions"}
                      </span>
                    ) : null}

                    {project.collaborators && project.collaborators.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#5D635F] px-2 py-0.5 rounded-md bg-[#EFECE2]">
                        {project.collaborators.length} {project.collaborators.length === 1 ? "collaborator" : "collaborators"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-[#203B35]/10 flex items-center justify-between text-xs text-[#5D635F]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600/30" />
                    <span>{project.likeCount ?? 0}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-[#5D635F]" />
                    <span>{project.commentCount ?? 0}</span>
                  </span>
                </div>

                <span className="font-mono text-[11px] font-semibold text-[#203B35] group-hover:translate-x-0.5 transition-transform">
                  View Project →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
