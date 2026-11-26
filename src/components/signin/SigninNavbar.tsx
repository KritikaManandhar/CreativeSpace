"use client";

import React from "react";
import Link from "next/link";
import { CreativeSpaceWordmark } from "@/components/landing/CreativeSpaceBrand";

export function SigninNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#F6F3EB]/88 backdrop-blur-md border-b border-[#203B35]/10 transition-colors">
      <div className="mx-auto flex h-[74px] max-w-[1320px] items-center justify-between gap-3 px-4 sm:px-8 lg:px-12">
        {/* CreativeSpace Logo & Wordmark */}
        <Link
          href="/"
          className="group inline-flex shrink-0 items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 rounded-lg py-1"
          aria-label="CreativeSpace Home"
        >
          <span className="transition-transform duration-300 group-hover:scale-[1.015]">
            <CreativeSpaceWordmark variant="dark" />
          </span>
        </Link>

        {/* New to CreativeSpace link */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 text-[12.5px] sm:text-[14px]">
          <span className="hidden min-[460px]:inline text-[#5D635F] whitespace-nowrap">
            New to CreativeSpace?
          </span>
          <Link
            href="/register"
            className="whitespace-nowrap font-medium text-[#203B35] hover:text-[#162A26] underline underline-offset-4 decoration-[#9DB5A5]/75 hover:decoration-[#203B35] transition-colors px-2 py-1.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
          >
            Create Account
          </Link>
        </div>
      </div>
    </header>
  );
}
