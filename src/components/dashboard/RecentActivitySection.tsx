"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  GitBranch,
  Heart,
  Layers,
  MessageCircle,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import type { DashboardActivityItem, ActivityCategory } from "@/data/mockDashboard";

interface RecentActivitySectionProps {
  activity: DashboardActivityItem[];
  onNavigateSection?: (sectionId: string) => void;
}

export function RecentActivitySection({
  activity,
  onNavigateSection,
}: RecentActivitySectionProps) {
  const [filter, setFilter] = useState<string>("all");

  const filteredActivity = useMemo(() => {
    if (filter === "all") return activity;
    if (filter === "bookings") return activity.filter((a) => a.category === "booking");
    if (filter === "collaborations") {
      return activity.filter((a) => a.category === "idea" || a.category === "service");
    }
    if (filter === "posts") {
      return activity.filter((a) => a.category === "post" || a.category === "comment");
    }
    if (filter === "projects") return activity.filter((a) => a.category === "project");
    return activity;
  }, [activity, filter]);

  const renderCategoryIcon = (category: ActivityCategory) => {
    switch (category) {
      case "booking":
        return {
          icon: Calendar,
          bgClass: "bg-[#E5A93C]/20 text-[#8E5A1C] border-[#E5A93C]/40",
        };
      case "project":
        return {
          icon: GitBranch,
          bgClass: "bg-[#203B35] text-[#FAF8F3] border-[#203B35]",
        };
      case "idea":
      case "collaboration":
        return {
          icon: Sparkles,
          bgClass: "bg-[#C8BDE0]/40 text-[#203B35] border-[#C8BDE0]/60",
        };
      case "post":
        return {
          icon: MessageSquare,
          bgClass: "bg-[#9DB5A5]/30 text-[#203B35] border-[#9DB5A5]/60",
        };
      case "comment":
        return {
          icon: MessageCircle,
          bgClass: "bg-[#EFECE2] text-[#203B35] border-[#203B35]/20",
        };
      case "service":
        return {
          icon: Briefcase,
          bgClass: "bg-[#9DB5A5]/25 text-[#203B35] border-[#9DB5A5]/60",
        };
    }
  };

  return (
    <section id="activity" aria-label="Recent Activity" className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#203B35]/10 pb-3.5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-xl sm:text-2xl font-normal tracking-tight text-[#203B35]">
              Recent Activity
            </h2>
            <span className="inline-flex items-center rounded-full bg-[#EFECE2] px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#203B35]">
              {activity.length}
            </span>
          </div>
          <p className="mt-0.5 text-xs sm:text-[13px] text-[#5D635F]">
            A simple timeline of recent interactions, booking requests, and updates.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: "all", label: "All" },
            { key: "bookings", label: "Bookings" },
            { key: "collaborations", label: "Spaces" },
            { key: "posts", label: "Posts & Critiques" },
            { key: "projects", label: "Projects" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === tab.key
                  ? "bg-[#203B35] text-[#FAF8F3]"
                  : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline container */}
      <div className="relative rounded-2xl border border-[#203B35]/12 bg-[#FAF8F3] p-5 sm:p-7 shadow-sm">
        {/* Continuous vertical line */}
        <div
          className="pointer-events-none absolute left-[31px] sm:left-[39px] top-8 bottom-8 w-[1.5px] bg-[#203B35]/12"
          aria-hidden="true"
        />

        <div className="space-y-6">
          {filteredActivity.map((item) => {
            const { icon: Icon, bgClass } = renderCategoryIcon(item.category);

            return (
              <div
                key={item.id}
                className="group relative flex items-start gap-4 sm:gap-5"
              >
                {/* Node icon */}
                <div
                  className={`relative z-10 flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border shadow-sm transition-transform group-hover:scale-105 ${bgClass}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.unread && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#E5A93C] ring-2 ring-[#FAF8F3]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-sm sm:text-base font-normal text-[#203B35] leading-snug group-hover:text-[#162A26] transition-colors">
                        {item.title}
                      </h3>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5D635F] bg-[#EFECE2] px-2 py-0.2 rounded-full">
                        {item.category}
                      </span>
                    </div>

                    <p className="text-xs sm:text-[13px] text-[#282B2A]/80 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-[#5D635F]">
                      <span className="font-medium text-[#203B35]">
                        {item.actorName}
                      </span>
                      <span>•</span>
                      <span>@{item.actorHandle}</span>
                    </div>
                  </div>

                  {/* Timestamp & Navigation action */}
                  <div className="shrink-0 flex items-center gap-3 pt-1 sm:pt-0">
                    <span className="font-mono text-[11px] text-[#5D635F]">
                      {item.timestamp}
                    </span>
                    {onNavigateSection && (
                      <button
                        type="button"
                        onClick={() => onNavigateSection(item.targetSection)}
                        className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#203B35] hover:underline underline-offset-2"
                      >
                        <span className="capitalize">View</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
