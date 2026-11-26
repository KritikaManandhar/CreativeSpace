import React from "react";
import Link from "next/link";
import { CreativeSpaceWordmark } from "@/components/landing/CreativeSpaceBrand";

export function ProfileFooter() {
  return (
    <footer className="relative z-10 mt-16 sm:mt-20 w-full border-t border-[#203B35]/10 bg-[#F6F3EB]">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-8 lg:px-12 py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 rounded-md"
            aria-label="CreativeSpace Home"
          >
            <CreativeSpaceWordmark variant="dark" />
          </Link>
          <span className="hidden md:inline-block text-xs text-[#5D635F]">
            · A calm space for creative minds.
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5 text-[13px] text-[#5D635F]">
          <Link href="/" className="hover:text-[#203B35] transition-colors">
            Studio Home
          </Link>
          <Link href="/discover" className="hover:text-[#203B35] transition-colors">
            Explore
          </Link>
          <Link href="/feed" className="hover:text-[#203B35] transition-colors">
            Feed
          </Link>
          <span className="font-mono text-[11px] text-[#5D635F]/80">
            © {new Date().getFullYear()} CreativeSpace
          </span>
        </div>
      </div>
    </footer>
  );
}
