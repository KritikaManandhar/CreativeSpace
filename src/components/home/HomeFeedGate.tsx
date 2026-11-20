"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { CommunityFeed } from "@/components/feed/CommunityFeed";

interface HomeFeedGateProps {
  landingContent: React.ReactNode;
}

export function HomeFeedGate({ landingContent }: HomeFeedGateProps) {
  const { status } = useSession();

  if (status === "authenticated") {
    return <CommunityFeed />;
  }

  return <>{landingContent}</>;
}
