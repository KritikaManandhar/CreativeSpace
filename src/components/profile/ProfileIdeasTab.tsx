"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Clock, Compass, Lightbulb, Sparkles, Tag } from "lucide-react";
import type {
  ProfileIdeaItem,
  ProfileIdeaStage,
  ProfilePerspective,
} from "@/data/mockProfiles";

interface ProfileIdeasTabProps {
  ideas: ProfileIdeaItem[];
  perspective: ProfilePerspective;
  ownerDisplayName: string;
}

const STAGE_ORDER: ProfileIdeaStage[] = [
  "Spark",
  "Concept & Moodboard",
  "Active Production",
  "Review & Polish",
  "Completed",
];

const STAGE_STEP_LABELS = ["Spark", "Concept", "Production", "Completed"];

function getStageBadgeStyle(stage: ProfileIdeaStage): string {
  switch (stage) {
    case "Completed":
      return "border-[#203B35]/30 bg-[#203B35] text-[#F6F3EB]";
    case "Review & Polish":
      return "border-[#9DB5A5]/70 bg-[#9DB5A5]/25 text-[#203B35]";
    case "Active Production":
      return "border-[#C8BDE0] bg-[#C8BDE0]/30 text-[#203B35]";
    case "Concept & Moodboard":
      return "border-[#203B35]/20 bg-[#F6F3EB] text-[#203B35]";
    case "Spark":
    default:
      return "border-[#203B35]/15 bg-[#EFECE2] text-[#282B2A]";
  }
}

function getActiveStepCount(stage: ProfileIdeaStage): number {
  switch (stage) {
    case "Spark":
      return 1;
    case "Concept & Moodboard":
      return 2;
    case "Active Production":
      return 3;
    case "Review & Polish":
      return 3;
    case "Completed":
      return 4;
    default:
      return 1;
  }
}

export function ProfileIdeasTab({
  ideas,
  perspective,
  ownerDisplayName,
}: ProfileIdeasTabProps) {
  const [stageFilter, setStageFilter] = useState<string>("All");

  const availableStages = useMemo(() => {
    const present = STAGE_ORDER.filter((stage) =>
      ideas.some((idea) => idea.stage === stage)
    );
    return ["All", ...present];
  }, [ideas]);

  const filteredIdeas = useMemo(() => {
    if (stageFilter === "All") return ideas;
    return ideas.filter((idea) => idea.stage === stageFilter);
  }, [ideas, stageFilter]);

  return (
    <div
      id="panel-ideas"
      role="tabpanel"
      aria-labelledby="tab-ideas"
      className="mt-7 space-y-6"
    >
      {/* Toolbar: Stage filters & subtle public-view dashboard context */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1"
          aria-label="Filter ideas by stage"
        >
          {availableStages.map((stage) => {
            const active = stageFilter === stage;
            return (
              <button
                key={stage}
                type="button"
                onClick={() => setStageFilter(stage)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                  active
                    ? "bg-[#203B35] text-[#F6F3EB] font-medium"
                    : "border border-[#203B35]/15 bg-[#FAF8F3] text-[#282B2A]/80 hover:border-[#203B35]/30 hover:text-[#203B35]"
                }`}
              >
                {stage}
              </button>
            );
          })}
        </div>

        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#5D635F] shrink-0">
          {perspective === "owner"
            ? `${ideas.length} ${ideas.length === 1 ? "idea" : "ideas"} · Public viewer preview`
            : `${filteredIdeas.length} active ${filteredIdeas.length === 1 ? "concept" : "concepts"}`}
        </p>
      </div>

      {/* Ideas Grid */}
      {filteredIdeas.length === 0 ? (
        <div className="rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] p-10 text-center">
          <Lightbulb className="mx-auto h-6 w-6 text-[#5D635F]/70 mb-2.5" />
          <h3 className="font-serif text-[1.2rem] text-[#203B35]">
            No ideas in this stage yet
          </h3>
          <p className="mt-1 text-[13.5px] text-[#5D635F] max-w-md mx-auto">
            {ownerDisplayName} has no ideas listed under &ldquo;{stageFilter}&rdquo; at the moment.
          </p>
          {stageFilter !== "All" && (
            <button
              type="button"
              onClick={() => setStageFilter("All")}
              className="mt-4 inline-flex items-center rounded-full border border-[#203B35]/20 bg-[#F6F3EB] px-4 py-1.5 text-[12.5px] font-medium text-[#203B35] hover:border-[#203B35] transition-colors"
            >
              Show all ideas
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {filteredIdeas.map((idea) => {
            const activeSteps = getActiveStepCount(idea.stage);

            return (
              <article
                key={idea.id}
                className="flex flex-col justify-between rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] p-5 sm:p-6 shadow-sm transition-colors hover:border-[#203B35]/25"
              >
                <div className="space-y-4">
                  {/* Top Discipline & Stage Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/15 bg-[#F6F3EB] px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#5D635F]">
                      <Compass className="h-3 w-3 text-[#203B35]" />
                      {idea.discipline}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium ${getStageBadgeStyle(
                        idea.stage
                      )}`}
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>{idea.stage}</span>
                    </span>
                  </div>

                  {/* Idea Title & Concept Thesis */}
                  <div className="space-y-2">
                    <h3 className="font-serif text-[1.28rem] sm:text-[1.38rem] leading-[1.22] text-[#203B35]">
                      {idea.title}
                    </h3>
                    <p className="text-[13.5px] leading-relaxed text-[#282B2A]/85">
                      {idea.spark}
                    </p>
                  </div>

                  {/* Editorial Stage Progression Track */}
                  <div className="rounded-xl border border-[#203B35]/10 bg-[#F6F3EB]/80 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5D635F]">
                        Studio Progress
                      </span>
                      <span className="font-mono text-[11px] font-medium text-[#203B35] tabular-nums">
                        {idea.stageProgress}%
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {STAGE_STEP_LABELS.map((stepLabel, idx) => {
                        const completedOrActive = idx < activeSteps;
                        const isCurrentStep = idx === activeSteps - 1 && idea.stage !== "Completed";
                        return (
                          <div key={stepLabel} className="space-y-1">
                            <div
                              className={`h-1.5 rounded-full ${
                                completedOrActive
                                  ? isCurrentStep
                                    ? "bg-[#9DB5A5]"
                                    : "bg-[#203B35]"
                                  : "bg-[#203B35]/15"
                              }`}
                            />
                            <p
                              className={`font-mono text-[9.5px] uppercase tracking-[0.08em] truncate ${
                                completedOrActive
                                  ? "text-[#203B35] font-medium"
                                  : "text-[#5D635F]/75"
                              }`}
                            >
                              {stepLabel}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Next Milestone & Recent Studio Note */}
                  <div className="space-y-1.5 text-[12.5px] text-[#5D635F]">
                    <p className="flex items-start gap-2 text-[#203B35]">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5D635F]" />
                      <span>
                        <span className="font-medium">Next milestone:</span>{" "}
                        <span className="text-[#282B2A]/85">{idea.nextMilestone}</span>
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5D635F]/80" />
                      <span>{idea.lastUpdate}</span>
                    </p>
                  </div>
                </div>

                {/* Bottom Section: Read-only Credits & Topic Tags */}
                <div className="mt-5 pt-4 border-t border-[#203B35]/10 space-y-3">
                  {idea.contributors.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5D635F]">
                        Led by {idea.leadName} · Studio Credits
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {idea.contributors.map((contributor) => (
                          <Link
                            key={`${idea.id}-${contributor.username}`}
                            href={`/profile/${contributor.username}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/15 bg-[#F6F3EB] py-0.5 pl-1 pr-2.5 text-[11.5px] text-[#203B35] hover:border-[#203B35]/35 transition-colors"
                            title={`${contributor.name} — ${contributor.role}`}
                          >
                            <span
                              className="flex h-5 w-5 items-center justify-center rounded-full text-[9.5px] font-semibold"
                              style={{
                                backgroundColor: contributor.tone,
                                color: contributor.accent,
                              }}
                            >
                              {contributor.initials}
                            </span>
                            <span className="font-medium">
                              {contributor.name.split(" ")[0]}
                            </span>
                            <span className="text-[#5D635F] hidden sm:inline">
                              · {contributor.role}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {idea.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Tag className="h-3 w-3 text-[#5D635F]/75 mr-0.5" />
                      {idea.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-[#203B35]/10 bg-[#EFECE2]/80 px-2 py-0.5 font-mono text-[10.5px] text-[#5D635F]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
