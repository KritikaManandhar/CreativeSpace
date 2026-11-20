"use client";

import React from "react";
import { MotionConfig } from "framer-motion";
import { LandingNavbar } from "./LandingNavbar";
import { HeroSection } from "./HeroSection";
import { CommunityShowcase } from "./CommunityShowcase";
import { CapabilitiesSection } from "./CapabilitiesSection";
import { ClosingCtaSection } from "./ClosingCtaSection";
import { LandingFooter } from "./LandingFooter";

export function CreativeSpaceLanding() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen w-full bg-[#F6F3EB] text-[#282B2A] selection:bg-[#203B35] selection:text-[#F6F3EB] overflow-x-clip">
        <LandingNavbar />
        <HeroSection />
        <CommunityShowcase />
        <CapabilitiesSection />
        <ClosingCtaSection />
        <LandingFooter />
      </div>
    </MotionConfig>
  );
}
