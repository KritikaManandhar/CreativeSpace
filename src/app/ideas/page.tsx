import type { Metadata } from "next";
import { TemporaryPagePlaceholder } from "@/components/placeholder/TemporaryPagePlaceholder";

export const metadata: Metadata = {
  title: "Ideas — Creative Sparks & Prompts | CreativeSpace",
  description:
    "Reserved destination for CreativeSpace prompts, visual moodboards, and early studio sketches.",
};

export default function IdeasPage() {
  return (
    <TemporaryPagePlaceholder
      title="Ideas"
      routeLabel="/ideas"
      description="Ideas board UI is reserved for an upcoming phase. Community Feed and navigation links remain active."
      contextItems={[
        { label: "Status", value: "Upcoming Phase Placeholder" },
        { label: "Return", value: "Use Home to return to Community Feed" },
      ]}
    />
  );
}
