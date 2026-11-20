"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { CreativeSpaceWordmark } from "./CreativeSpaceBrand";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-colors duration-300 ${
        scrolled
          ? "bg-[#F6F3EB]/92 backdrop-blur-md border-b border-[#203B35]/10"
          : "bg-[#F6F3EB]/75 backdrop-blur-sm border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-[74px] max-w-[1320px] items-center justify-between px-5 sm:px-8 lg:px-12">
        {/* Brand */}
        <Link
          href="/"
          className="group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 rounded-lg py-1"
          aria-label="CreativeSpace Home"
        >
          <span className="transition-transform duration-300 group-hover:scale-[1.015]">
            <CreativeSpaceWordmark variant="dark" />
          </span>
        </Link>

        {/* Center / Right Navigation */}
        <nav
          className="hidden md:flex items-center gap-9"
          aria-label="Landing page navigation"
        >
          <a
            href="#explore"
            className="text-[14px] font-medium text-[#282B2A]/80 hover:text-[#203B35] transition-colors relative py-1 after:absolute after:left-0 after:bottom-0 after:h-[1px] after:w-0 after:bg-[#203B35] hover:after:w-full after:transition-all after:duration-300"
          >
            Explore
          </a>
          <a
            href="#about"
            className="text-[14px] font-medium text-[#282B2A]/80 hover:text-[#203B35] transition-colors relative py-1 after:absolute after:left-0 after:bottom-0 after:h-[1px] after:w-0 after:bg-[#203B35] hover:after:w-full after:transition-all after:duration-300"
          >
            About
          </a>
        </nav>

        {/* Auth Actions */}
        <div className="hidden md:flex items-center gap-5">
          <Link
            href="/login"
            className="text-[14px] font-medium text-[#282B2A]/80 hover:text-[#203B35] transition-colors px-2 py-1.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-full bg-[#203B35] px-5 py-2.5 text-[13.5px] font-medium text-[#F6F3EB] transition-all duration-300 hover:bg-[#162A26] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F3EB]"
          >
            <span>Get Started</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-[#9DB5A5] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* Mobile Menu Trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#203B35]/15 text-[#203B35] hover:bg-[#203B35]/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden border-t border-[#203B35]/10 bg-[#F6F3EB]"
          >
            <div className="px-5 py-6 space-y-4">
              <div className="flex flex-col space-y-1">
                <a
                  href="#explore"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 text-[15px] font-medium text-[#282B2A] hover:text-[#203B35] transition-colors"
                >
                  Explore
                </a>
                <a
                  href="#about"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 text-[15px] font-medium text-[#282B2A] hover:text-[#203B35] transition-colors"
                >
                  About
                </a>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 text-[15px] font-medium text-[#282B2A] hover:text-[#203B35] transition-colors"
                >
                  Sign In
                </Link>
              </div>

              <div className="pt-2 border-t border-[#203B35]/10">
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#203B35] px-5 py-3 text-sm font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors"
                >
                  Get Started
                  <ArrowUpRight className="h-4 w-4 text-[#9DB5A5]" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
