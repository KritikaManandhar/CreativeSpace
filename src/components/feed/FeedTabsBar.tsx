"use client";

import React from "react";
import { Sparkles, Users, Clock } from "lucide-react";

export type FeedTabType = "for-you" | "following" | "latest";

interface FeedTabsBarProps {
  activeTab: FeedTabType;
  onChangeTab: (tab: FeedTabType) => void;
  followingCount?: number;
  className?: string;
}

export function FeedTabsBar({
  activeTab,
  onChangeTab,
  followingCount = 0,
  className = "",
}: FeedTabsBarProps) {
  const tabs: Array<{
    id: FeedTabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | null;
  }> = [
    {
      id: "for-you",
      label: "For You",
      icon: Sparkles,
    },
    {
      id: "following",
      label: "Following",
      icon: Users,
      badge: followingCount > 0 ? followingCount : null,
    },
    {
      id: "latest",
      label: "Latest",
      icon: Clock,
    },
  ];

  return (
    <div
      className={`flex items-center gap-1 border-b border-[#203B35]/12 pt-2 pb-1 ${className}`}
      role="tablist"
      aria-label="Feed content views"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChangeTab(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/30 ${
              isActive
                ? "text-[#203B35]"
                : "text-[#5D635F] hover:text-[#203B35] hover:bg-[#EFECE2]/50"
            }`}
          >
            <Icon
              className={`h-4 w-4 transition-colors ${
                isActive ? "text-[#203B35]" : "text-[#92958F]"
              }`}
            />
            <span>{tab.label}</span>

            {typeof tab.badge === "number" && (
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                  isActive
                    ? "bg-[#203B35]/10 text-[#203B35]"
                    : "bg-[#203B35]/5 text-[#5D635F]"
                }`}
              >
                {tab.badge}
              </span>
            )}

            {/* Subtle active underline indicator */}
            {isActive && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-[#203B35]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
