"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Compass, Feather } from "lucide-react";
import { CelestialSpark } from "./CreativeSpaceBrand";
import { HERO_COLLAGE_WORKS } from "./landingData";

const EASE_OUT_EDITORIAL: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function HeroSection() {
  const [illustration, photography, graphicDesign, uiux, digitalArt] = HERO_COLLAGE_WORKS;

  return (
    <section
      aria-label="Introduction"
      className="relative w-full overflow-hidden bg-[#F6F3EB] pt-8 pb-20 sm:pt-12 sm:pb-24 lg:pt-16 lg:pb-32"
    >
      {/* Subtle atmospheric background tints — very restrained */}
      <div
        className="pointer-events-none absolute -top-24 right-[10%] h-[420px] w-[420px] rounded-full bg-[#C8BDE0]/20 blur-[110px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-10 -left-24 h-[360px] w-[360px] rounded-full bg-[#9DB5A5]/18 blur-[100px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-8 items-center">
          {/* ============================================================ */}
          {/* LEFT EDITORIAL COLUMN (5 cols on lg)                         */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 relative z-10">
            {/* Introductory Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: EASE_OUT_EDITORIAL }}
              className="inline-flex items-center gap-2.5 mb-7"
            >
              <CelestialSpark className="h-3.5 w-3.5 text-[#9DB5A5]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#203B35]/75">
                A Space For Creative Minds
              </span>
              <span className="hidden sm:inline-block h-[1px] w-10 bg-[#9DB5A5]/70" />
            </motion.div>

            {/* Main Editorial Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08, ease: EASE_OUT_EDITORIAL }}
              className="font-serif text-[3.35rem] sm:text-[4.5rem] lg:text-[4.85rem] xl:text-[5.5rem] font-normal leading-[0.97] tracking-[-0.025em] text-[#203B35]"
            >
              Where{" "}
              <span className="italic font-normal text-[#203B35]">creativity</span>
              <br />
              finds its{" "}
              <span className="relative inline-block">
                space.
                {/* Delicate hand-drawn cosmic sage underline arc */}
                <svg
                  viewBox="0 0 180 14"
                  fill="none"
                  className="pointer-events-none absolute -bottom-1.5 left-0 w-full h-3 text-[#9DB5A5]"
                  aria-hidden="true"
                >
                  <path
                    d="M3 10.5C48 3.5 124 2.5 177 9"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </motion.h1>

            {/* Supporting Description */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.18, ease: EASE_OUT_EDITORIAL }}
              className="mt-7 max-w-[460px] text-[15.5px] sm:text-[16.5px] leading-[1.7] text-[#282B2A]/80"
            >
              Share what you create, discover inspiring work, connect with creative minds,
              and turn ideas into something extraordinary.
            </motion.p>

            {/* Primary & Secondary Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.28, ease: EASE_OUT_EDITORIAL }}
              className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5"
            >
              <Link
                href="/discover"
                className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-[#203B35] px-7 py-3.5 text-[14px] font-medium text-[#F6F3EB] transition-all duration-300 hover:bg-[#162A26] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F3EB]"
              >
                <Compass className="h-4 w-4 text-[#9DB5A5]" />
                <span>Explore Community</span>
              </Link>

              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-[#203B35]/25 bg-[#FAF8F3] px-7 py-3.5 text-[14px] font-medium text-[#203B35] transition-all duration-300 hover:border-[#203B35] hover:bg-[#EFECE2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F3EB]"
              >
                <span>Start Creating</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </motion.div>

            {/* Quiet Editorial Discipline Index */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.85, delay: 0.42, ease: EASE_OUT_EDITORIAL }}
              className="mt-12 pt-7 border-t border-[#203B35]/10"
            >
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-[#5D635F] mb-3">
                <span>Featured Mediums</span>
                <span className="font-mono text-[#92958F]">01 — 06</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-[#282B2A]/75">
                {[
                  "Illustration",
                  "Photography",
                  "Graphic Design",
                  "UI/UX",
                  "Digital Art",
                  "Writing",
                ].map((medium, i) => (
                  <span key={medium} className="inline-flex items-center gap-2">
                    {i > 0 && (
                      <span className="h-1 w-1 rounded-full bg-[#9DB5A5]" aria-hidden="true" />
                    )}
                    <span>{medium}</span>
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT ART-DIRECTED COLLAGE (7 cols on lg)                    */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 relative">
            {/* Desktop Overlapping Editorial Collage (lg+) */}
            <div className="hidden lg:block relative h-[620px] xl:h-[660px] w-full">
              {/* Subtle Slow-Rotating Cosmic Orbital Geometry */}
              <motion.svg
                viewBox="0 0 600 600"
                fill="none"
                aria-hidden="true"
                animate={{ rotate: 360 }}
                transition={{ duration: 110, repeat: Infinity, ease: "linear" }}
                className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] xl:w-[580px] xl:h-[580px] opacity-75"
              >
                <circle
                  cx="300"
                  cy="300"
                  r="242"
                  stroke="#9DB5A5"
                  strokeOpacity="0.45"
                  strokeWidth="1"
                  strokeDasharray="4 7"
                />
                <ellipse
                  cx="300"
                  cy="300"
                  rx="276"
                  ry="168"
                  transform="rotate(-24 300 300)"
                  stroke="#C8BDE0"
                  strokeOpacity="0.6"
                  strokeWidth="1.15"
                />
                <circle cx="542" cy="300" r="3.5" fill="#C8BDE0" />
                <circle cx="96" cy="176" r="2.5" fill="#9DB5A5" />
              </motion.svg>

              {/* Subtle editorial curator tag top-left of collage */}
              <div
                className="pointer-events-none absolute top-0 left-[6%] xl:left-[8%] flex items-center gap-2 text-[#203B35]/60"
                aria-hidden="true"
              >
                <CelestialSpark className="h-3.5 w-3.5 text-[#C8BDE0]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
                  Curated Works · Vol. IV
                </span>
              </div>

              {/* CARD 1: Primary Tall Illustration Portrait (Upper-Left Anchor) */}
              <motion.figure
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.14, ease: EASE_OUT_EDITORIAL }}
                className="absolute top-[30px] left-[6%] xl:left-[8%] w-[236px] xl:w-[268px] z-20"
              >
                <div className="group rounded-sm bg-[#FAF8F3] p-2.5 border border-[#203B35]/10 shadow-[0_18px_45px_-28px_rgba(32,59,53,0.35)]">
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EFECE2]">
                    <Image
                      src={illustration.imageSrc}
                      alt={illustration.imageAlt}
                      fill
                      priority
                      sizes="(max-width: 1280px) 236px, 268px"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <figcaption className="mt-2.5 flex items-baseline justify-between px-0.5">
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-medium text-[#203B35] leading-snug truncate">
                        {illustration.title}
                      </p>
                      <p className="text-[11px] text-[#5D635F]">{illustration.creator}</p>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#92958F] shrink-0 ml-2">
                      {illustration.discipline}
                    </span>
                  </figcaption>
                </div>
              </motion.figure>

              {/* CARD 2: Overlapping Landscape Photography (Upper Right, Gentle Float) */}
              <motion.figure
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: [0, -7, 0] }}
                transition={{
                  opacity: { duration: 0.85, delay: 0.25, ease: EASE_OUT_EDITORIAL },
                  y: {
                    duration: 7.5,
                    delay: 1.0,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
                className="absolute top-[10px] right-[1%] w-[232px] xl:w-[272px] z-10"
              >
                <div className="group rounded-sm bg-[#FAF8F3] p-2 border border-[#203B35]/10 shadow-[0_14px_38px_-24px_rgba(32,59,53,0.28)]">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EFECE2]">
                    <Image
                      src={photography.imageSrc}
                      alt={photography.imageAlt}
                      fill
                      priority
                      sizes="272px"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <figcaption className="mt-2 flex items-center justify-between px-0.5 text-[11px]">
                    <span className="font-medium text-[#203B35] truncate">{photography.title}</span>
                    <span className="text-[#5D635F] shrink-0 ml-2">{photography.discipline}</span>
                  </figcaption>
                </div>
              </motion.figure>

              {/* CARD 3: Sculptural 3D Digital Art (Middle-Right, Slow Counter-Phase Float) */}
              <motion.figure
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: [0, 7, 0] }}
                transition={{
                  opacity: { duration: 0.85, delay: 0.36, ease: EASE_OUT_EDITORIAL },
                  y: {
                    duration: 8.5,
                    delay: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
                className="absolute top-[234px] xl:top-[258px] right-[4%] xl:right-[5%] w-[186px] xl:w-[216px] z-30"
              >
                <div className="group rounded-lg bg-[#FAF8F3] p-2 border border-[#203B35]/12 shadow-[0_18px_40px_-24px_rgba(32,59,53,0.32)]">
                  <div className="relative aspect-square w-full overflow-hidden rounded-[4px] bg-[#EFECE2]">
                    <Image
                      src={digitalArt.imageSrc}
                      alt={digitalArt.imageAlt}
                      fill
                      sizes="216px"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <figcaption className="mt-2 flex items-center justify-between px-0.5 text-[11px]">
                    <span className="font-medium text-[#203B35] truncate">{digitalArt.title}</span>
                    <span className="text-[#5D635F] shrink-0 ml-2">{digitalArt.discipline}</span>
                  </figcaption>
                </div>
              </motion.figure>

              {/* CARD 4: Graphic Design Print (Lower-Left Offset) */}
              <motion.figure
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.42, ease: EASE_OUT_EDITORIAL }}
                className="absolute bottom-[8px] left-[1%] w-[148px] xl:w-[168px] z-30"
              >
                <div className="group rounded-sm bg-[#FAF8F3] p-1.5 border border-[#203B35]/10 shadow-[0_16px_36px_-22px_rgba(32,59,53,0.28)]">
                  <div className="relative aspect-square w-full overflow-hidden bg-[#EFECE2]">
                    <Image
                      src={graphicDesign.imageSrc}
                      alt={graphicDesign.imageAlt}
                      fill
                      sizes="168px"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <figcaption className="mt-1.5 flex items-center justify-between px-0.5 text-[10.5px]">
                    <span className="font-medium text-[#203B35] truncate">{graphicDesign.title}</span>
                    <span className="text-[#5D635F] shrink-0 ml-1">Print</span>
                  </figcaption>
                </div>
              </motion.figure>

              {/* CARD 5: UI/UX Interface Plate (Lower Center) */}
              <motion.figure
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.5, ease: EASE_OUT_EDITORIAL }}
                className="absolute bottom-[14px] left-[31%] xl:left-[30%] w-[202px] xl:w-[234px] z-20"
              >
                <div className="group rounded-sm bg-[#FAF8F3] p-2 border border-[#203B35]/10 shadow-[0_14px_34px_-22px_rgba(32,59,53,0.25)]">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EFECE2]">
                    <Image
                      src={uiux.imageSrc}
                      alt={uiux.imageAlt}
                      fill
                      sizes="234px"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <figcaption className="mt-1.5 flex items-center justify-between px-0.5 text-[10.5px]">
                    <span className="font-medium text-[#203B35] truncate">{uiux.title}</span>
                    <span className="text-[#5D635F] shrink-0 ml-2">{uiux.discipline}</span>
                  </figcaption>
                </div>
              </motion.figure>

              {/* Editorial Literary Excerpt Floating Slip (Writing discipline touch) */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: [0, -4, 0] }}
                transition={{
                  opacity: { duration: 0.8, delay: 0.58, ease: EASE_OUT_EDITORIAL },
                  y: { duration: 9, delay: 1.8, repeat: Infinity, ease: "easeInOut" },
                }}
                className="absolute bottom-[16px] right-[0%] z-40 w-[160px] xl:w-[186px] rounded-xl border border-[#203B35]/12 bg-[#FAF8F3]/95 px-3.5 py-2.5 shadow-[0_12px_30px_-20px_rgba(32,59,53,0.3)]"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#203B35]/70">
                  <Feather className="h-3 w-3 text-[#9DB5A5]" />
                  <span>Writing · Essay</span>
                </div>
                <p className="mt-1 font-serif italic text-[13.5px] leading-snug text-[#203B35]">
                  &ldquo;Notes on quiet light and unfinished rooms.&rdquo;
                </p>
              </motion.div>
            </div>

            {/* Responsive Mobile & Tablet Asymmetric Collage (< lg) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.25, ease: EASE_OUT_EDITORIAL }}
              className="lg:hidden grid grid-cols-12 gap-3.5 sm:gap-4 items-start"
            >
              <div className="col-span-7 space-y-3.5 sm:space-y-4">
                <figure className="rounded-sm bg-[#FAF8F3] p-2 border border-[#203B35]/10">
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EFECE2]">
                    <Image
                      src={illustration.imageSrc}
                      alt={illustration.imageAlt}
                      fill
                      priority
                      sizes="(max-width: 1024px) 58vw, 320px"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="font-medium text-[#203B35] truncate">{illustration.title}</span>
                    <span className="text-[#5D635F] shrink-0 ml-2">{illustration.discipline}</span>
                  </figcaption>
                </figure>

                <figure className="rounded-sm bg-[#FAF8F3] p-2 border border-[#203B35]/10">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EFECE2]">
                    <Image
                      src={uiux.imageSrc}
                      alt={uiux.imageAlt}
                      fill
                      sizes="(max-width: 1024px) 58vw, 320px"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="font-medium text-[#203B35] truncate">{uiux.title}</span>
                    <span className="text-[#5D635F] shrink-0 ml-2">{uiux.discipline}</span>
                  </figcaption>
                </figure>
              </div>

              <div className="col-span-5 space-y-3.5 sm:space-y-4 pt-6 sm:pt-10">
                <figure className="rounded-sm bg-[#FAF8F3] p-2 border border-[#203B35]/10">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EFECE2]">
                    <Image
                      src={photography.imageSrc}
                      alt={photography.imageAlt}
                      fill
                      sizes="(max-width: 1024px) 42vw, 240px"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="mt-1.5 text-[10.5px] font-medium text-[#203B35] truncate">
                    {photography.discipline}
                  </figcaption>
                </figure>

                <figure className="rounded-sm bg-[#FAF8F3] p-2 border border-[#203B35]/10">
                  <div className="relative aspect-square w-full overflow-hidden bg-[#EFECE2]">
                    <Image
                      src={digitalArt.imageSrc}
                      alt={digitalArt.imageAlt}
                      fill
                      sizes="(max-width: 1024px) 42vw, 240px"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="mt-1.5 text-[10.5px] font-medium text-[#203B35] truncate">
                    {digitalArt.discipline}
                  </figcaption>
                </figure>

                <figure className="rounded-sm bg-[#FAF8F3] p-2 border border-[#203B35]/10">
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#EFECE2]">
                    <Image
                      src={graphicDesign.imageSrc}
                      alt={graphicDesign.imageAlt}
                      fill
                      sizes="(max-width: 1024px) 42vw, 240px"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="mt-1.5 text-[10.5px] font-medium text-[#203B35] truncate">
                    {graphicDesign.discipline}
                  </figcaption>
                </figure>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
