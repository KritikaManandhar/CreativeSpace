"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const FOOTER_DISCIPLINES = [
  "Illustration",
  "Photography",
  "Music",
  "Writing",
  "Animation",
  "Video",
  "UI/UX",
];

export function Footer() {
  const pathname = usePathname();
  const { status } = useSession();

  // On editorial pages ("/", "/register", "/login"), the dedicated editorial footer is rendered instead
  if ((pathname === "/" || pathname === "/register" || pathname === "/login") && status !== "authenticated") {
    return null;
  }

  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#0A0908] text-[#A89F94]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/[0.07]">
          {/* Brand column */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#E85D3F] to-[#D14628] text-white">
                <svg viewBox="0 0 28 28" fill="none" className="h-4 w-4" aria-hidden="true">
                  <rect x="3" y="3" width="14" height="14" rx="3.5" stroke="currentColor" strokeWidth="2.2" />
                  <rect
                    x="11"
                    y="11"
                    width="14"
                    height="14"
                    rx="3.5"
                    fill="currentColor"
                    fillOpacity="0.24"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  />
                  <circle cx="14" cy="14" r="2.2" fill="currentColor" />
                </svg>
              </div>
              <span className="font-bold text-[#F5F0E8] text-base tracking-tight">
                Creative<span className="font-serif italic font-normal text-[#F47652] text-[19px] ml-0.5">Space</span>
              </span>
            </Link>
            <p className="text-sm text-[#8F877D] max-w-sm leading-relaxed">
              One quiet studio for the entire creative arc — from private concept notes and versioned client reviews to public portfolio exhibitions.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="h-2 w-2 rounded-full bg-[#4E9F76]" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#756D64]">
                Private Drafts · Public Portfolios
              </span>
            </div>
          </div>

          {/* Studio Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#756D64]">
              Studio
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/discover" className="hover:text-[#F5F0E8] transition-colors">
                  Explore Exhibition
                </Link>
              </li>
              <li>
                <Link href="/feed" className="hover:text-[#F5F0E8] transition-colors">
                  Community Feed
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#F5F0E8] transition-colors">
                  My Workspace
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#F5F0E8] transition-colors">
                  Start Creating
                </Link>
              </li>
            </ul>
          </div>

          {/* Disciplines */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#756D64]">
              Disciplines
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {FOOTER_DISCIPLINES.map((discipline) => (
                <Link
                  key={discipline}
                  href={`/discover?category=${encodeURIComponent(discipline)}`}
                  className="px-2.5 py-1 rounded-full text-xs border border-white/[0.08] bg-white/[0.02] text-[#A89F94] hover:border-[#E85D3F]/50 hover:text-[#F5F0E8] transition-colors"
                >
                  {discipline}
                </Link>
              ))}
            </div>
          </div>

          {/* Roles */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#756D64]">
              Built For
            </h4>
            <ul className="space-y-2.5 text-sm text-[#8F877D]">
              <li>Independent Creators</li>
              <li>Creative Collectives</li>
              <li>Client Reviewers</li>
              <li>Art Directors</li>
            </ul>
          </div>
        </div>

        <div className="pt-7 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#756D64]">
          <p>© {new Date().getFullYear()} CreativeSpace. Crafted for makers across every medium.</p>
          <p className="font-mono text-[11px] tracking-wider uppercase text-[#756D64]">
            Idea · Assets · Versions · Feedback · Portfolio
          </p>
        </div>
      </div>
    </footer>
  );
}
