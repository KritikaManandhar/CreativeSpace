"use client";

import React from "react";
import Link from "next/link";
import { CreativeSpaceWordmark } from "@/components/landing/CreativeSpaceBrand";

export function SignupNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#F6F3EB]/85 backdrop-blur-md border-b border-[#203B35]/10 transition-colors">
      <div className="mx-auto flex h-[74px] max-w-[1320px] items-center justify-between px-5 sm:px-8 lg:px-12">
        {/* CreativeSpace Logo & Wordmark */}
        <Link
          href="/"
          className="group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 rounded-lg py-1 transition-transform duration-200 hover:scale-[1.01]"
          aria-label="CreativeSpace Home"
        >
          <CreativeSpaceWordmark variant="dark" />
        </Link>

        {/* Existing account prompt */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-[14px]">
          <span className="text-[#92958F] hidden sm:inline">Already have an account?</span>
          <Link
            href="/login"
            className="font-medium text-[#203B35] hover:text-[#162A26] underline underline-offset-4 decoration-[#9DB5A5]/60 hover:decoration-[#203B35] transition-all px-2 py-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/30"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
