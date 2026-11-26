"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { motion, MotionConfig } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import { CosmicPortalBackdrop } from "@/components/signup/CosmicPortalBackdrop";
import {
  DesktopPortalOrbit,
  ResponsivePortalShowcase,
} from "@/components/signup/CosmicPortalShowcase";
import { SigninNavbar } from "@/components/signin/SigninNavbar";
import { SigninForm } from "@/components/signin/SigninForm";

const EASE_OUT_EDITORIAL: [number, number, number, number] = [0.22, 1, 0.36, 1];

function FormFallback() {
  return (
    <div className="relative w-full max-w-[492px] min-h-[450px] rounded-[22px] bg-[#FAF8F3] p-6 sm:p-8 border border-[#203B35]/12 shadow-[0_24px_60px_-24px_rgba(32,59,53,0.16),0_2px_8px_rgba(32,59,53,0.04)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-xs text-[#5D635F]">
        <Loader2 className="h-5 w-5 animate-spin text-[#203B35]" />
        <span>Loading CreativeSpace studio...</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen w-full bg-[#F6F3EB] text-[#282B2A] selection:bg-[#203B35] selection:text-[#F6F3EB] flex flex-col justify-between overflow-x-clip">
        {/* Abstract Cosmic Portal Background System */}
        <CosmicPortalBackdrop />

        {/* Minimal Editorial Header */}
        <SigninNavbar />

        {/* Main Content Area */}
        <main className="relative z-10 mx-auto w-full max-w-[1320px] px-4 sm:px-8 lg:px-12 py-7 sm:py-10 lg:py-12 flex-1 flex items-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-10 items-center">
            {/* ========================================================== */}
            {/* LEFT / TOP COLUMN: Cosmic Welcome & Portal Showcase        */}
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
                    YOUR CREATIVE JOURNEY CONTINUES HERE
                  </span>
                </motion.div>

                {/* Main Heading */}
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.08, ease: EASE_OUT_EDITORIAL }}
                  className="font-serif text-[2.65rem] sm:text-[3.55rem] xl:text-[4.25rem] font-normal leading-[0.99] tracking-[-0.025em] text-[#203B35]"
                >
                  Welcome Back, <br />
                  <span className="italic font-normal inline-flex items-center gap-3">
                    Dreamer!
                    <span
                      className="relative inline-flex items-center justify-center -translate-y-0.5 sm:-translate-y-1.5"
                      aria-hidden="true"
                    >
                      <span className="absolute h-8 w-8 rounded-full bg-[#C8BDE0]/50 blur-[8px] animate-pulse-soft" />
                      <span className="relative inline-flex items-center justify-center h-7 w-7 rounded-full bg-[#FAF8F3] border border-[#9DB5A5]/50 text-[#203B35] shadow-sm">
                        <svg
                          viewBox="0 0 16 16"
                          fill="none"
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        >
                          <path
                            d="M9.5 2C6.46 2 4 4.46 4 7.5C4 10.54 6.46 13 9.5 13C10.63 13 11.68 12.65 12.56 12.06C10.74 11.75 9.35 10.18 9.35 8.28C9.35 6.38 10.74 4.81 12.56 4.5C11.68 3.91 10.63 2 9.5 2Z"
                            fill="#203B35"
                          />
                        </svg>
                      </span>
                    </span>
                  </span>
                </motion.h1>

                {/* Supporting Description */}
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.16, ease: EASE_OUT_EDITORIAL }}
                  className="text-[15px] sm:text-[16px] leading-[1.68] text-[#282B2A]/82 max-w-lg"
                >
                  Your creative universe is waiting. Sign in to continue where inspiration
                  left off.
                </motion.p>

                {/* Returning Studio Presence Note */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.24, ease: EASE_OUT_EDITORIAL }}
                  className="pt-1 flex items-center gap-3.5"
                >
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#203B35] text-[#FAF8F3] ring-1 ring-[#203B35]/15 shadow-sm">
                    <Sparkles className="h-4 w-4 text-[#C8BDE0]" />
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#4E9F76] ring-2 ring-[#FAF8F3]" />
                  </div>
                  <div className="text-xs text-[#282B2A]/80 leading-snug">
                    <span className="font-semibold text-[#203B35]">
                      Your studio desk awaits
                    </span>
                    <span className="block text-[11px] text-[#5D635F]">
                      Resume drafts, creative portfolios &amp; studio collaborations
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
            {/* RIGHT / BOTTOM COLUMN: The Cosmic Portal Sign In Form      */}
            {/* ========================================================== */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.18, ease: EASE_OUT_EDITORIAL }}
              className="lg:col-span-5 flex justify-center lg:justify-end"
            >
              <Suspense fallback={<FormFallback />}>
                <SigninForm />
              </Suspense>
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
              <Link href="/register" className="hover:text-[#203B35] transition-colors">
                Create Account
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
