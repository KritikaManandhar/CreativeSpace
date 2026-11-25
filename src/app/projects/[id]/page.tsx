import React from "react";
import type { Metadata } from "next";
import { ProjectDetailPage } from "@/components/project-detail/ProjectDetailPage";

export const metadata: Metadata = {
  title: "Creative Work Exhibition — CreativeSpace 2.0",
  description:
    "Explore verified creative works, iterative version histories, feedback, and collaborations on CreativeSpace.",
};

export default function Page() {
  return <ProjectDetailPage />;
}
