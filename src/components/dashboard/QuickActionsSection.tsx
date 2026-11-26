"use client";

import React from "react";
import {
  Briefcase,
  FolderPlus,
  Lightbulb,
  MessageSquarePlus,
  Plus,
  Sparkles,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";

interface QuickActionsSectionProps {
  onCreateProject: () => void;
  onPublishPost: () => void;
  onCreateService: () => void;
  onStartIdea: () => void;
}

export function QuickActionsSection({
  onCreateProject,
  onPublishPost,
  onCreateService,
  onStartIdea,
}: QuickActionsSectionProps) {
  const actions = [
    {
      id: "project",
      title: "Create a Project",
      tagline: "New artwork or portfolio piece",
      description: "Set up version tracking, define discipline specs, and upload assets.",
      icon: FolderPlus,
      color: "bg-[#203B35] text-[#FAF8F3]",
      borderHover: "hover:border-[#203B35]",
      badge: "Projects",
      onClick: onCreateProject,
    },
    {
      id: "post",
      title: "Publish a Post",
      tagline: "Studio note or process log",
      description: "Share sketches, technique breakthroughs, or ask for peer critique.",
      icon: MessageSquarePlus,
      color: "bg-[#9DB5A5]/35 text-[#203B35]",
      borderHover: "hover:border-[#9DB5A5]",
      badge: "Community Feed",
      onClick: onPublishPost,
    },
    {
      id: "service",
      title: "Create a Service",
      tagline: "Bookable creative offering",
      description: "Package commissions, sprint reviews, or 1-on-1 studio mentorships.",
      icon: Briefcase,
      color: "bg-[#C8BDE0]/40 text-[#203B35]",
      borderHover: "hover:border-[#C8BDE0]",
      badge: "Services",
      onClick: onCreateService,
    },
    {
      id: "idea",
      title: "Start an Idea",
      tagline: "Spark or collaboration space",
      description: "Post early concepts, moodboards, and find collaborative partners.",
      icon: Lightbulb,
      color: "bg-[#E5A93C]/25 text-[#8E5A1C]",
      borderHover: "hover:border-[#E5A93C]",
      badge: "Collaborations",
      onClick: onStartIdea,
    },
  ];

  return (
    <section aria-label="Quick Actions" className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CelestialSpark className="h-4 w-4 text-[#9DB5A5]" />
          <h2 className="font-serif text-lg sm:text-xl font-medium tracking-tight text-[#203B35]">
            Quick Actions
          </h2>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#5D635F]">
          Fast shortcuts
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              type="button"
              onClick={act.onClick}
              className={`group flex flex-col justify-between rounded-2xl border border-[#203B35]/12 bg-[#FAF8F3] p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${act.borderHover}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${act.color} transition-transform group-hover:scale-105`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#5D635F] bg-[#EFECE2] px-2 py-0.5 rounded-full">
                    {act.badge}
                  </span>
                </div>

                <h3 className="font-serif text-base sm:text-lg font-medium text-[#203B35] group-hover:text-[#162A26] transition-colors">
                  {act.title}
                </h3>
                <p className="text-xs font-medium text-[#203B35]/75 mt-0.5">
                  {act.tagline}
                </p>
                <p className="mt-2 text-xs text-[#5D635F] leading-relaxed line-clamp-2">
                  {act.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#203B35]/08 flex items-center justify-between text-xs font-semibold text-[#203B35]">
                <span>Launch</span>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#EFECE2] group-hover:bg-[#203B35] group-hover:text-[#FAF8F3] transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
