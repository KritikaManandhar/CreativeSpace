"use client";

import React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";

export interface PortalArtwork {
  id: string;
  discipline: string;
  shortDiscipline: string;
  title: string;
  creator: string;
  imageSrc: string;
  imageAlt: string;
  plate: string;
  aspectClass: string;
}

export const PORTAL_ARTWORKS: PortalArtwork[] = [
  {
    id: "portal-illustration",
    discipline: "Digital Illustration",
    shortDiscipline: "Illustration",
    title: "Nocturne Flora & Orbit",
    creator: "Anya Sharma",
    imageSrc: "/images/landing/artwork-illustration.jpg",
    imageAlt: "Gouache and ink botanical illustration with crescent moon and sage orbital arcs",
    plate: "FIG. 01",
    aspectClass: "aspect-[3/4]",
  },
  {
    id: "portal-photography",
    discipline: "Photography",
    shortDiscipline: "Photography",
    title: "Travertine Court",
    creator: "Kenji Sato",
    imageSrc: "/images/landing/artwork-photography.jpg",
    imageAlt: "Medium-format architectural photograph of sunlit travertine arches over a reflecting pool",
    plate: "FIG. 02",
    aspectClass: "aspect-[4/3]",
  },
  {
    id: "portal-graphic",
    discipline: "Graphic Design",
    shortDiscipline: "Graphic Design",
    title: "Solstice Biennial Print",
    creator: "Elena Rostova",
    imageSrc: "/images/landing/artwork-graphic-design.jpg",
    imageAlt: "Minimalist Swiss-editorial exhibition poster featuring deep green arches and sage circles",
    plate: "FIG. 03",
    aspectClass: "aspect-[4/5]",
  },
  {
    id: "portal-uiux",
    discipline: "UI/UX Design",
    shortDiscipline: "UI/UX",
    title: "Loom Tactile Interface",
    creator: "Mateo Silva",
    imageSrc: "/images/landing/artwork-uiux.jpg",
    imageAlt: "Minimalist editorial digital interface displayed on a tablet resting on natural travertine",
    plate: "FIG. 04",
    aspectClass: "aspect-[4/3]",
  },
  {
    id: "portal-digital-art",
    discipline: "Digital Art",
    shortDiscipline: "Digital Art",
    title: "Celadon Vessels in Glass",
    creator: "Amara Okafor",
    imageSrc: "/images/landing/artwork-digital-art.jpg",
    imageAlt: "Sculptural celadon sage arches, obsidian stone, and frosted lavender orb study",
    plate: "FIG. 05",
    aspectClass: "aspect-square",
  },
];

const EASE_OUT_EDITORIAL: [number, number, number, number] = [0.22, 1, 0.36, 1];

function PortalPlateCard({
  artwork,
  sizes,
  priority = false,
}: {
  artwork: PortalArtwork;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <figure className="group rounded-sm bg-[#FAF8F3] p-2 border border-[#203B35]/10 shadow-[0_18px_42px_-24px_rgba(32,59,53,0.32)] transition-transform duration-500 ease-out hover:-translate-y-1">
      <div className={`relative ${artwork.aspectClass} w-full overflow-hidden bg-[#EFECE2]`}>
        <Image
          src={artwork.imageSrc}
          alt={artwork.imageAlt}
          fill
          priority={priority}
          loading={priority ? undefined : "eager"}
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <span className="absolute top-1.5 left-1.5 rounded-sm bg-[#FAF8F3]/92 backdrop-blur-sm px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-[#203B35] border border-[#203B35]/10">
          {artwork.plate}
        </span>
      </div>
      <figcaption className="mt-2 px-0.5">
        <p className="font-mono text-[9px] xl:text-[9.5px] uppercase tracking-[0.11em] xl:tracking-[0.14em] text-[#5D635F]">
          {artwork.discipline}
        </p>
        <p className="mt-0.5 text-[12px] xl:text-[12.5px] font-medium text-[#203B35] leading-snug">
          {artwork.title}
        </p>
        <p className="text-[11px] text-[#5D635F]">{artwork.creator}</p>
      </figcaption>
    </figure>
  );
}

/**
 * Desktop Cosmic Portal Composition:
 * Anchors a serene architectural portal arch + celestial orbit behind five
 * varied-proportion gallery plates representing CreativeSpace's core disciplines.
 * Coordinates are tuned across lg and xl widths so zero captions or badges overlap.
 */
export function DesktopPortalOrbit() {
  const shouldReduceMotion = useReducedMotion();
  const [illustration, photography, graphic, uiux, digitalArt] = PORTAL_ARTWORKS;

  return (
    <div className="relative w-full h-[505px] xl:h-[545px] select-none">
      {/* Inner Cosmic Portal Arch & Orbital Constellation SVG */}
      <svg
        viewBox="0 0 680 540"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="showcasePortalGlow" cx="50%" cy="48%" r="48%">
            <stop offset="0%" stopColor="#FAF8F3" stopOpacity="0.85" />
            <stop offset="52%" stopColor="#C8BDE0" stopOpacity="0.16" />
            <stop offset="82%" stopColor="#9DB5A5" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#F6F3EB" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft luminous portal halo */}
        <circle cx="340" cy="268" r="228" fill="url(#showcasePortalGlow)" />

        {/* Architectural portal arch echoing CreativeSpaceMark */}
        <path
          d="M 192 480 V 236 C 192 154.262 258.262 88 340 88 C 421.738 88 488 154.262 488 236 V 480"
          stroke="#203B35"
          strokeOpacity="0.14"
          strokeWidth="1.15"
        />
        <path
          d="M 218 465 V 242 C 218 174.621 272.621 120 340 120 C 407.379 120 462 174.621 462 242 V 465"
          stroke="#9DB5A5"
          strokeOpacity="0.45"
          strokeWidth="1"
          strokeDasharray="4 7"
        />

        {/* Sweeping orbital ring */}
        <ellipse
          cx="340"
          cy="272"
          rx="268"
          ry="152"
          transform="rotate(-16 340 272)"
          stroke="#C8BDE0"
          strokeOpacity="0.65"
          strokeWidth="1.2"
        />

        {/* Delicate orbital markers */}
        <circle cx="136" cy="212" r="3" fill="#9DB5A5" fillOpacity="0.8" />
        <circle cx="536" cy="186" r="3.5" fill="#C8BDE0" fillOpacity="0.9" />
        <circle cx="340" cy="88" r="2.5" fill="#203B35" fillOpacity="0.35" />
      </svg>

      {/* Subtle top curator mark aligned with portal apex */}
      <div
        className="pointer-events-none absolute top-1 left-1/2 -translate-x-1/2 hidden xl:flex items-center gap-1.5 text-[#5D635F]"
        aria-hidden="true"
      >
        <CelestialSpark className="h-3 w-3 text-[#C8BDE0]" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
          Studio Orbit · 05 Disciplines
        </span>
      </div>

      {/* 1. Digital Illustration — Upper Left (3:4 portrait) */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={
          shouldReduceMotion
            ? { opacity: 1, y: 0 }
            : { opacity: 1, y: [0, -5, 0] }
        }
        transition={{
          opacity: { duration: 0.75, delay: 0.12, ease: EASE_OUT_EDITORIAL },
          y: { duration: 8, delay: 0.8, repeat: Infinity, ease: "easeInOut" },
        }}
        className="absolute top-[8px] left-0 w-[158px] xl:w-[178px] z-20"
      >
        <PortalPlateCard artwork={illustration} sizes="180px" priority />
      </motion.div>

      {/* 2. Photography — Portal Centerpiece (4:3 landscape) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={
          shouldReduceMotion
            ? { opacity: 1, y: 0 }
            : { opacity: 1, y: [0, 6, 0] }
        }
        transition={{
          opacity: { duration: 0.8, delay: 0.22, ease: EASE_OUT_EDITORIAL },
          y: { duration: 9, delay: 1.2, repeat: Infinity, ease: "easeInOut" },
        }}
        className="absolute top-[102px] xl:top-[114px] left-[33%] w-[180px] xl:w-[216px] z-30"
      >
        <PortalPlateCard artwork={photography} sizes="220px" priority />
      </motion.div>

      {/* 3. Graphic Design — Upper Right (4:5 portrait) */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={
          shouldReduceMotion
            ? { opacity: 1, y: 0 }
            : { opacity: 1, y: [0, -6, 0] }
        }
        transition={{
          opacity: { duration: 0.8, delay: 0.28, ease: EASE_OUT_EDITORIAL },
          y: { duration: 8.5, delay: 1.6, repeat: Infinity, ease: "easeInOut" },
        }}
        className="absolute top-0 right-[1%] w-[150px] xl:w-[174px] z-20"
      >
        <PortalPlateCard artwork={graphic} sizes="180px" />
      </motion.div>

      {/* 4. UI/UX Design — Lower Left (4:3 landscape) */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={
          shouldReduceMotion
            ? { opacity: 1, y: 0 }
            : { opacity: 1, y: [0, 5, 0] }
        }
        transition={{
          opacity: { duration: 0.8, delay: 0.34, ease: EASE_OUT_EDITORIAL },
          y: { duration: 9.5, delay: 2.0, repeat: Infinity, ease: "easeInOut" },
        }}
        className="absolute bottom-[10px] left-[2%] xl:left-[3%] w-[166px] xl:w-[196px] z-20"
      >
        <PortalPlateCard artwork={uiux} sizes="200px" />
      </motion.div>

      {/* 5. Digital Art — Lower Right (1:1 square) */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={
          shouldReduceMotion
            ? { opacity: 1, y: 0 }
            : { opacity: 1, y: [0, -5, 0] }
        }
        transition={{
          opacity: { duration: 0.8, delay: 0.4, ease: EASE_OUT_EDITORIAL },
          y: { duration: 8.2, delay: 1.0, repeat: Infinity, ease: "easeInOut" },
        }}
        className="absolute bottom-[8px] right-[3%] xl:right-[4%] w-[154px] xl:w-[178px] z-20"
      >
        <PortalPlateCard artwork={digitalArt} sizes="180px" />
      </motion.div>
    </div>
  );
}

/**
 * Tablet & Mobile Responsive Portal Showcase:
 * - Tablet (sm to < lg): clean 5-column exhibition strip with harmonized card proportions.
 * - Mobile (< sm): compact horizontal peeking discipline strip so the signup form
 *   stays welcomingly close below the introduction without vertical bloat.
 */
export function ResponsivePortalShowcase() {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#5D635F]">
          <CelestialSpark className="h-3 w-3 text-[#9DB5A5]" />
          <span>Featured Disciplines</span>
        </span>
        <span className="font-mono text-[10.5px] text-[#5D635F]">
          01 — 05
        </span>
      </div>

      {/* Tablet: Balanced 5-plate editorial row */}
      <div className="hidden sm:grid lg:hidden grid-cols-5 gap-3 items-start">
        {PORTAL_ARTWORKS.map((work) => (
          <figure
            key={work.id}
            className="rounded-sm bg-[#FAF8F3] p-1.5 border border-[#203B35]/10 shadow-[0_12px_28px_-18px_rgba(32,59,53,0.28)]"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#EFECE2]">
              <Image
                src={work.imageSrc}
                alt={work.imageAlt}
                fill
                loading="eager"
                sizes="140px"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-2 px-0.5">
              <p className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-[#5D635F]">
                {work.plate}
              </p>
              <p className="text-[11.5px] font-medium text-[#203B35] leading-snug">
                {work.shortDiscipline}
              </p>
              <p className="text-[10px] text-[#5D635F] truncate">{work.creator}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Mobile: Compact intentional horizontal peeking gallery strip */}
      <div
        className="sm:hidden flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory -mx-1 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        aria-label="Featured creative disciplines"
      >
        {PORTAL_ARTWORKS.map((work) => (
          <figure
            key={work.id}
            className="snap-start shrink-0 w-[156px] rounded-sm bg-[#FAF8F3] p-1.5 border border-[#203B35]/10 shadow-[0_10px_24px_-16px_rgba(32,59,53,0.25)]"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EFECE2]">
              <Image
                src={work.imageSrc}
                alt={work.imageAlt}
                fill
                loading="eager"
                sizes="156px"
                className="object-cover"
              />
              <span className="absolute top-1 left-1 rounded-sm bg-[#FAF8F3]/92 px-1 py-0.5 font-mono text-[8px] font-medium text-[#203B35] border border-[#203B35]/10">
                {work.plate}
              </span>
            </div>
            <figcaption className="mt-1.5 px-0.5">
              <p className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-[#5D635F]">
                {work.shortDiscipline}
              </p>
              <p className="text-[11.5px] font-medium text-[#203B35] leading-snug">
                {work.title}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
