import React from "react";
import { HomeFeedGate } from "@/components/home/HomeFeedGate";
import { CreativeSpaceLanding } from "@/components/landing/CreativeSpaceLanding";

export default function HomePage() {
  return <HomeFeedGate landingContent={<CreativeSpaceLanding />} />;
}
