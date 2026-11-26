import React, { Suspense } from "react";
import type { Metadata } from "next";
import { ExploreClient } from "@/components/explore/ExploreClient";

export const metadata: Metadata = {
  title: "Explore — Discover Creators, Projects, Posts & Services | CreativeSpace",
  description:
    "Explore independent creators, curated projects, studio notes, and bespoke atelier services across creative disciplines on CreativeSpace.",
};

interface ExplorePageProps {
  searchParams?: {
    q?: string;
    category?: string;
    discipline?: string;
  };
}

export default function ExplorePage({ searchParams }: ExplorePageProps) {
  return (
    <Suspense fallback={null}>
      <ExploreClient initialSearchQuery={searchParams?.q} />
    </Suspense>
  );
}
