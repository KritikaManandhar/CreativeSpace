import React from "react";
import type { Metadata } from "next";
import { TemporaryPagePlaceholder } from "@/components/placeholder/TemporaryPagePlaceholder";

export const metadata: Metadata = {
  title: "Creative Work Exhibition — CreativeSpace 2.0",
  description:
    "Explore verified creative works, iterative version histories, feedback, and collaborations on CreativeSpace.",
};

export default function Page() {
  return (
    <TemporaryPagePlaceholder
      title="Project Workspace"
      routeLabel="/projects/[id]"
      description="Old project detail, version timeline, assets, and threaded comments UI has been removed for upcoming redesign. RBAC visibility and upload/version APIs remain intact."
      contextItems={[
        { label: "Extracted Logic", value: "src/lib/features/project-detail.ts, assets.ts, comments.ts" },
        { label: "Backend APIs", value: "/api/projects/[id], /versions, /assets, /comments" },
      ]}
    />
  );
}
