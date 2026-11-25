import type { Metadata } from "next";
import { ExplorePage } from "@/components/explore/ExplorePage";

export const metadata: Metadata = {
  title: "Explore — Discover Ideas & Creators | CreativeSpace",
  description:
    "Discover ideas, meet creators, and find inspiration in every corner of creativity. Explore trending projects, independent practitioners, and curated collections.",
};

export default function Page() {
  return <ExplorePage />;
}
