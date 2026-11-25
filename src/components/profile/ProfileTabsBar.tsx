"use client";

import React from "react";
import { Sparkles, Layers, User, Handshake } from "lucide-react";

export type ProfileTabType = "posts" | "projects" | "about" | "collaborations";

interface ProfileTabsBarProps {
  activeTab: ProfileTabType;
  onChangeTab: (tab: ProfileTabType) => void;
  postsCount: number;
  projectsCount: number;
  collaborationsCount: number;
}

export function ProfileTabsBar({
  activeTab,
  onChangeTab,
  postsCount,
  projectsCount,
  collaborationsCount,
}: ProfileTabsBarProps) {
  const tabs = [
    {
      id: "posts" as const,
      label: "Posts",
      count: postsCount,
      icon: Sparkles,
    },
    {
      id: "projects" as const,
      label: "Projects",
      count: projectsCount,
      icon: Layers,
    },
    {
      id: "about" as const,
      label: "About",
      count: null,
      icon: User,
    },
    {
      id: "collaborations" as const,
      label: "Collaborations",
      count: collaborationsCount,
      icon: Handshake,
    },
  ];

  return (
    <div className="border-b border-[#203B35]/12 mb-8">
      <nav
        className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar -mb-px"
        aria-label="Creator profile tabs"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`group inline-flex items-center gap-2 py-3.5 px-4 sm:px-5 border-b-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus:outline-none ${
                isActive
                  ? "border-[#203B35] text-[#203B35]"
                  : "border-transparent text-[#5D635F] hover:text-[#203B35] hover:border-[#203B35]/30"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? "text-[#203B35]" : "text-[#9DB5A5] group-hover:text-[#203B35]"
                }`}
              />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-mono transition-colors ${
                    isActive
                      ? "bg-[#203B35] text-[#F6F3EB]"
                      : "bg-[#EFECE2] text-[#5D635F] group-hover:bg-[#203B35]/10 group-hover:text-[#203B35]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
