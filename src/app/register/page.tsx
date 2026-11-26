"use client";

import React from "react";
import Link from "next/link";
import { motion, MotionConfig } from "framer-motion";
import { CelestialSpark, CreatorAvatar } from "@/components/landing/CreativeSpaceBrand";
import { SignupNavbar } from "@/components/signup/SignupNavbar";
import { CosmicPortalBackdrop } from "@/components/signup/CosmicPortalBackdrop";
import {
  DesktopPortalOrbit,
  ResponsivePortalShowcase,
} from "@/components/signup/CosmicPortalShowcase";
import { SignupForm } from "@/components/signup/SignupForm";

const EASE_OUT_EDITORIAL: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function RegisterPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen w-full bg-[#F6F3EB] text-[#282B2A] selection:bg-[#203B35] selection:text-[#F6F3EB] flex flex-col justify-between overflow-x-clip">
        {/* Abstract Cosmic Portal Background System */}
        <CosmicPortalBackdrop />

        {/* Minimal Editorial Header */}
        <SignupNavbar />

        {/* Main Content Area */}
        <main className="relative z-10 mx-auto w-full max-w-[1320px] px-4 sm:px-8 lg:px-12 py-7 sm:py-10 lg:py-12 flex-1 flex items-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-10 items-center">
            {/* ========================================================== */}
            {/* LEFT / TOP COLUMN: Cosmic Introduction & Portal Showcase   */}
            {/* ========================================================== */}
            <div className="lg:col-span-7 flex flex-col space-y-6 lg:space-y-7">
              {/* Editorial Intro Text */}
              <div className="space-y-4 sm:space-y-5 max-w-xl">
                {/* Eyebrow Label */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: EASE_OUT_EDITORIAL }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#9DB5A5]/18 border border-[#9DB5A5]/40 px-3.5 py-1 text-[#203B35]"
                >
                  <CelestialSpark className="h-3 w-3 text-[#203B35]" />
                  <span className="text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-[0.18em]">
                    YOUR CREATIVE JOURNEY STARTS HERE
                  </span>
                </motion.div>

                {/* Main Heading */}
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.08, ease: EASE_OUT_EDITORIAL }}
                  className="font-serif text-[2.65rem] sm:text-[3.55rem] xl:text-[4.25rem] font-normal leading-[0.99] tracking-[-0.025em] text-[#203B35]"
                >
                  Step into your <br />
                  <span className="italic font-normal">creative universe.</span>
                </motion.h1>

                {/* Supporting Description */}
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.16, ease: EASE_OUT_EDITORIAL }}
                  className="text-[15px] sm:text-[16px] leading-[1.68] text-[#282B2A]/82 max-w-lg"
                >
                  A space to share your ideas, discover inspiring work, connect with
                  creative minds, and bring your imagination to life.
                </motion.p>

                {/* Community Presence Note */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.24, ease: EASE_OUT_EDITORIAL }}
                  className="pt-1 flex items-center gap-3.5"
                >
                  <div className="flex -space-x-2 shrink-0">
                    <CreatorAvatar
                      initials="AS"
                      tone="#203B35"
                      accent="#C8BDE0"
                      name="Anya Sharma"
                      size="sm"
                    />
                    <CreatorAvatar
                      initials="KS"
                      tone="#3B4A44"
                      accent="#9DB5A5"
                      name="Kenji Sato"
                      size="sm"
                    />
                    <CreatorAvatar
                      initials="ER"
                      tone="#2D3C38"
                      accent="#F6F3EB"
                      name="Elena Rostova"
                      size="sm"
                    />
                    <CreatorAvatar
                      initials="MS"
                      tone="#4A5952"
                      accent="#C8BDE0"
                      name="Mateo Silva"
                      size="sm"
                    />
                  </div>
                  <div className="text-xs text-[#282B2A]/80 leading-snug">
                    <span className="font-semibold text-[#203B35]">
                      A studio built for every craft
                    </span>
                    <span className="block text-[11px] text-[#5D635F]">
                      Illustration, photography, graphic design, UI/UX &amp; digital art
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Integrated Artwork Previews Around the Cosmic Portal */}
              <div className="hidden lg:block pt-1">
                <DesktopPortalOrbit />
              </div>

              <div className="lg:hidden pt-1">
                <ResponsivePortalShowcase />
              </div>
            </div>

            {/* ========================================================== */}
            {/* RIGHT / BOTTOM COLUMN: The Cosmic Portal Signup Form      */}
            {/* ========================================================== */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.18, ease: EASE_OUT_EDITORIAL }}
              className="lg:col-span-5 flex justify-center lg:justify-end"
            >
              <SignupForm />
            </motion.div>
          </div>
        </main>

        {/* Quiet Editorial Footer */}
        <footer className="relative z-10 w-full border-t border-[#203B35]/10 py-5 text-center text-xs text-[#5D635F]">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <p>© {new Date().getFullYear()} CreativeSpace · A calm space for creative minds.</p>
            <div className="flex items-center gap-5">
              <Link href="/" className="hover:text-[#203B35] transition-colors">
                Studio Home
              </Link>
              <Link href="/discover" className="hover:text-[#203B35] transition-colors">
                Discover
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
