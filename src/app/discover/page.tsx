import type { Metadata } from "next";
import { TemporaryPagePlaceholder } from "@/components/placeholder/TemporaryPagePlaceholder";

export const metadata: Metadata = {
  title: "Explore — Discover Ideas & Creators | CreativeSpace",
  description:
    "Discover ideas, meet creators, and find inspiration in every corner of creativity. Explore trending projects, independent practitioners, and curated collections.",
};

export default function DiscoverPage() {
  return (
    <TemporaryPagePlaceholder
      title="Discover"
      routeLabel="/discover"
      description="Old discovery gallery and mock dataset have been removed for upcoming redesign. Public discovery and search endpoints remain active."
      contextItems={[
        { label: "Extracted Logic", value: "src/lib/features/discover.ts" },
        { label: "Backend APIs", value: "/api/discover, /api/search" },
      ]}
    />
  );
}
