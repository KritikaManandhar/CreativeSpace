"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { CelestialSpark } from "./CreativeSpaceBrand";

const EASE_EDITORIAL: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function ClosingCtaSection() {
  return (
    <section
      aria-labelledby="closing-cta-heading"
      className="relative w-full bg-[#F6F3EB] pt-8 pb-20 sm:pt-12 sm:pb-28 lg:pb-32"
    >
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.85, ease: EASE_EDITORIAL }}
          className="relative overflow-hidden rounded-2xl bg-[#203B35] px-7 py-16 sm:px-14 sm:py-24 lg:px-20 lg:py-28 text-center"
        >
          {/* Subtle atmospheric glow — calm sage & soft lavender */}
          <div
            className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[560px] rounded-full bg-[#9DB5A5]/15 blur-[110px]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-28 right-[14%] h-56 w-56 rounded-full bg-[#C8BDE0]/15 blur-[95px]"
            aria-hidden="true"
          />

          {/* Subtle Cosmic-Nature Orbital Arcs */}
          <svg
            viewBox="0 0 960 420"
            fill="none"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-45"
            aria-hidden="true"
          >
            <ellipse
              cx="480"
              cy="210"
              rx="410"
              ry="152"
              transform="rotate(-8 480 210)"
              stroke="#9DB5A5"
              strokeOpacity="0.45"
              strokeWidth="1"
            />
            <ellipse
              cx="480"
              cy="210"
              rx="330"
              ry="118"
              transform="rotate(9 480 210)"
              stroke="#C8BDE0"
              strokeOpacity="0.35"
              strokeWidth="1"
              strokeDasharray="4 8"
            />
            <circle cx="842" cy="148" r="3" fill="#C8BDE0" fillOpacity="0.85" />
            <circle cx="136" cy="272" r="2.5" fill="#9DB5A5" fillOpacity="0.85" />
          </svg>

          {/* Subtle Corner Editorial Registration Hairlines */}
          <div
            className="pointer-events-none absolute top-6 left-6 h-5 w-5 border-t border-l border-[#9DB5A5]/35"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute top-6 right-6 h-5 w-5 border-t border-r border-[#9DB5A5]/35"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-6 left-6 h-5 w-5 border-b border-l border-[#9DB5A5]/35"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-6 right-6 h-5 w-5 border-b border-r border-[#9DB5A5]/35"
            aria-hidden="true"
          />

          {/* Centered Editorial Content */}
          <div className="relative z-10 mx-auto max-w-2xl">
            <div className="inline-flex items-center gap-2 mb-6">
              <CelestialSpark className="h-3.5 w-3.5 text-[#C8BDE0]" />
              <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#9DB5A5]">
                Open Invitation
              </span>
              <CelestialSpark className="h-3.5 w-3.5 text-[#C8BDE0]" />
            </div>

            <h2
              id="closing-cta-heading"
              className="font-serif text-[2.65rem] sm:text-[3.75rem] lg:text-[4.4rem] font-normal leading-[1.02] tracking-[-0.02em] text-[#F6F3EB]"
            >
              Your next creative chapter
              <br />
              <span className="italic font-normal text-[#C8BDE0]">starts here.</span>
            </h2>

            <p className="mt-6 text-[15.5px] sm:text-[17px] leading-[1.68] text-[#F6F3EB]/78 max-w-lg mx-auto">
              Find your people. Share your ideas. Make something extraordinary.
            </p>

            <div className="mt-10 flex justify-center">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2.5 rounded-full bg-[#F6F3EB] px-8 py-4 text-[14.5px] font-medium text-[#203B35] transition-all duration-300 hover:bg-[#FFFFFF] hover:scale-[1.015] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F6F3EB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#203B35]"
              >
                <span>Join CreativeSpace</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
