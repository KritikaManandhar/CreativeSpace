import React from "react";
import { TemporaryPagePlaceholder } from "@/components/placeholder/TemporaryPagePlaceholder";

export function CommunityFeed() {
  return (
    <TemporaryPagePlaceholder
      title="Community Feed"
      routeLabel="/feed"
      description="Old community feed UI has been removed for upcoming redesign. Keyset feed, categories, search, and project creation backend logic remain preserved."
      contextItems={[
        { label: "Extracted Logic", value: "src/lib/features/feed.ts" },
        { label: "Backend APIs", value: "/api/feed, /api/search, /api/projects" },
      ]}
    />
  );
}
