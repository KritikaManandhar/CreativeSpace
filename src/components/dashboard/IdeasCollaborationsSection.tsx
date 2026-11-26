"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Compass,
  Crown,
  Lightbulb,
  Plus,
  Share2,
  Sparkles,
  Tag,
  UserPlus,
  Users,
} from "lucide-react";
import type { DashboardIdeaItem, IdeaStage } from "@/data/mockDashboard";

interface IdeasCollaborationsSectionProps {
  ideas: DashboardIdeaItem[];
  onStartIdea: () => void;
  onAdvanceStage: (ideaId: string) => void;
  onSelectIdea?: (idea: DashboardIdeaItem) => void;
}

const STAGE_ORDER: IdeaStage[] = [
  "Spark",
  "Concept & Moodboard",
  "Active Production",
  "Review & Polish",
  "Completed",
];

export function IdeasCollaborationsSection({
  ideas,
  onStartIdea,
  onAdvanceStage,
  onSelectIdea,
}: IdeasCollaborationsSectionProps) {
  const [filter, setFilter] = useState<"all" | "owned" | "collaborating">("all");

  const ownedCount = useMemo(
    () => ideas.filter((i) => i.role === "Owner").length,
    [ideas]
  );
  const collabCount = ideas.length - ownedCount;

  const filteredIdeas = useMemo(() => {
    if (filter === "owned") return ideas.filter((i) => i.role === "Owner");
    if (filter === "collaborating") return ideas.filter((i) => i.role === "Collaborator");
    return ideas;
  }, [ideas, filter]);

  const getStageIndex = (stage: IdeaStage) => STAGE_ORDER.indexOf(stage);

  return (
    <section id="ideas" aria-label="Ideas & Collaborations" className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#203B35]/10 pb-3.5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-xl sm:text-2xl font-normal tracking-tight text-[#203B35]">
              Ideas & Collaborations
            </h2>
            <span className="inline-flex items-center rounded-full bg-[#EFECE2] px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#203B35]">
              {ideas.length}
            </span>
          </div>
          <p className="mt-0.5 text-xs sm:text-[13px] text-[#5D635F]">
            Creative spaces and joint journeys you own or contribute to, tracking each stage from spark to delivery.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartIdea}
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full bg-[#203B35] px-4 py-2 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Start an Idea</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
            filter === "all"
              ? "bg-[#203B35] text-[#FAF8F3]"
              : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
          }`}
        >
          <span>All Spaces</span>
          <span className="font-mono text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">
            {ideas.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("owned")}
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
            filter === "owned"
              ? "bg-[#203B35] text-[#FAF8F3]"
              : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
          }`}
        >
          <Crown className="h-3 w-3 text-[#E5A93C]" />
          <span>Owned by Me</span>
          <span className="font-mono text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">
            {ownedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("collaborating")}
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
            filter === "collaborating"
              ? "bg-[#203B35] text-[#FAF8F3]"
              : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
          }`}
        >
          <Users className="h-3 w-3" />
          <span>Participating</span>
          <span className="font-mono text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">
            {collabCount}
          </span>
        </button>
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredIdeas.map((idea) => {
          const currentStageIdx = getStageIndex(idea.stage);
          const isOwner = idea.role === "Owner";

          return (
            <div
              key={idea.id}
              className="group flex flex-col justify-between rounded-2xl border border-[#203B35]/12 bg-[#FAF8F3] p-5 sm:p-6 transition-all shadow-sm hover:border-[#203B35]/30 hover:shadow-md"
            >
              <div className="space-y-4">
                {/* Top: Role Pill, Discipline & Current Stage */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        isOwner
                          ? "bg-[#203B35] text-[#FAF8F3]"
                          : "bg-[#9DB5A5]/25 text-[#203B35] border border-[#9DB5A5]/60"
                      }`}
                    >
                      {isOwner ? (
                        <>
                          <Crown className="h-3 w-3 text-[#E5A93C]" />
                          <span>Owner / Lead</span>
                        </>
                      ) : (
                        <>
                          <Users className="h-3 w-3 text-[#203B35]" />
                          <span>Collaborator</span>
                        </>
                      )}
                    </span>

                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#5D635F] bg-[#EFECE2] px-2.5 py-0.5 rounded-full">
                      {idea.discipline}
                    </span>
                  </div>

                  <span className="font-mono text-[11px] text-[#5D635F]">
                    Led by @{idea.leadUsername}
                  </span>
                </div>

                {/* Title & Spark description */}
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-normal text-[#203B35] group-hover:text-[#162A26] transition-colors leading-snug">
                    {idea.title}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-[13.5px] text-[#282B2A]/85 leading-relaxed">
                    {idea.spark}
                  </p>
                </div>

                {/* ======================================================== */}
                {/* Stage Progress Pipeline                                   */}
                {/* ======================================================== */}
                <div className="rounded-xl border border-[#203B35]/08 bg-[#EFECE2]/50 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F]">
                      Current Stage
                    </span>
                    <span className="font-semibold text-[#203B35] flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#4E9F76] animate-pulse" />
                      {idea.stage} ({idea.stageProgress}%)
                    </span>
                  </div>

                  {/* Horizontal Stage Stepper */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {STAGE_ORDER.slice(0, 4).map((stageName, idx) => {
                      const isComplete = idx < currentStageIdx;
                      const isCurrent = idx === currentStageIdx;
                      return (
                        <div key={stageName} className="space-y-1">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              isComplete
                                ? "bg-[#203B35]"
                                : isCurrent
                                ? "bg-[#4E9F76]"
                                : "bg-[#203B35]/15"
                            }`}
                          />
                          <p
                            className={`text-[9.5px] font-mono uppercase tracking-[0.08em] truncate ${
                              isCurrent
                                ? "font-bold text-[#203B35]"
                                : "text-[#5D635F]"
                            }`}
                            title={stageName}
                          >
                            {stageName.split(" ")[0]}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Collaborators Roster */}
                <div className="space-y-1.5">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F]">
                    Creative Team ({idea.collaborators.length})
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {idea.collaborators.map((c) => (
                      <div
                        key={c.username}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/12 bg-[#FAF8F3] py-0.5 pl-1 pr-2.5 text-xs text-[#203B35]"
                        title={`${c.name} — ${c.role}`}
                      >
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-[#FAF8F3]"
                          style={{ backgroundColor: c.tone }}
                        >
                          {c.initials}
                        </span>
                        <span className="font-medium text-[11.5px]">{c.name.split(" ")[0]}</span>
                        <span className="text-[10px] text-[#5D635F]">({c.role.split(" ")[0]})</span>
                      </div>
                    ))}
                    {idea.openRolesNeeded && idea.openRolesNeeded.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#203B35]/25 bg-[#FAF8F3] px-2 py-0.5 text-[11px] text-[#5D635F]">
                        <UserPlus className="h-3 w-3 text-[#4E9F76]" />
                        <span>Seeking co-creator</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Recent update / Next milestone */}
                <div className="text-[11.5px] text-[#5D635F] space-y-1 pt-1">
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-[#203B35]/60" />
                    <span>{idea.lastUpdate}</span>
                  </p>
                  <p className="font-medium text-[#203B35] flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-[#E5A93C]" />
                    <span>{idea.nextMilestone}</span>
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-3.5 border-t border-[#203B35]/08 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onAdvanceStage(idea.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/15 bg-[#EFECE2] px-3.5 py-1.5 text-xs font-semibold text-[#203B35] hover:bg-[#FAF8F3] transition-colors"
                  title="Advance to next workflow milestone"
                >
                  <span>Advance Stage</span>
                  <ArrowRight className="h-3 w-3" />
                </button>

                <button
                  type="button"
                  onClick={() => onSelectIdea?.(idea)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/20 bg-[#FAF8F3] px-3.5 py-1.5 text-xs font-semibold text-[#203B35] hover:bg-[#203B35] hover:text-[#FAF8F3] hover:border-[#203B35] transition-all"
                >
                  <span>Open Space</span>
                  <Compass className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
