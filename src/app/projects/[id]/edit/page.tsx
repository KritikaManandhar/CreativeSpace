import React from "react";
import type { Metadata } from "next";
import { ProjectEditPage } from "@/components/project-edit/ProjectEditPage";

export const metadata: Metadata = {
  title: "Edit Creative Work — CreativeSpace 2.0",
  description:
    "Modify previously published creative work, media attachments, taxonomy tags, and publishing visibility on CreativeSpace.",
};

export default function Page() {
  return <ProjectEditPage />;
}
