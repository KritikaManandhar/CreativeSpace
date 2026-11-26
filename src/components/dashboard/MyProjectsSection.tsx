"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ExternalLink,
  Eye,
  GitBranch,
  Heart,
  MessageCircle,
  MoreVertical,
  Plus,
  Sliders,
  Sparkles,
} from "lucide-react";
import type { ProfileProjectItem } from "@/data/mockProfiles";

interface MyProjectsSectionProps {
  projects: ProfileProjectItem[];
  onCreateProject: () => void;
  onUpdateProjectStatus: (
    projectId: string,
    newStatus: ProfileProjectItem["status"]
  ) => void;
  onSelectProject?: (project: ProfileProjectItem) => void;
}

export function MyProjectsSection({
  projects,
  onCreateProject,
  onUpdateProjectStatus,
  onSelectProject,
}: MyProjectsSectionProps) {
  const [filter, setFilter] = useState<string>("All");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filterTabs = useMemo(() => {
    const inProgressCount = projects.filter((p) => p.status === "InProgress").length;
    const inReviewCount = projects.filter((p) => p.status === "InReview").length;
    const completedCount = projects.filter((p) => p.status === "Completed").length;

    return [
      { key: "All", label: "All Works", count: projects.length },
      { key: "InProgress", label: "In Progress", count: inProgressCount },
      { key: "InReview", label: "In Review", count: inReviewCount },
      { key: "Completed", label: "Completed", count: completedCount },
    ];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (filter === "All") return projects;
    return projects.filter((p) => p.status === filter);
  }, [projects, filter]);

  const renderStatusBadge = (status: ProfileProjectItem["status"]) => {
    switch (status) {
      case "InProgress":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#9DB5A5]/60 bg-[#9DB5A5]/25 px-2.5 py-0.5 text-[11px] font-semibold text-[#203B35]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4E9F76] animate-pulse" />
            In Progress
          </span>
        );
      case "InReview":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5A93C]/50 bg-[#E5A93C]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#8E5A1C]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E5A93C]" />
            In Review
          </span>
        );
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/20 bg-[#203B35] px-2.5 py-0.5 text-[11px] font-semibold text-[#FAF8F3]">
            <Check className="h-3 w-3" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/15 bg-[#EFECE2] px-2.5 py-0.5 text-[11px] font-medium text-[#5D635F]">
            Draft
          </span>
        );
    }
  };

  return (
    <section id="projects" aria-label="My Projects" className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#203B35]/10 pb-3.5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-xl sm:text-2xl font-normal tracking-tight text-[#203B35]">
              My Projects
            </h2>
            <span className="inline-flex items-center rounded-full bg-[#EFECE2] px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#203B35]">
              {projects.length}
            </span>
          </div>
          <p className="mt-0.5 text-xs sm:text-[13px] text-[#5D635F]">
            Recently created projects, version iterations, and access to manage them.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateProject}
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full bg-[#203B35] px-4 py-2 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map((tab) => {
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "bg-[#203B35] text-[#FAF8F3] shadow-sm"
                  : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2] hover:text-[#203B35]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`font-mono text-[10px] rounded-full px-1.5 py-0.2 ${
                  isActive
                    ? "bg-[#FAF8F3]/20 text-[#FAF8F3]"
                    : "bg-[#203B35]/10 text-[#203B35]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#203B35]/20 bg-[#FAF8F3] p-10 text-center">
          <p className="text-sm text-[#5D635F]">
            No projects found in &ldquo;{filter}&rdquo; status.
          </p>
          <button
            type="button"
            onClick={onCreateProject}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#203B35] underline underline-offset-4"
          >
            Create your first project in this view
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const isMenuOpen = activeMenuId === project.id;
            return (
              <div
                key={project.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-[#203B35]/12 bg-[#FAF8F3] overflow-hidden shadow-sm hover:border-[#203B35]/30 hover:shadow-md transition-all"
              >
                {/* Cover & Top Badges */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EFECE2]">
                  <Image
                    src={project.coverUrl}
                    alt={project.coverAlt || project.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

                  {/* Top badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#FAF8F3] bg-black/50 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/15">
                      {project.discipline}
                    </span>
                    <div className="shrink-0">{renderStatusBadge(project.status)}</div>
                  </div>

                  {/* Bottom overlay: Version tag */}
                  <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-[11px] font-mono text-[#FAF8F3] bg-black/45 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/15">
                    <GitBranch className="h-3 w-3 text-[#9DB5A5]" />
                    <span>{project.versionTag}</span>
                  </div>
                </div>

                {/* Content body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-serif text-lg font-normal text-[#203B35] line-clamp-1 group-hover:text-[#162A26] transition-colors">
                      {project.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#5D635F] line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {/* Meta stats & Collaborators */}
                  <div className="pt-2 border-t border-[#203B35]/08 flex items-center justify-between text-xs text-[#5D635F]">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5 text-[#e85d3f]" />
                        <span>{project.likeCount}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5 text-[#203B35]/60" />
                        <span>{project.commentCount}</span>
                      </span>
                    </div>

                    <span className="font-mono text-[10.5px] text-[#5D635F]">
                      {project.updatedAt}
                    </span>
                  </div>
                </div>

                {/* Action Bar / Manage Controls */}
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 flex items-center justify-between gap-2 border-t border-[#203B35]/06">
                  {/* Status Dropdown Trigger */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMenuId(isMenuOpen ? null : project.id)
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/15 bg-[#EFECE2]/70 px-3 py-1.5 text-[11.5px] font-medium text-[#203B35] hover:bg-[#FAF8F3] transition-colors"
                    >
                      <Sliders className="h-3 w-3 text-[#203B35]/70" />
                      <span>Status</span>
                      <ChevronDown className="h-3 w-3 text-[#203B35]/50" />
                    </button>

                    {/* Status selection popup */}
                    {isMenuOpen && (
                      <div className="absolute bottom-full left-0 mb-1.5 w-44 rounded-xl border border-[#203B35]/15 bg-[#FAF8F3] p-1.5 shadow-xl z-30 space-y-0.5">
                        <p className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#5D635F]">
                          Change Status
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateProjectStatus(project.id, "InProgress");
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-[#203B35] hover:bg-[#EFECE2] flex items-center justify-between"
                        >
                          <span>In Progress</span>
                          {project.status === "InProgress" && (
                            <Check className="h-3 w-3 text-[#4E9F76]" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateProjectStatus(project.id, "InReview");
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-[#203B35] hover:bg-[#EFECE2] flex items-center justify-between"
                        >
                          <span>In Review</span>
                          {project.status === "InReview" && (
                            <Check className="h-3 w-3 text-[#E5A93C]" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateProjectStatus(project.id, "Completed");
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-[#203B35] hover:bg-[#EFECE2] flex items-center justify-between"
                        >
                          <span>Completed</span>
                          {project.status === "Completed" && (
                            <Check className="h-3 w-3 text-[#203B35]" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Primary Manage Button */}
                  <button
                    type="button"
                    onClick={() => onSelectProject?.(project)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-1.5 text-[11.5px] font-semibold text-[#203B35] hover:bg-[#203B35] hover:text-[#FAF8F3] hover:border-[#203B35] transition-all"
                  >
                    <span>Manage</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
