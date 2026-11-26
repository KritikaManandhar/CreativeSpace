import React from "react";
import type { Metadata } from "next";
import { resolveMockProfile } from "@/data/mockProfiles";
import { ProfilePageClient } from "@/components/profile/ProfilePageClient";

interface ProfilePageProps {
  params: {
    username: string;
  };
}

export function generateMetadata({ params }: ProfilePageProps): Metadata {
  const profile = resolveMockProfile(params.username);
  return {
    title: `${profile.displayName} (@${profile.username}) — CreativeSpace`,
    description:
      profile.bio ||
      `Explore ${profile.displayName}'s creative projects, studio notes, and collaborations on CreativeSpace.`,
  };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  return <ProfilePageClient username={params.username} />;
}
