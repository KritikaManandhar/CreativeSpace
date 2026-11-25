import React from "react";
import { TemporaryPagePlaceholder } from "@/components/placeholder/TemporaryPagePlaceholder";

interface ProfilePageProps {
  params: {
    username: string;
  };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  return (
    <TemporaryPagePlaceholder
      title={`@${params.username}`}
      routeLabel="/profile/[username]"
      description="Old creator profile and portfolio UI has been removed for upcoming redesign. Portfolio lookup, follow/connection actions, URL sanitization, and collaboration invites remain preserved."
      contextItems={[
        { label: "Creator Handle", value: `@${params.username}` },
        { label: "Extracted Logic", value: "src/lib/features/profile.ts" },
      ]}
    />
  );
}
