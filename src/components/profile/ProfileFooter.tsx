"use client";

import React from "react";
import Link from "next/link";
import { CreativeSpaceWordmark } from "@/components/landing/CreativeSpaceBrand";

export function ProfileFooter() {
  return (
    <footer className="w-full bg-[#F6F3EB] border-t border-[#203B35]/10 mt-20">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#203B35]/10">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <Link href="/" aria-label="CreativeSpace Home">
              <CreativeSpaceWordmark variant="dark" />
            </Link>
            <span className="hidden sm:inline text-[#203B35]/20">|</span>
            <p className="text-xs text-[#5D635F]">
              A calm community for creators to showcase work, version drafts, and collaborate.
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold text-[#5D635F]">
            <Link href="/feed" className="hover:text-[#203B35] transition-colors">
              Community Feed
            </Link>
            <Link href="/discover" className="hover:text-[#203B35] transition-colors">
              Explore
            </Link>
            <Link href="/dashboard" className="hover:text-[#203B35] transition-colors">
              Studio Workspace
            </Link>
            <Link href="/settings/profile" className="hover:text-[#203B35] transition-colors">
              Settings
            </Link>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-[#92958F]">
          <p>© {new Date().getFullYear()} CreativeSpace 2.0. All creative works belong to their respective creators.</p>
          <p>Crafted for makers, artists, and independent studios.</p>
        </div>
      </div>
    </footer>
  );
}
