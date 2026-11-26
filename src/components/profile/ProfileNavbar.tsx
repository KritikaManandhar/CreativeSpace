"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Eye, Menu, PencilLine, Users, X } from "lucide-react";
import { CelestialSpark, CreativeSpaceWordmark } from "@/components/landing/CreativeSpaceBrand";
import { SAMPLE_PROFILE_LINKS, type ProfilePerspective } from "@/data/mockProfiles";

interface ProfileNavbarProps {
  activeUsername: string;
  perspective: ProfilePerspective;
  onPerspectiveChange: (mode: ProfilePerspective) => void;
}

export function ProfileNavbar({
  activeUsername,
  perspective,
  onPerspectiveChange,
}: ProfileNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSwitcherOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-300 ${
        scrolled
          ? "bg-[#F6F3EB]/95 backdrop-blur-md border-b border-[#203B35]/15"
          : "bg-[#F6F3EB]/85 backdrop-blur-sm border-b border-[#203B35]/10"
      }`}
    >
      <div className="mx-auto flex h-[74px] max-w-[1320px] items-center justify-between gap-3 px-4 sm:px-8 lg:px-12">
        {/* Left: Brand Wordmark */}
        <Link
          href="/"
          className="group inline-flex shrink-0 items-center rounded-lg py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
          aria-label="CreativeSpace Home"
        >
          <span className="transition-transform duration-300 group-hover:scale-[1.015]">
            <CreativeSpaceWordmark variant="dark" />
          </span>
        </Link>

        {/* Center: Editorial Navigation + Creator Switcher (lg+) */}
        <nav
          className="hidden lg:flex items-center gap-7"
          aria-label="Profile workspace navigation"
        >
          <Link
            href="/"
            className="text-[14px] font-medium text-[#282B2A]/80 hover:text-[#203B35] transition-colors py-1"
          >
            Home
          </Link>
          <Link
            href="/discover"
            className="text-[14px] font-medium text-[#282B2A]/80 hover:text-[#203B35] transition-colors py-1"
          >
            Explore
          </Link>
          <Link
            href="/feed"
            className="text-[14px] font-medium text-[#282B2A]/80 hover:text-[#203B35] transition-colors py-1"
          >
            Feed
          </Link>

          {/* Sample Profile Switcher Dropdown */}
          <div ref={switcherRef} className="relative">
            <button
              type="button"
              onClick={() => setSwitcherOpen((prev) => !prev)}
              aria-expanded={switcherOpen}
              aria-haspopup="menu"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/15 bg-[#FAF8F3] px-3.5 py-1.5 text-[13px] font-medium text-[#203B35] hover:border-[#203B35]/35 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
            >
              <Users className="h-3.5 w-3.5 text-[#5D635F]" />
              <span>@{activeUsername}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[#5D635F] transition-transform duration-200 ${
                  switcherOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {switcherOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.16 }}
                  role="menu"
                  className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] p-2 shadow-[0_20px_48px_-18px_rgba(32,59,53,0.22)] z-50"
                >
                  <div className="px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.16em] text-[#5D635F]">
                    <CelestialSpark className="h-3 w-3 text-[#9DB5A5]" />
                    <span>Sample Profiles</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {SAMPLE_PROFILE_LINKS.map((sample) => {
                      const isCurrent =
                        sample.username.toLowerCase() === activeUsername.toLowerCase();
                      return (
                        <Link
                          key={sample.username}
                          href={`/profile/${sample.username}`}
                          onClick={() => setSwitcherOpen(false)}
                          role="menuitem"
                          className={`flex items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                            isCurrent
                              ? "bg-[#203B35] text-[#F6F3EB]"
                              : "text-[#282B2A] hover:bg-[#EFECE2]/80"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium truncate">{sample.label}</p>
                            <p
                              className={`font-mono text-[11px] truncate ${
                                isCurrent ? "text-[#9DB5A5]" : "text-[#5D635F]"
                              }`}
                            >
                              @{sample.username}
                            </p>
                          </div>
                          <span
                            className={`text-[10.5px] shrink-0 ml-2 ${
                              isCurrent ? "text-[#C8BDE0]" : "text-[#5D635F]"
                            }`}
                          >
                            {sample.discipline}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Right: View Perspective Switcher + Mobile Trigger */}
        <div className="flex items-center gap-2.5">
          {/* Perspective Switcher (Owner vs Public Visitor preview) */}
          <div
            className="hidden sm:inline-flex items-center rounded-full border border-[#203B35]/15 bg-[#FAF8F3] p-1"
            role="group"
            aria-label="Preview profile perspective"
          >
            <button
              type="button"
              onClick={() => onPerspectiveChange("owner")}
              aria-pressed={perspective === "owner"}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                perspective === "owner"
                  ? "bg-[#203B35] text-[#F6F3EB] shadow-sm"
                  : "text-[#5D635F] hover:text-[#203B35]"
              }`}
            >
              <PencilLine className="h-3 w-3" />
              <span>Owner View</span>
            </button>
            <button
              type="button"
              onClick={() => onPerspectiveChange("visitor")}
              aria-pressed={perspective === "visitor"}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                perspective === "visitor"
                  ? "bg-[#203B35] text-[#F6F3EB] shadow-sm"
                  : "text-[#5D635F] hover:text-[#203B35]"
              }`}
            >
              <Eye className="h-3 w-3" />
              <span>Visitor View</span>
            </button>
          </div>

          {/* Mobile Menu Trigger (< lg) */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#203B35]/15 bg-[#FAF8F3] text-[#203B35] hover:bg-[#EFECE2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {/* Responsive Drawer (< lg) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden overflow-hidden border-t border-[#203B35]/10 bg-[#F6F3EB]"
          >
            <div className="px-4 sm:px-8 py-5 space-y-5">
              {/* Mobile Perspective Switcher */}
              <div className="space-y-2">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#5D635F]">
                  Preview Perspective
                </p>
                <div
                  className="grid grid-cols-2 gap-2 rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] p-1.5"
                  role="group"
                  aria-label="Preview profile perspective"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onPerspectiveChange("owner");
                      setMobileOpen(false);
                    }}
                    aria-pressed={perspective === "owner"}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-medium transition-all ${
                      perspective === "owner"
                        ? "bg-[#203B35] text-[#F6F3EB]"
                        : "text-[#5D635F] hover:text-[#203B35]"
                    }`}
                  >
                    <PencilLine className="h-3.5 w-3.5" />
                    <span>Owner View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onPerspectiveChange("visitor");
                      setMobileOpen(false);
                    }}
                    aria-pressed={perspective === "visitor"}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-medium transition-all ${
                      perspective === "visitor"
                        ? "bg-[#203B35] text-[#F6F3EB]"
                        : "text-[#5D635F] hover:text-[#203B35]"
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Visitor View</span>
                  </button>
                </div>
              </div>

              {/* Sample Profiles */}
              <div className="space-y-2">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#5D635F]">
                  Switch Sample Profile
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SAMPLE_PROFILE_LINKS.map((sample) => {
                    const isCurrent =
                      sample.username.toLowerCase() === activeUsername.toLowerCase();
                    return (
                      <Link
                        key={sample.username}
                        href={`/profile/${sample.username}`}
                        onClick={() => setMobileOpen(false)}
                        className={`rounded-xl border px-3.5 py-2.5 transition-colors ${
                          isCurrent
                            ? "border-[#203B35] bg-[#203B35] text-[#F6F3EB]"
                            : "border-[#203B35]/15 bg-[#FAF8F3] text-[#282B2A] hover:border-[#203B35]/30"
                        }`}
                      >
                        <p className="text-[13px] font-medium truncate">{sample.label}</p>
                        <p
                          className={`font-mono text-[11px] truncate ${
                            isCurrent ? "text-[#9DB5A5]" : "text-[#5D635F]"
                          }`}
                        >
                          @{sample.username} · {sample.discipline}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Primary Nav */}
              <div className="flex flex-wrap items-center gap-5 border-t border-[#203B35]/10 pt-3 text-[14px] font-medium text-[#203B35]">
                <Link href="/" onClick={() => setMobileOpen(false)}>
                  Home
                </Link>
                <Link href="/discover" onClick={() => setMobileOpen(false)}>
                  Explore
                </Link>
                <Link href="/feed" onClick={() => setMobileOpen(false)}>
                  Feed
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
