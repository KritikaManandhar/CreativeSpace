import React from "react";
import Link from "next/link";
import { CreativeSpaceWordmark } from "./CreativeSpaceBrand";

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "X / Twitter", href: "https://x.com" },
  { label: "Are.na", href: "https://are.na" },
  { label: "Behance", href: "https://behance.net" },
];

export function LandingFooter() {
  return (
    <footer className="w-full bg-[#F6F3EB] border-t border-[#203B35]/10">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#203B35]/10">
          {/* Brand & Short Platform Description */}
          <div className="md:col-span-6 space-y-4">
            <Link
              href="/"
              className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 rounded-md"
              aria-label="CreativeSpace Home"
            >
              <CreativeSpaceWordmark variant="dark" />
            </Link>
            <p className="max-w-sm text-[14px] leading-[1.68] text-[#282B2A]/75">
              A calm creative community where makers showcase their work, share their
              process, discover fellow creators, and collaborate on meaningful projects.
            </p>
          </div>

          {/* Primary Navigation */}
          <div className="md:col-span-3 space-y-3.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5D635F]">
              Platform
            </h3>
            <ul className="space-y-2.5 text-[14px] text-[#282B2A]/80">
              <li>
                <a
                  href="#explore"
                  className="hover:text-[#203B35] transition-colors"
                >
                  Explore
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  className="hover:text-[#203B35] transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-[#203B35] transition-colors"
                >
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div className="md:col-span-3 space-y-3.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5D635F]">
              Elsewhere
            </h3>
            <ul className="space-y-2.5 text-[14px] text-[#282B2A]/80">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="hover:text-[#203B35] transition-colors"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12.5px] text-[#5D635F]">
          <p>© {new Date().getFullYear()} CreativeSpace. All rights reserved.</p>
          <p className="text-[#92958F]">Made for curious minds across every craft.</p>
        </div>
      </div>
    </footer>
  );
}
